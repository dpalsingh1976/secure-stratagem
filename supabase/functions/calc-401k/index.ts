import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const Calc401kSchema = z.object({
  annual_contrib: z.number().min(0).max(10000000),
  years: z.number().int().min(1).max(50),
  pre_tax_rate_now: z.number().min(0).max(1),
  assumed_return: z.number().min(-0.5).max(0.5),
  draw_mode: z.enum(['interest', 'swr', 'fixed_period']),
  retire_return: z.number().min(-0.5).max(0.5).optional().default(0.05),
  swr_rate: z.number().min(0).max(0.2).optional().default(0.04),
  fixed_years: z.number().int().min(1).max(50).optional().default(20),
  retire_bracket: z.number().min(0).max(1),
  ssi_annual: z.number().min(0).max(500000),
  filing_status: z.enum(['single', 'mfj']).optional().default('mfj')
});

/**
 * 401k Calculator with SSI Provisional Income Analysis
 * 
 * Inputs:
 * - annual_contrib: Pre-tax contribution amount
 * - years: Accumulation years
 * - pre_tax_rate_now: Current tax rate (0-1)
 * - assumed_return: Growth rate (0-1)
 * - draw_mode: 'interest' | 'swr' | 'fixed_period'
 * - retire_return?: Return during retirement
 * - swr_rate?: Safe withdrawal rate
 * - fixed_years?: Years for fixed period
 * - retire_bracket: Retirement tax rate (0-1)
 * - ssi_annual: Annual SSI benefit
 * - filing_status: 'single' | 'mfj'
 * 
 * Outputs:
 * - balance_at_retire: Account balance at retirement
 * - gross_income: Annual gross income
 * - tax_on_401k: Annual 401k distribution tax
 * - taxable_ssi: Amount of SSI subject to tax
 * - ssi_tax_due: Tax on SSI
 * - total_annual_tax: Combined tax
 * - net_income: After-tax income
 * - front_end_savings_total: Total tax savings during accumulation
 * - payback_years: Years to pay back front-end savings
 * - cum_tax_20: 20-year cumulative tax
 * - cum_tax_30: 30-year cumulative tax
 * - effective_rate_incl_ssi: Effective tax rate including SSI impact
 * - sensitivity: Alternative scenarios
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawInputs = await req.json();
    console.log('[calc-401k] Received inputs:', rawInputs);

    // Validate inputs with Zod
    const parseResult = Calc401kSchema.safeParse(rawInputs);
    if (!parseResult.success) {
      console.error('[calc-401k] Validation error:', parseResult.error.errors);
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
      annual_contrib,
      years,
      pre_tax_rate_now,
      assumed_return,
      draw_mode,
      retire_return,
      swr_rate,
      fixed_years,
      retire_bracket,
      ssi_annual,
      filing_status
    } = inputs;

    // Calculate future value (ordinary annuity)
    // FV = P * (((1+r)^n - 1) / r)
    const fv_factor = (Math.pow(1 + assumed_return, years) - 1) / assumed_return;
    const balance_at_retire = annual_contrib * fv_factor;

    // Calculate gross income based on draw mode
    let gross_income = 0;
    if (draw_mode === 'interest') {
      gross_income = balance_at_retire * retire_return;
    } else if (draw_mode === 'swr') {
      gross_income = balance_at_retire * swr_rate;
    } else if (draw_mode === 'fixed_period') {
      // Amortization: PMT = PV * r * (1+r)^n / ((1+r)^n - 1)
      const r = retire_return;
      const n = fixed_years;
      const factor = (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      gross_income = balance_at_retire * factor;
    }

    // Calculate SSI Provisional Income
    // PI = 0.5 * SSI + other income (401k distributions)
    const provisional_income = 0.5 * ssi_annual + gross_income;

    // SSI Taxability thresholds (2025 values)
    const thresholds = filing_status === 'mfj' 
      ? { base: 32000, upper: 44000 }
      : { base: 25000, upper: 34000 };

    let taxable_ssi = 0;
    if (provisional_income <= thresholds.base) {
      taxable_ssi = 0;
    } else if (provisional_income <= thresholds.upper) {
      // 50% of SSI is taxable
      taxable_ssi = Math.min(ssi_annual * 0.5, (provisional_income - thresholds.base) * 0.5);
    } else {
      // Up to 85% of SSI is taxable
      const amount_over_upper = provisional_income - thresholds.upper;
      const base_taxable = Math.min(ssi_annual * 0.5, (thresholds.upper - thresholds.base) * 0.5);
      taxable_ssi = Math.min(ssi_annual * 0.85, base_taxable + amount_over_upper * 0.85);
    }

    // Calculate taxes
    const tax_on_401k = gross_income * retire_bracket;
    const ssi_tax_due = taxable_ssi * retire_bracket;
    const total_annual_tax = tax_on_401k + ssi_tax_due;

    // Net income
    const net_income = gross_income + (ssi_annual - ssi_tax_due);

    // Front-end savings analysis
    const front_end_savings_total = annual_contrib * pre_tax_rate_now * years;
    const payback_years = total_annual_tax > 0 ? front_end_savings_total / total_annual_tax : Infinity;

    // Lifetime tax projections
    const cum_tax_20 = total_annual_tax * 20;
    const cum_tax_30 = total_annual_tax * 30;

    // Effective rate including SSI impact
    const effective_rate_incl_ssi = gross_income > 0 ? total_annual_tax / gross_income : 0;

    // Sensitivity analysis
    const sensitivity = {
      tax_up_5pct: calculateScenario({ ...inputs, retire_bracket: retire_bracket * 1.05 }),
      tax_down_5pct: calculateScenario({ ...inputs, retire_bracket: retire_bracket * 0.95 }),
      return_up_2pct: calculateScenario({ ...inputs, assumed_return: assumed_return + 0.02 }),
      return_down_2pct: calculateScenario({ ...inputs, assumed_return: assumed_return - 0.02 }),
      sunset_2026: calculateScenario({ ...inputs, retire_bracket: retire_bracket * 1.15 }) // Higher ordinary rates
    };

    const result = {
      balance_at_retire,
      gross_income,
      tax_on_401k,
      taxable_ssi,
      ssi_tax_due,
      total_annual_tax,
      net_income,
      front_end_savings_total,
      payback_years,
      cum_tax_20,
      cum_tax_30,
      effective_rate_incl_ssi,
      sensitivity
    };

    console.log('[calc-401k] Calculation result:', result);

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[calc-401k] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function for sensitivity calculations
function calculateScenario(inputs: {
  annual_contrib: number;
  years: number;
  assumed_return: number;
  draw_mode: string;
  retire_return: number;
  swr_rate: number;
  fixed_years: number;
  retire_bracket: number;
  ssi_annual: number;
  filing_status: string;
}) {
  const {
    annual_contrib,
    years,
    assumed_return,
    draw_mode,
    retire_return,
    swr_rate,
    fixed_years,
    retire_bracket,
    ssi_annual,
    filing_status
  } = inputs;

  const fv_factor = (Math.pow(1 + assumed_return, years) - 1) / assumed_return;
  const balance = annual_contrib * fv_factor;

  let gross = 0;
  if (draw_mode === 'interest') {
    gross = balance * retire_return;
  } else if (draw_mode === 'swr') {
    gross = balance * swr_rate;
  } else if (draw_mode === 'fixed_period') {
    const r = retire_return;
    const n = fixed_years;
    const factor = (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    gross = balance * factor;
  }

  const pi = 0.5 * ssi_annual + gross;
  const thresholds = filing_status === 'mfj' 
    ? { base: 32000, upper: 44000 }
    : { base: 25000, upper: 34000 };

  let taxable_ssi = 0;
  if (pi > thresholds.upper) {
    const amount_over = pi - thresholds.upper;
    const base_taxable = Math.min(ssi_annual * 0.5, (thresholds.upper - thresholds.base) * 0.5);
    taxable_ssi = Math.min(ssi_annual * 0.85, base_taxable + amount_over * 0.85);
  } else if (pi > thresholds.base) {
    taxable_ssi = Math.min(ssi_annual * 0.5, (pi - thresholds.base) * 0.5);
  }

  const total_tax = (gross * retire_bracket) + (taxable_ssi * retire_bracket);

  return {
    balance,
    gross_income: gross,
    total_annual_tax: total_tax,
    net_income: gross + (ssi_annual - taxable_ssi * retire_bracket)
  };
}
