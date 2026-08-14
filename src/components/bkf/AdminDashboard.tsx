"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { DashBarChart } from "@/components/bkf/DashBarChart";
import { KpiStrip } from "@/components/bkf/KpiStrip";
import {
  loadAdminDashBundle,
  type AdminDashBundle,
} from "@/lib/bkf/dashboard-metrics";

type Props = {
  appId: string;
};

const COMING_SOON = [
  { id: "config", title: "Config técnica", blurb: "Flags e force update" },
  { id: "team", title: "Equipe", blurb: "Operadores e convites" },
] as const;

export function AdminDashboard({ appId }: Props) {
  const [data, setData] = useState<AdminDashBundle | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const base = `/intranet/bkf/apps/${appId}`;

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setError(null);
    void loadAdminDashBundle(appId)
      .then((bundle) => {
        if (cancelled) return;
        startTransition(() => {
          setData(bundle);
          setReady(true);
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setReady(true);
        setError(
          err instanceof Error ? err.message : "Falha ao carregar dashboard.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [appId]);

  return (
    <div className="bkf-dash">
      <div className="bkf-panel bkf-dash__hero">
        <div className="bkf-panel__head">
          <div>
            <h2 className="bkf-panel__title">Dashboard Admin</h2>
            <p className="bkf-panel__sub">
              Visão consolidada dos módulos com dados reais. Operadores não
              veem este painel — só Chat / fila.
            </p>
          </div>
          <Link href={`${base}/chat/`} className="pill pill-blue">
            Abrir Chat / fila
          </Link>
        </div>
        {error ? (
          <p className="bkf-toast" style={{ color: "#b00020" }}>
            {error}
          </p>
        ) : null}
      </div>

      <section className="bkf-dash__section">
        <div className="bkf-dash__section-head">
          <h3>Chat / fila</h3>
          <Link href={`${base}/chat/`}>Abrir módulo</Link>
        </div>
        <div className="bkf-panel">
          <KpiStrip
            loading={!ready}
            items={[
              {
                label: "Pendentes",
                value: data?.chat.pending ?? 0,
                tone: (data?.chat.pending ?? 0) > 0 ? "warn" : "ok",
              },
              { label: "Abertos", value: data?.chat.open ?? 0 },
              {
                label: "Aguardando",
                value: data?.chat.pendingStatus ?? 0,
              },
              { label: "Em atendimento", value: data?.chat.assigned ?? 0 },
              {
                label: "Não lidas",
                value: data?.chat.unread ?? 0,
                tone: (data?.chat.unread ?? 0) > 0 ? "bad" : "default",
              },
            ]}
          />
          <div className="bkf-dash__charts">
            <DashBarChart
              title="Fila por prioridade (pendentes)"
              items={[
                { label: "Normal", value: data?.chat.normal ?? 0 },
                { label: "Alta", value: data?.chat.high ?? 0 },
                { label: "Urgente", value: data?.chat.urgent ?? 0 },
              ]}
              emptyLabel={ready ? "Nenhum ticket pendente" : "Carregando…"}
            />
            <DashBarChart
              title="Por status"
              items={[
                { label: "Aberto", value: data?.chat.open ?? 0 },
                { label: "Aguardando", value: data?.chat.pendingStatus ?? 0 },
                { label: "Atribuído", value: data?.chat.assigned ?? 0 },
                { label: "Resolvido", value: data?.chat.resolved ?? 0 },
              ]}
              emptyLabel={ready ? "Sem tickets" : "Carregando…"}
            />
          </div>
        </div>
      </section>

      <section className="bkf-dash__section">
        <div className="bkf-dash__section-head">
          <h3>Usuários</h3>
          <Link href={`${base}/users/`}>Abrir módulo</Link>
        </div>
        <div className="bkf-panel">
          <KpiStrip
            loading={!ready}
            items={[
              { label: "Na amostra", value: data?.users.total ?? 0 },
              {
                label: "Ativos",
                value: data?.users.active ?? 0,
                tone: "ok",
              },
              {
                label: "Desativados",
                value: data?.users.disabled ?? 0,
                tone: (data?.users.disabled ?? 0) > 0 ? "warn" : "default",
              },
              {
                label: "Premium",
                value: data?.users.premium ?? 0,
                tone: "ok",
              },
            ]}
          />
          <DashBarChart
            title="Distribuição de contas"
            items={[
              { label: "Ativos", value: data?.users.active ?? 0 },
              { label: "Desativados", value: data?.users.disabled ?? 0 },
              { label: "Com Premium", value: data?.users.premium ?? 0 },
            ]}
            emptyLabel={ready ? "Sem usuários na amostra" : "Carregando…"}
          />
        </div>
      </section>

      <section className="bkf-dash__section">
        <div className="bkf-dash__section-head">
          <h3>Premium</h3>
          <Link href={`${base}/premium/`}>Abrir módulo</Link>
        </div>
        <div className="bkf-panel">
          <KpiStrip
            loading={!ready}
            items={[
              {
                label: "Ativos",
                value: data?.premium.active ?? 0,
                tone: "ok",
              },
              {
                label: "Expirados",
                value: data?.premium.expired ?? 0,
              },
              {
                label: "Expira em 7d",
                value: data?.premium.expiring7 ?? 0,
                tone: (data?.premium.expiring7 ?? 0) > 0 ? "warn" : "default",
              },
              {
                label: "Expira em 30d",
                value: data?.premium.expiring30 ?? 0,
              },
            ]}
          />
          <div className="bkf-dash__charts">
            <DashBarChart
              title="Origem (ativos)"
              items={(data?.premium.bySource ?? []).map((s) => ({
                label: s.label,
                value: s.count,
              }))}
              emptyLabel={ready ? "Nenhum Premium ativo" : "Carregando…"}
            />
            <DashBarChart
              title="Plano (ativos)"
              items={(data?.premium.byPlan ?? []).map((p) => ({
                label: p.label,
                value: p.count,
              }))}
              emptyLabel={ready ? "Nenhum Premium ativo" : "Carregando…"}
            />
          </div>
        </div>
      </section>

      <section className="bkf-dash__section">
        <div className="bkf-dash__section-head">
          <h3>Denúncias</h3>
          <Link href={`${base}/reports/`}>Abrir módulo</Link>
        </div>
        <div className="bkf-panel">
          <KpiStrip
            loading={!ready}
            items={[
              {
                label: "Abertas",
                value: data?.reports.open ?? 0,
                tone: (data?.reports.open ?? 0) > 0 ? "warn" : "ok",
              },
              {
                label: "Revisadas",
                value: data?.reports.reviewed ?? 0,
                tone: "ok",
              },
              {
                label: "Descartadas",
                value: data?.reports.dismissed ?? 0,
              },
              { label: "Total", value: data?.reports.total ?? 0 },
            ]}
          />
          <DashBarChart
            title="Fila de moderação (chat)"
            items={[
              { label: "Abertas", value: data?.reports.open ?? 0 },
              { label: "Revisadas", value: data?.reports.reviewed ?? 0 },
              { label: "Descartadas", value: data?.reports.dismissed ?? 0 },
            ]}
            emptyLabel={
              ready
                ? "Nenhuma denúncia — aparecem quando o usuário denuncia no chat"
                : "Carregando…"
            }
          />
        </div>
      </section>

      <section className="bkf-dash__section">
        <div className="bkf-dash__section-head">
          <h3>SOS — auditoria</h3>
          <Link href={`${base}/sos/`}>Abrir módulo</Link>
        </div>
        <div className="bkf-panel">
          <KpiStrip
            loading={!ready}
            items={[
              {
                label: "Alertas",
                value: data?.sos.alerts ?? 0,
                tone: (data?.sos.alerts ?? 0) > 0 ? "warn" : "default",
              },
              {
                label: "Falsos alarmes",
                value: data?.sos.falseAlarms ?? 0,
                tone: "ok",
              },
              {
                label: "Suprimidos",
                value: data?.sos.suppressed ?? 0,
              },
              { label: "Na amostra", value: data?.sos.total ?? 0 },
            ]}
          />
          <DashBarChart
            title="Eventos (FCM automático — sem fila BKF)"
            items={[
              { label: "Alertas", value: data?.sos.alerts ?? 0 },
              { label: "Falsos", value: data?.sos.falseAlarms ?? 0 },
              { label: "Suprimidos", value: data?.sos.suppressed ?? 0 },
              { label: "Duplicados", value: data?.sos.deduped ?? 0 },
            ]}
            emptyLabel={
              ready
                ? "Nenhum evento — aparecem após SOS/queda no app"
                : "Carregando…"
            }
          />
        </div>
      </section>

      <section className="bkf-dash__section">
        <div className="bkf-dash__section-head">
          <h3>Cloud Functions</h3>
          <Link href={`${base}/functions/`}>Abrir módulo</Link>
        </div>
        <div className="bkf-panel">
          <KpiStrip
            loading={!ready}
            items={[
              {
                label: "Erros",
                value: data?.functionFailures.errors ?? 0,
                tone:
                  (data?.functionFailures.errors ?? 0) > 0 ? "bad" : "ok",
              },
              {
                label: "Avisos",
                value: data?.functionFailures.warnings ?? 0,
                tone:
                  (data?.functionFailures.warnings ?? 0) > 0
                    ? "warn"
                    : "default",
              },
              {
                label: "Na amostra",
                value: data?.functionFailures.total ?? 0,
              },
            ]}
          />
          <DashBarChart
            title="Falhas por tipo de trigger"
            items={[
              {
                label: "Callable",
                value: data?.functionFailures.callable ?? 0,
              },
              {
                label: "Agendada",
                value: data?.functionFailures.schedule ?? 0,
              },
              {
                label: "Firestore",
                value: data?.functionFailures.firestore ?? 0,
              },
              { label: "HTTP", value: data?.functionFailures.https ?? 0 },
            ]}
            emptyLabel={
              ready
                ? "Nenhuma falha — aparecem quando uma Function quebra"
                : "Carregando…"
            }
          />
        </div>
      </section>

      <section className="bkf-dash__section">
        <div className="bkf-dash__section-head">
          <h3>Próximos módulos</h3>
        </div>
        <div className="bkf-dash__soon">
          {COMING_SOON.map((item) => (
            <div key={item.id} className="bkf-dash-soon-card">
              <h4>{item.title}</h4>
              <p>{item.blurb}</p>
              <span className="bkf-tag">Em breve</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
