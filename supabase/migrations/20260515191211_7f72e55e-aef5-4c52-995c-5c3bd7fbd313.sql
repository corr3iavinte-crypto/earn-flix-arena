
-- 1) Create trigger on auth.users to call handle_new_user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2) Backfill profiles for existing auth users that have none
INSERT INTO public.profiles (id, full_name, phone, referral_code)
SELECT u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', 'Utilizador'),
  COALESCE(u.raw_user_meta_data->>'phone', u.phone, replace(u.id::text,'-','')),
  upper(substr(replace(u.id::text,'-',''),1,8))
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'user'::app_role FROM auth.users u
LEFT JOIN public.user_roles r ON r.user_id = u.id AND r.role='user'
WHERE r.user_id IS NULL;

-- 3) Seed VIP plans (SC1..SC10)
INSERT INTO public.plans (code,name,price,daily_tasks,per_task,daily_return,duration_days,total_return,accent_color,badge,sort_order,image_url) VALUES
('SC1','VIP SC1',650,5,13,65,30,1950,'#10b981','Iniciante',1,'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800'),
('SC2','VIP SC2',1500,6,30,180,40,7200,'#06b6d4','Popular',2,'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800'),
('SC3','VIP SC3',3500,7,75,525,60,31500,'#3b82f6',null,3,'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800'),
('SC4','VIP SC4',7500,8,180,1440,90,129600,'#6366f1',null,4,'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800'),
('SC5','VIP SC5',15000,10,400,4000,120,480000,'#8b5cf6','Top',5,'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=800'),
('SC6','VIP SC6',30000,12,900,10800,180,1944000,'#a855f7',null,6,'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800'),
('SC7','VIP SC7',55000,14,1850,25900,240,6216000,'#d946ef',null,7,'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800'),
('SC8','VIP SC8',85000,16,3200,51200,300,15360000,'#ec4899',null,8,'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800'),
('SC9','VIP SC9',120000,18,5000,90000,330,29700000,'#f43f5e','Elite',9,'https://images.unsplash.com/photo-1605792657660-596af9009e82?w=800'),
('SC10','VIP SC10',150000,20,7000,140000,365,51100000,'#f59e0b','MÁXIMO',10,'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800')
ON CONFLICT (code) DO UPDATE SET
  price=EXCLUDED.price, daily_tasks=EXCLUDED.daily_tasks, per_task=EXCLUDED.per_task,
  daily_return=EXCLUDED.daily_return, duration_days=EXCLUDED.duration_days,
  total_return=EXCLUDED.total_return, accent_color=EXCLUDED.accent_color, badge=EXCLUDED.badge,
  sort_order=EXCLUDED.sort_order, image_url=EXCLUDED.image_url, active=true;

-- 4) Seed reward videos (short YouTube clips 10-30s, popular series/trailers/shorts)
INSERT INTO public.videos (title, thumbnail_url, video_url, team_name, duration_seconds, active) VALUES
('Stranger Things — Trailer Curto','https://img.youtube.com/vi/b9EkMc79ZSU/hqdefault.jpg','https://www.youtube.com/watch?v=b9EkMc79ZSU','Netflix',30,true),
('Wednesday — Dance','https://img.youtube.com/vi/Q2I3iI8m6yM/hqdefault.jpg','https://www.youtube.com/watch?v=Q2I3iI8m6yM','Netflix',25,true),
('Squid Game — Teaser','https://img.youtube.com/vi/oqxAJKy0ii4/hqdefault.jpg','https://www.youtube.com/watch?v=oqxAJKy0ii4','Netflix',20,true),
('Money Heist — Bella Ciao','https://img.youtube.com/vi/N8nGig78lNs/hqdefault.jpg','https://www.youtube.com/watch?v=N8nGig78lNs','Netflix',30,true),
('YouTube Shorts — Comedy','https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg','https://www.youtube.com/watch?v=dQw4w9WgXcQ','YouTube',15,true),
('Avatar 2 — Clip','https://img.youtube.com/vi/d9MyW72ELq0/hqdefault.jpg','https://www.youtube.com/watch?v=d9MyW72ELq0','Disney',30,true),
('The Witcher — Toss a Coin','https://img.youtube.com/vi/WTwEYK4HQjE/hqdefault.jpg','https://www.youtube.com/watch?v=WTwEYK4HQjE','Netflix',30,true),
('Black Mirror — Teaser','https://img.youtube.com/vi/LFDJ8a0hcK0/hqdefault.jpg','https://www.youtube.com/watch?v=LFDJ8a0hcK0','Netflix',20,true),
('Peaky Blinders — Cena','https://img.youtube.com/vi/oVWEb-At8yc/hqdefault.jpg','https://www.youtube.com/watch?v=oVWEb-At8yc','Netflix',25,true),
('You — Trailer','https://img.youtube.com/vi/0RbsfqAEeXQ/hqdefault.jpg','https://www.youtube.com/watch?v=0RbsfqAEeXQ','Netflix',30,true)
ON CONFLICT DO NOTHING;
