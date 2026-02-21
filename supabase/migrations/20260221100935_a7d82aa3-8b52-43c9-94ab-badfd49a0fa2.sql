
-- Allow authenticated users to insert their own role IF no admins exist yet
-- This is a one-time bootstrap policy
CREATE OR REPLACE FUNCTION public.no_admins_exist()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE role = 'admin'
  )
$$;

CREATE POLICY "First user can become admin" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() 
    AND role = 'admin' 
    AND public.no_admins_exist()
  );
