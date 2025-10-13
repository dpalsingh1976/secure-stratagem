-- Add policy analysis fields to documents table
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS analysis_status text DEFAULT 'pending' CHECK (analysis_status IN ('pending', 'processing', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS analysis_result jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS parsing_method text,
ADD COLUMN IF NOT EXISTS guest_name text,
ADD COLUMN IF NOT EXISTS guest_email text;

-- Create policy_analyses table for structured analysis results
CREATE TABLE IF NOT EXISTS policy_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  coverages jsonb DEFAULT '[]'::jsonb,
  exclusions jsonb DEFAULT '[]'::jsonb,
  gaps jsonb DEFAULT '[]'::jsonb,
  client_questions jsonb DEFAULT '[]'::jsonb,
  summary text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on policy_analyses
ALTER TABLE policy_analyses ENABLE ROW LEVEL SECURITY;

-- Users can view analyses for their documents
CREATE POLICY "Users can view their policy analyses"
  ON policy_analyses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = policy_analyses.document_id
      AND (documents.user_id = auth.uid() OR documents.user_id IS NULL OR documents.user_id = '12345678-1234-1234-1234-123456789abc'::uuid)
    )
  );

-- Users can insert analyses for their documents
CREATE POLICY "Users can insert policy analyses"
  ON policy_analyses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = policy_analyses.document_id
      AND (documents.user_id = auth.uid() OR documents.user_id IS NULL OR documents.user_id = '12345678-1234-1234-1234-123456789abc'::uuid)
    )
  );

-- Users can update analyses for their documents
CREATE POLICY "Users can update their policy analyses"
  ON policy_analyses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = policy_analyses.document_id
      AND (documents.user_id = auth.uid() OR documents.user_id IS NULL OR documents.user_id = '12345678-1234-1234-1234-123456789abc'::uuid)
    )
  );

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_policy_analyses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_policy_analyses_updated_at
  BEFORE UPDATE ON policy_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_policy_analyses_updated_at();