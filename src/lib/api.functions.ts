import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// ============ DASHBOARD ============
export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const today = new Date().toISOString().slice(0, 10);

    const [profileRes, todayRes, refsRes, txRes, plansRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("tasks").select("amount").eq("user_id", userId).eq("task_date", today),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("referred_by", userId),
      supabase.from("transactions").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
      supabase.from("user_plans").select("*, plan:plans(*)").eq("user_id", userId).eq("status", "active"),
    ]);

    const earnedToday = (todayRes.data ?? []).reduce((s, r) => s + Number(r.amount), 0);
    return {
      profile: profileRes.data,
      earnedToday,
      referralCount: refsRes.count ?? 0,
      transactions: txRes.data ?? [],
      activePlans: plansRes.data ?? [],
    };
  });

// ============ PURCHASE PLAN ============
export const purchasePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ planId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;

    const { data: plan } = await supabaseAdmin.from("plans").select("*").eq("id", data.planId).maybeSingle();
    if (!plan || !plan.active) throw new Error("Plano não encontrado");

    const { data: profile } = await supabaseAdmin.from("profiles").select("balance").eq("id", userId).maybeSingle();
    if (!profile) throw new Error("Perfil não encontrado");
    if (Number(profile.balance) < Number(plan.price)) {
      throw new Error("Saldo insuficiente. Faça um depósito primeiro.");
    }

    const expiresAt = new Date(Date.now() + plan.duration_days * 86400000).toISOString();
    const newBalance = Number(profile.balance) - Number(plan.price);

    await supabaseAdmin.from("profiles").update({ balance: newBalance }).eq("id", userId);
    const { data: up } = await supabaseAdmin.from("user_plans").insert({
      user_id: userId, plan_id: plan.id, expires_at: expiresAt,
    }).select().single();

    await supabaseAdmin.from("transactions").insert({
      user_id: userId, type: "plan_purchase", amount: -Number(plan.price),
      description: `Compra de ${plan.name}`, reference_id: up?.id,
    });

    return { success: true };
  });

// ============ COMPLETE TASK ============
export const completeTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ videoId: z.string().uuid(), userPlanId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const today = new Date().toISOString().slice(0, 10);

    const { data: up } = await supabaseAdmin.from("user_plans")
      .select("*, plan:plans(*)").eq("id", data.userPlanId).eq("user_id", userId).maybeSingle();
    if (!up || up.status !== "active") throw new Error("Plano não ativo");
    const plan = (up as any).plan;

    const { count } = await supabaseAdmin.from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId).eq("user_plan_id", data.userPlanId).eq("task_date", today);

    if ((count ?? 0) >= plan.daily_tasks) throw new Error("Limite diário atingido para este plano");

    const { data: existing } = await supabaseAdmin.from("tasks")
      .select("id").eq("user_id", userId).eq("video_id", data.videoId).eq("task_date", today).maybeSingle();
    if (existing) throw new Error("Vídeo já assistido hoje");

    const amount = Number(plan.per_task);
    await supabaseAdmin.from("tasks").insert({
      user_id: userId, user_plan_id: data.userPlanId, video_id: data.videoId, amount,
    });

    const { data: profile } = await supabaseAdmin.from("profiles")
      .select("balance, total_earned").eq("id", userId).maybeSingle();
    if (profile) {
      await supabaseAdmin.from("profiles").update({
        balance: Number(profile.balance) + amount,
        total_earned: Number(profile.total_earned) + amount,
      }).eq("id", userId);
    }
    await supabaseAdmin.from("user_plans")
      .update({ total_earned: Number(up.total_earned) + amount }).eq("id", up.id);
    await supabaseAdmin.from("transactions").insert({
      user_id: userId, type: "task_reward", amount, description: "Tarefa de vídeo concluída",
    });

    return { success: true, amount };
  });

// ============ REQUEST DEPOSIT ============
export const requestDeposit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    method: z.string().min(1).max(50),
    amount: z.number().min(100).max(10000000),
    screenshotPath: z.string().min(1).max(500),
    confirmationMessage: z.string().max(2000).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    await supabaseAdmin.from("deposits").insert({
      user_id: userId, method: data.method, amount: data.amount,
      screenshot_url: data.screenshotPath, status: "pending",
      confirmation_message: data.confirmationMessage ?? null,
    });
    return { success: true };
  });

