import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getTasks, completeTask } from "@/lib/api.functions";
import { formatMZN } from "@/lib/format";
import { toast } from "sonner";
import { Play, Check, Lock, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_authenticated/tasks")({ component: Tasks });

function Tasks() {
  const qc = useQueryClient();
  const listFn = useServerFn(getTasks);
  const doneFn = useServerFn(completeTask);
  const { data, isLoading } = useQuery({ queryKey: ["tasks"], queryFn: () => listFn() });
  const [watching, setWatching] = useState<string | null>(null);
  const [secs, setSecs] = useState(0);

  useEffect(() => {
    if (!watching) return;
    if (secs <= 0) return;
    const t = setTimeout(() => setSecs((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [watching, secs]);

  const complete = useMutation({
    mutationFn: (videoId: string) => doneFn({ data: { videoId, userPlanId: data!.activePlan!.id } }),
    onSuccess: (r) => { toast.success(`+${formatMZN(r.amount)} adicionados!`); qc.invalidateQueries(); setWatching(null); setSecs(0); },
    onError: (e: any) => { toast.error(e?.message ?? "Erro"); setWatching(null); setSecs(0); },
  });

  const startWatch = (videoId: string, duration: number) => {
    setWatching(videoId);
    setSecs(Math.max(5, Math.min(30, duration || 15)));
  };

  if (isLoading) return <div className="text-center text-muted-foreground py-10">A carregar…</div>;

  const plan = data?.activePlan;
  const doneIds = new Set((data?.doneToday ?? []).map((d: any) => d.video_id));
  const doneCount = doneIds.size;
  const limit = (plan as any)?.plan?.daily_tasks ?? 0;
  const perTask = (plan as any)?.plan?.per_task ?? 0;

  return (
    <div className="space-y-4">
      {plan ? (
        <div className="rounded-2xl bg-gradient-to-br from-primary to-purple-700 p-4 text-primary-foreground shadow-elegant">
          <div className="text-xs uppercase opacity-80">Plano ativo</div>
          <div className="text-xl font-extrabold">{(plan as any).plan?.name}</div>
          <div className="mt-2 flex justify-between text-sm">
            <span>Tarefas hoje: {doneCount}/{limit}</span>
            <span>Por vídeo: {formatMZN(perTask)}</span>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-primary/40 bg-gradient-to-br from-primary/10 to-purple-500/10 p-5 text-center">
          <Lock className="mx-auto mb-2 h-8 w-8 text-primary" />
          <h2 className="text-base font-bold">Assista grátis — Ganhe com VIP</h2>
          <p className="mt-1 text-xs text-muted-foreground">Pode ver os vídeos abaixo. Para receber recompensas, deposite e ative um plano VIP.</p>
          <div className="mt-3 flex justify-center gap-2">
            <Link to="/deposit" className="rounded-xl bg-success px-4 py-2 text-xs font-bold text-success-foreground">Depositar</Link>
            <Link to="/plans" className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground inline-flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" /> Ativar VIP
            </Link>
          </div>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {(data?.videos ?? []).map((v: any) => {
          const done = doneIds.has(v.id);
          const isWatching = watching === v.id;
          const reachedLimit = plan && doneCount >= limit;
          const canEarn = !!plan && !reachedLimit && !done;
          return (
            <div key={v.id} className="overflow-hidden rounded-2xl bg-card shadow-card">
              {v.thumbnail_url && <img src={v.thumbnail_url} alt={v.title} className="h-36 w-full object-cover" />}
              <div className="p-3">
                <div className="font-semibold">{v.title}</div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm font-bold text-success">
                    {plan ? `+${formatMZN(perTask)}` : "VIP necessário"}
                  </span>
                  {done ? (
                    <span className="flex items-center gap-1 rounded-lg bg-success/15 px-3 py-1.5 text-xs font-bold text-success"><Check className="h-3.5 w-3.5" /> Feito</span>
                  ) : isWatching ? (
                    secs > 0 ? (
                      <span className="rounded-lg bg-primary/15 px-3 py-1.5 text-xs font-bold text-primary">A assistir… {secs}s</span>
                    ) : canEarn ? (
                      <button onClick={() => complete.mutate(v.id)} disabled={complete.isPending} className="rounded-lg bg-success px-3 py-1.5 text-xs font-bold text-success-foreground">
                        {complete.isPending ? "…" : "Reclamar"}
                      </button>
                    ) : (
                      <Link to="/plans" className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground">Ativar VIP</Link>
                    )
                  ) : (
                    <button
                      onClick={() => startWatch(v.id, v.duration_seconds ?? 15)}
                      className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" /> Assistir
                    </button>
                  )}
                </div>
                {isWatching && v.video_url && (
                  isYouTube(v.video_url) ? (
                    <iframe
                      className="mt-3 aspect-video w-full rounded-lg"
                      src={toYouTubeEmbed(v.video_url)}
                      title={v.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video src={v.video_url} autoPlay controls className="mt-3 w-full rounded-lg" />
                  )
                )}
              </div>
            </div>
          );
        })}
        {(data?.videos ?? []).length === 0 && (
          <div className="md:col-span-2 rounded-2xl bg-card p-8 text-center text-muted-foreground">Sem vídeos disponíveis.</div>
        )}
      </div>
    </div>
  );
}

function isYouTube(url: string) {
  return /youtube\.com|youtu\.be/.test(url);
}
function toYouTubeEmbed(url: string) {
  const m = url.match(/(?:youtu\.be\/|v=|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{6,})/);
  const id = m?.[1];
  return id ? `https://www.youtube.com/embed/${id}?autoplay=1` : url;
}
