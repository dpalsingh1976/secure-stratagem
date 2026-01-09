-- Fix guest document access by adding secure access tokens
-- This prevents exposure of guest contact info while allowing guests to access their documents

-- Add access_token column to documents table for secure guest access
ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS access_token UUID DEFAULT gen_random_uuid();

-- Create index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_documents_access_token ON public.documents(access_token);

-- Drop existing overly permissive RLS policies for documents
DROP POLICY IF EXISTS "Users can view their own documents or guest documents" ON public.documents;
DROP POLICY IF EXISTS "Users can view own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON public.documents;
DROP POLICY IF EXISTS "Allow guest document uploads" ON public.documents;
DROP POLICY IF EXISTS "Allow public read for guest documents" ON public.documents;

-- Create secure RLS policies

-- 1. Authenticated users can view their own documents
CREATE POLICY "Authenticated users view own documents"
ON public.documents
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2. Authenticated users can insert their own documents
CREATE POLICY "Authenticated users insert own documents"
ON public.documents
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. Authenticated users can update their own documents
CREATE POLICY "Authenticated users update own documents"
ON public.documents
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- 4. Authenticated users can delete their own documents
CREATE POLICY "Authenticated users delete own documents"
ON public.documents
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 5. Allow anonymous uploads with NULL user_id (guest uploads)
-- Guest contact info is stored but only accessible via secure token
CREATE POLICY "Allow guest document uploads"
ON public.documents
FOR INSERT
TO anon
WITH CHECK (user_id IS NULL);

-- Create a secure function to retrieve guest documents by access token only
-- This avoids exposing guest_email/guest_name in broad queries
CREATE OR REPLACE FUNCTION public.get_document_by_access_token(p_access_token UUID)
RETURNS TABLE (
    id UUID,
    filename TEXT,
    original_filename TEXT,
    file_size INTEGER,
    mime_type TEXT,
    storage_path TEXT,
    upload_status TEXT,
    analysis_status TEXT,
    analysis_result JSONB,
    processed_at TIMESTAMPTZ,
    processing_progress INTEGER,
    parsing_method TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.filename,
        d.original_filename,
        d.file_size,
        d.mime_type,
        d.storage_path,
        d.upload_status,
        d.analysis_status,
        d.analysis_result,
        d.processed_at,
        d.processing_progress,
        d.parsing_method,
        d.metadata,
        d.created_at,
        d.updated_at
    FROM public.documents d
    WHERE d.access_token = p_access_token
      AND d.user_id IS NULL;  -- Only return guest documents
END;
$$;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.get_document_by_access_token(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_document_by_access_token(UUID) TO authenticated;