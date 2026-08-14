"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { DashColumnChart } from "@/components/bkf/DashColumnChart";
import { DashDonutChart } from "@/components/bkf/DashDonutChart";
import { DashStackChart } from "@/components/bkf/DashStackChart";
import { KpiStrip } from "@/components/bkf/KpiStrip";
import {
  loadAdminDashBundle,
  type AdminDashBundle,
} from "@/lib/bkf/dashboard-metrics";

type Props = {
  appId: string;
};

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
            <DashColumnChart
              title="Prioridade (pendentes)"
              items={[
                {
                  label: "Normal",
                  value: data?.chat.normal ?? 0,
                  tone: "muted",
                },
                {
                  label: "Alta",
                  value: data?.chat.high ?? 0,
                  tone: "warn",
                },
                {
                  label: "Urgente",
                  value: data?.chat.urgent ?? 0,
                  tone: "bad",
                },
              ]}
              emptyLabel={ready ? "Nenhum ticket pendente" : "Carregando…"}
            />
            <DashDonutChart
              title="Status da fila"
              items={[
                {
                  label: "Aberto",
                  value: data?.chat.open ?? 0,
                  tone: "info",
                },
                {
                  label: "Aguardando",
                  value: data?.chat.pendingStatus ?? 0,
                  tone: "warn",
                },
                {
                  label: "Atribuído",
                  value: data?.chat.assigned ?? 0,
                  tone: "ok",
                },
                {
                  label: "Resolvido",
                  value: data?.chat.resolved ?? 0,
                  tone: "muted",
                },
              ]}
              emptyLabel={ready ? "Sem tickets" : "Carregando…"}
            />
            <DashDonutChart
              title="Contas"
              items={[
                {
                  label: "Ativos",
                  value: data?.users.active ?? 0,
                  tone: "ok",
                },
                {
                  label: "Desativados",
                  value: data?.users.disabled ?? 0,
                  tone: "warn",
                },
                {
                  label: "Premium",
                  value: data?.users.premium ?? 0,
                  tone: "info",
                },
              ]}
              emptyLabel={ready ? "Sem usuários" : "Carregando…"}
            />
            <DashDonutChart
              title="Denúncias"
              items={[
                {
                  label: "Abertas",
                  value: data?.reports.open ?? 0,
                  tone: "warn",
                },
                {
                  label: "Revisadas",
                  value: data?.reports.reviewed ?? 0,
                  tone: "ok",
                },
                {
                  label: "Descartadas",
                  value: data?.reports.dismissed ?? 0,
                  tone: "muted",
                },
              ]}
              emptyLabel={ready ? "Sem denúncias" : "Carregando…"}
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
            <DashStackChart
              title="Origem Premium"
              items={(data?.premium.bySource ?? []).map((s) => ({
                label: s.label,
                value: s.count,
              }))}
              emptyLabel={ready ? "Nenhum ativo" : "Carregando…"}
            />
            <DashColumnChart
              title="Planos"
              items={(data?.premium.byPlan ?? []).map((p) => ({
                label: p.label,
                value: p.count,
              }))}
              emptyLabel={ready ? "Nenhum ativo" : "Carregando…"}
            />
            <DashColumnChart
              title="SOS"
              items={[
                {
                  label: "Alertas",
                  value: data?.sos.alerts ?? 0,
                  tone: "bad",
                },
                {
                  label: "Falsos",
                  value: data?.sos.falseAlarms ?? 0,
                  tone: "ok",
                },
                {
                  label: "Suprimidos",
                  value: data?.sos.suppressed ?? 0,
                  tone: "warn",
                },
                {
                  label: "Dup.",
                  value: data?.sos.deduped ?? 0,
                  tone: "muted",
                },
              ]}
              emptyLabel={ready ? "Sem eventos" : "Carregando…"}
            />
            <DashStackChart
              title="Falhas CF"
              items={[
                {
                  label: "Callable",
                  value: data?.functionFailures.callable ?? 0,
                  tone: "info",
                },
                {
                  label: "Agenda",
                  value: data?.functionFailures.schedule ?? 0,
                  tone: "warn",
                },
                {
                  label: "Firestore",
                  value: data?.functionFailures.firestore ?? 0,
                  tone: "muted",
                },
                {
                  label: "HTTP",
                  value: data?.functionFailures.https ?? 0,
                  tone: "ok",
                },
              ]}
              emptyLabel={ready ? "Sem falhas" : "Carregando…"}
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
        </div>
      </section>
    </div>
  );
}
