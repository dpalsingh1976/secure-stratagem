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
    const { userProfile, riskScores } = await req.json();

    console.log('Predictive insights request:', { userProfile, riskScores });

    const systemPrompt = `You are a senior financial planner and risk analyst with 20+ years of experience. 
    Your task is to generate a comprehensive 20-year financial risk path and protection strategy based on a user's current profile and risk assessment.

    Create a detailed analysis that includes:
    1. Current Risk Assessment Summary
    2. 5-Year Outlook (Years 1-5)
    3. 10-Year Outlook (Years 6-10) 
    4. 15-Year Outlook (Years 11-15)
    5. 20-Year Outlook (Years 16-20)
    6. Key Recommendations and Action Items

    For each time period, consider:
    - Life stage changes and their impact on risk
    - Income progression and financial growth
    - Family and dependent changes
    - Health and aging considerations
    - Asset accumulation and protection needs
    - Market and economic factors

    Keep the analysis practical, actionable, and personalized to their specific situation.
    Use clear, professional language that's easy to understand.`;

    const userPrompt = `User Profile:
${JSON.stringify(userProfile, null, 2)}

Current Risk Scores:
${JSON.stringify(riskScores, null, 2)}

Please generate a comprehensive 20-year financial risk path and protection strategy for this individual.`;

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
        temperature: 0.4,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const insights = data.choices[0].message.content;

    console.log('Predictive insights generated successfully');

    return new Response(JSON.stringify({ 
      insights,
      generatedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in predictive-insights function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      insights: "I'm sorry, I couldn't generate predictive insights right now. Please try again later."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});