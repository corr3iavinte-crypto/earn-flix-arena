
-- Recreate trigger on auth.users to auto-create profile + role
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill profiles for any existing auth users that don't have one
INSERT INTO public.profiles (id, full_name, phone, referral_code)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', 'Utilizador'),
  COALESCE(u.raw_user_meta_data->>'phone', u.phone, ''),
  upper(substr(replace(u.id::text, '-', ''), 1, 8))
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- Backfill user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'user'::app_role
FROM auth.users u
LEFT JOIN public.user_roles r ON r.user_id = u.id
WHERE r.user_id IS NULL;
