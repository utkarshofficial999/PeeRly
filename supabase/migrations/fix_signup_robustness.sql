-- Robust fix for the handle_new_user trigger and profiles table
-- 1. Ensure the year column exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS year TEXT;

-- 2. Create or replace the function with better error handling and case-insensitivity
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  college_id_found UUID;
  user_full_name TEXT;
  user_year TEXT;
BEGIN
  -- Extract metadata safely
  user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  user_year := NEW.raw_user_meta_data->>'year';

  -- Try to match college by email domain (CASE-INSENSITIVE)
  SELECT id INTO college_id_found FROM colleges 
  WHERE LOWER(email_domain) = LOWER(split_part(NEW.email, '@', 2))
  LIMIT 1;

  -- Insert with ON CONFLICT to avoid "duplicate key" errors if the profile somehow exists
  INSERT INTO profiles (id, email, full_name, avatar_url, college_id, year)
  VALUES (
    NEW.id,
    LOWER(NEW.email),
    user_full_name,
    NEW.raw_user_meta_data->>'avatar_url',
    college_id_found,
    user_year
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    year = EXCLUDED.year,
    college_id = EXCLUDED.college_id,
    updated_at = NOW();

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error details to postgres logs (visible in Supabase dashboard)
  RAISE WARNING 'Error in handle_new_user trigger for %: %', NEW.email, SQLERRM;
  RETURN NEW; -- Still return NEW to allow auth user creation even if profile fails
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Ensure the trigger is correctly mapped
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
