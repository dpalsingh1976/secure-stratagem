import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import { feeDragYear } from "../_shared/math.ts";
import type { IulPolicy } from "../_shared/types.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { caseId, annualPremium = 10000 } = await req.json();
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    
    console.log(`[iul-compare] Comparing case ${caseId}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch policies
    const { data: policies, error: policiesError } = await supabase
      .from('iul_policies')
      .select('*')
      .eq('case_id', caseId);

    if (policiesError) throw policiesError;

    const policyData: IulPolicy[] = policies.map(p => p.data as IulPolicy);

    // Build comparison table
    const table = {
      headers: ['Feature', ...policyData.map(p => p.carrier || p.product_name || 'Unknown')],
      rows: [
        ['Carrier', ...policyData.map(p => p.carrier || 'N/A')],
        ['Product', ...policyData.map(p => p.product_name || 'N/A')],
        ['Premium Load %', ...policyData.map(p => 
          p.charges?.premium_load_pct?.toString() || 'N/A'
        )],
        ['Monthly Admin Fee', ...policyData.map(p => 
          p.charges?.monthly_admin_fee ? `$${p.charges.monthly_admin_fee}` : 'N/A'
        )],
        ['Expense Charge %', ...policyData.map(p => 
          p.charges?.expense_charge_pct?.toString() || 'N/A'
        )],
      ],
    };

    // Calculate fee drag
    const charts = policyData.map(policy => ({
      policy: policy.carrier || policy.product_name,
      annualFeeDrag: feeDragYear(policy.charges || {}, annualPremium),
    }));

    // Generate narrative using OpenAI
    let narrative = 'Comparison summary: ';
    
    if (openaiKey) {
      try {
        const completion = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are an IUL policy comparison expert. Analyze the policies and provide insights.',
              },
              {
                role: 'user',
                content: `Compare these IUL policies:\n${JSON.stringify(policyData, null, 2)}\n\nProvide a detailed comparison focusing on fees, charges, and value.`,
              },
            ],
          }),
        });

        const completionData = await completion.json();
        narrative = completionData.choices[0].message.content;
      } catch (aiError) {
        console.error('[iul-compare] AI generation error:', aiError);
        narrative += `Comparing ${policyData.length} policies. Review the table and charts for detailed fee structure analysis.`;
      }
    } else {
      narrative += `Comparing ${policyData.length} policies. Review the table and charts for detailed fee structure analysis.`;
    }

    return new Response(
      JSON.stringify({ success: true, table, charts, narrative }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[iul-compare] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
