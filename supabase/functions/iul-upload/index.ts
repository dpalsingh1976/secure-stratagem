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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const formData = await req.formData();
    const caseId = formData.get('caseId') as string;
    const files = formData.getAll('files') as File[];

    console.log(`[iul-upload] Processing ${files.length} files for case ${caseId}`);

    const results = [];

    for (const file of files) {
      // Upload to storage
      const fileName = `${caseId}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('iul-uploads')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Extract text placeholder (MVP: actual PDF parsing requires specialized library)
      const placeholderText = `PDF File: ${file.name}\nSize: ${file.size} bytes\nUploaded: ${new Date().toISOString()}\n\nNote: PDF text extraction requires pdf-parse or similar library. This is a placeholder for MVP.`;
      
      // Store file record
      const { data: fileRecord, error: fileError } = await supabase
        .from('iul_files')
        .insert({
          case_id: caseId,
          filename: file.name,
          storage_path: fileName,
        })
        .select()
        .single();

      if (fileError) throw fileError;

      // Store extracted text
      const { data: textRecord, error: textError } = await supabase
        .from('iul_texts')
        .insert({
          case_id: caseId,
          file_id: fileRecord.id,
          plain: placeholderText,
        })
        .select()
        .single();

      if (textError) throw textError;

      // Create normalized policy stub
      const normalizedData = {
        id: fileRecord.id,
        carrier: null,
        product_name: file.name,
        charges: {},
        indices: [],
        projected_values: [],
        ratings: {},
        sources: [{ field: 'filename', file: file.name }],
      };

      const { error: policyError } = await supabase
        .from('iul_policies')
        .insert({
          case_id: caseId,
          source_file_id: fileRecord.id,
          data: normalizedData,
        });

      if (policyError) throw policyError;

      results.push({ fileId: fileRecord.id, filename: file.name });
    }

    return new Response(
      JSON.stringify({ success: true, count: files.length, files: results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[iul-upload] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
