import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboard } from "@/lib/api.functions";
import { useAuth } from "@/lib/auth-context";
import { formatMZN } from "@/lib/format";
import { LogOut, User, Phone, Hash, Calendar, Mail, Shield } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/profile")({ component: Profile });

function Profile() {
  const { signOut, user } = useAuth();
  const nav = useNavigate();
  const { t } = useI18n();
  const fn = useServerFn(getDashboard);
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: () => fn() });
  const p = data?.profile;
  const created = p?.created_at ? new Date(p.created_at).toLocaleDateString() : "—";

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-header p-6 text-primary-foreground shadow-elegant text-center">
        <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-white/25 text-3xl font-black">
          {(p?.full_name ?? "U").charAt(0).toUpperCase()}
        </div>
        <div className="text-xl font-extrabold">{isLoading ? t("common.loading") : (p?.full_name ?? "—")}</div>
        <div className="text-sm opacity-90">{p?.phone ?? user?.email}</div>
        <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs">
          <Shield className="h-3 w-3" /> ID: {p?.referral_code ?? "—"}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat label={t("profile.balance")} value={formatMZN(p?.balance ?? 0)} />
        <Stat label={t("profile.earned")} value={formatMZN(p?.total_earned ?? 0)} />
        <Stat label={t("profile.withdrawn")} value={formatMZN(p?.total_withdrawn ?? 0)} />
      </div>

      <div className="space-y-2">
        <Item icon={User} label={t("profile.name")} value={p?.full_name ?? "—"} />
        <Item icon={Phone} label={t("profile.phone")} value={p?.phone ?? "—"} />
        <Item icon={Hash} label={t("profile.refCode")} value={p?.referral_code ?? "—"} />
        <Item icon={Mail} label="Email" value={user?.email ?? "—"} />
        <Item icon={Calendar} label="Membro desde" value={created} />
      </div>

      <button
        onClick={async () => { await signOut(); nav({ to: "/login" }); }}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/40 bg-card py-3.5 font-bold text-destructive hover:bg-destructive/10"
      >
        <LogOut className="h-5 w-5" /> {t("profile.signOut")}
      </button>
    </div>
  );
}

function Item({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-card">
      <span className="rounded-lg bg-primary/15 p-2 text-primary"><Icon className="h-4 w-4" /></span>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="truncate font-semibold">{value}</div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-card p-3 shadow-card text-center">
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 text-xs font-bold">{value}</div>
    </div>
  );
}
