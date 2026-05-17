
-- Seed VIP plans (10 levels)
INSERT INTO public.plans (code, name, price, daily_tasks, per_task, daily_return, duration_days, total_return, accent_color, badge, sort_order) VALUES
('SC1','VIP 1', 650, 2, 32.50, 65, 30, 1950, '#8b5cf6', NULL, 1),
('SC2','VIP 2', 1500, 2, 78.75, 157.50, 40, 6300, '#06b6d4', NULL, 2),
('SC3','VIP 3', 3500, 3, 128.33, 385, 60, 23100, '#10b981', 'Popular', 3),
('SC4','VIP 4', 7500, 3, 291.67, 875, 90, 78750, '#f59e0b', NULL, 4),
('SC5','VIP 5', 15000, 4, 525, 2100, 120, 252000, '#ef4444', NULL, 5),
('SC6','VIP 6', 30000, 4, 1125, 4500, 150, 675000, '#ec4899', 'Premium', 6),
('SC7','VIP 7', 50000, 5, 1500, 7500, 180, 1350000, '#6366f1', NULL, 7),
('SC8','VIP 8', 80000, 5, 2400, 12000, 240, 2880000, '#a855f7', NULL, 8),
('SC9','VIP 9', 110000, 6, 2750, 16500, 300, 4950000, '#0ea5e9', NULL, 9),
('SC10','VIP 10', 150000, 6, 3500, 21000, 365, 7665000, '#facc15', 'Elite', 10)
ON CONFLICT (code) DO UPDATE SET
  price=EXCLUDED.price, daily_tasks=EXCLUDED.daily_tasks, per_task=EXCLUDED.per_task,
  daily_return=EXCLUDED.daily_return, duration_days=EXCLUDED.duration_days,
  total_return=EXCLUDED.total_return, accent_color=EXCLUDED.accent_color,
  badge=EXCLUDED.badge, sort_order=EXCLUDED.sort_order, active=true;

-- Seed short sample videos (10-30s clips)
INSERT INTO public.videos (title, thumbnail_url, video_url, team_name, duration_seconds, active) VALUES
('Trailer Netflix - Ação', 'https://image.tmdb.org/t/p/w500/q0R4crx2SehcEEQEkYObktdeFy.jpg', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'Netflix', 15, true),
('Trailer Netflix - Aventura', 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 'Netflix', 15, true),
('Big Buck Bunny - Curta', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'YouTube', 30, true),
('Elephant Dream', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 'YouTube', 30, true),
('Sintel - Aventura', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/Sintel.jpg', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', 'Netflix', 20, true),
('For Bigger Joyrides', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerJoyrides.jpg', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', 'Netflix', 15, true),
('Tears of Steel', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/TearsOfSteel.jpg', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', 'YouTube', 25, true),
('Subaru Outback', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/SubaruOutbackOnStreetAndDirt.jpg', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4', 'YouTube', 20, true)
ON CONFLICT DO NOTHING;
