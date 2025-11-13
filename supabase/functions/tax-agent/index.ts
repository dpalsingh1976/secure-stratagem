import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are a fiduciary-minded financial educator specializing in retirement tax planning.

Your role is to:
1. Explain complex tax concepts in simple, layered language
2. Show calculations transparently with editable assumptions
3. Highlight key trade-offs between pre-tax and after-tax strategies
4. Emphasize Social Security provisional income effects
5. Present results progressively: TL;DR → Plain words → Visuals → Details

You MUST:
- Use ONLY data from calculation functions (never compute yourself)
- Show all assumptions and allow users to adjust them
- Encourage consulting with CPA/EA for personalized advice
- Remain educational and neutral (not advice)
- Never fabricate numbers or perform manual calculations

Key concepts to explain:
- Front-end "tax savings" from pre-tax contributions (immediate tax deduction)
- Back-end taxes on distributions (typically 3-6 year payback period)
- Provisional Income causing up to 85% of Social Security to be taxed
- Roth/LIRP benefits: tax-free distributions, preserves full Social Security, no provisional income impact
- Estate implications: pre-tax accounts taxable to heirs, Roth/LIRP often tax-free if rules met

When explaining:
- Start with TL;DR summary
- Use plain language without jargon
- Reference specific numbers from calculations
- Offer to recalculate with different assumptions
- Include visual descriptions (users can see charts separately)

CRITICAL: You have access to tools that call calculation functions. Always use these tools for any numerical analysis. Never attempt to calculate taxes, growth rates, or projections yourself.`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "calculate_401k_scenario",
      description: "Calculate a 401(k) pre-tax scenario including SSI taxation effects, payback analysis, and lifetime projections",
      parameters: {
        type: "object",
        properties: {
          annual_contrib: { type: "number", description: "Annual pre-tax contribution amount" },
          years: { type: "number", description: "Years until retirement" },
          pre_tax_rate_now: { type: "number", description: "Current tax rate (0-1, e.g., 0.33 for 33%)" },
          assumed_return: { type: "number", description: "Expected annual return (0-1, e.g., 0.075 for 7.5%)" },
          draw_mode: { type: "string", enum: ["interest", "swr", "fixed_period"], description: "Distribution method" },
          retire_bracket: { type: "number", description: "Retirement tax rate (0-1)" },
          ssi_annual: { type: "number", description: "Annual Social Security benefit" },
          filing_status: { type: "string", enum: ["single", "mfj"], description: "Tax filing status" },
          retire_return: { type: "number", description: "Return rate during retirement (optional)" },
          swr_rate: { type: "number", description: "Safe withdrawal rate if using swr mode (optional)" },
          fixed_years: { type: "number", description: "Years for fixed period distribution (optional)" }
        },
        required: ["annual_contrib", "years", "pre_tax_rate_now", "assumed_return", "draw_mode", "retire_bracket", "ssi_annual", "filing_status"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "calculate_roth_lirp_scenario",
      description: "Calculate a Roth/LIRP after-tax scenario with tax-free distributions",
      parameters: {
        type: "object",
        properties: {
          annual_contrib_after_tax: { type: "number", description: "Annual after-tax contribution" },
          years: { type: "number", description: "Years until retirement" },
          assumed_return: { type: "number", description: "Expected annual return (0-1)" },
          draw_mode: { type: "string", enum: ["interest", "swr", "fixed_period"], description: "Distribution method" },
          ssi_annual: { type: "number", description: "Annual Social Security benefit" },
          retire_return: { type: "number", description: "Return rate during retirement (optional)" },
          swr_rate: { type: "number", description: "Safe withdrawal rate (optional)" },
          fixed_years: { type: "number", description: "Years for fixed period (optional)" }
        },
        required: ["annual_contrib_after_tax", "years", "assumed_return", "draw_mode", "ssi_annual"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "calculate_ssi_taxation",
      description: "Calculate Social Security taxation based on other income",
      parameters: {
        type: "object",
        properties: {
          ssi_annual: { type: "number", description: "Annual Social Security benefit" },
          other_ordinary_income: { type: "number", description: "Other taxable income (e.g., 401k distributions)" },
          filing_status: { type: "string", enum: ["single", "mfj"], description: "Tax filing status" },
          tax_rate: { type: "number", description: "Marginal tax rate (0-1)" }
        },
        required: ["ssi_annual", "other_ordinary_income", "filing_status", "tax_rate"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "calculate_heirs_tax",
      description: "Calculate tax implications for heirs inheriting pre-tax accounts",
      parameters: {
        type: "object",
        properties: {
          pretax_balance: { type: "number", description: "Pre-tax account balance" },
          beneficiary_bracket: { type: "number", description: "Beneficiary's tax rate (0-1)" },
          mode: { type: "string", enum: ["lump", "10yr"], description: "Distribution mode for heirs" }
        },
        required: ["pretax_balance", "beneficiary_bracket", "mode"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "compare_scenarios",
      description: "Generate a comprehensive comparison between 401(k) and Roth/LIRP scenarios",
      parameters: {
        type: "object",
        properties: {
          scenario_401k: { type: "object", description: "Result from calculate_401k_scenario" },
          scenario_roth: { type: "object", description: "Result from calculate_roth_lirp_scenario" },
          heirs_401k: { type: "object", description: "Result from calculate_heirs_tax for 401k (optional)" },
          heirs_roth: { type: "object", description: "Result from calculate_heirs_tax for Roth (optional)" },
          inputs_401k: { type: "object", description: "Original 401k inputs" },
          inputs_roth: { type: "object", description: "Original Roth inputs" }
        },
        required: ["scenario_401k", "scenario_roth", "inputs_401k", "inputs_roth"]
      }
    }
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log('[tax-agent] Processing request with', messages.length, 'messages');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Make request to Lovable AI with tools
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        tools: TOOLS,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[tax-agent] AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add funds to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    // Stream the response back
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error('[tax-agent] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
