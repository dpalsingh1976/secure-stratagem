import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

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
    const { documentId, question } = await req.json();
    
    // Validate documentId format
    if (!documentId || !UUID_REGEX.test(documentId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid document ID format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

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
      console.warn('Access denied: user', user.id, 'attempted to analyze document owned by', document.user_id);
      return new Response(
        JSON.stringify({ error: 'Access denied: you do not have permission to analyze this document' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Download the file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(document.storage_path);

    if (downloadError || !fileData) {
      throw new Error('Failed to download document');
    }

    // Convert file to text (simple extraction - in production, use proper PDF parsing)
    const text = await fileData.text();
    
    // Prepare the AI prompt
    const systemPrompt = `You are an expert insurance policy analyzer. Your role is to:
1. Analyze insurance policy documents thoroughly
2. Identify coverage gaps and potential issues
3. Suggest improvements and optimization opportunities
4. Explain complex policy terms in simple language
5. Highlight important exclusions, limitations, and riders

Provide detailed, actionable insights that help users understand their coverage better.`;

    const userPrompt = question 
      ? `Based on this policy document, please answer: ${question}\n\nPolicy Document:\n${text.substring(0, 15000)}`
      : `Please analyze this insurance policy document and provide:
1. A summary of the coverage
2. Key benefits and features
3. Any coverage gaps or limitations identified
4. Recommendations for improvements
5. Important considerations or red flags

Policy Document:
${text.substring(0, 15000)}`;

    // Call Lovable AI Gateway
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 2000,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI analysis failed: ${response.status}`);
    }

    const aiResult = await response.json();
    const analysis = aiResult.choices[0].message.content;

    // Update document with analysis metadata
    await supabase
      .from('documents')
      .update({
        processed_at: new Date().toISOString(),
        metadata: {
          ...document.metadata,
          last_analysis: new Date().toISOString(),
          analysis_type: question ? 'question' : 'full_analysis'
        }
      })
      .eq('id', documentId);

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        documentName: document.original_filename
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in analyze-policy function:', error);
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
