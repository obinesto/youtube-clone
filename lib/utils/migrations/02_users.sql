-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  username TEXT,
  firebase_uid TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email);
CREATE INDEX IF NOT EXISTS users_firebase_uid_idx ON public.users(firebase_uid);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

-- Create the new trigger
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Select own data" ON public.users;
DROP POLICY IF EXISTS "Insert own data" ON public.users;
DROP POLICY IF EXISTS "Update own data" ON public.users;
DROP POLICY IF EXISTS "Service role access" ON public.users;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.users;

-- Enable RLS on the users table but with bypass for service role
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Create an unrestricted policy
CREATE POLICY "Unrestricted policy"
ON public.users
FOR ALL
TO public
USING (true)
WITH CHECK (true);