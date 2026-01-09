import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const CalcHeirsSchema = z.object({
  pretax_balance: z.number().min(0).max(100000000),
  beneficiary_bracket: z.number().min(0).max(1),
  mode: z.enum(['lump', '10yr']).optional().default('lump')
});

/**
 * Heirs Tax Calculator
 * 
 * Inputs:
 * - pretax_balance: Pre-tax account balance
 * - beneficiary_bracket: Beneficiary's tax rate
 * - mode: 'lump' | '10yr'
 * 
 * Outputs:
 * - heirs_tax_due: Total tax liability
 * - annual_tax_10yr?: Annual tax if 10-year mode
 * - net_to_heirs: Amount heirs receive after tax
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawInputs = await req.json();
    console.log('[calc-heirs-tax] Received inputs:', rawInputs);

    // Validate inputs with Zod
    const parseResult = CalcHeirsSchema.safeParse(rawInputs);
    if (!parseResult.success) {
      console.error('[calc-heirs-tax] Validation error:', parseResult.error.errors);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input', 
          details: parseResult.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const inputs = parseResult.data;
    const {
      pretax_balance,
      beneficiary_bracket,
      mode
    } = inputs;

    let heirs_tax_due = 0;
    let annual_tax_10yr = 0;

    if (mode === 'lump') {
      // Immediate tax hit on full balance
      heirs_tax_due = pretax_balance * beneficiary_bracket;
    } else if (mode === '10yr') {
      // Simplified: distribute evenly over 10 years
      const annual_distribution = pretax_balance / 10;
      annual_tax_10yr = annual_distribution * beneficiary_bracket;
      heirs_tax_due = annual_tax_10yr * 10;
    }

    const net_to_heirs = pretax_balance - heirs_tax_due;

    const result = {
      heirs_tax_due,
      annual_tax_10yr: mode === '10yr' ? annual_tax_10yr : undefined,
      net_to_heirs,
      mode
    };

    console.log('[calc-heirs-tax] Calculation result:', result);

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[calc-heirs-tax] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
