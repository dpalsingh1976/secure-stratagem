import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Fetching document:', documentId);

    // Fetch document data
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      throw new Error('Document not found');
    }

    // Update status to processing
    await supabase
      .from('documents')
      .update({ analysis_status: 'processing' })
      .eq('id', documentId);

    console.log('Downloading file from storage:', document.storage_path);

    // Download the file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(document.storage_path);

    if (downloadError || !fileData) {
      throw new Error('Failed to download document');
    }

    console.log('File downloaded, parsing...');

    // Convert file to text
    let text = '';
    let parsingMethod = 'native';

    try {
      // Try native text extraction first
      text = await fileData.text();
      
      // If text is too short or looks like binary, it might need OCR
      if (text.length < 100 || /[^\x20-\x7E\s]/.test(text.substring(0, 1000))) {
        console.log('Text appears to be binary or scanned, OCR would be needed');
        parsingMethod = 'ocr_needed';
        // For now, we'll work with what we have
        // TODO: Implement OCR fallback with tesseract.js in a separate service
      }
    } catch (error) {
      console.error('Error parsing document:', error);
      text = 'Unable to extract text from document';
      parsingMethod = 'failed';
    }

    console.log(`Extracted ${text.length} characters using ${parsingMethod}`);

    // Update parsing method
    await supabase
      .from('documents')
      .update({ parsing_method: parsingMethod })
      .eq('id', documentId);

    // Chunk the text (simple chunking - split into ~1000 char chunks with overlap)
    const chunkSize = 1000;
    const overlap = 200;
    const chunks: string[] = [];
    
    for (let i = 0; i < text.length; i += chunkSize - overlap) {
      chunks.push(text.substring(i, i + chunkSize));
    }

    console.log(`Created ${chunks.length} chunks`);

    // Generate embeddings and store chunks
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      try {
        // Generate embedding using OpenAI
        const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: chunk,
          }),
        });

        if (!embeddingResponse.ok) {
          console.error('Embedding API error:', await embeddingResponse.text());
          continue;
        }

        const embeddingData = await embeddingResponse.json();
        const embedding = embeddingData.data[0].embedding;

        // Store chunk with embedding
        await supabase
          .from('document_chunks')
          .insert({
            document_id: documentId,
            content: chunk,
            chunk_index: i,
            embedding: embedding,
            metadata: { 
              parsing_method: parsingMethod,
              chunk_size: chunk.length 
            }
          });

        console.log(`Stored chunk ${i + 1}/${chunks.length}`);
      } catch (error) {
        console.error(`Error processing chunk ${i}:`, error);
      }
    }

    // Mark as ready for analysis
    await supabase
      .from('documents')
      .update({ 
        processed_at: new Date().toISOString(),
        metadata: {
          ...document.metadata,
          chunks_created: chunks.length,
          parsing_method: parsingMethod
        }
      })
      .eq('id', documentId);

    console.log('Document parsing complete');

    return new Response(
      JSON.stringify({
        success: true,
        documentId,
        chunks: chunks.length,
        parsingMethod
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in parse-policy function:', error);
    
    // Try to update document status to failed
    try {
      const { documentId } = await req.json();
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      await supabase
        .from('documents')
        .update({ analysis_status: 'failed' })
        .eq('id', documentId);
    } catch {}

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
