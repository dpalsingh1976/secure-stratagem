import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ANALYSIS_PROMPT = `You are an expert insurance policy analyst. Analyze the provided policy document and extract structured information.

Output MUST be valid JSON with this exact schema:
{
  "coverages": [
    {
      "type": "Life Insurance" | "Health" | "Auto" | "Home" | "Disability" | "Long-term Care" | "Umbrella" | "Other",
      "limit": "string (e.g., '$500,000')",
      "deductible": "string or null",
      "riders": ["rider1", "rider2"]
    }
  ],
  "exclusions": [
    {
      "category": "string",
      "description": "string",
      "impact": "string"
    }
  ],
  "gaps": [
    {
      "gap_type": "string",
      "severity": "critical" | "high" | "medium" | "low",
      "business_impact": "string (clear explanation of risk)",
      "remedy": "string (specific actionable recommendation)"
    }
  ],
  "client_questions": [
    "Question 1 to gather missing information?",
    "Question 2?",
    "Question 3?"
  ],
  "summary": "A 2-3 sentence executive summary of the policy"
}

Focus on:
1. Extract all coverage types, limits, and deductibles
2. Identify critical exclusions and their impact
3. Find coverage gaps with clear business impact
4. Suggest 3-7 questions to gather missing information
5. Provide actionable remedies for each gap`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting RAG analysis for document:', documentId);

    // Fetch document
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      throw new Error('Document not found');
    }

    // Update status
    await supabase
      .from('documents')
      .update({ analysis_status: 'processing' })
      .eq('id', documentId);

    // Fetch all chunks for this document (ordered by index)
    const { data: chunks, error: chunksError } = await supabase
      .from('document_chunks')
      .select('content, chunk_index')
      .eq('document_id', documentId)
      .order('chunk_index');

    if (chunksError || !chunks || chunks.length === 0) {
      throw new Error('No document chunks found. Please parse the document first.');
    }

    console.log(`Found ${chunks.length} chunks`);

    // Combine chunks into full text (for now, we'll use all chunks)
    // In production, you might want to use RAG with embeddings to find relevant chunks
    const fullText = chunks.map(c => c.content).join('\n\n');
    
    // Truncate if too long (keep first 15000 chars for analysis)
    const textToAnalyze = fullText.substring(0, 15000);

    console.log('Calling Lovable AI for analysis...');

    // Call Lovable AI Gateway with structured output
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: ANALYSIS_PROMPT },
          { 
            role: 'user', 
            content: `Analyze this insurance policy document:\n\n${textToAnalyze}` 
          }
        ],
        response_format: { type: 'json_object' },
        max_completion_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI analysis failed: ${response.status}`);
    }

    const aiResult = await response.json();
    let analysisJson = aiResult.choices[0].message.content;

    console.log('Analysis received, parsing JSON...');

    // Parse the JSON response
    let parsedAnalysis;
    try {
      parsedAnalysis = JSON.parse(analysisJson);
    } catch (parseError) {
      console.error('Failed to parse JSON:', analysisJson);
      throw new Error('Invalid JSON response from AI');
    }

    // Store the analysis
    const { error: insertError } = await supabase
      .from('policy_analyses')
      .insert({
        document_id: documentId,
        coverages: parsedAnalysis.coverages || [],
        exclusions: parsedAnalysis.exclusions || [],
        gaps: parsedAnalysis.gaps || [],
        client_questions: parsedAnalysis.client_questions || [],
        summary: parsedAnalysis.summary || ''
      });

    if (insertError) {
      console.error('Error storing analysis:', insertError);
      throw insertError;
    }

    // Update document status
    await supabase
      .from('documents')
      .update({ 
        analysis_status: 'completed',
        analysis_result: parsedAnalysis,
        metadata: {
          ...document.metadata,
          last_analysis: new Date().toISOString()
        }
      })
      .eq('id', documentId);

    console.log('Analysis complete and stored');

    return new Response(
      JSON.stringify({
        success: true,
        documentId,
        analysis: parsedAnalysis
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in analyze-policy-rag function:', error);
    
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
