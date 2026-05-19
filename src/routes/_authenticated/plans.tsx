import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getPlans, purchasePlan } from "@/lib/api.functions";
import { toast } from "sonner";
import { Crown, TrendingUp, Calendar, Coins, MessageCircle, X } from "lucide-react";
import { useState } from "react";
import { useI18n, whatsappUrl } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/plans")({ component: Plans });

function Plans() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const listFn = useServerFn(getPlans);
  const buyFn = useServerFn(purchasePlan);
  const { data, isLoading } = useQuery({ queryKey: ["plans"], queryFn: () => listFn() });
  const [activated, setActivated] = useState<{ name: string } | null>(null);
  const [confirmPlan, setConfirmPlan] = useState<any | null>(null);

  const buy = useMutation({
    mutationFn: async (plan: any) => {
      const res: any = await buyFn({ data: { planId: plan.id } });
      if (res && res.success === false) throw new Error(res.error || "Erro");
      return plan;
    },
    onSuccess: (plan) => {
      setActivated({ name: plan.name });
      toast.success(t("plans.activatedTitle"));
      qc.invalidateQueries();
    },
    onError: (e: any) => {
      const msg = e?.message ?? "Erro";
      if (/saldo insuficiente/i.test(msg)) {
        toast.error(lang === "pt" ? "Saldo insuficiente. A redirecionar para depósito..." : "Insufficient balance. Redirecting to deposit...");
        setTimeout(() => navigate({ to: "/deposit" }), 800);
      } else {
        toast.error(msg);
      }
    },
  });

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-header p-5 text-primary-foreground shadow-elegant">
        <h1 className="text-2xl font-black">{t("plans.title")}</h1>
        <p className="mt-1 text-sm opacity-90">{t("plans.subtitle")}</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-56 animate-pulse rounded-2xl bg-card" />)}</div>
      ) : (data?.plans ?? []).length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-card p-10 text-center">
          <p className="text-muted-foreground">{t("plans.empty")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(data?.plans ?? []).map((p: any) => {
            const accent = p.accent_color?.startsWith("#") ? p.accent_color : "#f97316";
            const locked = p.badge === "AGUARDE";
            return (
              <div key={p.id} className="overflow-hidden rounded-2xl bg-card shadow-card">
                <div className="relative h-36 overflow-hidden">
                  {p.image_url && (
                    <img src={p.image_url} alt={p.name} className="absolute inset-0 h-full w-full object-cover opacity-60" />
                  )}
                  {/* base animated gradient */}
                  <div
                    className="absolute inset-0 animate-vip-bg"
                    style={{
                      background: `linear-gradient(125deg, ${accent}ff 0%, ${accent}88 25%, #000000cc 50%, ${accent}aa 75%, ${accent}ff 100%)`,
                      backgroundSize: "400% 400%",
                    }}
                  />
                  {/* rotating conic aura */}
                  <div
                    className="pointer-events-none absolute -inset-1/2 opacity-40 animate-vip-conic mix-blend-screen"
                    style={{ background: `conic-gradient(from 0deg, transparent, ${accent}cc, transparent 40%, #ffffff66, transparent 70%, ${accent}aa, transparent)` }}
                  />
                  {/* roaming radial highlight */}
                  <div
                    className="pointer-events-none absolute -inset-20 opacity-70 animate-vip-shine mix-blend-screen"
                    style={{ background: "radial-gradient(circle at 30% 30%, #ffffffaa, transparent 40%)" }}
                  />
                  {/* diagonal shine sweep */}
                  <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div
                      className="absolute top-0 h-full w-1/3 animate-vip-sweep"
                      style={{ background: "linear-gradient(90deg, transparent, #ffffffaa, transparent)" }}
                    />
                  </div>
                  {/* expanding rings */}
                  <div className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2">
                    <div className="h-10 w-10 rounded-full border-2 border-white/60 animate-vip-ring" />
                    <div className="absolute inset-0 h-10 w-10 rounded-full border-2 border-white/40 animate-vip-ring" style={{ animationDelay: "0.9s" }} />
                  </div>
                  {/* floating sparkles */}
                  <div className="absolute top-3 left-3 h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_#fff] animate-vip-float" />
                  <div className="absolute top-10 left-1/3 h-1 w-1 rounded-full bg-white shadow-[0_0_6px_#fff] animate-vip-float" style={{ animationDelay: "0.4s" }} />
                  <div className="absolute top-6 right-1/3 h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_#fff] animate-vip-pulse" style={{ animationDelay: "0.8s" }} />
                  <div className="absolute bottom-6 left-1/4 h-1 w-1 rounded-full bg-white shadow-[0_0_6px_#fff] animate-vip-pulse" style={{ animationDelay: "1.2s" }} />
                  <div className="absolute bottom-10 right-1/4 h-2 w-2 rounded-full bg-white shadow-[0_0_10px_#fff] animate-vip-float" style={{ animationDelay: "1.6s" }} />
                  <div className="absolute bottom-3 left-1/2 h-1 w-1 rounded-full bg-white shadow-[0_0_6px_#fff] animate-vip-pulse" style={{ animationDelay: "2s" }} />
                  <div className="relative z-10 flex h-full items-end justify-between p-4 text-white">
                    <div>
                      <div className="text-xs uppercase tracking-wider opacity-90 drop-shadow">{t("plans.member")}</div>
                      <div className="text-2xl font-black drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">{p.name}</div>
                    </div>
                    {p.badge && <span className="rounded-full bg-white/30 px-2.5 py-1 text-[10px] font-black ring-1 ring-white/40">{p.badge}</span>}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Crown className="h-5 w-5" style={{ color: accent }} />
                      <span className="text-sm font-bold">{p.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase text-muted-foreground">{t("plans.investment")}</div>
                      <div className="text-xl font-black" style={{ color: accent }}>MT {Number(p.price).toLocaleString("pt-PT")}</div>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <Tile icon={<TrendingUp className="h-4 w-4" />} label={t("plans.daily")} value={`MT ${Number(p.daily_return).toLocaleString("pt-PT")}`} accent={accent} />
                    <Tile icon={<Calendar className="h-4 w-4" />} label={t("plans.days")} value={`${p.duration_days}`} accent={accent} />
                    <Tile icon={<Coins className="h-4 w-4" />} label={t("plans.total")} value={`MT ${Number(p.total_return).toLocaleString("pt-PT")}`} accent={accent} />
                  </div>
                  <button
                    disabled={buy.isPending || locked}
                    onClick={() => !locked && setConfirmPlan(p)}
                    className="mt-3 w-full rounded-full py-3 text-base font-bold text-white shadow-elegant transition-transform active:scale-[0.98] disabled:opacity-60"
                    style={{ background: locked ? "#6b7280" : `linear-gradient(135deg, ${accent}, ${accent}cc)` }}
                  >
                    {locked ? "AGUARDE" : buy.isPending ? t("plans.processing") : t("plans.buy")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {confirmPlan && (
        <ConfirmPurchase
          plan={confirmPlan}
          pending={buy.isPending}
          onClose={() => setConfirmPlan(null)}
          onConfirm={() => { const p = confirmPlan; setConfirmPlan(null); buy.mutate(p); }}
        />
      )}

      {activated && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setActivated(null)}>
          <div className="w-full max-w-sm rounded-3xl bg-card p-6 text-center shadow-elegant" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-3xl">🎉</div>
            <h3 className="text-lg font-black">{t("plans.activatedTitle")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{activated.name}</p>
            <p className="mt-3 text-sm">{t("plans.activatedMsg")}</p>
            <a
              href={whatsappUrl(
                lang === "pt"
                  ? `Olá! Acabei de ativar o ${activated.name} na Netflilms. Por favor confirmem.`
                  : `Hi! I just activated ${activated.name} on Netflilms. Please confirm.`
              )}
              target="_blank" rel="noreferrer"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] py-3 font-bold text-white"
            >
              <MessageCircle className="h-5 w-5" /> {t("plans.contactSupport")}
            </a>
            <button onClick={() => setActivated(null)} className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <X className="h-3 w-3" /> Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const PAYMENT_METHODS = [
  { name: "M-Pesa (Vodacom)", number: "850366384", holder: "Orlando Salange", color: "#ef4444" },
  { name: "e-Mola (Movitel)", number: "872110481", holder: "Saide Omar", color: "#f59e0b" },
];

function ConfirmPurchase({ plan, pending, onClose, onConfirm }: { plan: any; pending: boolean; onClose: () => void; onConfirm: () => void }) {
  const accent = plan.accent_color?.startsWith("#") ? plan.accent_color : "#f97316";
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-card p-5 shadow-elegant max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-black">Confirmar compra</h3>
          <button onClick={onClose} className="rounded-full p-1 text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>

        <div className="rounded-2xl p-4 text-white" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}>
          <div className="text-xs uppercase opacity-90">Plano selecionado</div>
          <div className="text-2xl font-black">{plan.name}</div>
          <div className="mt-1 text-3xl font-black">MT {Number(plan.price).toLocaleString("pt-PT")}</div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-muted/60 p-2.5">
            <div className="text-[10px] uppercase text-muted-foreground">Diário</div>
            <div className="text-sm font-black" style={{ color: accent }}>MT {Number(plan.daily_return).toLocaleString("pt-PT")}</div>
          </div>
          <div className="rounded-xl bg-muted/60 p-2.5">
            <div className="text-[10px] uppercase text-muted-foreground">Dias</div>
            <div className="text-sm font-black" style={{ color: accent }}>{plan.duration_days}</div>
          </div>
          <div className="rounded-xl bg-success/15 p-2.5">
            <div className="text-[10px] uppercase text-success">Meta total</div>
            <div className="text-sm font-black text-success">MT {Number(plan.total_return).toLocaleString("pt-PT")}</div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border-l-4 border-primary bg-primary/5 p-3">
          <div className="text-xs font-bold uppercase text-primary">📲 Número de transferência</div>
          <p className="mt-1 text-xs text-muted-foreground">Se não tem saldo, faça o pagamento de <b>MT {Number(plan.price).toLocaleString("pt-PT")}</b> para um dos números abaixo:</p>
          <div className="mt-2 space-y-1.5">
            {PAYMENT_METHODS.map((m) => (
              <div key={m.name} className="rounded-lg bg-card p-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold" style={{ color: m.color }}>{m.name}</span>
                  <span className="font-mono text-base font-extrabold tracking-wider">{m.number}</span>
                </div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">Titular: <b>{m.holder}</b></div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">Depois envie o comprovativo na página de Depósito.</p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={onClose} className="rounded-full bg-muted py-3 text-sm font-bold">Cancelar</button>
          <button
            onClick={onConfirm}
            disabled={pending}
            className="rounded-full py-3 text-sm font-bold text-white shadow-elegant disabled:opacity-60"
            style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}
          >
            {pending ? "A processar…" : "Confirmar compra"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Tile({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) {
  return (
    <div className="rounded-xl bg-muted/60 p-3 text-center">
      <div className="mx-auto flex h-6 items-center justify-center" style={{ color: accent }}>{icon}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-black" style={{ color: accent }}>{value}</div>
    </div>
  );
}