// ============ REQUEST WITHDRAWAL ============
export const requestWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    network: z.string().min(1).max(20),
    amount: z.number().min(50).max(10000000),
    phone: z.string().min(9).max(15),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: profile } = await supabaseAdmin.from("profiles")
      .select("balance").eq("id", userId).maybeSingle();
    if (!profile) throw new Error("Perfil não encontrado");
    if (Number(profile.balance) < data.amount) throw new Error("Saldo insuficiente");

    const fee = Math.round(data.amount * 0.1 * 100) / 100;
    const net = data.amount - fee;

    await supabaseAdmin.from("withdrawals").insert({
      user_id: userId, network: data.network, amount: data.amount,
      fee, net_amount: net, phone: data.phone, status: "pending",
    });
    // Hold balance immediately
    await supabaseAdmin.from("profiles")
      .update({ balance: Number(profile.balance) - data.amount }).eq("id", userId);
    await supabaseAdmin.from("transactions").insert({
      user_id: userId, type: "withdrawal", amount: -data.amount,
      description: `Pedido de saque (${data.network})`,
    });
    return { success: true };
  });

// ============ ADMIN FUNCTIONS ============
async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin.from("user_roles")
    .select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Acesso negado");
}

export const adminListPending = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const [deps, withs, users] = await Promise.all([
      supabaseAdmin.from("deposits").select("*")
        .eq("status", "pending").order("created_at", { ascending: false }),
      supabaseAdmin.from("withdrawals").select("*")
        .eq("status", "pending").order("created_at", { ascending: false }),
      supabaseAdmin.from("profiles").select("id, full_name, phone, balance, total_earned, created_at")
        .order("created_at", { ascending: false }).limit(50),
    ]);
    const userIds = Array.from(new Set([
      ...(deps.data ?? []).map((d: any) => d.user_id),
      ...(withs.data ?? []).map((w: any) => w.user_id),
    ]));
    const profMap = new Map<string, { full_name: string; phone: string }>();
    if (userIds.length) {
      const { data: profs } = await supabaseAdmin.from("profiles")
        .select("id, full_name, phone").in("id", userIds);
      (profs ?? []).forEach((p: any) => profMap.set(p.id, { full_name: p.full_name, phone: p.phone }));
    }
    const attach = (rows: any[]) => rows.map((r) => ({ ...r, profile: profMap.get(r.user_id) ?? null }));
    return {
      deposits: attach(deps.data ?? []),
      withdrawals: attach(withs.data ?? []),
      users: users.data ?? [],
    };
  });

export const adminApproveDeposit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid(), approve: z.boolean(), note: z.string().max(500).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { data: dep } = await supabaseAdmin.from("deposits").select("*").eq("id", data.id).maybeSingle();
    if (!dep || dep.status !== "pending") throw new Error("Depósito inválido");

    if (data.approve) {
      const { data: profile } = await supabaseAdmin.from("profiles")
        .select("balance").eq("id", dep.user_id).maybeSingle();
      if (profile) {
        await supabaseAdmin.from("profiles")
          .update({ balance: Number(profile.balance) + Number(dep.amount) }).eq("id", dep.user_id);
      }
      await supabaseAdmin.from("transactions").insert({
        user_id: dep.user_id, type: "deposit", amount: Number(dep.amount),
        description: `Depósito aprovado (${dep.method})`, reference_id: dep.id,
      });

      // Referral commissions A/B/C: 10% / 3% / 1%
      const { data: depProfile } = await supabaseAdmin.from("profiles")
        .select("referred_by").eq("id", dep.user_id).maybeSingle();
      let currentRef = depProfile?.referred_by;
      const rates = [0.1, 0.03, 0.01];
      for (let lvl = 1; lvl <= 3 && currentRef; lvl++) {
        const commission = Math.round(Number(dep.amount) * rates[lvl - 1] * 100) / 100;
        const { data: refProfile } = await supabaseAdmin.from("profiles")
          .select("balance, total_earned, referred_by").eq("id", currentRef).maybeSingle();
        if (!refProfile) break;
        await supabaseAdmin.from("profiles").update({
          balance: Number(refProfile.balance) + commission,
          total_earned: Number(refProfile.total_earned) + commission,
        }).eq("id", currentRef);
        await supabaseAdmin.from("referral_commissions").insert({
          user_id: currentRef, referred_user_id: dep.user_id, level: lvl,
          amount: commission, source_deposit_id: dep.id,
        });
        await supabaseAdmin.from("transactions").insert({
          user_id: currentRef, type: "referral_commission", amount: commission,
          description: `Comissão nível ${lvl}`,
        });
        currentRef = refProfile.referred_by;
      }
    }

    await supabaseAdmin.from("deposits").update({
      status: data.approve ? "approved" : "rejected",
      admin_note: data.note ?? null, reviewed_by: context.userId, reviewed_at: new Date().toISOString(),
    }).eq("id", data.id);
    return { success: true };
  });

