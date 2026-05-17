
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.deposit_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.withdrawal_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.user_plan_status AS ENUM ('active', 'expired', 'cancelled');
CREATE TYPE public.transaction_type AS ENUM ('deposit', 'withdrawal', 'task_reward', 'plan_purchase', 'referral_commission', 'refund', 'adjustment');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  referral_code TEXT NOT NULL UNIQUE,
  referred_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_earned NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_withdrawn NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role security definer
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- ============ PLANS ============
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price NUMERIC(14,2) NOT NULL,
  daily_tasks INTEGER NOT NULL,
  per_task NUMERIC(14,2) NOT NULL,
  daily_return NUMERIC(14,2) NOT NULL,
  duration_days INTEGER NOT NULL,
  total_return NUMERIC(14,2) NOT NULL,
  accent_color TEXT NOT NULL DEFAULT 'primary',
  badge TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- ============ USER PLANS ============
CREATE TABLE public.user_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  status user_plan_status NOT NULL DEFAULT 'active',
  total_earned NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_user_plans_user ON public.user_plans(user_id);

-- ============ VIDEOS ============
CREATE TABLE public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  video_url TEXT,
  team_name TEXT NOT NULL DEFAULT 'StreamCash',
  duration_seconds INTEGER NOT NULL DEFAULT 30,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- ============ TASKS ============
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_plan_id UUID NOT NULL REFERENCES public.user_plans(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.videos(id),
  amount NUMERIC(14,2) NOT NULL,
  task_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_tasks_user_date ON public.tasks(user_id, task_date);

-- ============ DEPOSITS ============
CREATE TABLE public.deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  screenshot_url TEXT,
  status deposit_status NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_deposits_status ON public.deposits(status);
CREATE INDEX idx_deposits_user ON public.deposits(user_id);

-- ============ WITHDRAWALS ============
CREATE TABLE public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  network TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  fee NUMERIC(14,2) NOT NULL DEFAULT 0,
  net_amount NUMERIC(14,2) NOT NULL,
  phone TEXT NOT NULL,
  status withdrawal_status NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_withdrawals_status ON public.withdrawals(status);
CREATE INDEX idx_withdrawals_user ON public.withdrawals(user_id);

-- ============ TRANSACTIONS ============
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  description TEXT NOT NULL,
  reference_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_tx_user ON public.transactions(user_id, created_at DESC);

-- ============ REFERRAL COMMISSIONS ============
CREATE TABLE public.referral_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 3),
  amount NUMERIC(14,2) NOT NULL,
  source_deposit_id UUID REFERENCES public.deposits(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.referral_commissions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_ref_user ON public.referral_commissions(user_id);

-- ============ RLS POLICIES ============

-- profiles
CREATE POLICY "Profiles: users see own" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Profiles: users update own non-financial" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Trigger to prevent users from changing balance/totals
CREATE OR REPLACE FUNCTION public.protect_profile_financials()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN RETURN NEW; END IF;
  IF NEW.balance IS DISTINCT FROM OLD.balance
     OR NEW.total_earned IS DISTINCT FROM OLD.total_earned
     OR NEW.total_withdrawn IS DISTINCT FROM OLD.total_withdrawn
     OR NEW.referral_code IS DISTINCT FROM OLD.referral_code
     OR NEW.referred_by IS DISTINCT FROM OLD.referred_by THEN
    RAISE EXCEPTION 'Cannot modify protected fields';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_protect_profile BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_financials();

-- user_roles
CREATE POLICY "Roles: users see own" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- plans (publicly readable for authenticated users)
CREATE POLICY "Plans: authenticated read" ON public.plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Plans: admin all" ON public.plans FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- user_plans
CREATE POLICY "UserPlans: own" ON public.user_plans FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- videos
CREATE POLICY "Videos: authenticated read" ON public.videos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Videos: admin all" ON public.videos FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- tasks
CREATE POLICY "Tasks: own" ON public.tasks FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- deposits
CREATE POLICY "Deposits: own select" ON public.deposits FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Deposits: own insert" ON public.deposits FOR INSERT WITH CHECK (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Deposits: admin update" ON public.deposits FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- withdrawals
CREATE POLICY "Withdrawals: own select" ON public.withdrawals FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Withdrawals: admin update" ON public.withdrawals FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- transactions
CREATE POLICY "Tx: own" ON public.transactions FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- referral_commissions
CREATE POLICY "Ref: own" ON public.referral_commissions FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- ============ TRIGGERS ============

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile + role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  ref_code TEXT;
  ref_by UUID;
  full_n TEXT;
  ph TEXT;
BEGIN
  full_n := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Utilizador');
  ph := COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, '');
  ref_code := upper(substr(replace(NEW.id::text, '-', ''), 1, 8));

  IF NEW.raw_user_meta_data ? 'referred_by_code' THEN
    SELECT id INTO ref_by FROM public.profiles
      WHERE referral_code = upper(NEW.raw_user_meta_data->>'referred_by_code') LIMIT 1;
  END IF;

  INSERT INTO public.profiles (id, full_name, phone, referral_code, referred_by)
  VALUES (NEW.id, full_n, ph, ref_code, ref_by);

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ SEED PLANS ============
INSERT INTO public.plans (code, name, price, daily_tasks, per_task, daily_return, duration_days, total_return, accent_color, badge, sort_order) VALUES
('SC1',  'StreamCash 1',    650,    2, 32.50,    65.00,    30,  1950.00,    'primary', 'POPULAR', 1),
('SC2',  'StreamCash 2',    1500,   2, 78.75,    157.50,   60,  9450.00,    'success', 'QUENTE',  2),
('SC3',  'StreamCash 3',    3500,   3, 128.33,   385.00,   90,  34650.00,   'warning', NULL,      3),
('SC4',  'StreamCash 4',    7500,   3, 287.50,   862.50,   120, 103500.00,  'danger',  NULL,      4),
('SC5',  'StreamCash 5',    15000,  4, 450.00,   1800.00,  150, 270000.00,  'primary', 'POPULAR', 5),
('SC6',  'StreamCash 6',    30000,  4, 937.50,   3750.00,  180, 675000.00,  'info',    NULL,      6),
('SC7',  'StreamCash 7',    50000,  5, 1300.00,  6500.00,  240, 1560000.00, 'success', 'VIP',     7),
('SC8',  'StreamCash 8',    80000,  5, 2160.00,  10800.00, 300, 3240000.00, 'warning', NULL,      8),
('SC9',  'StreamCash 9',    100000, 6, 2250.00,  13500.00, 365, 4927500.00, 'danger',  NULL,      9),
('SC10', 'StreamCash 10',   150000, 6, 3500.00,  21000.00, 365, 7665000.00, 'primary', 'ELITE',   10);

-- ============ SEED VIDEOS ============
INSERT INTO public.videos (title, thumbnail_url, team_name, duration_seconds) VALUES
('O Lutador da Liberdade',          'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400', 'Equipa Espacial',   30),
('Sonhos de Lisboa',                'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400',   'Estúdio Lumi',     30),
('A Última Travessia',              'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400', 'Cinema Plus',      30),
('Coração de Aço',                  'https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=400',   'Stream Studios',   30),
('Noite em Maputo',                 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400', 'Equipa Áfrika',    30),
('Velocidade Máxima',               'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=400',   'Action Films',     30),
('Mistérios do Oceano',             'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400', 'Documentário+',    30),
('Risos da Cidade',                 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400', 'Comédia Total',    30),
('A Herança',                       'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400', 'Drama House',      30),
('Estrelas Distantes',              'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400', 'Sci-Fi World',     30),
('Caminhos do Sul',                 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400', 'Aventura Live',    30),
('Memórias de Verão',               'https://images.unsplash.com/photo-1500964757637-c85e8a162699?w=400', 'Romance Studios',  30);
