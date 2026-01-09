import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import * as pdfjsLib from 'npm:pdfjs-dist@4.0.379';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId } = await req.json();
    
    // Validate documentId format
    if (!documentId || !UUID_REGEX.test(documentId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid document ID format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract user from JWT for ownership validation
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching document:', documentId, 'for user:', user.id);

    // Fetch document data
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return new Response(
        JSON.stringify({ error: 'Document not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify document ownership - user can only access their own documents
    if (document.user_id !== null && document.user_id !== user.id) {
      console.warn('Access denied: user', user.id, 'attempted to access document owned by', document.user_id);
      return new Response(
        JSON.stringify({ error: 'Access denied: you do not have permission to access this document' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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

    // Extract text from document
    let text = '';
    let parsingMethod = 'pdf_native';

    try {
      // Check if it's a PDF
      if (document.mime_type === 'application/pdf') {
        console.log('Extracting text from PDF using PDF.js...');
        
        // Get PDF as ArrayBuffer
        const arrayBuffer = await fileData.arrayBuffer();
        
        // Load PDF document
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        
        console.log(`PDF has ${pdf.numPages} pages, extracting text...`);
        
        // Extract text from each page
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          // Combine text items from the page
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          
          text += `\n\n--- Page ${pageNum} ---\n\n${pageText}`;
          
          // Update progress every 10 pages
          if (pageNum % 10 === 0) {
            console.log(`Extracted ${pageNum}/${pdf.numPages} pages...`);
          }
        }
        
        console.log(`Successfully extracted ${text.length} characters from PDF`);
        
        // Check if extraction was successful
        if (text.length < 100) {
          console.log('Very little text extracted, PDF might be image-based');
          parsingMethod = 'pdf_ocr_needed';
        }
      } else {
        // Non-PDF files - use native text extraction
        text = await fileData.text();
        parsingMethod = 'text_native';
      }
    } catch (error) {
      console.error('Error parsing document:', error);
      parsingMethod = 'failed';
      
      // Fallback to raw text extraction
      try {
        text = await fileData.text();
        if (text.length < 100 || /[^\x20-\x7E\s]/.test(text.substring(0, 1000))) {
          text = 'Unable to extract readable text from document. PDF may be scanned or corrupted.';
        }
      } catch {
        text = 'Unable to extract text from document';
      }
    }

    console.log(`Extracted ${text.length} characters using ${parsingMethod}`);

    // Update parsing method
    await supabase
      .from('documents')
      .update({ parsing_method: parsingMethod })
      .eq('id', documentId);

    // Chunk the text (optimized - larger chunks to reduce total count)
    const chunkSize = 2500;
    const overlap = 300;
    const chunks: string[] = [];
    
    for (let i = 0; i < text.length; i += chunkSize - overlap) {
      chunks.push(text.substring(i, i + chunkSize));
    }

    console.log(`Created ${chunks.length} chunks`);

    // Process chunks in batches for better performance
    const batchSize = 10;
    const batches = [];
    for (let i = 0; i < chunks.length; i += batchSize) {
      batches.push(chunks.slice(i, i + batchSize));
    }

    let processedCount = 0;

    // Generate embeddings and store chunks in batches
    for (const batch of batches) {
      const batchPromises = batch.map(async (chunk, batchIndex) => {
        const globalIndex = processedCount + batchIndex;
        
        try {
          // Generate embedding using OpenAI with retry logic
          let embeddingResponse;
          let retries = 3;
          
          while (retries > 0) {
            try {
              embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
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

              if (embeddingResponse.ok) break;
              
              retries--;
              if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
              }
            } catch (error) {
              retries--;
              if (retries === 0) throw error;
              await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
            }
          }

          if (!embeddingResponse || !embeddingResponse.ok) {
            console.error('Embedding API error:', await embeddingResponse?.text());
            return null;
          }

          const embeddingData = await embeddingResponse.json();
          const embedding = embeddingData.data[0].embedding;

          // Store chunk with embedding
          await supabase
            .from('document_chunks')
            .insert({
              document_id: documentId,
              content: chunk,
              chunk_index: globalIndex,
              embedding: embedding,
              metadata: { 
                parsing_method: parsingMethod,
                chunk_size: chunk.length 
              }
            });

          console.log(`Stored chunk ${globalIndex + 1}/${chunks.length}`);
          return true;
        } catch (error) {
          console.error(`Error processing chunk ${globalIndex}:`, error);
          return null;
        }
      });

      await Promise.all(batchPromises);
      processedCount += batch.length;

      // Update progress
      const progress = Math.floor((processedCount / chunks.length) * 100);
      await supabase
        .from('documents')
        .update({ processing_progress: progress })
        .eq('id', documentId);

      console.log(`Progress: ${progress}% (${processedCount}/${chunks.length} chunks)`);
    }

    // Mark as ready for analysis
    await supabase
      .from('documents')
      .update({ 
        processed_at: new Date().toISOString(),
        processing_progress: 100,
        analysis_status: 'pending',
        metadata: {
          ...document.metadata,
          chunks_created: chunks.length,
          parsing_method: parsingMethod
        }
      })
      .eq('id', documentId);

    console.log('Document parsing complete, triggering automatic analysis...');

    // Automatically trigger analysis
    try {
      const { error: analysisError } = await supabase.functions.invoke('analyze-policy-rag', {
        body: { documentId }
      });
      
      if (analysisError) {
        console.error('Failed to trigger automatic analysis:', analysisError);
        // Don't fail the parsing - user can still manually trigger analysis
      } else {
        console.log('Automatic analysis triggered successfully');
      }
    } catch (error) {
      console.error('Error invoking analyze-policy-rag:', error);
      // Don't fail the parsing - user can still manually trigger analysis
    }

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