export const adminApproveWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid(), approve: z.boolean(), note: z.string().max(500).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { data: w } = await supabaseAdmin.from("withdrawals").select("*").eq("id", data.id).maybeSingle();
    if (!w || w.status !== "pending") throw new Error("Saque inválido");

    if (data.approve) {
      const { data: profile } = await supabaseAdmin.from("profiles")
        .select("total_withdrawn").eq("id", w.user_id).maybeSingle();
      if (profile) {
        await supabaseAdmin.from("profiles").update({
          total_withdrawn: Number(profile.total_withdrawn) + Number(w.amount),
        }).eq("id", w.user_id);
      }
    } else {
      // Refund
      const { data: profile } = await supabaseAdmin.from("profiles")
        .select("balance").eq("id", w.user_id).maybeSingle();
      if (profile) {
        await supabaseAdmin.from("profiles")
          .update({ balance: Number(profile.balance) + Number(w.amount) }).eq("id", w.user_id);
      }
      await supabaseAdmin.from("transactions").insert({
        user_id: w.user_id, type: "refund", amount: Number(w.amount),
        description: "Reembolso de saque rejeitado",
      });
    }

    await supabaseAdmin.from("withdrawals").update({
      status: data.approve ? "approved" : "rejected",
      admin_note: data.note ?? null, reviewed_by: context.userId, reviewed_at: new Date().toISOString(),
    }).eq("id", data.id);
    return { success: true };
  });

// ============ TASKS LIST ============
export const getTasks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const today = new Date().toISOString().slice(0, 10);

    const [planRes, vidsRes, doneRes] = await Promise.all([
      supabase.from("user_plans").select("*, plan:plans(*)").eq("user_id", userId).eq("status", "active").order("started_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("videos").select("*").eq("active", true).order("created_at", { ascending: false }),
      supabase.from("tasks").select("video_id, amount, completed_at").eq("user_id", userId).eq("task_date", today),
    ]);
    return {
      activePlan: planRes.data,
      videos: vidsRes.data ?? [],
      doneToday: doneRes.data ?? [],
    };
  });

// ============ TRANSACTIONS ============
export const getTransactions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("transactions")
      .select("*").eq("user_id", context.userId)
      .order("created_at", { ascending: false }).limit(100);
    return { transactions: data ?? [] };
  });

// ============ TEAM ============
export const getTeam = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [profile, refs, commissions] = await Promise.all([
      supabase.from("profiles").select("referral_code, full_name").eq("id", userId).maybeSingle(),
      supabase.from("profiles").select("id, full_name, phone, created_at").eq("referred_by", userId).order("created_at", { ascending: false }),
      supabase.from("referral_commissions").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
    ]);
    const totalCommission = (commissions.data ?? []).reduce((s, c) => s + Number(c.amount), 0);
    return {
      referralCode: profile.data?.referral_code ?? "",
      referrals: refs.data ?? [],
      commissions: commissions.data ?? [],
      totalCommission,
    };
  });

// ============ PLANS ============
export const getPlans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("plans")
      .select("*").eq("active", true).order("sort_order");
    return { plans: data ?? [] };
  });

// ============ DEPOSITS / WITHDRAWALS LIST ============
export const getMyRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [d, w] = await Promise.all([
      supabase.from("deposits").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
      supabase.from("withdrawals").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
    ]);
    return { deposits: d.data ?? [], withdrawals: w.data ?? [] };
  });

// ============ LEADERBOARD ============
export const getLeaderboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, total_earned")
      .order("total_earned", { ascending: false })
      .limit(20);
    return { leaders: (data ?? []).map((u, i) => ({
      rank: i + 1,
      name: (u.full_name || "Utilizador").slice(0, 2) + "***" + (u.full_name || "").slice(-1),
      total_earned: Number(u.total_earned),
    })) };
  });

// ============ DAILY CHECK-IN ============
const CHECKIN_REWARDS = [1, 2, 3, 4, 5, 6, 10]; // MT for day 1..7

export const getCheckInStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    const { data: todayRow } = await supabaseAdmin.from("check_ins")
      .select("*").eq("user_id", userId).eq("check_date", today).maybeSingle();
    const { data: yest } = await supabaseAdmin.from("check_ins")
      .select("streak").eq("user_id", userId).eq("check_date", yesterday).maybeSingle();

    const currentStreak = todayRow ? todayRow.streak : ((yest?.streak ?? 0) % 7) + 0;
    const nextDay = todayRow ? todayRow.streak : ((yest?.streak ?? 0) % 7) + 1;
    return {
      claimedToday: !!todayRow,
      streak: todayRow ? todayRow.streak : (yest?.streak ?? 0),
      nextDay,
      nextReward: CHECKIN_REWARDS[(nextDay - 1) % 7],
      rewards: CHECKIN_REWARDS,
    };
  });

