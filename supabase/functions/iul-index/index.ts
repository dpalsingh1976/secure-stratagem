import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { caseId } = await req.json();
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    
    console.log(`[iul-index] Indexing case ${caseId}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch all text records for this case
    const { data: texts, error: textsError } = await supabase
      .from('iul_texts')
      .select('id, plain, file_id, iul_files(filename)')
      .eq('case_id', caseId);

    if (textsError) throw textsError;

    // Create or reuse vector store
    let vectorStoreId = Deno.env.get('OPENAI_VECTOR_STORE_ID');
    
    if (!vectorStoreId) {
      const vsResponse = await fetch('https://api.openai.com/v1/vector_stores', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2',
        },
        body: JSON.stringify({ name: `iul-case-${caseId}` }),
      });
      
      const vsData = await vsResponse.json();
      vectorStoreId = vsData.id;
      
      // Store in DB
      const { data: vsRecord } = await supabase.from('iul_vector_store').insert({
        openai_vector_store_id: vectorStoreId,
        note: `Case ${caseId}`,
      }).select().single();
      
      // Update case with vector store reference
      await supabase
        .from('iul_cases')
        .update({ vector_store_id: vsRecord.id })
        .eq('id', caseId);
    }

    // Upload files to vector store
    for (const text of texts) {
      const blob = new Blob([text.plain], { type: 'text/plain' });
      const formData = new FormData();
      formData.append('file', blob, `${text.file_id}.txt`);
      formData.append('purpose', 'assistants');

      const fileResponse = await fetch('https://api.openai.com/v1/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: formData,
      });

      const fileData = await fileResponse.json();
      
      // Attach to vector store
      await fetch(`https://api.openai.com/v1/vector_stores/${vectorStoreId}/files`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2',
        },
        body: JSON.stringify({ file_id: fileData.id }),
      });
    }

    return new Response(
      JSON.stringify({ success: true, vectorStoreId, filesIndexed: texts.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[iul-index] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
