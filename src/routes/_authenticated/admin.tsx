import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListPending, adminApproveDeposit, adminApproveWithdrawal, checkAdmin } from "@/lib/api.functions";
import { supabase } from "@/integrations/supabase/client";
import { formatMZN } from "@/lib/format";
import { toast } from "sonner";
import { Check, X, ImageIcon, Shield } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/admin")({ component: Admin });

function Admin() {
  const qc = useQueryClient();
  const adm = useServerFn(checkAdmin);
  const list = useServerFn(adminListPending);
  const apprD = useServerFn(adminApproveDeposit);
  const apprW = useServerFn(adminApproveWithdrawal);

  const { data: who, isLoading: lc } = useQuery({ queryKey: ["check-admin"], queryFn: () => adm() });
  const { data, isLoading } = useQuery({ queryKey: ["admin-pending"], queryFn: () => list(), enabled: !!who?.isAdmin });

  const mD = useMutation({ mutationFn: (v: any) => apprD({ data: v }), onSuccess: () => { toast.success("OK"); qc.invalidateQueries(); } });
  const mW = useMutation({ mutationFn: (v: any) => apprW({ data: v }), onSuccess: () => { toast.success("OK"); qc.invalidateQueries(); } });

  if (lc) return <div className="text-center py-10 text-muted-foreground">A verificar…</div>;
  if (!who?.isAdmin) return <Navigate to="/home" />;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-extrabold">Painel Admin</h1>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-bold uppercase text-muted-foreground">Depósitos pendentes ({data?.deposits.length ?? 0})</h2>
        <div className="space-y-2">
          {isLoading && <div className="text-sm text-muted-foreground">A carregar…</div>}
          {(data?.deposits ?? []).map((d: any) => (
            <DepositCard key={d.id} d={d} onApprove={(approve) => mD.mutate({ id: d.id, approve })} />
          ))}
          {data && data.deposits.length === 0 && <div className="text-sm text-muted-foreground">Sem pendentes.</div>}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold uppercase text-muted-foreground">Saques pendentes ({data?.withdrawals.length ?? 0})</h2>
        <div className="space-y-2">
          {(data?.withdrawals ?? []).map((w: any) => (
            <div key={w.id} className="rounded-xl border-l-4 border-warning bg-card p-3 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold">{w.profile?.full_name} · {w.profile?.phone}</div>
                  <div className="text-sm text-muted-foreground">Pagar {formatMZN(w.net_amount)} para {w.network} {w.phone}</div>
                  <div className="text-xs text-muted-foreground">Bruto {formatMZN(w.amount)} · Taxa {formatMZN(w.fee)}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => mW.mutate({ id: w.id, approve: true })} className="rounded-lg bg-success p-2 text-success-foreground"><Check className="h-4 w-4" /></button>
                  <button onClick={() => mW.mutate({ id: w.id, approve: false })} className="rounded-lg bg-destructive p-2 text-destructive-foreground"><X className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
          {data && data.withdrawals.length === 0 && <div className="text-sm text-muted-foreground">Sem pendentes.</div>}
        </div>
      </section>

    </div>
  );
}

function DepositCard({ d, onApprove }: { d: any; onApprove: (a: boolean) => void }) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const showImage = async () => {
    const { data } = await supabase.storage.from("payment-proofs").createSignedUrl(d.screenshot_url, 300);
    if (data?.signedUrl) setImgUrl(data.signedUrl);
  };
  return (
    <div className="rounded-xl border-l-4 border-success bg-card p-3 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-bold">{d.profile?.full_name} · {d.profile?.phone}</div>
          <div className="text-sm">{formatMZN(d.amount)} via {d.method}</div>
          <div className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleString("pt-PT")}</div>
        </div>
        <div className="flex gap-2">
          <button onClick={showImage} className="rounded-lg bg-info p-2 text-info-foreground"><ImageIcon className="h-4 w-4" /></button>
          <button onClick={() => onApprove(true)} className="rounded-lg bg-success p-2 text-success-foreground"><Check className="h-4 w-4" /></button>
          <button onClick={() => onApprove(false)} className="rounded-lg bg-destructive p-2 text-destructive-foreground"><X className="h-4 w-4" /></button>
        </div>
      </div>
      {d.confirmation_message && (
        <div className="mt-2 whitespace-pre-wrap rounded-lg bg-muted p-2 text-xs text-foreground">
          <div className="mb-1 font-bold uppercase text-muted-foreground">Mensagem do cliente</div>
          {d.confirmation_message}
        </div>
      )}
      {imgUrl && (
        <div className="mt-3">
          <img src={imgUrl} alt="comprovativo" className="max-h-72 w-auto rounded-lg border" />
        </div>
      )}
    </div>
  );
}
