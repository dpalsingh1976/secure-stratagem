import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const CalcSSISchema = z.object({
  ssi_annual: z.number().min(0).max(500000),
  other_ordinary_income: z.number().min(0).max(50000000),
  filing_status: z.enum(['single', 'mfj']).optional().default('mfj'),
  tax_rate: z.number().min(0).max(1)
});

/**
 * SSI Taxation Calculator
 * 
 * Inputs:
 * - ssi_annual: Annual SSI benefit
 * - other_ordinary_income: Other taxable income (e.g., 401k distributions)
 * - filing_status: 'single' | 'mfj'
 * - tax_rate: Marginal tax rate to apply
 * 
 * Outputs:
 * - provisional_income: Calculated PI
 * - taxable_ssi: Amount of SSI subject to tax
 * - ssi_tax_due: Tax owed on SSI
 * - taxability_pct: Percentage of SSI taxed
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawInputs = await req.json();
    console.log('[calc-ssi] Received inputs:', rawInputs);

    // Validate inputs with Zod
    const parseResult = CalcSSISchema.safeParse(rawInputs);
    if (!parseResult.success) {
      console.error('[calc-ssi] Validation error:', parseResult.error.errors);
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
      ssi_annual,
      other_ordinary_income,
      filing_status,
      tax_rate
    } = inputs;

    // Calculate Provisional Income
    const provisional_income = 0.5 * ssi_annual + other_ordinary_income;

    // Thresholds for 2025
    const thresholds = filing_status === 'mfj' 
      ? { base: 32000, upper: 44000 }
      : { base: 25000, upper: 34000 };

    let taxable_ssi = 0;
    let taxability_pct = 0;

    if (provisional_income <= thresholds.base) {
      // No SSI is taxable
      taxable_ssi = 0;
      taxability_pct = 0;
    } else if (provisional_income <= thresholds.upper) {
      // Up to 50% of SSI is taxable
      taxable_ssi = Math.min(ssi_annual * 0.5, (provisional_income - thresholds.base) * 0.5);
      taxability_pct = ssi_annual > 0 ? (taxable_ssi / ssi_annual) * 100 : 0;
    } else {
      // Up to 85% of SSI is taxable
      const amount_over_upper = provisional_income - thresholds.upper;
      const base_taxable = Math.min(ssi_annual * 0.5, (thresholds.upper - thresholds.base) * 0.5);
      taxable_ssi = Math.min(ssi_annual * 0.85, base_taxable + amount_over_upper * 0.85);
      taxability_pct = ssi_annual > 0 ? (taxable_ssi / ssi_annual) * 100 : 0;
    }

    const ssi_tax_due = taxable_ssi * tax_rate;

    const result = {
      provisional_income,
      taxable_ssi,
      ssi_tax_due,
      taxability_pct,
      thresholds
    };

    console.log('[calc-ssi] Calculation result:', result);

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[calc-ssi] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
