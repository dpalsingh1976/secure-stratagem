-- Vector store registry (for OpenAI File Search)
CREATE TABLE IF NOT EXISTS iul_vector_store (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  owner_uid UUID,
  openai_vector_store_id TEXT NOT NULL,
  note TEXT
);

-- Comparison cases (sessions)
CREATE TABLE IF NOT EXISTS iul_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  owner_uid UUID,
  title TEXT,
  vector_store_id UUID REFERENCES iul_vector_store(id) ON DELETE SET NULL
);

-- Files uploaded per case
CREATE TABLE IF NOT EXISTS iul_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  case_id UUID REFERENCES iul_cases(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  text_id UUID,
  pages JSONB
);

-- Extracted text blobs
CREATE TABLE IF NOT EXISTS iul_texts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  case_id UUID REFERENCES iul_cases(id) ON DELETE CASCADE,
  file_id UUID REFERENCES iul_files(id) ON DELETE CASCADE,
  plain TEXT NOT NULL
);

-- Normalized policies (canonical JSON using _shared/types.ts structure)
CREATE TABLE IF NOT EXISTS iul_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  case_id UUID REFERENCES iul_cases(id) ON DELETE CASCADE,
  source_file_id UUID REFERENCES iul_files(id) ON DELETE CASCADE,
  data JSONB NOT NULL
);

-- Enable RLS
ALTER TABLE iul_vector_store ENABLE ROW LEVEL SECURITY;
ALTER TABLE iul_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE iul_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE iul_texts ENABLE ROW LEVEL SECURITY;
ALTER TABLE iul_policies ENABLE ROW LEVEL SECURITY;

-- Public access policies (MVP - refine later)
CREATE POLICY "allow_all_iul_vector_store" ON iul_vector_store FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_iul_cases" ON iul_cases FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_iul_files" ON iul_files FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_iul_texts" ON iul_texts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_iul_policies" ON iul_policies FOR ALL USING (true) WITH CHECK (true);

-- Create storage bucket for IUL uploads (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('iul-uploads', 'iul-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy (public read)
CREATE POLICY "allow_public_read_iul_uploads"
ON storage.objects FOR SELECT
USING (bucket_id = 'iul-uploads');

CREATE POLICY "allow_authenticated_upload_iul"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'iul-uploads');