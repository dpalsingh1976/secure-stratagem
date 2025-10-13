-- Add processing_progress column to documents table
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS processing_progress integer DEFAULT 0 CHECK (processing_progress >= 0 AND processing_progress <= 100);