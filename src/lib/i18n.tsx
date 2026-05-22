import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "pt" | "en";

const DICT = {
  pt: {
    "nav.home": "INÍCIO", "nav.tasks": "TAREFAS", "nav.plans": "NÍVEIS", "nav.profits": "LIQUIDEZ", "nav.profile": "O MEU",
    "menu.home": "Início", "menu.tasks": "Tarefas", "menu.plans": "Níveis VIP", "menu.profits": "Liquidez",
    "menu.deposit": "Recarregar", "menu.withdraw": "Levantar", "menu.team": "Equipa", "menu.profile": "O meu perfil",
    "menu.support": "Apoio (WhatsApp)", "menu.logout": "Sair",
    "profile.name": "Nome", "profile.phone": "Telefone", "profile.refCode": "Código de indicação",
    "profile.balance": "Saldo", "profile.earned": "Ganhos totais", "profile.withdrawn": "Sacado",
    "profile.signOut": "Sair da conta", "profile.welcome": "Bem-vindo de volta",
    "plans.title": "Níveis VIP", "plans.subtitle": "Escolha o seu nível e comece a ganhar diariamente",
    "plans.locked": "Em breve",
    "profits.title": "Liquidez", "profits.subtitle": "Acompanhe os seus ganhos e movimentos",
    "plans.daily": "Diário", "plans.days": "Dias", "plans.total": "Total",
    "plans.investment": "Investimento", "plans.member": "Membro Especial",
    "plans.buy": "Comprar agora", "plans.processing": "A processar…",
    "plans.empty": "Nenhum plano disponível.",
    "plans.activatedTitle": "🎉 VIP ativado!",
    "plans.activatedMsg": "Contacte o suporte por WhatsApp para confirmação rápida.",
    "plans.contactSupport": "Falar no WhatsApp",
    "tasks.activePlan": "Plano ativo", "tasks.tasksToday": "Tarefas hoje",
    "tasks.perVideo": "Por vídeo", "tasks.lockedTitle": "Assista grátis — Ganhe com VIP",
    "tasks.lockedMsg": "Pode ver os vídeos abaixo. Para receber recompensas, deposite e ative um plano VIP.",
    "tasks.deposit": "Depositar", "tasks.activate": "Ativar VIP",
    "tasks.watch": "Assistir", "tasks.watching": "A assistir…", "tasks.claim": "Reclamar",
    "tasks.done": "Feito", "tasks.vipNeeded": "VIP necessário", "tasks.empty": "Sem vídeos disponíveis.",
    "support.title": "Suporte 24/7", "support.whatsapp": "WhatsApp",
    "common.loading": "A carregar…",
  },
  en: {
    "nav.home": "HOME", "nav.tasks": "TASKS", "nav.plans": "LEVELS", "nav.profits": "LIQUIDITY", "nav.profile": "MINE",
    "menu.home": "Home", "menu.tasks": "Tasks", "menu.plans": "VIP Levels", "menu.profits": "Liquidity",
    "menu.deposit": "Deposit", "menu.withdraw": "Withdraw", "menu.team": "Team", "menu.profile": "My profile",
    "menu.support": "Support (WhatsApp)", "menu.logout": "Sign out",
    "profile.name": "Name", "profile.phone": "Phone", "profile.refCode": "Referral code",
    "profile.balance": "Balance", "profile.earned": "Total earned", "profile.withdrawn": "Withdrawn",
    "profile.signOut": "Sign out", "profile.welcome": "Welcome back",
    "plans.title": "VIP Levels", "plans.subtitle": "Pick your level and start earning daily",
    "plans.locked": "Coming soon",
    "profits.title": "Liquidity", "profits.subtitle": "Track your earnings and movements",
    "plans.daily": "Daily", "plans.days": "Days", "plans.total": "Total",
    "plans.investment": "Investment", "plans.member": "Special Member",
    "plans.buy": "Buy now", "plans.processing": "Processing…",
    "plans.empty": "No plans available.",
    "plans.activatedTitle": "🎉 VIP activated!",
    "plans.activatedMsg": "Contact WhatsApp support for fast confirmation.",
    "plans.contactSupport": "Open WhatsApp",
    "tasks.activePlan": "Active plan", "tasks.tasksToday": "Tasks today",
    "tasks.perVideo": "Per video", "tasks.lockedTitle": "Watch free — Earn with VIP",
    "tasks.lockedMsg": "You can watch the videos below. To earn rewards, deposit and activate a VIP plan.",
    "tasks.deposit": "Deposit", "tasks.activate": "Activate VIP",
    "tasks.watch": "Watch", "tasks.watching": "Watching…", "tasks.claim": "Claim",
    "tasks.done": "Done", "tasks.vipNeeded": "VIP required", "tasks.empty": "No videos available.",
    "support.title": "24/7 Support", "support.whatsapp": "WhatsApp",
    "common.loading": "Loading…",
  },
} as const;

type Key = keyof typeof DICT["pt"];

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: Key) => string }>({
  lang: "pt", setLang: () => {}, t: (k) => k,
});

export const WHATSAPP_NUMBER = "258858069930";
export const whatsappUrl = (msg: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("pt");
  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem("lang")) as Lang | null;
    if (saved === "pt" || saved === "en") setLangState(saved);
  }, []);
  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("lang", l);
  };
  const t = (k: Key) => (DICT[lang] as any)[k] ?? k;
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
