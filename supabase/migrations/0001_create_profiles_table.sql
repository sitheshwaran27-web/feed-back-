-- Create the profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  updated_at TIMESTAMPTZ,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE
);

-- Add comments to the table and columns
COMMENT ON TABLE public.profiles IS 'Profile information for each user.';
COMMENT ON COLUMN public.profiles.id IS 'References the user in auth.users.';
COMMENT ON COLUMN public.profiles.is_admin IS 'Indicates if the user has administrator privileges.';

-- Set up Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access to all profiles
CREATE POLICY "Public profiles are viewable by everyone."
ON public.profiles FOR SELECT
USING (TRUE);

-- Policy: Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile."
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Policy: Allow users to update their own profile
CREATE POLICY "Users can update their own profile."
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Policy: Allow admins to perform any action on profiles
CREATE POLICY "Admins can manage all profiles."
ON public.profiles FOR ALL
USING (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
);

-- Function to create a profile for a new user upon sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute the function when a new user is created in auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to add the user's email to their profile
-- This is useful because auth.users is not joinable by default for non-admins
ALTER TABLE public.profiles ADD COLUMN email TEXT;

UPDATE public.profiles p SET email = u.email FROM auth.users u WHERE p.id = u.id;