export const claimCheckIn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    const { data: existing } = await supabaseAdmin.from("check_ins")
      .select("id").eq("user_id", userId).eq("check_date", today).maybeSingle();
    if (existing) throw new Error("Já reclamou hoje");

    const { data: yest } = await supabaseAdmin.from("check_ins")
      .select("streak").eq("user_id", userId).eq("check_date", yesterday).maybeSingle();
    const nextStreak = ((yest?.streak ?? 0) % 7) + 1;
    const amount = CHECKIN_REWARDS[nextStreak - 1];

    await supabaseAdmin.from("check_ins").insert({
      user_id: userId, check_date: today, streak: nextStreak, amount,
    });
    const { data: profile } = await supabaseAdmin.from("profiles")
      .select("balance, total_earned").eq("id", userId).maybeSingle();
    if (profile) {
      await supabaseAdmin.from("profiles").update({
        balance: Number(profile.balance) + amount,
        total_earned: Number(profile.total_earned) + amount,
      }).eq("id", userId);
    }
    await supabaseAdmin.from("transactions").insert({
      user_id: userId, type: "task_reward", amount,
      description: `Check-in diário (dia ${nextStreak})`,
    });
    return { success: true, amount, streak: nextStreak };
  });

// ============ TEAM STATS ============
export const getTeamStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    // Level 1
    const { data: l1 } = await supabaseAdmin.from("profiles")
      .select("id, full_name, phone, created_at, total_earned")
      .eq("referred_by", userId);
    const l1Ids = (l1 ?? []).map(u => u.id);
    // Level 2
    let l2: any[] = [];
    if (l1Ids.length) {
      const { data } = await supabaseAdmin.from("profiles")
        .select("id, full_name, created_at").in("referred_by", l1Ids);
      l2 = data ?? [];
    }
    const l2Ids = l2.map(u => u.id);
    // Level 3
    let l3Count = 0;
    if (l2Ids.length) {
      const { count } = await supabaseAdmin.from("profiles")
        .select("id", { count: "exact", head: true }).in("referred_by", l2Ids);
      l3Count = count ?? 0;
    }
    // Last 30 days growth
    const since = new Date(Date.now() - 30 * 86400000).toISOString();
    const growth: Record<string, number> = {};
    for (const u of l1 ?? []) {
      if (u.created_at >= since) {
        const d = u.created_at.slice(0, 10);
        growth[d] = (growth[d] ?? 0) + 1;
      }
    }
    const growthArr = Object.entries(growth)
      .sort(([a],[b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    return {
      l1: l1 ?? [],
      l2Count: l2.length,
      l3Count,
      total: (l1?.length ?? 0) + l2.length + l3Count,
      growth: growthArr,
    };
  });

// ============ NOTIFICATIONS ============
export const getNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const items: { id: string; type: string; title: string; body: string; at: string }[] = [];
    // VIP expiry warnings
    const { data: plans } = await supabase.from("user_plans")
      .select("id, expires_at, plan:plans(name)").eq("user_id", userId).eq("status", "active");
    const now = Date.now();
    for (const p of plans ?? []) {
      const remain = new Date(p.expires_at).getTime() - now;
      const days = Math.ceil(remain / 86400000);
      if (days <= 3 && days >= 0) {
        items.push({
          id: "exp-" + p.id, type: "warning",
          title: `${(p.plan as any)?.name} expira em ${days} dia(s)`,
          body: "Renove para continuar a ganhar.", at: p.expires_at,
        });
      }
    }
    // Recent earnings today
    const today = new Date().toISOString().slice(0, 10);
    const { data: t } = await supabase.from("transactions")
      .select("id, amount, description, created_at")
      .eq("user_id", userId).gte("created_at", today + "T00:00:00Z")
      .order("created_at", { ascending: false }).limit(5);
    for (const tx of t ?? []) {
      items.push({
        id: tx.id, type: Number(tx.amount) >= 0 ? "success" : "info",
        title: tx.description ?? "Transação", body: `${tx.amount} MT`, at: tx.created_at,
      });
    }
    return { notifications: items };
  });

// ============ CHECK ADMIN ============
export const checkAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await supabaseAdmin.from("user_roles")
      .select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
    return { isAdmin: !!data };
  });
