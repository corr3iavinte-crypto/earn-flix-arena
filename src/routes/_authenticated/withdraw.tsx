import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { requestWithdrawal, getMyRequests, getDashboard } from "@/lib/api.functions";
import { formatMZN } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/withdraw")({ component: Withdraw });

function Withdraw() {
  const qc = useQueryClient();
  const [network, setNetwork] = useState("mpesa");
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");

  const reqFn = useServerFn(requestWithdrawal);
  const myFn = useServerFn(getMyRequests);
  const dashFn = useServerFn(getDashboard);
  const { data: dash } = useQuery({ queryKey: ["dashboard"], queryFn: () => dashFn() });
  const { data: my } = useQuery({ queryKey: ["my-requests"], queryFn: () => myFn() });

  const m = useMutation({
    mutationFn: () => reqFn({ data: { network, amount: Number(amount), phone } }),
    onSuccess: () => { toast.success("Pedido de saque enviado!"); setAmount(""); setPhone(""); qc.invalidateQueries(); },
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });

  const amt = Number(amount) || 0;
  const fee = Math.round(amt * 0.1 * 100) / 100;
  const net = amt - fee;
  const balance = Number(dash?.profile?.balance ?? 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold">Retirar</h1>
        <p className="text-sm text-muted-foreground">Saldo: <span className="font-bold text-primary">{formatMZN(balance)}</span></p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[{ id: "mpesa", n: "M-Pesa" }, { id: "emola", n: "e-Mola" }].map((x) => (
          <button key={x.id} onClick={() => setNetwork(x.id)} className={`rounded-xl p-3 text-sm font-bold ring-2 ${network === x.id ? "ring-primary bg-primary/10" : "ring-border bg-card"}`}>{x.n}</button>
        ))}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold">Número de recebimento</label>
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Ex: 841234567"
          className="w-full rounded-xl border bg-muted/50 px-4 py-3 outline-none" />

        <label className="block text-sm font-semibold pt-2">Valor (MZN, mín. 50)</label>
        <input type="number" min="50" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Ex: 500"
          className="w-full rounded-xl border bg-muted/50 px-4 py-3 outline-none" />

        <div className="pt-2">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Valores rápidos (MT)</div>
          <div className="grid grid-cols-3 gap-2">
            {[90, 200, 1500, 5000, 10000, 30000, 50000].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setAmount(String(v))}
                className={`rounded-xl border px-3 py-2.5 text-sm font-bold transition-colors ${
                  amt === v ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground hover:border-primary/40"
                }`}
              >
                MT {v.toLocaleString("pt-PT")}
              </button>
            ))}
          </div>
        </div>

        {amt > 0 && (
          <div className="rounded-xl bg-muted/50 p-3 text-sm space-y-1">
            <div className="flex justify-between"><span>Valor</span><span className="font-semibold">{formatMZN(amt)}</span></div>
            <div className="flex justify-between text-danger"><span>Taxa (10%)</span><span>-{formatMZN(fee)}</span></div>
            <div className="flex justify-between border-t pt-1 font-bold"><span>Você recebe</span><span className="text-success">{formatMZN(net)}</span></div>
          </div>
        )}

        <button
          onClick={() => m.mutate()}
          disabled={m.isPending || amt < 50 || phone.length < 9 || amt > balance}
          className="w-full rounded-2xl bg-primary py-3.5 font-bold text-primary-foreground shadow-elegant hover:opacity-90 disabled:opacity-60"
        >
          {m.isPending ? "A enviar…" : amt > balance ? "Saldo insuficiente" : "Solicitar saque"}
        </button>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-bold uppercase text-muted-foreground">Meus saques</h3>
        <div className="space-y-2">
          {(my?.withdrawals ?? []).map((w: any) => (
            <div key={w.id} className="flex items-center justify-between rounded-xl bg-card p-3 shadow-card">
              <div>
                <div className="font-semibold">{formatMZN(w.amount)} · {w.network}</div>
                <div className="text-xs text-muted-foreground">{new Date(w.created_at).toLocaleString("pt-PT")} · {w.phone}</div>
              </div>
              <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${w.status === "approved" ? "bg-success/20 text-success" : w.status === "rejected" ? "bg-destructive/20 text-destructive" : "bg-warning/20 text-warning-foreground"}`}>
                {w.status === "approved" ? "Pago" : w.status === "rejected" ? "Rejeitado" : "Pendente"}
              </span>
            </div>
          ))}
          {(my?.withdrawals ?? []).length === 0 && <div className="text-center text-sm text-muted-foreground py-3">Sem saques.</div>}
        </div>
      </div>
    </div>
  );
}
