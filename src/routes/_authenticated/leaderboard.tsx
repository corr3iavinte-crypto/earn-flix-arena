import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getLeaderboard } from "@/lib/api.functions";
import { formatMZN } from "@/lib/format";
import { Trophy, Medal, Award } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/leaderboard")({ component: Leaderboard });

function Leaderboard() {
  const fn = useServerFn(getLeaderboard);
  const { data, isLoading } = useQuery({ queryKey: ["leaderboard"], queryFn: () => fn(), staleTime: 60_000 });
  const { lang } = useI18n();

  const podium = (data?.leaders ?? []).slice(0, 3);
  const rest = (data?.leaders ?? []).slice(3);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold flex items-center gap-2">
          <Trophy className="h-7 w-7 text-warning" />
          {lang === "pt" ? "Ranking de Líderes" : "Top Earners"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {lang === "pt" ? "Os investidores que mais ganharam na Petromoc S.A" : "Top earners on Petromoc S.A"}
        </p>
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground py-10">…</div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 items-end">
            {[1,0,2].map((idx) => {
              const p = podium[idx];
              if (!p) return <div key={idx} />;
              const heights = ["h-28", "h-36", "h-24"];
              const icons = [Medal, Trophy, Award];
              const colors = ["bg-gradient-to-b from-slate-300 to-slate-500", "bg-gradient-to-b from-yellow-300 to-yellow-600", "bg-gradient-to-b from-orange-400 to-orange-700"];
              const Icon = icons[p.rank - 1];
              return (
                <div key={p.rank} className="flex flex-col items-center">
                  <Icon className={`h-8 w-8 ${p.rank === 1 ? "text-yellow-500" : p.rank === 2 ? "text-slate-400" : "text-orange-500"}`} />
                  <div className="mt-1 text-xs font-bold truncate w-full text-center">{p.name}</div>
                  <div className="text-[10px] text-success font-bold">{formatMZN(p.total_earned)}</div>
                  <div className={`mt-1 w-full ${heights[p.rank - 1]} rounded-t-xl ${colors[p.rank - 1]} flex items-start justify-center pt-2 text-white font-black text-2xl`}>
                    {p.rank}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="overflow-hidden rounded-2xl bg-card shadow-card">
            {rest.map((p) => (
              <div key={p.rank} className="flex items-center justify-between border-b last:border-0 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-bold">{p.rank}</span>
                  <span className="font-semibold">{p.name}</span>
                </div>
                <span className="text-sm font-bold text-success">{formatMZN(p.total_earned)}</span>
              </div>
            ))}
            {rest.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">
                {lang === "pt" ? "Seja o primeiro a aparecer aqui!" : "Be the first here!"}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
