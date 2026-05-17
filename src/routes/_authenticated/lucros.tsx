import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboard, getTransactions } from "@/lib/api.functions";
import { formatMZN } from "@/lib/format";
import { TrendingUp, Wallet, Coins } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/lucros")({ component: Lucros });

const TYPE_LABELS: Record<string, string> = {
  deposit: "Depósito",
  withdrawal: "Saque",
  task_reward: "Tarefa",
  plan_purchase: "Compra de plano",
  referral_commission: "Comissão",
  refund: "Reembolso",
};

function Lucros() {
  const { t } = useI18n() as any;
  const dashFn = useServerFn(getDashboard);
  const txFn = useServerFn(getTransactions);
  const { data: dash } = useQuery({ queryKey: ["dashboard"], queryFn: () => dashFn() });
  const { data: tx, isLoading } = useQuery({ queryKey: ["transactions"], queryFn: () => txFn() });

  const p = dash?.profile;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-header p-5 text-primary-foreground shadow-elegant">
        <h1 className="text-2xl font-black">{t("profits.title")}</h1>
        <p className="mt-1 text-sm opacity-90">{t("profits.subtitle")}</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Card icon={<TrendingUp className="h-4 w-4" />} label="Hoje" value={formatMZN(dash?.earnedToday ?? 0)} />
        <Card icon={<Coins className="h-4 w-4" />} label="Total ganho" value={formatMZN(p?.total_earned ?? 0)} />
        <Card icon={<Wallet className="h-4 w-4" />} label="Saldo" value={formatMZN(p?.balance ?? 0)} />
      </div>

      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Movimentos</h3>
      {isLoading ? (
        <div className="text-center text-muted-foreground py-10">A carregar…</div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-card shadow-card">
          {(tx?.transactions ?? []).length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Sem transações ainda.</div>
          ) : (
            tx!.transactions.map((t: any) => (
              <div key={t.id} className="flex items-center justify-between border-b last:border-0 px-4 py-3">
                <div>
                  <div className="text-sm font-semibold">{TYPE_LABELS[t.type] ?? t.type}</div>
                  <div className="text-xs text-muted-foreground">{t.description ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString("pt-PT")}</div>
                </div>
                <div className={`text-sm font-bold ${Number(t.amount) >= 0 ? "text-success" : "text-danger"}`}>
                  {Number(t.amount) >= 0 ? "+" : ""}{formatMZN(t.amount)}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function Card({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card p-3 text-center shadow-card">
      <div className="mx-auto flex items-center justify-center text-primary">{icon}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-black text-primary">{value}</div>
    </div>
  );
}
