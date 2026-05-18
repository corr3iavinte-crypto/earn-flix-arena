import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboard, getTasks } from "@/lib/api.functions";
import { formatMZN } from "@/lib/format";
import { CheckInCard } from "@/components/CheckInCard";
import { FloatingPromos } from "@/components/FloatingPromos";
import {
  Volume2, Building2, Mail, Wallet, ArrowUpRight, Users, Star, Play, Trophy,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/home")({ component: HomePage });

const QUICK = [
  { to: "/profile", label: "Perfil", icon: Building2, color: "bg-violet-500" },
  { to: "/team", label: "Convidar", icon: Mail, color: "bg-sky-500" },
  { to: "/deposit", label: "Recarregar", icon: Wallet, color: "bg-primary" },
  { to: "/withdraw", label: "Levantar", icon: ArrowUpRight, color: "bg-emerald-600" },
  { to: "/leaderboard", label: "Ranking", icon: Trophy, color: "bg-amber-500" },
  { to: "/team", label: "Grupo", icon: Users, color: "bg-emerald-500" },
] as const;

function HomePage() {
  const fn = useServerFn(getDashboard);
  const tasksFn = useServerFn(getTasks);
  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: () => fn() });
  const { data: tasksData } = useQuery({ queryKey: ["tasks-home"], queryFn: () => tasksFn() });

  const balance = Number(data?.profile?.balance ?? 0);
  const featured = (tasksData?.videos ?? []).slice(0, 3);

  return (
    <div className="space-y-4">
      {/* Balance + scrolling tags */}
      <section className="rounded-2xl bg-muted/60 px-4 py-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Saldo</span>
          <Link to="/lucros" className="font-semibold text-primary">Ver tudo ›</Link>
        </div>
        <div className="mt-1 text-2xl font-black text-primary">{formatMZN(balance)}</div>
      </section>

      {/* Daily check-in */}
      <CheckInCard />

      {/* Announcement banner */}
      <section className="flex items-center gap-3 rounded-xl border-l-4 border-warning bg-warning/10 px-3 py-2.5">
        <Volume2 className="h-5 w-5 shrink-0 text-warning" />
        <div className="truncate text-sm font-medium text-foreground/80">
          Bem-vindo à <b>Netflilms</b> — convide amigos, invista e ganhe lucros diários ilimitados.
        </div>
      </section>

      {/* Quick actions */}
      <section className="grid grid-cols-6 gap-2">
        {QUICK.map((q) => (
          <Link key={q.label} to={q.to} className="flex flex-col items-center gap-1.5">
            <span className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-sm ${q.color}`}>
              <q.icon className="h-6 w-6" />
            </span>
            <span className="text-[10px] font-medium text-foreground/80">{q.label}</span>
          </Link>
        ))}
      </section>

      {/* Today's earnings strip */}
      <section className="grid grid-cols-3 gap-2 rounded-2xl bg-card p-3 shadow-card">
        <Mini label="Hoje" value={formatMZN(data?.earnedToday ?? 0)} accent />
        <Mini label="Total ganho" value={formatMZN(data?.profile?.total_earned ?? 0)} />
        <Mini label="Sacado" value={formatMZN(data?.profile?.total_withdrawn ?? 0)} />
      </section>

      {/* Área de Participação */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-base font-bold">Área de Participação</h3>
          <Link to="/tasks" className="text-sm font-semibold text-primary">Ver tudo ›</Link>
        </div>

        <div className="space-y-3">
          {featured.length === 0 && (
            <Link to="/plans" className="block rounded-2xl border-2 border-dashed border-primary/40 bg-card p-6 text-center">
              <Play className="mx-auto mb-2 h-8 w-8 text-primary" />
              <div className="font-semibold">Compre o seu primeiro plano</div>
              <div className="mt-1 text-xs text-muted-foreground">Comece a ganhar a partir de 650 MZN</div>
            </Link>
          )}

          {featured.map((v: any) => (
            <Link to="/tasks" key={v.id} className="flex gap-3 rounded-2xl bg-card p-3 shadow-card">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-muted">
                {v.thumbnail_url ? (
                  <img src={v.thumbnail_url} alt={v.title} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">Sem Imagem</div>
                )}
                <span className="absolute inset-0 flex items-center justify-center">
                  <Play className="h-7 w-7 fill-white/90 text-white drop-shadow" />
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-base font-bold">{v.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Equipa: <span className="text-foreground">{v.team_name ?? "Netflilms"}</span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  Pontuação:
                  {[1,2,3,4,5].map(i => <Star key={i} className="h-3.5 w-3.5 fill-warning text-warning" />)}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  ⏱ {v.duration_seconds ?? 30}s · Ganhe ao concluir
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function Mini({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="text-center">
      <div className={`text-sm font-black ${accent ? "text-primary" : "text-foreground"}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
