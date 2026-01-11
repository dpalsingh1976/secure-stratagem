import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  TrendingUp, 
  Shield, 
  CheckCircle,
  Info,
  Heart,
  HelpCircle
} from 'lucide-react';
import type { ScenarioComparison } from '@/types/retirement';
import { AssumptionsModal } from './AssumptionsModal';

interface ClientAllocations {
  iul: number;
  annuity: number;
}

interface ScenarioComparisonCardProps {
  comparison: ScenarioComparison;
  clientAllocations?: ClientAllocations;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatPercent = (value: number): string => {
  return `${Math.round(value)}%`;
};

export function ScenarioComparisonCard({ comparison, clientAllocations }: ScenarioComparisonCardProps) {
  const [showAssumptions, setShowAssumptions] = useState(false);
  const { scenario_a, scenario_b, comparison_metrics } = comparison;
  
  // Calculate death benefit leverage if IUL is included
  const iulDeathBenefit = scenario_b.iul_death_benefit || 0;
  const iulAnnualPremium = scenario_b.iul_annual_premium || 0;
  const deathBenefitLeverage = iulAnnualPremium > 0 ? Math.round(iulDeathBenefit / iulAnnualPremium) : 0;

  // Calculate total retirement accumulation for each scenario
  // Column A: Current investments only
  // Column B: Current investments + IUL cash value (IUL is ADDITIONAL investment)
  const totalAccumulationA = scenario_a.portfolio_at_retirement;
  const iulCashValue = scenario_b.iul_projected_cash_value || 0;
  const totalAccumulationB = scenario_b.portfolio_at_retirement + iulCashValue;
  const accumulationDifference = totalAccumulationB - totalAccumulationA;

  // Death benefit shows Cash Value + Death Benefit combined
  const totalDeathBenefitValue = iulCashValue + iulDeathBenefit;

  const metrics = [
    {
      label: 'Total Retirement Accumulation',
      tooltip: 'Current (A): Your portfolio value at retirement age based on current investments and growth. Optimized (B): Your portfolio + IUL cash value — IUL is treated as additional investment on top of your existing contributions.',
      valueA: formatCurrency(totalAccumulationA),
      valueB: formatCurrency(totalAccumulationB),
      improved: totalAccumulationB > totalAccumulationA,
      difference: accumulationDifference !== 0 ? formatCurrency(Math.abs(accumulationDifference)) : undefined,
      subtext: iulCashValue > 0 ? `Portfolio: ${formatCurrency(scenario_b.portfolio_at_retirement)} + IUL Cash: ${formatCurrency(iulCashValue)}` : undefined,
    },
    {
      label: 'Death Benefit (Tax-Free)',
      tooltip: 'Total value passed to beneficiaries: IUL Cash Value + Death Benefit. This amount transfers immediately upon passing, outside of probate and income tax-free.',
      valueA: '$0',
      valueB: formatCurrency(totalDeathBenefitValue),
      improved: totalDeathBenefitValue > 0,
      difference: totalDeathBenefitValue > 0 ? formatCurrency(totalDeathBenefitValue) : undefined,
      subtext: totalDeathBenefitValue > 0 ? `Cash Value: ${formatCurrency(iulCashValue)} + Death Benefit: ${formatCurrency(iulDeathBenefit)}` : undefined,
      highlight: true,
    },
    {
      label: 'Lifetime Taxes Paid',
      tooltip: 'Current (A): All portfolio withdrawals are taxable at 22% marginal rate over 30 years. Optimized (B): IUL policy loans are tax-free, reducing the amount of taxable withdrawals needed.',
      valueA: formatCurrency(scenario_a.lifetime_taxes_paid),
      valueB: formatCurrency(scenario_b.lifetime_taxes_paid),
      improved: scenario_b.lifetime_taxes_paid < scenario_a.lifetime_taxes_paid,
      difference: formatCurrency(comparison_metrics.tax_savings_lifetime),
      lowerIsBetter: true,
    },
    {
      label: 'Guaranteed Income',
      tooltip: 'Current (A): Only Social Security and Pension provide guaranteed income. Optimized (B): Adds FIA annuity payments (5% of benefit base annually) that continue regardless of market conditions.',
      valueA: scenario_a.has_guaranteed_income ? 'Yes (SS/Pension)' : 'None',
      valueB: scenario_b.has_guaranteed_income ? 'Yes' : 'No',
      improved: scenario_b.has_guaranteed_income && !scenario_a.has_guaranteed_income,
      isBoolean: true,
    },
    {
      label: 'Tax-Free Income',
      tooltip: 'Current (A): None unless you have Roth accounts. Optimized (B): IUL policy loans provide tax-free income − calculated as 80% of cash value distributed over 20 years of retirement.',
      valueA: scenario_a.has_tax_free_income ? 'Yes' : 'None',
      valueB: scenario_b.has_tax_free_income ? 'Yes' : 'None',
      improved: scenario_b.has_tax_free_income && !scenario_a.has_tax_free_income,
      isBoolean: true,
    },
    {
      label: 'Money Lasts Until Age',
      tooltip: 'Year-by-year simulation of withdrawals assuming 6% portfolio returns. Shows the age when your portfolio + income sources can no longer cover your expenses. 95+ means money lasts through the entire planning horizon.',
      valueA: scenario_a.money_runs_out_age ? `${scenario_a.money_runs_out_age}` : '95+',
      valueB: scenario_b.money_runs_out_age ? `${scenario_b.money_runs_out_age}` : '95+',
      improved: comparison_metrics.longevity_improvement_years > 0,
      difference: comparison_metrics.longevity_improvement_years > 0 
        ? `+${comparison_metrics.longevity_improvement_years} years` 
        : undefined,
    },
    {
      label: 'Market Risk Exposure',
      tooltip: 'High = 100% portfolio dependent on market performance. Moderate = IUL or Annuity provides some downside protection. Low = Both IUL (0% floor) and Annuity reduce dependency on market returns.',
      valueA: scenario_a.market_risk_exposure,
      valueB: scenario_b.market_risk_exposure,
      improved: comparison_metrics.market_risk_reduction,
      isRisk: true,
    },
    {
      label: 'Legacy Value at Age 90',
      tooltip: 'Current (A): Remaining portfolio balance at age 90 after withdrawals. Optimized (B): Portfolio balance PLUS IUL death benefit (if included), providing enhanced legacy value to heirs.',
      valueA: formatCurrency(scenario_a.legacy_value_at_90),
      valueB: formatCurrency(scenario_b.legacy_value_at_90),
      improved: scenario_b.legacy_value_at_90 > scenario_a.legacy_value_at_90,
      difference: formatCurrency(comparison_metrics.legacy_improvement_amount),
    },
  ];

  const getRiskBadgeStyle = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-primary" />
          Side-by-Side Comparison
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowAssumptions(true)}
            className="text-muted-foreground hover:text-primary ml-auto text-xs"
          >
            <Info className="h-4 w-4 mr-1" />
            View Assumptions
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Header Row */}
        <div className="grid grid-cols-4 gap-2 md:gap-4 mb-4 pb-2 border-b">
          <div className="font-medium text-muted-foreground text-xs md:text-sm">Metric</div>
          <div className="font-semibold text-center text-xs md:text-sm">
            <span className="text-muted-foreground text-xs block">A</span>
            Current
          </div>
          <div className="font-semibold text-center text-primary text-xs md:text-sm">
            <span className="text-muted-foreground text-xs block">B</span>
            Optimized
          </div>
          <div className="font-semibold text-center text-xs md:text-sm">
            B vs A
          </div>
        </div>
        
        {/* Metrics Rows */}
        <div className="space-y-3">
          {metrics.map((metric, index) => (
            <div 
              key={metric.label} 
              className={`grid grid-cols-4 gap-2 md:gap-4 py-2 ${metric.highlight ? 'bg-blue-50 dark:bg-blue-950/30 rounded-lg px-2 -mx-2 border border-blue-200 dark:border-blue-800' : index % 2 === 0 ? 'bg-muted/30 rounded-lg px-2 -mx-2' : ''}`}
            >
              <div className="text-sm font-medium flex items-center gap-1.5">
                {metric.highlight && <Heart className="h-4 w-4 text-blue-600 mr-1" />}
                <span className="truncate">{metric.label}</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-primary cursor-help flex-shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      <p className="text-sm">{metric.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              {/* Scenario A Value */}
              <div className="text-center text-sm">
                {metric.isRisk ? (
                  <Badge variant="outline" className={getRiskBadgeStyle(metric.valueA as string)}>
                    {(metric.valueA as string).charAt(0).toUpperCase() + (metric.valueA as string).slice(1)}
                  </Badge>
                ) : metric.isBoolean ? (
                  <span className={metric.valueA === 'None' ? 'text-muted-foreground' : ''}>
                    {metric.valueA}
                  </span>
                ) : (
                  metric.valueA
                )}
              </div>
              
              {/* Scenario B Value */}
              <div className="text-center text-sm font-medium">
                {metric.isRisk ? (
                  <Badge variant="outline" className={getRiskBadgeStyle(metric.valueB as string)}>
                    {(metric.valueB as string).charAt(0).toUpperCase() + (metric.valueB as string).slice(1)}
                  </Badge>
                ) : metric.isBoolean ? (
                  <span className={metric.improved ? 'text-green-600 font-semibold' : ''}>
                    {metric.valueB}
                  </span>
                ) : (
                  <span className={metric.improved ? 'text-green-600' : ''}>
                    {metric.valueB}
                  </span>
                )}
              </div>
              
              {/* B vs A Difference */}
              <div className="text-center">
                {metric.improved ? (
                  <div className="flex items-center justify-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    {metric.difference && (
                      <span className="text-xs text-green-600 font-medium">
                        {metric.lowerIsBetter ? `-${metric.difference.replace('-', '')}` : `+${metric.difference.replace('+', '')}`}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Death Benefit Leverage Callout */}
        {iulDeathBenefit > 0 && iulAnnualPremium > 0 && (
          <>
            <Separator className="my-6" />
            <div className="p-4 rounded-lg border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/30">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-5 w-5 text-blue-600" />
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">Death Benefit Leverage</h4>
              </div>
              
              {/* Prominent Death Benefit Display */}
              <div className="flex items-center justify-center bg-blue-100 dark:bg-blue-900/50 rounded-lg p-4 mb-3">
                <div className="text-center">
                  <span className="text-3xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(iulDeathBenefit)}</span>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">Tax-Free Death Benefit</p>
                </div>
              </div>
              
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Based on an annual IUL premium of <span className="font-bold">{formatCurrency(iulAnnualPremium)}</span>, 
                your family receives immediate protection of{' '}
                <span className="font-bold">{formatCurrency(iulDeathBenefit)}</span>.
                {deathBenefitLeverage > 1 && (
                  <> That's <span className="font-bold text-blue-600 dark:text-blue-400">{deathBenefitLeverage}x</span> your annual premium investment.</>
                )}
              </p>
              
              {/* Comparison Callout */}
              <div className="mt-3 p-3 bg-white/50 dark:bg-blue-900/30 rounded border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  <strong>💡 Traditional Path:</strong> To accumulate {formatCurrency(iulDeathBenefit)} in investments would require decades of saving and market growth. 
                  With IUL, your family has this protection <strong>immediately</strong> while you also build tax-free retirement income.
                </p>
              </div>
            </div>
          </>
        )}
        
        <Separator className="my-6" />
        
        {/* Summary Row */}
        <div className="bg-primary/5 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm mb-1">Optimization Summary</h4>
              <p className="text-sm text-muted-foreground">
                {accumulationDifference !== 0 && (
                  <>
                    At retirement, your total accumulation is{' '}
                    <span className={`font-medium ${accumulationDifference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(Math.abs(accumulationDifference))}
                    </span>
                    {accumulationDifference > 0 ? ' higher' : ' lower'} with the optimized strategy.{' '}
                  </>
                )}
                {comparison_metrics.tax_savings_lifetime > 50000 && (
                  <>
                    Potential lifetime tax savings of{' '}
                    <span className="font-medium text-green-600">
                      {formatCurrency(comparison_metrics.tax_savings_lifetime)}
                    </span>.{' '}
                  </>
                )}
                {comparison_metrics.market_risk_reduction && (
                  <>Market risk exposure is reduced from high to {scenario_b.market_risk_exposure}.</>
                )}
              </p>
            </div>
          </div>
        </div>
        
        {/* What's Included */}
        {(comparison.includes_iul || comparison.includes_annuity) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {comparison.includes_iul && (
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                IUL for Tax-Free Income
                {clientAllocations?.iul ? ` (${formatCurrency(clientAllocations.iul)}/yr)` : ''}
              </Badge>
            )}
            {comparison.includes_annuity && (
              <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                FIA for Guaranteed Income
                {clientAllocations?.annuity ? ` (${formatCurrency(clientAllocations.annuity)})` : ''}
              </Badge>
            )}
          </div>
        )}

        {/* Why Not Included - Exclusion Reasons */}
        {(!comparison.includes_iul || !comparison.includes_annuity) && (
          <div className="mt-4 space-y-2">
            {!comparison.includes_iul && comparison.iul_eligibility?.exclusion_reason && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Why IUL Not Included:</p>
                  <p className="text-sm text-muted-foreground">{comparison.iul_eligibility.exclusion_reason}</p>
                </div>
              </div>
            )}
            {!comparison.includes_annuity && comparison.annuity_eligibility?.exclusion_reason && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Why Guaranteed Income Not Included:</p>
                  <p className="text-sm text-muted-foreground">{comparison.annuity_eligibility.exclusion_reason}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      {/* Assumptions Modal */}
      <AssumptionsModal 
        open={showAssumptions} 
        onClose={() => setShowAssumptions(false)}
        comparison={comparison}
      />
    </Card>
  );
}
