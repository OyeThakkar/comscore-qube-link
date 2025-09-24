-- Check if user exists and create profile + admin role if needed
DO $$
DECLARE
    user_record RECORD;
BEGIN
    -- Find the user in auth.users
    SELECT id, email, raw_user_meta_data 
    INTO user_record 
    FROM auth.users 
    WHERE email = 'harshit.thakkar@qubecinema.com';
    
    IF user_record.id IS NOT NULL THEN
        -- Insert or update profile
        INSERT INTO public.profiles (id, email, name)
        VALUES (
            user_record.id, 
            user_record.email,
            COALESCE(user_record.raw_user_meta_data ->> 'name', user_record.raw_user_meta_data ->> 'full_name', split_part(user_record.email, '@', 1))
        )
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            name = COALESCE(EXCLUDED.name, profiles.name);
        
        -- Insert or update role to admin
        INSERT INTO public.user_roles (user_id, role)
        VALUES (user_record.id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
        
        -- Remove any other roles for this user
        DELETE FROM public.user_roles 
        WHERE user_id = user_record.id AND role != 'admin';
        
        RAISE NOTICE 'Profile and admin role assigned to %', user_record.email;
    ELSE
        RAISE NOTICE 'User with email harshit.thakkar@qubecinema.com not found in auth.users';
    END IF;
END $$;