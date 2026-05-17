import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo } from "react";
import { getTransactions } from "@/lib/api.functions";
import { formatMZN } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/history")({ component: History });

const TYPE_LABELS: Record<string, { pt: string; en: string }> = {
  deposit: { pt: "Depósito", en: "Deposit" },
  withdrawal: { pt: "Saque", en: "Withdrawal" },
  task_reward: { pt: "Tarefa", en: "Task" },
  plan_purchase: { pt: "Compra de plano", en: "Plan purchase" },
  referral_commission: { pt: "Comissão", en: "Commission" },
  refund: { pt: "Reembolso", en: "Refund" },
};

const FILTERS = [
  { key: "all", pt: "Todos", en: "All" },
  { key: "deposit", pt: "Depósitos", en: "Deposits" },
  { key: "withdrawal", pt: "Saques", en: "Withdrawals" },
  { key: "task_reward", pt: "Tarefas", en: "Tasks" },
  { key: "referral_commission", pt: "Comissões", en: "Commissions" },
] as const;

function History() {
  const fn = useServerFn(getTransactions);
  const { data, isLoading } = useQuery({ queryKey: ["transactions"], queryFn: () => fn() });
  const { lang } = useI18n();
  const [filter, setFilter] = useState<string>("all");

  const items = useMemo(() => {
    const all = data?.transactions ?? [];
    return filter === "all" ? all : all.filter((t: any) => t.type === filter);
  }, [data, filter]);

  const totals = useMemo(() => {
    const inn = items.filter((t: any) => Number(t.amount) > 0).reduce((s: number, t: any) => s + Number(t.amount), 0);
    const out = items.filter((t: any) => Number(t.amount) < 0).reduce((s: number, t: any) => s + Number(t.amount), 0);
    return { inn, out };
  }, [items]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">{lang === "pt" ? "Histórico" : "History"}</h1>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-card p-3 shadow-card">
          <div className="text-xs text-muted-foreground">{lang === "pt" ? "Entradas" : "Inflows"}</div>
          <div className="text-lg font-black text-success">+{formatMZN(totals.inn)}</div>
        </div>
        <div className="rounded-2xl bg-card p-3 shadow-card">
          <div className="text-xs text-muted-foreground">{lang === "pt" ? "Saídas" : "Outflows"}</div>
          <div className="text-lg font-black text-danger">{formatMZN(totals.out)}</div>
        </div>
      </div>

      <div className="-mx-4 overflow-x-auto px-4">
        <div className="flex gap-2 pb-1 w-max">
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold ${
                filter === f.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
              {f[lang]}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground py-10">…</div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-card shadow-card">
          {items.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {lang === "pt" ? "Sem transações." : "No transactions."}
            </div>
          ) : items.map((tx: any) => (
            <div key={tx.id} className="flex items-center justify-between border-b last:border-0 px-4 py-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold">{TYPE_LABELS[tx.type]?.[lang] ?? tx.type}</div>
                <div className="text-xs text-muted-foreground truncate">{tx.description ?? "—"}</div>
                <div className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleString(lang === "pt" ? "pt-PT" : "en-US")}</div>
              </div>
              <div className={`text-sm font-bold ${Number(tx.amount) >= 0 ? "text-success" : "text-danger"}`}>
                {Number(tx.amount) >= 0 ? "+" : ""}{formatMZN(tx.amount)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
