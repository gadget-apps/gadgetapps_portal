"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  TUTORIAL_CATALOG,
  TUTORIAL_PROFILES,
  tutorialModulesFor,
  type TutorialCatalogItem,
  type TutorialProfile,
} from "@/data/bkf/tutorial-catalog";
import { isBkfAdminSession } from "@/lib/bkf/operators";
import {
  loadTutorialVideoLinks,
  saveTutorialVideoLink,
  type TutorialVideoLink,
} from "@/lib/bkf/tutorial-videos-firestore";
import { parseYoutubeInput, youtubeEmbedUrl } from "@/lib/bkf/youtube-url";

type LinkFilter = "all" | "linked" | "empty" | "unsaved";
type ProfileFilter = "todos" | TutorialProfile;

type Draft = {
  url: string;
  published: boolean;
};

type Preview = {
  id: string;
  title: string;
};

function draftFromLink(link: TutorialVideoLink | undefined): Draft {
  return {
    url: link?.youtubeUrl ?? "",
    published: link?.published ?? true,
  };
}

function rowDirty(
  item: TutorialCatalogItem,
  draft: Draft,
  saved: TutorialVideoLink | undefined,
): boolean {
  const savedUrl = saved?.youtubeUrl ?? "";
  const savedPub = saved?.published ?? false;
  const parsed = parseYoutubeInput(draft.url);
  const nextUrl = parsed.ok ? parsed.url : draft.url.trim();
  const nextPub = parsed.ok && parsed.id ? draft.published : false;
  return nextUrl !== savedUrl || nextPub !== savedPub;
}

