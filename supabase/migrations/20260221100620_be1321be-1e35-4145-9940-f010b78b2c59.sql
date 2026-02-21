
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create queue_entries table
CREATE TABLE public.queue_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  phone TEXT,
  party_size INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'serving', 'served', 'removed')),
  entered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  served_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.queue_entries ENABLE ROW LEVEL SECURITY;

-- Enable realtime for queue_entries
ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_entries;

-- Security definer function to check admin role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies

-- Profiles: admins can read their own profile
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- User roles: only admins can read roles
CREATE POLICY "Admins can read roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Queue entries: anyone can read (public queue visibility)
CREATE POLICY "Anyone can view queue" ON public.queue_entries
  FOR SELECT TO anon, authenticated
  USING (true);

-- Anyone can join the queue
CREATE POLICY "Anyone can join queue" ON public.queue_entries
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Only admins can update queue entries
CREATE POLICY "Admins can update queue" ON public.queue_entries
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete queue entries
CREATE POLICY "Admins can delete queue" ON public.queue_entries
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
