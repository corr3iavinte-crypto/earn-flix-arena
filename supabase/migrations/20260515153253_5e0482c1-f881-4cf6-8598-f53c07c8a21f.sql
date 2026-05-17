
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS image_url TEXT;

UPDATE public.plans SET image_url = CASE name
  WHEN 'VIP 1'  THEN 'https://images.unsplash.com/photo-1579621970795-87facc2f976d?w=800&q=80'
  WHEN 'VIP 2'  THEN 'https://images.unsplash.com/photo-1620325867502-221cfb5faa5f?w=800&q=80'
  WHEN 'VIP 3'  THEN 'https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?w=800&q=80'
  WHEN 'VIP 4'  THEN 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80'
  WHEN 'VIP 5'  THEN 'https://images.unsplash.com/photo-1565514020179-026b92b84bb6?w=800&q=80'
  WHEN 'VIP 6'  THEN 'https://images.unsplash.com/photo-1605792657660-596af9009e82?w=800&q=80'
  WHEN 'VIP 7'  THEN 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=800&q=80'
  WHEN 'VIP 8'  THEN 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&q=80'
  WHEN 'VIP 9'  THEN 'https://images.unsplash.com/photo-1493723843671-1d655e66ac1c?w=800&q=80'
  WHEN 'VIP 10' THEN 'https://images.unsplash.com/photo-1605792657660-596af9009e82?w=800&q=80'
END;
