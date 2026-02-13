-- Migration to add academic year to student profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS year TEXT;

-- Update the handle_new_user function to include year from metadata if present
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  college_id_found UUID;
BEGIN
  -- Try to match college by email domain (e.g., abes.ac.in)
  SELECT id INTO college_id_found FROM colleges 
  WHERE email_domain = split_part(NEW.email, '@', 2)
  LIMIT 1;

  INSERT INTO profiles (id, email, full_name, avatar_url, college_id, year)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    college_id_found,
    NEW.raw_user_meta_data->>'year'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
