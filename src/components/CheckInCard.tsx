import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCheckInStatus, claimCheckIn } from "@/lib/api.functions";
import { Gift, Flame, Check } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

export function CheckInCard() {
  const fn = useServerFn(getCheckInStatus);
  const claimFn = useServerFn(claimCheckIn);
  const qc = useQueryClient();
  const { lang } = useI18n();
  const { data } = useQuery({ queryKey: ["checkin"], queryFn: () => fn() });

  const claim = useMutation({
    mutationFn: () => claimFn(),
    onSuccess: (r: any) => {
      toast.success(lang === "pt" ? `+${r.amount} MT recebidos!` : `+${r.amount} MT received!`);
      qc.invalidateQueries({ queryKey: ["checkin"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro"),
  });

  if (!data) return null;
  const rewards = data.rewards;
  const currentDay = data.nextDay;

  return (
    <section className="rounded-2xl bg-gradient-to-br from-primary/90 to-primary p-4 text-primary-foreground shadow-elegant">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          <span className="font-bold">{lang === "pt" ? "Check-in Diário" : "Daily Check-in"}</span>
        </div>
        <div className="flex items-center gap-1 text-xs bg-white/20 rounded-full px-2 py-0.5">
          <Flame className="h-3.5 w-3.5" />
          {data.streak} {lang === "pt" ? "dias" : "days"}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1">
        {rewards.map((r: number, i: number) => {
          const day = i + 1;
          const claimed = data.claimedToday && currentDay === day;
          const past = day < currentDay || (data.claimedToday && day <= currentDay);
          const isNext = !data.claimedToday && day === currentDay;
          return (
            <div key={i} className={`rounded-lg p-1.5 text-center text-[10px] font-bold ${
              past ? "bg-success/80" : isNext ? "bg-white/30 ring-2 ring-white" : "bg-white/10"
            }`}>
              <div className="opacity-80">D{day}</div>
              <div className="mt-0.5">{past || claimed ? <Check className="h-3 w-3 mx-auto" /> : `${r}MT`}</div>
            </div>
          );
        })}
      </div>

      <button
        disabled={data.claimedToday || claim.isPending}
        onClick={() => claim.mutate()}
        className="mt-3 w-full rounded-xl bg-white text-primary py-2.5 font-black disabled:opacity-50"
      >
        {data.claimedToday
          ? (lang === "pt" ? "✓ Reclamado hoje — volte amanhã" : "✓ Claimed today — come back tomorrow")
          : (lang === "pt" ? `Reclamar +${data.nextReward} MT` : `Claim +${data.nextReward} MT`)}
      </button>
    </section>
  );
}
