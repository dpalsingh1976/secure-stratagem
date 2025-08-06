import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { riskCategory, riskScore, userProfile } = await req.json();

    console.log('Risk explanation request:', { riskCategory, riskScore, userProfile });

    const systemPrompt = `You are an expert financial risk analyst. Your task is to explain why a user has a specific risk score in a particular category based on their profile data.

    Provide a clear, concise explanation that:
    1. Identifies the key factors contributing to the risk level
    2. Explains how these factors specifically impact the risk score
    3. Offers actionable recommendations to improve the situation
    4. Uses simple, non-technical language
    5. Is empathetic and constructive

    Keep the explanation focused and under 200 words.`;

    const userPrompt = `Risk Category: ${riskCategory}
Risk Score: ${riskScore}
User Profile: ${JSON.stringify(userProfile, null, 2)}

Please explain why this user has this risk score in the ${riskCategory} category and what they can do about it.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const explanation = data.choices[0].message.content;

    console.log('Risk explanation generated successfully');

    return new Response(JSON.stringify({ 
      explanation,
      riskCategory,
      riskScore
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in explain-risk function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      explanation: "I'm sorry, I couldn't generate an explanation right now. Please try again later."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});