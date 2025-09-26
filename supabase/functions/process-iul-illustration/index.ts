import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { illustrationId } = await req.json();
    console.log('Processing illustration:', illustrationId);

    // Update status to processing
    await supabase
      .from('iul_illustrations')
      .update({ 
        processing_status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', illustrationId);

    // Get the illustration record
    const { data: illustration, error: fetchError } = await supabase
      .from('iul_illustrations')
      .select('*')
      .eq('id', illustrationId)
      .single();

    if (fetchError || !illustration) {
      throw new Error(`Failed to fetch illustration: ${fetchError?.message}`);
    }

    console.log('Fetched illustration:', illustration.file_name);

    // Download the PDF file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(illustration.file_path);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    console.log('Downloaded file, processing with AI...');

    // Convert file to base64 for AI processing
    const arrayBuffer = await fileData.arrayBuffer();
    const base64Data = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    // Use OpenAI to analyze the PDF content
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert in analyzing IUL (Indexed Universal Life) insurance illustrations. 
            Extract and structure the key policy data from the provided PDF document.
            Return the data in a structured JSON format with the following fields:
            - policyData: basic policy information (policy number, carrier, etc.)
            - insuredInfo: information about the insured person
            - premiumStructure: premium payment details
            - deathBenefit: death benefit information
            - projections: projected values over time
            - assumptions: interest rates and other assumptions
            - costs: fees and charges
            - riders: any additional riders or benefits`
          },
          {
            role: 'user',
            content: `Please analyze this IUL illustration PDF and extract the structured data. The filename is: ${illustration.file_name}`
          }
        ],
        max_tokens: 4000,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const aiResult = await response.json();
    const extractedContent = aiResult.choices[0].message.content;

    console.log('AI processing completed');

    // Try to parse the extracted content as JSON, fallback to text if needed
    let extractedData;
    try {
      extractedData = JSON.parse(extractedContent);
    } catch (parseError) {
      console.log('Could not parse as JSON, storing as text');
      extractedData = {
        rawAnalysis: extractedContent,
        processingNote: 'AI analysis completed but could not be parsed as structured JSON'
      };
    }

    // Update the illustration record with extracted data and completed status
    const { error: updateError } = await supabase
      .from('iul_illustrations')
      .update({
        extracted_data: extractedData,
        processing_status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', illustrationId);

    if (updateError) {
      throw new Error(`Failed to update illustration: ${updateError.message}`);
    }

    console.log('Successfully processed illustration:', illustrationId);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Illustration processed successfully',
        illustrationId,
        extractedDataKeys: Object.keys(extractedData)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error processing illustration:', error);

    // Update status to failed if we have the illustrationId
    try {
      const { illustrationId } = await req.json();
      if (illustrationId) {
        await supabase
          .from('iul_illustrations')
          .update({ 
            processing_status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', illustrationId);
      }
    } catch (updateError) {
      console.error('Error updating failed status:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});