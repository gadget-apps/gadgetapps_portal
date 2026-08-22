export type IntranetModule = {
  id: string;
  href: string;
  title: string;
  description: string;
  status: "available" | "planned";
};

export const INTRANET_MODULES: IntranetModule[] = [
  {
    id: "bkf",
    href: "/intranet/bkf/",
    title: "Backoffice (BKF)",
    description:
      "Operação multi-app: usuários, Premium, denúncias, chat, SOS e config.",
    status: "available",
  },
  {
    id: "docs",
    href: "/intranet/",
    title: "Documentos internos",
    description: "Políticas, manuais e materiais da equipe (em breve).",
    status: "planned",
  },
  {
    id: "ops",
    href: "/intranet/",
    title: "Operações",
    description: "Processos internos e ferramentas da empresa (em breve).",
    status: "planned",
  },
];
