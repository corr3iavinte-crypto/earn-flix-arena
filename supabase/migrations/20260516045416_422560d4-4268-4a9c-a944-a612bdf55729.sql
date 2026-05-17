
-- Wipe old plans (no FK from user_plans enforced, but keep existing user_plans intact by deleting only plans not in use)
DELETE FROM public.plans;

INSERT INTO public.plans (code, name, price, daily_tasks, per_task, daily_return, duration_days, total_return, badge, accent_color, sort_order, active, image_url) VALUES
('VIP1','VIP 1',650,1,45,45,30,1350,NULL,'#f97316',1,true,'/src/assets/netflix-bg.jpg'),
('VIP2','VIP 2',1250,1,75,75,30,2250,NULL,'#fb923c',2,true,'/src/assets/netflix-bg.jpg'),
('VIP3','VIP 3',2550,1,150,150,60,9000,'POPULAR','#ef4444',3,true,'/src/assets/netflix-bg.jpg'),
('VIP4','VIP 4',6000,1,315,315,180,56700,NULL,'#dc2626',4,true,'/src/assets/netflix-bg.jpg'),
('VIP5','VIP 5',12600,1,700,700,365,255500,'TOP','#b91c1c',5,true,'/src/assets/netflix-bg.jpg'),
('VIP6','VIP 6',20000,1,0,0,0,0,'AGUARDE','#6b7280',6,true,'/src/assets/netflix-bg.jpg'),
('VIP7','VIP 7',50000,1,0,0,0,0,'AGUARDE','#6b7280',7,true,'/src/assets/netflix-bg.jpg'),
('VIP8','VIP 8',100000,1,0,0,0,0,'AGUARDE','#6b7280',8,true,'/src/assets/netflix-bg.jpg');

-- Replace video thumbnails with Netflix background
UPDATE public.videos SET thumbnail_url = '/netflix-bg.jpg', team_name = 'Netflix';
