-- Drop existing policies on documents table
DROP POLICY IF EXISTS "Users can upload documents" ON public.documents;
DROP POLICY IF EXISTS "Users can view their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON public.documents;

-- Create new policies that support both authenticated users and testing mode
CREATE POLICY "Anyone can upload documents"
ON public.documents FOR INSERT
WITH CHECK (
  (auth.uid() = user_id)
  OR (user_id IS NULL)
  OR (user_id = '12345678-1234-1234-1234-123456789abc'::uuid)
);

CREATE POLICY "Users can view their documents"
ON public.documents FOR SELECT
USING (
  (auth.uid() = user_id)
  OR (user_id IS NULL)
  OR (user_id = '12345678-1234-1234-1234-123456789abc'::uuid)
);

CREATE POLICY "Users can update their documents"
ON public.documents FOR UPDATE
USING (
  (auth.uid() = user_id)
  OR (user_id IS NULL)
  OR (user_id = '12345678-1234-1234-1234-123456789abc'::uuid)
)
WITH CHECK (
  (auth.uid() = user_id)
  OR (user_id IS NULL)
  OR (user_id = '12345678-1234-1234-1234-123456789abc'::uuid)
);

CREATE POLICY "Users can delete their documents"
ON public.documents FOR DELETE
USING (
  (auth.uid() = user_id)
  OR (user_id IS NULL)
  OR (user_id = '12345678-1234-1234-1234-123456789abc'::uuid)
);