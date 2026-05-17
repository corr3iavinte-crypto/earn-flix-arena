import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getTeam, getTeamStats } from "@/lib/api.functions";
import { formatMZN } from "@/lib/format";
import { Copy, Users, Gift, Network } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/team")({ component: Team });

function Team() {
  const fn = useServerFn(getTeam);
  const statsFn = useServerFn(getTeamStats);
  const { data, isLoading } = useQuery({ queryKey: ["team"], queryFn: () => fn() });
  const { data: stats } = useQuery({ queryKey: ["team-stats"], queryFn: () => statsFn() });

  const link = typeof window !== "undefined" && data?.referralCode
    ? `${window.location.origin}/signup?ref=${data.referralCode}` : "";

  if (isLoading) return <div className="text-center text-muted-foreground py-10">A carregar…</div>;
  const maxGrowth = Math.max(1, ...(stats?.growth ?? []).map(g => g.count));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold">Equipa</h1>
        <p className="text-sm text-muted-foreground">Convide amigos e ganhe comissões A/B/C.</p>
      </div>

      <div className="rounded-2xl bg-gradient-card-purple p-5 text-primary-foreground shadow-elegant">
        <div className="text-xs uppercase opacity-80">Seu código</div>
        <div className="mt-1 text-3xl font-extrabold tracking-wider">{data?.referralCode}</div>
        <button
          onClick={() => { navigator.clipboard.writeText(link); toast.success("Link copiado!"); }}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white/20 py-2.5 font-bold backdrop-blur hover:bg-white/30"
        >
          <Copy className="h-4 w-4" /> Copiar link de convite
        </button>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
          <Tier label="Nível A" pct="10%" />
          <Tier label="Nível B" pct="3%" />
          <Tier label="Nível C" pct="1%" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card icon={Users} label="Indicações diretas" value={String(data?.referrals.length ?? 0)} />
        <Card icon={Gift} label="Comissão total" value={formatMZN(data?.totalCommission ?? 0)} />
      </div>

      <div className="rounded-2xl bg-card p-4 shadow-card">
        <div className="mb-3 flex items-center gap-2">
          <Network className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold uppercase">Rede</h3>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <NetLevel label="Nível A" value={stats?.l1.length ?? 0} color="bg-primary/15 text-primary" />
          <NetLevel label="Nível B" value={stats?.l2Count ?? 0} color="bg-emerald-500/15 text-emerald-600" />
          <NetLevel label="Nível C" value={stats?.l3Count ?? 0} color="bg-amber-500/15 text-amber-600" />
        </div>
        <div className="mt-3 rounded-xl bg-muted p-2 text-center">
          <div className="text-xs text-muted-foreground">Total da equipa</div>
          <div className="text-xl font-black text-primary">{stats?.total ?? 0}</div>
        </div>
      </div>

      {(stats?.growth.length ?? 0) > 0 && (
        <div className="rounded-2xl bg-card p-4 shadow-card">
          <h3 className="mb-2 text-sm font-bold uppercase text-muted-foreground">Crescimento (30 dias)</h3>
          <div className="flex items-end gap-1 h-24">
            {stats!.growth.map((g) => (
              <div key={g.date} className="flex-1 bg-primary rounded-t" style={{ height: `${(g.count / maxGrowth) * 100}%` }} title={`${g.date}: ${g.count}`} />
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="mb-2 text-sm font-bold uppercase text-muted-foreground">Indicados</h3>
        <div className="overflow-hidden rounded-2xl bg-card shadow-card">
          {(data?.referrals ?? []).length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Ainda sem indicações.</div>
          ) : data!.referrals.map((r: any) => (
            <div key={r.id} className="flex items-center justify-between border-b last:border-0 p-3">
              <div>
                <div className="font-semibold">{r.full_name}</div>
                <div className="text-xs text-muted-foreground">{r.phone}</div>
              </div>
              <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("pt-PT")}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-bold uppercase text-muted-foreground">Comissões recebidas</h3>
        <div className="overflow-hidden rounded-2xl bg-card shadow-card">
          {(data?.commissions ?? []).length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Sem comissões ainda.</div>
          ) : data!.commissions.map((c: any) => (
            <div key={c.id} className="flex items-center justify-between border-b last:border-0 p-3">
              <div>
                <div className="font-semibold">Nível {c.level}</div>
                <div className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString("pt-PT")}</div>
              </div>
              <div className="font-bold text-success">+{formatMZN(c.amount)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Tier({ label, pct }: { label: string; pct: string }) {
  return (
    <div className="rounded-lg bg-white/15 p-2">
      <div className="opacity-80">{label}</div>
      <div className="font-bold">{pct}</div>
    </div>
  );
}

function NetLevel({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-xl p-3 ${color}`}>
      <div className="text-xs opacity-80">{label}</div>
      <div className="text-xl font-black">{value}</div>
    </div>
  );
}

function Card({ icon: Icon, label, value }: any) {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-card">
      <div className="mb-1 inline-flex rounded-lg bg-primary/15 p-2 text-primary"><Icon className="h-4 w-4" /></div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}
