-- Create a function to handle new user signups
-- This function automatically creates a profile when a new auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, onboarding_step)
  VALUES (
    NEW.id,
    'homeowner', -- Default role, users can change this in onboarding
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''), -- Extract from metadata if available
    'role_selection' -- Start users at role selection step
  )
  ON CONFLICT (id) DO NOTHING; -- Avoid errors if profile already exists

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger that fires after a new user is created in auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant execute permission on the function to the authenticated role
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
