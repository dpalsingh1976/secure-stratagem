import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schemas
const Scenario401kSchema = z.object({
  net_income: z.number(),
  total_annual_tax: z.number(),
  gross_income: z.number(),
  payback_years: z.number(),
  front_end_savings_total: z.number(),
  cum_tax_20: z.number(),
  cum_tax_30: z.number(),
  taxable_ssi: z.number(),
  ssi_tax_due: z.number()
});

const ScenarioRothSchema = z.object({
  net_income: z.number(),
  total_annual_tax: z.number(),
  annual_tax_free_income: z.number(),
  cum_tax_20: z.number(),
  cum_tax_30: z.number(),
  ssi_retained: z.number()
});

const HeirsSchema = z.object({
  heirs_tax_due: z.number()
}).optional();

const Inputs401kSchema = z.object({
  years: z.number().min(1).max(50),
  ssi_annual: z.number().min(0).max(500000)
});

const CalcSummarySchema = z.object({
  scenario_401k: Scenario401kSchema,
  scenario_roth: ScenarioRothSchema,
  heirs_401k: HeirsSchema,
  heirs_roth: HeirsSchema,
  inputs_401k: Inputs401kSchema,
  inputs_roth: z.object({}).optional()
});

/**
 * Summary Comparison Generator
 * 
 * Inputs:
 * - scenario_401k: Output from calc-401k
 * - scenario_roth: Output from calc-roth-lirp
 * - heirs_401k?: Output from calc-heirs-tax for 401k
 * - heirs_roth?: Output from calc-heirs-tax for Roth
 * - inputs_401k: Original inputs for context
 * - inputs_roth: Original inputs for context
 * 
 * Outputs:
 * - kpis: Key comparison metrics
 * - narrative: Educational bullets
 * - chart_data: Data for visualization
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawInputs = await req.json();
    console.log('[calc-summary-compare] Received inputs:', rawInputs);

    // Validate inputs with Zod
    const parseResult = CalcSummarySchema.safeParse(rawInputs);
    if (!parseResult.success) {
      console.error('[calc-summary-compare] Validation error:', parseResult.error.errors);
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
      scenario_401k,
      scenario_roth,
      heirs_401k,
      heirs_roth,
      inputs_401k
    } = inputs;

    // Extract KPIs
    const kpis = {
      net_income_401k: scenario_401k.net_income,
      net_income_roth: scenario_roth.net_income,
      net_income_diff: scenario_roth.net_income - scenario_401k.net_income,
      
      total_tax_401k: scenario_401k.total_annual_tax,
      total_tax_roth: scenario_roth.total_annual_tax,
      annual_tax_savings: scenario_401k.total_annual_tax,
      
      payback_years: scenario_401k.payback_years,
      front_end_savings: scenario_401k.front_end_savings_total,
      
      cum_tax_20_401k: scenario_401k.cum_tax_20,
      cum_tax_20_roth: scenario_roth.cum_tax_20,
      lifetime_tax_diff_20: scenario_401k.cum_tax_20,
      
      cum_tax_30_401k: scenario_401k.cum_tax_30,
      cum_tax_30_roth: scenario_roth.cum_tax_30,
      lifetime_tax_diff_30: scenario_401k.cum_tax_30,
      
      heirs_tax_401k: heirs_401k?.heirs_tax_due || 0,
      heirs_tax_roth: heirs_roth?.heirs_tax_due || 0,
      heirs_tax_savings: (heirs_401k?.heirs_tax_due || 0) - (heirs_roth?.heirs_tax_due || 0),
      
      ssi_preserved_roth: scenario_roth.ssi_retained,
      ssi_taxed_401k: scenario_401k.taxable_ssi,
      ssi_impact: scenario_401k.ssi_tax_due
    };

    // Generate narrative (educational tone)
    const narrative = [
      `Your 401(k) provides $${formatCurrency(kpis.front_end_savings)} in front-end tax savings over ${inputs_401k.years} years by allowing pre-tax contributions.`,
      
      `However, retirement distributions trigger $${formatCurrency(kpis.total_tax_401k)} in annual taxes, including $${formatCurrency(scenario_401k.ssi_tax_due)} on Social Security due to Provisional Income calculations.`,
      
      `The "payback period" for your accumulated tax savings is approximately ${kpis.payback_years.toFixed(1)} years of retirement distributions.`,
      
      `By contrast, Roth/LIRP distributions are tax-free and preserve your full $${formatCurrency(kpis.ssi_preserved_roth)} Social Security benefit annually.`,
      
      `Your net annual retirement income differs by $${formatCurrency(Math.abs(kpis.net_income_diff))} (${kpis.net_income_diff > 0 ? 'Roth/LIRP advantage' : '401(k) advantage'}).`,
      
      `Over 20 years, the 401(k) results in $${formatCurrency(kpis.lifetime_tax_diff_20)} more in lifetime taxes compared to Roth/LIRP.`,
      
      `Over 30 years, the difference grows to $${formatCurrency(kpis.lifetime_tax_diff_30)} in additional taxes.`,
      
      heirs_401k ? `For estate planning: Your heirs would face approximately $${formatCurrency(kpis.heirs_tax_401k)} in taxes on the 401(k) balance vs $${formatCurrency(kpis.heirs_tax_roth)} on Roth/LIRP (assuming rules are met).` : '',
      
      `Key insight: Up to ${((scenario_401k.taxable_ssi / inputs_401k.ssi_annual) * 100).toFixed(0)}% of your Social Security becomes taxable when you have 401(k) income, significantly increasing your effective tax rate.`
    ].filter(Boolean);

    // Chart data for visualization
    const chart_data = {
      annual: [
        {
          category: '401(k)',
          gross: scenario_401k.gross_income,
          taxes: scenario_401k.total_annual_tax,
          net: scenario_401k.net_income,
          ssi_tax: scenario_401k.ssi_tax_due
        },
        {
          category: 'Roth/LIRP',
          gross: scenario_roth.annual_tax_free_income,
          taxes: 0,
          net: scenario_roth.net_income,
          ssi_tax: 0
        }
      ],
      cumulative: generateCumulativeData(scenario_401k, scenario_roth)
    };

    const result = {
      kpis,
      narrative,
      chart_data
    };

    console.log('[calc-summary-compare] Comparison result generated');

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[calc-summary-compare] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
}

function generateCumulativeData(scenario_401k: z.infer<typeof Scenario401kSchema>, scenario_roth: z.infer<typeof ScenarioRothSchema>) {
  const years = [5, 10, 15, 20, 25, 30];
  return years.map(year => ({
    year,
    tax_401k: scenario_401k.total_annual_tax * year,
    tax_roth: scenario_roth.total_annual_tax * year,
  }));
}
