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
    const { message, context } = await req.json();

    console.log('AI Chatbot request:', { message, context });

    const systemPrompt = `You are a knowledgeable financial risk advisor for a Smart Risk Analyzer platform. 
    Your role is to help users understand financial risks, insurance needs, and protection strategies.
    
    Key capabilities:
    - Explain different types of financial risks (life insurance, health, disability, property, liability, etc.)
    - Provide guidance on risk assessment and mitigation strategies
    - Help users understand insurance products and coverage needs
    - Offer personalized advice based on user profiles
    - Explain complex financial concepts in simple terms
    
    Guidelines:
    - Be professional, empathetic, and helpful
    - Use clear, non-technical language
    - Provide actionable advice
    - When discussing specific products, focus on education rather than sales
    - If asked about specific financial advice, remind users to consult with licensed professionals
    - Stay focused on risk management and protection topics
    
    ${context ? `User context: ${JSON.stringify(context)}` : ''}`;

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
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('AI response generated successfully');

    return new Response(JSON.stringify({ 
      response: aiResponse,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-chatbot function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      response: "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});