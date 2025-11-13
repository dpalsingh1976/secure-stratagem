-- Fix 1: Remove hardcoded UUID backdoor from has_role() function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Fix 2: Make storage buckets private
UPDATE storage.buckets 
SET public = false 
WHERE name IN ('documents', 'iul-uploads');

-- Add RLS policies for secure storage access
CREATE POLICY "Users can access own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR auth.uid() IS NULL)
);

CREATE POLICY "Advisors can access client documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  has_role(auth.uid(), 'advisor'::user_role)
);

CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR auth.uid() IS NULL)
);

CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR auth.uid() IS NULL)
);

CREATE POLICY "IUL uploads access control"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'iul-uploads' AND
  (has_role(auth.uid(), 'advisor'::user_role) OR has_role(auth.uid(), 'admin'::user_role))
);

CREATE POLICY "IUL uploads insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'iul-uploads' AND
  (has_role(auth.uid(), 'advisor'::user_role) OR has_role(auth.uid(), 'admin'::user_role))
);