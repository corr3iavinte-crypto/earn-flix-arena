import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { requestDeposit, getMyRequests, getPaymentMethods } from "@/lib/api.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { formatMZN } from "@/lib/format";
import { toast } from "sonner";
import { Upload, Smartphone, Copy } from "lucide-react";

export const Route = createFileRoute("/_authenticated/deposit")({ component: Deposit });

function Deposit() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [method, setMethod] = useState("");
  const [amount, setAmount] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const reqFn = useServerFn(requestDeposit);
  const myFn = useServerFn(getMyRequests);
  const pmFn = useServerFn(getPaymentMethods);
  const { data: pm } = useQuery({ queryKey: ["payment-methods"], queryFn: () => pmFn() });
  const METHODS = pm?.methods ?? [];
  const { data: my } = useQuery({ queryKey: ["my-requests"], queryFn: () => myFn() });

function Deposit() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [method, setMethod] = useState("mpesa");
  const [amount, setAmount] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const reqFn = useServerFn(requestDeposit);
  const myFn = useServerFn(getMyRequests);
  const { data: my } = useQuery({ queryKey: ["my-requests"], queryFn: () => myFn() });

  const copyNumber = async (num: string) => {
    try {
      await navigator.clipboard.writeText(num);
      toast.success(`Número ${num} copiado!`);
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  const submit = async () => {
    const amt = Number(amount);
    if (!amt || amt < 100) { toast.error("Valor mínimo: 100 MZN"); return; }
    if (!file) { toast.error("Anexe o comprovativo"); return; }
    if (!confirmationMessage.trim()) { toast.error("Cole a mensagem de confirmação da transferência"); return; }
    setBusy(true);
    try {
      const path = `${user!.id}/${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, "_")}`;
      const { error } = await supabase.storage.from("payment-proofs").upload(path, file);
      if (error) throw error;
      await reqFn({ data: { method, amount: amt, screenshotPath: path, confirmationMessage: confirmationMessage.trim() } });
      toast.success("Depósito enviado! Aguarde aprovação.");
      setAmount(""); setFile(null); setConfirmationMessage("");
      qc.invalidateQueries();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro");
    } finally { setBusy(false); }
  };

  const selected = METHODS.find((m) => m.id === method)!;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold">Depósito</h1>
        <p className="text-sm text-muted-foreground">Envie o pagamento e anexe o comprovativo.</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {METHODS.map((m) => (
          <button key={m.id} onClick={() => setMethod(m.id)} className={`rounded-xl p-3 text-sm font-bold ring-2 ${method === m.id ? "ring-primary bg-primary/10" : "ring-border bg-card"}`}>
            <div className={`mx-auto mb-1 inline-flex rounded-lg ${m.color} p-1.5 text-white`}><Smartphone className="h-4 w-4" /></div>
            <div>{m.name}</div>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border-l-4 border-primary bg-card p-4 shadow-card">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Envie para {selected.name}</div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <div className="text-2xl font-extrabold tracking-wider text-primary">{selected.number}</div>
          <button
            type="button"
            onClick={() => copyNumber(selected.number)}
            className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow hover:opacity-90 active:scale-95"
          >
            <Copy className="h-3.5 w-3.5" /> Copiar
          </button>
        </div>
        <div className="mt-1 text-sm font-semibold">Titular: {selected.holder}</div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold">Valor (MZN)</label>
        <input type="number" min="100" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Ex: 650"
          className="w-full rounded-xl border bg-muted/50 px-4 py-3 outline-none" />

        <label className="block text-sm font-semibold pt-2">Mensagem de confirmação da transferência</label>
        <textarea
          value={confirmationMessage}
          onChange={(e) => setConfirmationMessage(e.target.value)}
          rows={4}
          placeholder="Cole aqui a SMS de confirmação do M-Pesa / e-Mola (ID da transação, valor, número, etc.)"
          className="w-full rounded-xl border bg-muted/50 px-4 py-3 outline-none text-sm"
        />

        <label className="block text-sm font-semibold pt-2">Comprovativo (foto)</label>
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 bg-card px-4 py-6 text-sm text-muted-foreground hover:bg-primary/5">
          <Upload className="h-5 w-5" />
          {file ? file.name : "Toque para anexar imagem"}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>

        <button onClick={submit} disabled={busy} className="w-full rounded-2xl bg-primary py-3.5 font-bold text-primary-foreground shadow-elegant hover:opacity-90 disabled:opacity-60">
          {busy ? "A enviar…" : "Enviar depósito"}
        </button>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-bold uppercase text-muted-foreground">Meus depósitos</h3>
        <div className="space-y-2">
          {(my?.deposits ?? []).map((d: any) => (
            <div key={d.id} className="flex items-center justify-between rounded-xl bg-card p-3 shadow-card">
              <div>
                <div className="font-semibold">{formatMZN(d.amount)} · {d.method}</div>
                <div className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleString("pt-PT")}</div>
              </div>
              <StatusBadge status={d.status} />
            </div>
          ))}
          {(my?.deposits ?? []).length === 0 && <div className="text-center text-sm text-muted-foreground py-3">Sem depósitos.</div>}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: any = {
    pending: "bg-warning/20 text-warning-foreground",
    approved: "bg-success/20 text-success",
    rejected: "bg-destructive/20 text-destructive",
  };
  const label: any = { pending: "Pendente", approved: "Aprovado", rejected: "Rejeitado" };
  return <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${map[status]}`}>{label[status] ?? status}</span>;
}
