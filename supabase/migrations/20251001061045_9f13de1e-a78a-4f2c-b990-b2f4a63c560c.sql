-- Backfill missing profiles for existing users
INSERT INTO public.profiles (id, email, name)
SELECT u.id,
       u.email,
       COALESCE(u.raw_user_meta_data ->> 'name', u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1))
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- Backfill missing user roles for existing users
-- Assign admin to the known admin email, viewer to everyone else
INSERT INTO public.user_roles (user_id, role, assigned_by)
SELECT u.id,
       CASE WHEN u.email = 'harshit.thakkar@qubecinema.com' THEN 'admin'::app_role ELSE 'viewer'::app_role END,
       NULL
FROM auth.users u
LEFT JOIN public.user_roles r ON r.user_id = u.id
WHERE r.user_id IS NULL;