"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  supportMacrosFor,
  priorityLabel,
  statusLabel,
  type SupportMessage,
  type SupportTicket,
  type TicketPriority,
  type TicketStatus,
} from "@/data/bkf/support-tickets";
import {
  buildAttendanceGreeting,
  getOperatorProfile,
  isPersonalizedDisplayName,
  updateMyDisplayName,
} from "@/lib/bkf/operators";
import { getAngelsCareAuth } from "@/lib/firebase/angels-care";
import {
  deleteStaffMessage as deleteStaffMessageFs,
  editStaffMessage as editStaffMessageFs,
  sendStaffReply,
  updateThreadMeta,
  watchSupportThreads,
  watchThreadMessages,
} from "@/lib/bkf/support-firestore";
import { chatMetricsFromTickets } from "@/lib/bkf/dashboard-metrics";
import { isBootstrapEmail } from "@/lib/bkf/operators";
import { KpiStrip } from "@/components/bkf/KpiStrip";
import { DashBarChart } from "@/components/bkf/DashBarChart";

type Props = {
  appId: string;
};

type QueueFilter = "all" | TicketStatus;

const DEMO_FLAG = "gat_intranet_demo";

export function ChatQueueModule({ appId }: Props) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [filter, setFilter] = useState<QueueFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [operatorEmail, setOperatorEmail] = useState(
    "gadget.apps.technology@gmail.com",
  );
  const [operatorName, setOperatorName] = useState("");
  const [nameDraft, setNameDraft] = useState("");
  const [nameReady, setNameReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DEMO_FLAG);
      if (raw) {
        const parsed = JSON.parse(raw) as { email?: string; uid?: string };
        if (parsed.email) setOperatorEmail(parsed.email);
      }
    } catch {
      /* ignore */
    }

    const unsub = onAuthStateChanged(getAngelsCareAuth(), (user) => {
      if (!user?.uid) return;
      if (user.email) setOperatorEmail(user.email);
      setIsAdmin(isBootstrapEmail(user.email));
      void getOperatorProfile(user.uid).then((profile) => {
        if (!profile) {
          setOperatorName("");
          setNameDraft("");
          setNameReady(false);
          return;
        }
        setOperatorEmail(profile.email || user.email || "");
        if (profile.hasPersonalizedName) {
          setOperatorName(profile.displayName);
          setNameDraft(profile.displayName);
          setNameReady(true);
        } else {
          setOperatorName("");
          setNameDraft(profile.displayName || "");
          setNameReady(false);
        }
      });
    });
    return () => unsub();
  }, []);

  const macros = useMemo(
    () => (nameReady ? supportMacrosFor(operatorName) : []),
    [operatorName, nameReady],
  );

  async function saveAttendantName(e?: FormEvent) {
    e?.preventDefault();
    setError(null);
    try {
      await updateMyDisplayName(nameDraft);
      const cleaned = nameDraft.trim();
      setOperatorName(cleaned);
      setNameReady(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar nome.");
    }
  }

  useEffect(() => {
    setReady(false);
    setError(null);
    const unsub = watchSupportThreads(
      appId,
      (list) => {
        setTickets(list);
        setReady(true);
        setSelectedId((prev) => {
          if (prev && list.some((t) => t.id === prev)) return prev;
          const firstOpen =
            list.find((t) => t.status === "open" || t.unreadForStaff > 0) ??
            list[0];
          return firstOpen?.id ?? null;
        });
      },
      (err) => {
        setReady(true);
        setError(err.message || "Falha ao carregar a fila.");
      },
    );
    return () => unsub();
  }, [appId]);

  const selected = useMemo(
    () => tickets.find((t) => t.id === selectedId) ?? null,
    [tickets, selectedId],
  );

  useEffect(() => {
    if (!selectedId || !selected) {
      setMessages([]);
      return;
    }
    const unsub = watchThreadMessages(
      selectedId,
      selected.userName,
      setMessages,
      (err) => setError(err.message || "Falha ao carregar mensagens."),
    );
    return () => unsub();
  }, [selectedId, selected?.userName]);

  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, selectedId]);

  const queue = useMemo(() => {
    const list =
      filter === "all" ? tickets : tickets.filter((t) => t.status === filter);
    return [...list].sort(
      (a, b) =>
        new Date(b.lastMessageAt).getTime() -
        new Date(a.lastMessageAt).getTime(),
    );
  }, [tickets, filter]);

  const counts = useMemo(() => {
    return {
      all: tickets.length,
      open: tickets.filter((t) => t.status === "open").length,
      pending: tickets.filter((t) => t.status === "pending").length,
      assigned: tickets.filter((t) => t.status === "assigned").length,
      resolved: tickets.filter((t) => t.status === "resolved").length,
      unread: tickets.reduce((n, t) => n + t.unreadForStaff, 0),
    };
  }, [tickets]);

  const chatDash = useMemo(() => chatMetricsFromTickets(tickets), [tickets]);

  async function selectTicket(id: string) {
    setSelectedId(id);
    setDraft("");
    const ticket = tickets.find((t) => t.id === id);
    if (ticket && ticket.unreadForStaff > 0) {
      try {
        await updateThreadMeta(id, { unreadForStaff: 0 });
      } catch {
        /* listener corrige */
      }
    }
  }

  function alreadyGreetedByMe(): boolean {
    const needle = `meu nome é ${operatorName}`.toLowerCase();
    return messages.some(
      (m) =>
        m.sender === "staff" &&
        !m.isDeleted &&
        m.text.toLowerCase().includes(needle),
    );
  }

  async function assignToMe(id: string) {
    if (busy) return;
    if (!isPersonalizedDisplayName(operatorName, operatorEmail)) {
      setError(
        "Antes de atender, diga como quer ser chamado (ex.: Márcio). Não usamos o e-mail.",
      );
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await updateThreadMeta(id, {
        assigneeEmail: operatorEmail,
        status: "assigned",
      });
      if (!alreadyGreetedByMe()) {
        await sendStaffReply({
          threadId: id,
          text: buildAttendanceGreeting(operatorName),
          operatorEmail,
          operatorName,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao iniciar atendimento.");
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(id: string, status: TicketStatus) {
    try {
      await updateThreadMeta(id, { status });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao mudar status.");
    }
  }

  async function setPriority(id: string, priority: TicketPriority) {
    try {
      await updateThreadMeta(id, { priority });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao mudar prioridade.");
    }
  }

  async function sendReply(e?: FormEvent) {
    e?.preventDefault();
    if (!selected || !draft.trim() || busy) return;
    if (!isPersonalizedDisplayName(operatorName, operatorEmail)) {
      setError(
        "Antes de responder, defina seu nome de atendimento (ex.: Márcio).",
      );
      return;
    }
    const text = draft.trim();
    setBusy(true);
    try {
      await sendStaffReply({
        threadId: selected.id,
        text,
        operatorEmail,
        operatorName,
      });
      setDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao enviar.");
    } finally {
      setBusy(false);
    }
  }

  function applyMacro(body: string) {
    setDraft((prev) => (prev ? `${prev}\n${body}` : body));
  }

  async function editStaffMessage(ticketId: string, messageId: string) {
    const msg = messages.find((m) => m.id === messageId);
    if (!msg || msg.isDeleted || msg.sender !== "staff") return;
    const next = window.prompt("Editar mensagem", msg.text);
    if (next == null) return;
    const trimmed = next.trim();
    if (!trimmed || trimmed === msg.text) return;
    try {
      await editStaffMessageFs({ threadId: ticketId, messageId, text: trimmed });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao editar.");
    }
  }

  async function deleteStaffMessage(ticketId: string, messageId: string) {
    if (!window.confirm("Apagar esta mensagem para ambos os lados?")) return;
    try {
      await deleteStaffMessageFs({ threadId: ticketId, messageId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao apagar.");
    }
  }

  if (!ready) {
    return (
      <div className="bkf-panel">
        <p className="bkf-empty">Carregando fila…</p>
      </div>
    );
  }

  return (
    <div className="chatq">
      <aside className="chatq__queue">
        <div className="chatq__queue-head">
          <div>
            <h2 className="bkf-panel__title">Fila de atendimento</h2>
            <p className="bkf-panel__sub">
              {counts.unread > 0 ? `${counts.unread} não lidas · ` : ""}
              {counts.open} novas · Firestore ao vivo
            </p>
          </div>
        </div>

        {isAdmin ? (
          <div className="chatq__admin-dash">
            <KpiStrip
              items={[
                {
                  label: "Pendentes",
                  value: chatDash.pending,
                  tone: chatDash.pending > 0 ? "warn" : "ok",
                },
                { label: "Abertos", value: chatDash.open },
                { label: "Aguardando", value: chatDash.pendingStatus },
                { label: "Em atendimento", value: chatDash.assigned },
                {
                  label: "Não lidas",
                  value: chatDash.unread,
                  tone: chatDash.unread > 0 ? "bad" : "default",
                },
              ]}
            />
            <DashBarChart
              title="Prioridade (pendentes)"
              items={[
                { label: "Normal", value: chatDash.normal },
                { label: "Alta", value: chatDash.high },
                { label: "Urgente", value: chatDash.urgent },
              ]}
              emptyLabel="Nenhum pendente"
            />
          </div>
        ) : null}

        {error ? (
          <p className="bkf-empty" style={{ color: "#b00020", marginBottom: "0.75rem" }}>
            {error}
          </p>
        ) : null}

        <form
          onSubmit={saveAttendantName}
          style={{
            marginBottom: "0.9rem",
            padding: "0.85rem",
            borderRadius: "0.75rem",
            border: nameReady ? "1px solid var(--line, #e5e7eb)" : "1px solid #f59e0b",
            background: nameReady ? "var(--soft, #f5f5f7)" : "#fffbeb",
            display: "grid",
            gap: "0.5rem",
          }}
        >
          <strong style={{ fontSize: "0.9rem" }}>
            Meu nome de atendimento
          </strong>
          <p
            style={{
              margin: 0,
              fontSize: "0.8rem",
              color: nameReady ? "#6b7280" : "#92400e",
            }}
          >
            {nameReady
              ? "Usado na saudação automática. Você pode alterar quando quiser."
              : "Obrigatório antes de atender. Esse nome aparece na saudação (não usamos o e-mail)."}
          </p>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <input
              className="bkf-input"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              placeholder="Ex.: Márcio"
              style={{ flex: "1 1 160px" }}
              aria-label="Nome de atendimento"
            />
            <button
              type="submit"
              className="pill pill-blue"
              disabled={busy || !nameDraft.trim()}
            >
              Salvar nome
            </button>
          </div>
        </form>

        <div className="bkf-filters" style={{ marginBottom: "0.75rem" }}>
          {(
            [
              ["all", `Todas (${counts.all})`],
              ["open", `Novas (${counts.open})`],
              ["assigned", `Em atendimento (${counts.assigned})`],
              ["pending", `Aguardando (${counts.pending})`],
              ["resolved", `Resolvidas (${counts.resolved})`],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`bkf-chip ${filter === id ? "is-on" : ""}`}
              onClick={() => setFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <ul className="chatq__list">
          {queue.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                className={`chatq__item ${selectedId === t.id ? "is-active" : ""}`}
                onClick={() => selectTicket(t.id)}
              >
                <div className="chatq__item-top">
                  <strong>{t.userName}</strong>
                  {t.unreadForStaff > 0 ? (
                    <span className="chatq__unread">{t.unreadForStaff}</span>
                  ) : null}
                </div>
                <p className="chatq__subject">{t.subject}</p>
                <div className="chatq__meta">
                  <span className={`chatq__prio chatq__prio--${t.priority}`}>
                    {priorityLabel(t.priority)}
                  </span>
                  <span>{statusLabel(t.status)}</span>
                  <span>
                    {new Date(t.lastMessageAt).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </button>
            </li>
          ))}
          {queue.length === 0 ? (
            <li className="bkf-empty" style={{ padding: "1rem 0.25rem" }}>
              Nenhuma conversa neste filtro. Abra o suporte no app para criar o
              primeiro ticket.
            </li>
          ) : null}
        </ul>
      </aside>

      <section className="chatq__thread">
        {!selected ? (
          <div className="chatq__empty">
            <p>Selecione uma conversa na fila.</p>
          </div>
        ) : (
          <>
            <header className="chatq__thread-head">
              <div>
                <h3>{selected.userName}</h3>
                <p>
                  {selected.userEmail} · {selected.subject}
                </p>
              </div>
              <div className="chatq__thread-actions">
                <button
                  type="button"
                  className="bkf-action"
                  disabled={busy}
                  onClick={() => assignToMe(selected.id)}
                  title={`Envia saudação como ${operatorName}`}
                >
                  Iniciar atendimento
                </button>
                <select
                  className="bkf-input"
                  style={{ width: "auto", padding: "0.35rem 0.55rem" }}
                  value={selected.status}
                  onChange={(e) =>
                    setStatus(selected.id, e.target.value as TicketStatus)
                  }
                >
                  <option value="open">Novo</option>
                  <option value="assigned">Em atendimento</option>
                  <option value="pending">Aguardando</option>
                  <option value="resolved">Resolvido</option>
                </select>
                <select
                  className="bkf-input"
                  style={{ width: "auto", padding: "0.35rem 0.55rem" }}
                  value={selected.priority}
                  onChange={(e) =>
                    setPriority(selected.id, e.target.value as TicketPriority)
                  }
                >
                  <option value="low">Baixa</option>
                  <option value="normal">Normal</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>
            </header>

            <div className="chatq__assignee">
              Responsável:{" "}
              <strong>{selected.assigneeEmail ?? "sem atribuição"}</strong>
              {nameReady ? (
                <>
                  {" · "}
                  Seu nome no chat: <strong>{operatorName}</strong>
                </>
              ) : (
                <>
                  {" · "}
                  <span style={{ color: "#b45309" }}>
                    Defina seu nome acima para atender
                  </span>
                </>
              )}
            </div>

            <div className="chatq__messages" ref={messagesRef}>
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`chatq__bubble ${m.sender === "staff" ? "is-staff" : "is-user"}`}
                >
                  <div className="chatq__bubble-meta">
                    {m.senderName} ·{" "}
                    {new Date(m.createdAt).toLocaleString("pt-BR")}
                  </div>
                  {m.isDeleted ? (
                    <p className="chatq__deleted">Mensagem apagada</p>
                  ) : (
                    <>
                      <p>{m.text}</p>
                      {m.isEdited ? (
                        <span className="chatq__edited">editada</span>
                      ) : null}
                    </>
                  )}
                  {m.sender === "staff" && !m.isDeleted ? (
                    <div className="chatq__msg-actions">
                      <button
                        type="button"
                        className="chatq__msg-btn"
                        onClick={() => editStaffMessage(selected.id, m.id)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="chatq__msg-btn"
                        onClick={() => deleteStaffMessage(selected.id, m.id)}
                      >
                        Apagar
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="chatq__footer">
              <div className="chatq__macros">
                {macros.map((macro) => (
                  <button
                    key={macro.id}
                    type="button"
                    className="bkf-chip"
                    onClick={() => applyMacro(macro.body)}
                    title={macro.body}
                  >
                    {macro.title}
                  </button>
                ))}
              </div>

              <form className="chatq__composer" onSubmit={sendReply}>
                <textarea
                  className="chatq__textarea"
                  rows={3}
                  placeholder="Escreva a resposta ao usuário…"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  disabled={busy}
                />
                <button
                  type="submit"
                  className="pill pill-blue"
                  disabled={!draft.trim() || busy}
                >
                  {busy ? "Enviando…" : "Enviar"}
                </button>
              </form>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
