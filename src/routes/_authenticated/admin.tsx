import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  adminListPending, adminApproveDeposit, adminApproveWithdrawal, checkAdmin,
  adminListPaymentMethods, adminUpsertPaymentMethod, adminDeletePaymentMethod,
  adminListAdmins, adminAddAdmin, adminRemoveAdmin,
  adminSearchUsers, adminAdjustBalance,
  adminListPlans, adminUpsertPlan, adminDeletePlan,
} from "@/lib/api.functions";
import { supabase } from "@/integrations/supabase/client";
import { formatMZN } from "@/lib/format";
import { toast } from "sonner";
import { Check, X, ImageIcon, Shield, Trash2, Pencil, Plus, Search, UserPlus } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/admin")({ component: Admin });

type Tab = "pending" | "methods" | "admins" | "balances" | "plans";

function Admin() {
  const adm = useServerFn(checkAdmin);
  const { data: who, isLoading: lc } = useQuery({ queryKey: ["check-admin"], queryFn: () => adm() });
  const [tab, setTab] = useState<Tab>("pending");

  if (lc) return <div className="text-center py-10 text-muted-foreground">A verificar…</div>;
  if (!who?.isAdmin) return <Navigate to="/home" />;

  const tabs: { id: Tab; label: string }[] = [
    { id: "pending", label: "Pendentes" },
    { id: "methods", label: "Números" },
    { id: "admins", label: "Admins" },
    { id: "balances", label: "Saldos" },
    { id: "plans", label: "Planos" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-extrabold">Painel Admin</h1>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-bold ${tab === t.id ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "pending" && <PendingSection />}
      {tab === "methods" && <MethodsSection />}
      {tab === "admins" && <AdminsSection />}
      {tab === "balances" && <BalancesSection />}
      {tab === "plans" && <PlansSection />}
    </div>
  );
}

/* ========================= PENDENTES ========================= */
function PendingSection() {
  const qc = useQueryClient();
  const list = useServerFn(adminListPending);
  const apprD = useServerFn(adminApproveDeposit);
  const apprW = useServerFn(adminApproveWithdrawal);
  const { data, isLoading } = useQuery({ queryKey: ["admin-pending"], queryFn: () => list() });
  const mD = useMutation({ mutationFn: (v: any) => apprD({ data: v }), onSuccess: () => { toast.success("OK"); qc.invalidateQueries(); } });
  const mW = useMutation({ mutationFn: (v: any) => apprW({ data: v }), onSuccess: () => { toast.success("OK"); qc.invalidateQueries(); } });

  return (
    <div className="space-y-5">
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

/* ========================= NÚMEROS DE RECEBIMENTO ========================= */
function MethodsSection() {
  const qc = useQueryClient();
  const list = useServerFn(adminListPaymentMethods);
  const upsert = useServerFn(adminUpsertPaymentMethod);
  const del = useServerFn(adminDeletePaymentMethod);
  const { data } = useQuery({ queryKey: ["admin-methods"], queryFn: () => list() });
  const [editing, setEditing] = useState<any | null>(null);
  const invalidate = () => qc.invalidateQueries();

  const save = async (form: any) => {
    try {
      await upsert({ data: form });
      toast.success("Guardado");
      setEditing(null);
      invalidate();
      qc.invalidateQueries({ queryKey: ["payment-methods"] });
    } catch (e: any) { toast.error(e?.message ?? "Erro"); }
  };

  return (
    <div className="space-y-3">
      <button onClick={() => setEditing({ code: "", name: "", number: "", holder: "", color: "bg-primary", sort_order: 0, active: true })} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" /> Novo método</button>
      <div className="space-y-2">
        {(data?.methods ?? []).map((m: any) => (
          <div key={m.id} className="rounded-xl bg-card p-3 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold">{m.name} {!m.active && <span className="ml-2 text-xs text-muted-foreground">(inactivo)</span>}</div>
                <div className="text-sm text-muted-foreground">{m.number} · {m.holder}</div>
                <div className="text-xs text-muted-foreground">código: {m.code}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing(m)} className="rounded-lg bg-info p-2 text-info-foreground"><Pencil className="h-4 w-4" /></button>
                <button onClick={async () => { if (confirm(`Apagar ${m.name}?`)) { await del({ data: { id: m.id } }); toast.success("Removido"); invalidate(); qc.invalidateQueries({ queryKey: ["payment-methods"] }); } }} className="rounded-lg bg-destructive p-2 text-destructive-foreground"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {editing && <MethodForm value={editing} onCancel={() => setEditing(null)} onSave={save} />}
    </div>
  );
}

function MethodForm({ value, onCancel, onSave }: any) {
  const [f, setF] = useState(value);
  const set = (k: string, v: any) => setF({ ...f, [k]: v });
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div className="w-full max-w-md space-y-3 rounded-2xl bg-card p-4 shadow-elegant">
        <div className="text-lg font-bold">{f.id ? "Editar método" : "Novo método"}</div>
        <Field label="Código (mpesa, emola...)" v={f.code} on={(v: any) => set("code", v)} />
        <Field label="Nome" v={f.name} on={(v: any) => set("name", v)} />
        <Field label="Número" v={f.number} on={(v: any) => set("number", v)} />
        <Field label="Titular" v={f.holder} on={(v: any) => set("holder", v)} />
        <Field label="Cor (bg-danger, bg-warning, bg-primary)" v={f.color} on={(v: any) => set("color", v)} />
        <Field label="Ordem" type="number" v={f.sort_order} on={(v: any) => set("sort_order", Number(v))} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.active} onChange={(e) => set("active", e.target.checked)} /> Activo</label>
        <div className="flex gap-2 pt-2">
          <button onClick={onCancel} className="flex-1 rounded-xl bg-muted py-2 font-bold">Cancelar</button>
          <button onClick={() => onSave(f)} className="flex-1 rounded-xl bg-primary py-2 font-bold text-primary-foreground">Guardar</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, v, on, type = "text" }: any) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-bold uppercase text-muted-foreground">{label}</div>
      <input type={type} value={v ?? ""} onChange={(e) => on(e.target.value)} className="w-full rounded-xl border bg-muted/50 px-3 py-2 outline-none" />
    </label>
  );
}

/* ========================= ADMINS ========================= */
function AdminsSection() {
  const qc = useQueryClient();
  const list = useServerFn(adminListAdmins);
  const add = useServerFn(adminAddAdmin);
  const rem = useServerFn(adminRemoveAdmin);
  const { data } = useQuery({ queryKey: ["admin-admins"], queryFn: () => list() });
  const [phone, setPhone] = useState("");

  const submit = async () => {
    try {
      const r = await add({ data: { phone } });
      toast.success(r.alreadyAdmin ? `${r.name} já era admin` : `${r.name} promovido a admin`);
      setPhone("");
      qc.invalidateQueries({ queryKey: ["admin-admins"] });
    } catch (e: any) { toast.error(e?.message ?? "Erro"); }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-card p-3 shadow-card">
        <div className="mb-2 text-sm font-bold">Adicionar admin por telefone</div>
        <div className="flex gap-2">
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Ex: 876763395" className="flex-1 rounded-xl border bg-muted/50 px-3 py-2 outline-none" />
          <button onClick={submit} disabled={phone.length < 6} className="rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground disabled:opacity-50"><UserPlus className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="space-y-2">
        {(data?.admins ?? []).map((a: any) => (
          <div key={a.roleId} className="flex items-center justify-between rounded-xl bg-card p-3 shadow-card">
            <div>
              <div className="font-bold">{a.profile?.full_name ?? "—"}</div>
              <div className="text-sm text-muted-foreground">{a.profile?.phone ?? a.userId.slice(0, 8)}</div>
            </div>
            <button onClick={async () => { if (confirm("Remover admin?")) { try { await rem({ data: { userId: a.userId } }); toast.success("Removido"); qc.invalidateQueries({ queryKey: ["admin-admins"] }); } catch (e: any) { toast.error(e?.message ?? "Erro"); } } }} className="rounded-lg bg-destructive p-2 text-destructive-foreground"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ========================= SALDOS ========================= */
function BalancesSection() {
  const qc = useQueryClient();
  const search = useServerFn(adminSearchUsers);
  const adjust = useServerFn(adminAdjustBalance);
  const [q, setQ] = useState("");
  const { data, refetch } = useQuery({ queryKey: ["admin-users", q], queryFn: () => search({ data: { query: q } }) });

  const doAdjust = async (userId: string, sign: 1 | -1) => {
    const v = prompt(`Valor a ${sign > 0 ? "creditar" : "debitar"} (MZN):`);
    if (!v) return;
    const n = Number(v);
    if (!n || n <= 0) return toast.error("Valor inválido");
    const note = prompt("Nota (opcional):") ?? "";
    try {
      await adjust({ data: { userId, delta: sign * n, note: note || undefined } });
      toast.success("Saldo actualizado");
      refetch();
      qc.invalidateQueries();
    } catch (e: any) { toast.error(e?.message ?? "Erro"); }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pesquisar nome ou telefone…" className="w-full rounded-xl border bg-muted/50 py-2 pl-9 pr-3 outline-none" />
        </div>
      </div>
      <div className="space-y-2">
        {(data?.users ?? []).map((u: any) => (
          <div key={u.id} className="rounded-xl bg-card p-3 shadow-card">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate font-bold">{u.full_name}</div>
                <div className="text-xs text-muted-foreground">{u.phone}</div>
                <div className="text-sm">Saldo: <span className="font-bold text-primary">{formatMZN(u.balance)}</span></div>
              </div>
              <div className="flex shrink-0 gap-2">
                <button onClick={() => doAdjust(u.id, 1)} className="rounded-lg bg-success px-3 py-2 text-xs font-bold text-success-foreground">+ Creditar</button>
                <button onClick={() => doAdjust(u.id, -1)} className="rounded-lg bg-destructive px-3 py-2 text-xs font-bold text-destructive-foreground">− Debitar</button>
              </div>
            </div>
          </div>
        ))}
        {data && data.users.length === 0 && <div className="text-sm text-muted-foreground">Sem utilizadores.</div>}
      </div>
    </div>
  );
}

/* ========================= PLANOS ========================= */
function PlansSection() {
  const qc = useQueryClient();
  const list = useServerFn(adminListPlans);
  const upsert = useServerFn(adminUpsertPlan);
  const del = useServerFn(adminDeletePlan);
  const { data } = useQuery({ queryKey: ["admin-plans"], queryFn: () => list() });
  const [editing, setEditing] = useState<any | null>(null);

  const save = async (form: any) => {
    try {
      await upsert({ data: form });
      toast.success("Guardado");
      setEditing(null);
      qc.invalidateQueries();
    } catch (e: any) { toast.error(e?.message ?? "Erro"); }
  };

  const empty = {
    code: "", name: "", price: 0, daily_return: 0, total_return: 0,
    duration_days: 30, daily_tasks: 1, per_task: 0, badge: "",
    accent_color: "primary", sort_order: 0, active: true, image_url: "",
  };

  return (
    <div className="space-y-3">
      <button onClick={() => setEditing(empty)} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" /> Novo plano</button>
      <div className="space-y-2">
        {(data?.plans ?? []).map((p: any) => (
          <div key={p.id} className="rounded-xl bg-card p-3 shadow-card">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate font-bold">{p.name} {p.badge && <span className="ml-1 text-xs font-bold text-primary">[{p.badge}]</span>} {!p.active && <span className="text-xs text-muted-foreground">(inactivo)</span>}</div>
                <div className="text-xs text-muted-foreground">{formatMZN(p.price)} · {p.duration_days}d · {p.daily_tasks} tarefas/dia · {formatMZN(p.per_task)}/tarefa</div>
                <div className="text-xs text-muted-foreground">Diário: {formatMZN(p.daily_return)} · Total: {formatMZN(p.total_return)}</div>
              </div>
              <div className="flex shrink-0 gap-2">
                <button onClick={() => setEditing(p)} className="rounded-lg bg-info p-2 text-info-foreground"><Pencil className="h-4 w-4" /></button>
                <button onClick={async () => { if (confirm(`Apagar ${p.name}?`)) { try { await del({ data: { id: p.id } }); toast.success("Removido"); qc.invalidateQueries(); } catch (e: any) { toast.error(e?.message ?? "Erro"); } } }} className="rounded-lg bg-destructive p-2 text-destructive-foreground"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {editing && <PlanForm value={editing} onCancel={() => setEditing(null)} onSave={save} />}
    </div>
  );
}

function PlanForm({ value, onCancel, onSave }: any) {
  const [f, setF] = useState({ ...value, badge: value.badge ?? "", image_url: value.image_url ?? "" });
  const set = (k: string, v: any) => setF({ ...f, [k]: v });
  const submit = () => {
    onSave({
      ...f,
      price: Number(f.price), daily_return: Number(f.daily_return), total_return: Number(f.total_return),
      duration_days: Number(f.duration_days), daily_tasks: Number(f.daily_tasks), per_task: Number(f.per_task),
      sort_order: Number(f.sort_order),
      badge: f.badge || null, image_url: f.image_url || null,
    });
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/60 p-4 sm:items-center">
      <div className="my-4 w-full max-w-md space-y-2 rounded-2xl bg-card p-4 shadow-elegant">
        <div className="text-lg font-bold">{f.id ? "Editar plano" : "Novo plano"}</div>
        <Field label="Código" v={f.code} on={(v: any) => set("code", v)} />
        <Field label="Nome" v={f.name} on={(v: any) => set("name", v)} />
        <div className="grid grid-cols-2 gap-2">
          <Field label="Preço (MT)" type="number" v={f.price} on={(v: any) => set("price", v)} />
          <Field label="Duração (dias)" type="number" v={f.duration_days} on={(v: any) => set("duration_days", v)} />
          <Field label="Retorno diário" type="number" v={f.daily_return} on={(v: any) => set("daily_return", v)} />
          <Field label="Retorno total" type="number" v={f.total_return} on={(v: any) => set("total_return", v)} />
          <Field label="Tarefas/dia" type="number" v={f.daily_tasks} on={(v: any) => set("daily_tasks", v)} />
          <Field label="MT por tarefa" type="number" v={f.per_task} on={(v: any) => set("per_task", v)} />
          <Field label="Ordem" type="number" v={f.sort_order} on={(v: any) => set("sort_order", v)} />
          <Field label="Cor accent" v={f.accent_color} on={(v: any) => set("accent_color", v)} />
        </div>
        <Field label="Badge (ex: VIP, AGUARDE)" v={f.badge} on={(v: any) => set("badge", v)} />
        <Field label="URL imagem (opcional)" v={f.image_url} on={(v: any) => set("image_url", v)} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.active} onChange={(e) => set("active", e.target.checked)} /> Activo</label>
        <div className="flex gap-2 pt-2">
          <button onClick={onCancel} className="flex-1 rounded-xl bg-muted py-2 font-bold">Cancelar</button>
          <button onClick={submit} className="flex-1 rounded-xl bg-primary py-2 font-bold text-primary-foreground">Guardar</button>
        </div>
      </div>
    </div>
  );
}
