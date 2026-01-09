import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const CalcRothSchema = z.object({
  annual_contrib_after_tax: z.number().min(0).max(10000000),
  years: z.number().int().min(1).max(50),
  assumed_return: z.number().min(-0.5).max(0.5),
  draw_mode: z.enum(['interest', 'swr', 'fixed_period']),
  retire_return: z.number().min(-0.5).max(0.5).optional().default(0.05),
  swr_rate: z.number().min(0).max(0.2).optional().default(0.04),
  fixed_years: z.number().int().min(1).max(50).optional().default(20),
  ssi_annual: z.number().min(0).max(500000).optional().default(0)
});

/**
 * Roth/LIRP Calculator (Tax-Free Distributions)
 * 
 * Inputs:
 * - annual_contrib_after_tax: After-tax contribution
 * - years: Accumulation years
 * - assumed_return: Growth rate (0-1)
 * - draw_mode: 'interest' | 'swr' | 'fixed_period'
 * - retire_return?: Return during retirement
 * - swr_rate?: Safe withdrawal rate
 * - fixed_years?: Years for fixed period
 * - ssi_annual: Annual SSI benefit (for comparison)
 * 
 * Outputs:
 * - balance_at_retire: Account balance
 * - annual_tax_free_income: Tax-free distribution
 * - total_annual_tax: Always 0
 * - net_income: Full gross + full SSI
 * - ssi_retained: Full SSI benefit (no taxation)
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawInputs = await req.json();
    console.log('[calc-roth-lirp] Received inputs:', rawInputs);

    // Validate inputs with Zod
    const parseResult = CalcRothSchema.safeParse(rawInputs);
    if (!parseResult.success) {
      console.error('[calc-roth-lirp] Validation error:', parseResult.error.errors);
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
      annual_contrib_after_tax,
      years,
      assumed_return,
      draw_mode,
      retire_return,
      swr_rate,
      fixed_years,
      ssi_annual
    } = inputs;

    // Calculate future value (same formula)
    const fv_factor = (Math.pow(1 + assumed_return, years) - 1) / assumed_return;
    const balance_at_retire = annual_contrib_after_tax * fv_factor;

    // Calculate tax-free income based on draw mode
    let annual_tax_free_income = 0;
    if (draw_mode === 'interest') {
      annual_tax_free_income = balance_at_retire * retire_return;
    } else if (draw_mode === 'swr') {
      annual_tax_free_income = balance_at_retire * swr_rate;
    } else if (draw_mode === 'fixed_period') {
      const r = retire_return;
      const n = fixed_years;
      const factor = (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      annual_tax_free_income = balance_at_retire * factor;
    }

    // Key differentiator: NO taxes on distributions
    const total_annual_tax = 0;
    
    // Full SSI benefit retained (not counted in provisional income)
    const ssi_retained = ssi_annual;
    
    // Net income = all income (no taxes)
    const net_income = annual_tax_free_income + ssi_retained;

    const result = {
      balance_at_retire,
      annual_tax_free_income,
      total_annual_tax,
      net_income,
      ssi_retained,
      taxable_ssi: 0,
      ssi_tax_due: 0,
      effective_rate: 0,
      cum_tax_20: 0,
      cum_tax_30: 0
    };

    console.log('[calc-roth-lirp] Calculation result:', result);

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[calc-roth-lirp] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