function formatSavedAt(iso: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TutorialsModule({ embedded = false }: { embedded?: boolean }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [links, setLinks] = useState<Record<string, TutorialVideoLink>>({});
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileFilter>("todos");
  const [moduleName, setModuleName] = useState("todos");
  const [linkFilter, setLinkFilter] = useState<LinkFilter>("all");
  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [justSaved, setJustSaved] = useState<Record<string, boolean>>({});
  const justSavedToken = useRef<Record<string, number>>({});

  useEffect(() => {
    setIsAdmin(isBkfAdminSession());
  }, []);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setError(null);
    void loadTutorialVideoLinks()
      .then((map) => {
        if (cancelled) return;
        setLinks(map);
        const next: Record<string, Draft> = {};
        for (const item of TUTORIAL_CATALOG) {
          next[item.id] = draftFromLink(map[item.id]);
        }
        setDrafts(next);
        setReady(true);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setReady(true);
        setError(
          err instanceof Error
            ? err.message
            : "Falha ao carregar vínculos do YouTube.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!preview) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreview(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [preview]);

  const modules = useMemo(() => tutorialModulesFor(profile), [profile]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TUTORIAL_CATALOG.filter((item) => {
      if (profile !== "todos" && item.profile !== profile) return false;
      if (moduleName !== "todos" && item.module !== moduleName) return false;
      const saved = links[item.id];
      const hasLink = Boolean(saved?.youtubeId);
      if (linkFilter === "linked" && !hasLink) return false;
      if (linkFilter === "empty" && hasLink) return false;
      if (linkFilter === "unsaved") {
        const draft = drafts[item.id] ?? draftFromLink(saved);
        if (!rowDirty(item, draft, saved)) return false;
      }
      if (!q) return true;
      const hay = `${item.title} ${item.module} ${item.file} ${item.id}`.toLowerCase();
      return hay.includes(q);
    });
  }, [profile, moduleName, linkFilter, query, links, drafts]);

  const linkedCount = useMemo(
    () => TUTORIAL_CATALOG.filter((item) => links[item.id]?.youtubeId).length,
    [links],
  );
  const publishedCount = useMemo(
    () =>
      TUTORIAL_CATALOG.filter((item) => links[item.id]?.published).length,
    [links],
  );
  const unsavedCount = useMemo(
    () =>
      TUTORIAL_CATALOG.filter((item) =>
        rowDirty(
          item,
          drafts[item.id] ?? draftFromLink(links[item.id]),
          links[item.id],
        ),
      ).length,
    [drafts, links],
  );

  function markJustSaved(id: string) {
    const token = Date.now();
    justSavedToken.current[id] = token;
    setJustSaved((prev) => ({ ...prev, [id]: true }));
    window.setTimeout(() => {
      if (justSavedToken.current[id] !== token) return;
      setJustSaved((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }, 5000);
  }

  function patchDraft(id: string, patch: Partial<Draft>) {
    if (justSaved[id]) {
      justSavedToken.current[id] = 0;
      setJustSaved((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...draftFromLink(links[id]), ...prev[id], ...patch },
    }));
  }

  async function saveRow(item: TutorialCatalogItem) {
    if (!isAdmin || busyId) return;
    const draft = drafts[item.id] ?? draftFromLink(links[item.id]);
    const parsed = parseYoutubeInput(draft.url);
    if (!parsed.ok) {
      setError(parsed.error);
      setNote(null);
      return;
    }
    setBusyId(item.id);
    setError(null);
    setNote(null);
    try {
      const saved = await saveTutorialVideoLink({
        item,
        youtubeUrl: draft.url,
        published: draft.published,
      });
      setLinks((prev) => ({ ...prev, [item.id]: saved }));
      setDrafts((prev) => ({
        ...prev,
        [item.id]: { url: saved.youtubeUrl, published: saved.published },
      }));
      markJustSaved(item.id);
      setNote(
        saved.youtubeId
          ? saved.published
            ? `Link publicado: ${item.title}`
            : `Link salvo (ainda oculto no app/site): ${item.title}`
          : `Link removido: ${item.title}`,
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Falha ao salvar o link.",
      );
    } finally {
      setBusyId(null);
    }
  }

  if (!isAdmin) {
    if (embedded) {
      return (
        <p className="bkf-empty">
          Somente o admin BKF vincula os vídeos tutoriais.
        </p>
      );
    }
    return (
      <div className="bkf-panel">
        <p className="bkf-empty">
          Somente o admin BKF vincula os vídeos tutoriais.
        </p>
      </div>
    );
  }

  const intro = (
    <p
      className="bkf-panel__sub"
      style={embedded ? { margin: "0 0 0.75rem" } : undefined}
    >
      Cole o link do YouTube em cada item do catálogo. Use{" "}
      <strong>Reproduzir</strong> para conferir se o vídeo associado está
      correto — vale o texto colado, mesmo antes de salvar. O app e o site só
      exibem o vídeo quando o link estiver salvo e marcado como publicado.
      Enquanto as legendas não terminam, deixe publicado desligado.
    </p>
  );

  const body = (
    <>
      {embedded ? intro : null}

      <p className="bkf-toast" style={{ background: "#eff6ff", color: "#1e40af" }}>
        {linkedCount} de {TUTORIAL_CATALOG.length} com link · {publishedCount}{" "}
        publicados
        {unsavedCount > 0 ? ` · ${unsavedCount} não salvo${unsavedCount === 1 ? "" : "s"}` : ""}
      </p>

      <div className="bkf-filters" style={{ marginBottom: "0.75rem" }}>
        <button
          type="button"
          className={`bkf-chip ${profile === "todos" ? "is-on" : ""}`}
          onClick={() => {
            setProfile("todos");
            setModuleName("todos");
          }}
        >
          Todos os perfis
        </button>
        {TUTORIAL_PROFILES.map((p) => (
          <button
            key={p}
            type="button"
            className={`bkf-chip ${profile === p ? "is-on" : ""}`}
            onClick={() => {
              setProfile(p);
              setModuleName("todos");
            }}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="bkf-filters" style={{ marginBottom: "0.75rem" }}>
        <button
          type="button"
          className={`bkf-chip ${linkFilter === "all" ? "is-on" : ""}`}
          onClick={() => setLinkFilter("all")}
        >
          Todos
        </button>
        <button
          type="button"
          className={`bkf-chip ${linkFilter === "empty" ? "is-on" : ""}`}
          onClick={() => setLinkFilter("empty")}
        >
          Sem link
        </button>
        <button
          type="button"
          className={`bkf-chip ${linkFilter === "linked" ? "is-on" : ""}`}
          onClick={() => setLinkFilter("linked")}
        >
          Com link
        </button>
        <button
          type="button"
          className={`bkf-chip ${linkFilter === "unsaved" ? "is-on" : ""}`}
          onClick={() => setLinkFilter("unsaved")}
        >
          Não salvos{unsavedCount > 0 ? ` (${unsavedCount})` : ""}
        </button>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.6rem",
          marginBottom: "0.85rem",
        }}
      >
        <select
          className="bkf-input"
          value={moduleName}
          onChange={(e) => setModuleName(e.target.value)}
          style={{ maxWidth: "18rem" }}
        >
          <option value="todos">Todos os módulos</option>
          {modules.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <input
          className="bkf-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar título ou arquivo…"
          style={{ maxWidth: "22rem" }}
        />
      </div>

      {note ? (
        <p style={{ margin: "0 0 0.75rem", color: "#166534", fontSize: "0.875rem" }}>
          {note}
        </p>
      ) : null}
      {error ? (
        <p className="bkf-toast" style={{ color: "#b00020" }}>
          {error}
        </p>
      ) : null}

      {!ready ? (
        <p className="bkf-empty">Carregando catálogo…</p>
      ) : (
        <div className="bkf-table-wrap">
          <table className="bkf-table">
            <thead>
              <tr>
                <th>Vídeo</th>
                <th>Perfil</th>
                <th>Link do YouTube</th>
                <th>Publicar</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((item) => {
                const saved = links[item.id];
                const draft = drafts[item.id] ?? draftFromLink(saved);
                const dirty = rowDirty(item, draft, saved);
                const parsed = parseYoutubeInput(draft.url);
                const persisted = Boolean(saved);
                const saving = busyId === item.id;
                const flashed = Boolean(justSaved[item.id]);
                const savedAt = formatSavedAt(saved?.updatedAt ?? "");
                return (
                  <tr key={item.id} className={dirty ? "is-dirty" : undefined}>
                    <td style={{ whiteSpace: "normal", minWidth: "14rem" }}>
                      <strong>{item.title}</strong>
                      <div style={{ color: "#6b7280", fontSize: "0.75rem" }}>
                        {item.module}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`bkf-tag ${
                          item.profile === "Profissional"
                            ? "bkf-tag--role-profissional"
                            : item.profile === "Contratante"
                              ? "bkf-tag--role-contratante"
                              : "bkf-tag--role-assistido"
                        }`}
                      >
                        {item.profile}
                      </span>
                    </td>
                    <td style={{ minWidth: "18rem", whiteSpace: "normal" }}>
                      <input
                        className={`bkf-input${
                          dirty ? " is-dirty" : persisted ? " is-saved" : ""
                        }`}
                        value={draft.url}
                        placeholder="https://youtu.be/…"
                        disabled={saving}
                        aria-invalid={dirty}
                        onChange={(e) =>
                          patchDraft(item.id, { url: e.target.value })
                        }
                      />
                      <p className="bkf-save-hint">
                        {saving ? (
                          <span className="bkf-tag">Salvando…</span>
                        ) : dirty ? (
                          <span className="bkf-tag bkf-tag--warn">Não salvo</span>
                        ) : flashed ? (
                          <span className="bkf-tag bkf-tag--ok">Salvo agora</span>
                        ) : persisted ? (
                          <span className="bkf-tag bkf-tag--ok">
                            {saved?.youtubeId ? "Salvo" : "Salvo (sem link)"}
                          </span>
                        ) : (
                          <span className="bkf-tag">Ainda não gravado</span>
                        )}
                        {!dirty && !saving && savedAt ? (
                          <span style={{ color: "#6b7280" }}>{savedAt}</span>
                        ) : null}
                      </p>
                      {parsed.ok && parsed.id ? (
                        <div
                          className="bkf-row-actions"
                          style={{ marginTop: "0.4rem", justifyContent: "flex-start" }}
                        >
                          <button
                            type="button"
                            className="bkf-action bkf-action--primary"
                            disabled={saving}
                            onClick={() =>
                              setPreview({ id: parsed.id, title: item.title })
                            }
                          >
                            Reproduzir
                          </button>
                          <a
                            className="bkf-action"
                            href={parsed.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Abrir no YouTube
                          </a>
                        </div>
                      ) : null}
                      {!parsed.ok && draft.url.trim() ? (
                        <div style={{ color: "#b00020", fontSize: "0.75rem" }}>
                          {parsed.error}
                        </div>
                      ) : null}
                    </td>
                    <td>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          fontSize: "0.8rem",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(draft.published && parsed.ok && parsed.id)}
                          disabled={saving || !(parsed.ok && parsed.id)}
                          onChange={(e) =>
                            patchDraft(item.id, { published: e.target.checked })
                          }
                        />
                        No app/site
                      </label>
                    </td>
                    <td>
                      {saving ? (
                        <button type="button" className="pill pill-blue" disabled>
                          Salvando…
                        </button>
                      ) : dirty ? (
                        <button
                          type="button"
                          className="pill pill-blue"
                          disabled={!parsed.ok}
                          onClick={() => void saveRow(item)}
                        >
                          Salvar
                        </button>
                      ) : persisted ? (
                        <button type="button" className="pill pill-saved" disabled>
                          {flashed ? "Salvo agora" : "Salvo"}
                        </button>
                      ) : (
                        <button type="button" className="pill pill-blue" disabled>
                          Salvar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <p className="bkf-empty">Nenhum vídeo neste filtro.</p>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}

      {preview ? (
        <div className="bkf-modal" role="dialog" aria-modal="true">
          <button
            type="button"
            className="bkf-modal__backdrop"
            aria-label="Fechar reprodução"
            onClick={() => setPreview(null)}
          />
          <div className="bkf-modal__card bkf-modal__card--video">
            <div className="bkf-modal__head">
              <div>
                <h3 className="bkf-modal__title">{preview.title}</h3>
                <p className="bkf-modal__sub">
                  Conferência do vídeo associado. Feche e ajuste o link se
                  não for este.
                </p>
              </div>
              <button
                type="button"
                className="bkf-action"
                onClick={() => setPreview(null)}
              >
                Fechar
              </button>
            </div>
            <div className="bkf-video-frame">
              <iframe
                src={youtubeEmbedUrl(preview.id, true)}
                title={preview.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );

  if (embedded) return body;

  return (
    <div className="bkf-panel">
      <div className="bkf-panel__head">
        <div>
          <h2 className="bkf-panel__title">Vídeos tutoriais</h2>
          {intro}
        </div>
      </div>
      {body}
    </div>
  );
}
