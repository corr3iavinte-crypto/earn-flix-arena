import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Menu, X, Globe, Home, ListChecks, Layers, TrendingUp, User as UserIcon,
  LogOut, Shield, MessageCircle, Smartphone, Trophy, History,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { checkAdmin } from "@/lib/api.functions";
import { AIChat } from "@/components/AIChat";
import { NotificationsBell } from "@/components/NotificationsBell";
import { useI18n, whatsappUrl, WHATSAPP_NUMBER } from "@/lib/i18n";

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const checkAdminFn = useServerFn(checkAdmin);
  const { data: adminData } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: () => checkAdminFn(),
    enabled: !!user,
  });
  const { lang, setLang, t } = useI18n();

  const TABS = [
    { to: "/home", label: t("nav.home"), icon: Home },
    { to: "/tasks", label: t("nav.tasks"), icon: ListChecks },
    { to: "/plans", label: t("nav.plans"), icon: Layers },
    { to: "/lucros", label: t("nav.profits"), icon: TrendingUp, hot: true },
    { to: "/profile", label: t("nav.profile"), icon: UserIcon },
  ];

  const handleLogout = async () => { await signOut(); nav({ to: "/login" }); };
  const userName = (user?.user_metadata as any)?.full_name ?? "Utilizador";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <button onClick={() => setOpen(true)} aria-label="Menu"
            className="rounded-xl bg-primary p-2 text-primary-foreground shadow-sm">
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/home" className="text-xl font-black tracking-wider">
            PETRO<span className="text-primary">MOC</span> S.A
          </Link>
          <div className="flex items-center gap-2">
            <NotificationsBell />
            <button
              onClick={() => setLang(lang === "pt" ? "en" : "pt")}
              aria-label="Language"
              className="flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-xs font-bold text-muted-foreground hover:text-primary"
            >
              <Globe className="h-4 w-4" />
              {lang.toUpperCase()}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-4 pb-28">{children}</main>

      {/* Floating WhatsApp button */}
      <a
        href={whatsappUrl(lang === "pt" ? "Olá! Preciso de ajuda na Petromoc S.A." : "Hi! I need help on Petromoc S.A.")}
        target="_blank" rel="noreferrer"
        aria-label="WhatsApp"
        className="fixed bottom-24 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-elegant hover:scale-110 transition-transform"
      >
        <svg viewBox="0 0 32 32" className="h-7 w-7" fill="currentColor"><path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.043-.53-.043-.302 0-.53.115-.746.315-.688.645-1.04 1.318-1.06 2.264v.114c-.015.99.472 1.977 1.017 2.78 1.23 1.82 2.506 3.41 4.554 4.34.616.287 2.035.916 2.722.916.345 0 2.13-.43 2.13-1.604 0-.46-.03-.88-.31-1.262-.247-.34-.62-.43-1.034-.43z"/><path d="M16.013 0C7.187 0 0 7.187 0 16.013c0 2.842.747 5.622 2.165 8.075L.06 32l8.092-2.123a15.9 15.9 0 0 0 7.86 2.06c8.825 0 16.013-7.187 16.013-16.013S24.838 0 16.013 0zm0 29.342c-2.515 0-4.97-.673-7.116-1.95l-.51-.302-5.236 1.374 1.395-5.106-.332-.526a13.27 13.27 0 0 1-2.04-7.083C2.174 8.665 8.4 2.44 16.05 2.44c3.677 0 7.13 1.435 9.728 4.034a13.66 13.66 0 0 1 4.024 9.71c-.01 7.65-6.236 13.876-13.886 13.876z"/></svg>
      </a>

      <AIChat />

      {/* Bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur">
        <div className="mx-auto grid max-w-5xl grid-cols-5">
          {TABS.map((t) => {
            const active = path === t.to;
            return (
              <Link key={t.to} to={t.to} className="flex flex-col items-center gap-0.5 py-2.5">
                <span className={`relative flex h-9 w-9 items-center justify-center rounded-2xl ${active ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}>
                  <t.icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                  {t.hot && <span className="absolute -right-2 -top-2 rounded-full bg-danger px-1.5 py-px text-[8px] font-black text-white">HOT</span>}
                </span>
                <span className={`text-[10px] font-bold tracking-wide ${active ? "text-primary" : "text-muted-foreground"}`}>{t.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="relative flex h-full w-[88%] max-w-sm flex-col bg-sidebar text-sidebar-foreground">
            <div className="bg-gradient-header p-4 text-primary-foreground">
              <div className="flex items-center justify-between">
                <span className="text-lg font-black tracking-wider">PETROMOC S.A</span>
                <button onClick={() => setOpen(false)} className="rounded-lg bg-white/15 p-2 hover:bg-white/25"><X className="h-5 w-5" /></button>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <div className="rounded-full bg-white/20 p-2"><UserIcon className="h-6 w-6" /></div>
                <div>
                  <div className="font-semibold">{userName}</div>
                  <div className="text-xs opacity-90">{t("profile.welcome")}</div>
                </div>
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto p-3">
              {[
                { to: "/home", label: t("menu.home"), icon: Home },
                { to: "/tasks", label: t("menu.tasks"), icon: ListChecks },
                { to: "/plans", label: t("menu.plans"), icon: Layers },
                { to: "/lucros", label: t("menu.profits"), icon: TrendingUp },
                { to: "/deposit", label: t("menu.deposit"), icon: Smartphone },
                { to: "/withdraw", label: t("menu.withdraw"), icon: TrendingUp },
                { to: "/team", label: t("menu.team"), icon: UserIcon },
                { to: "/leaderboard", label: lang === "pt" ? "Ranking" : "Leaderboard", icon: Trophy },
                { to: "/history", label: lang === "pt" ? "Histórico" : "History", icon: History },
                { to: "/profile", label: t("menu.profile"), icon: UserIcon },
              ].map((item) => {
                const active = path === item.to;
                return (
                  <Link key={item.to} to={item.to} onClick={() => setOpen(false)}
                    className={`mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 ${active ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/50"}`}>
                    <item.icon className="h-5 w-5 text-primary" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
              {adminData?.isAdmin && (
                <Link to="/admin" onClick={() => setOpen(false)}
                  className={`mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 ${path.startsWith("/admin") ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/50"}`}>
                  <Shield className="h-5 w-5 text-warning" />
                  <span className="font-medium">Admin</span>
                </Link>
              )}
              <a
                href={whatsappUrl(lang === "pt" ? "Olá! Preciso de ajuda." : "Hi! I need help.")}
                target="_blank" rel="noreferrer"
                className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-sidebar-accent/50"
              >
                <MessageCircle className="h-5 w-5 text-success" />
                <span className="font-medium">{t("menu.support")}</span>
                <span className="ml-auto text-[10px] text-muted-foreground">+{WHATSAPP_NUMBER}</span>
              </a>
            </nav>

            <div className="border-t border-sidebar-border p-3">
              <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl border border-destructive/40 px-3 py-2.5 text-destructive hover:bg-destructive/10">
                <LogOut className="h-5 w-5" /> <span className="font-semibold">{t("menu.logout")}</span>
              </button>
              <div className="mt-3 text-center text-xs text-sidebar-foreground/40">Petromoc S.A © 2026</div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
