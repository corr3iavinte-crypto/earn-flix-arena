
CREATE TABLE public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  number text NOT NULL,
  holder text NOT NULL,
  color text NOT NULL DEFAULT 'bg-primary',
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "PM: authenticated read" ON public.payment_methods
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "PM: admin all" ON public.payment_methods
  FOR ALL USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER pm_updated_at BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.payment_methods (code, name, number, holder, color, sort_order) VALUES
  ('mpesa', 'M-Pesa (Vodacom)', '850366384', 'Orlando Salange', 'bg-danger', 1),
  ('emola', 'e-Mola (Movitel)', '872110481', 'Saide Omar', 'bg-warning', 2);
