import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowRight, 
  TrendingUp, 
  TrendingDown, 
  Shield, 
  DollarSign,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import type { ScenarioComparison } from '@/types/retirement';

interface ScenarioComparisonCardProps {
  comparison: ScenarioComparison;
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

export function ScenarioComparisonCard({ comparison }: ScenarioComparisonCardProps) {
  const { scenario_a, scenario_b, comparison_metrics } = comparison;
  
  const metrics = [
    {
      label: 'Monthly Retirement Income (Net)',
      valueA: formatCurrency(scenario_a.retirement_income_net),
      valueB: formatCurrency(scenario_b.retirement_income_net),
      improved: scenario_b.retirement_income_net > scenario_a.retirement_income_net,
      difference: formatCurrency(comparison_metrics.income_improvement_monthly),
    },
    {
      label: 'Lifetime Taxes Paid',
      valueA: formatCurrency(scenario_a.lifetime_taxes_paid),
      valueB: formatCurrency(scenario_b.lifetime_taxes_paid),
      improved: scenario_b.lifetime_taxes_paid < scenario_a.lifetime_taxes_paid,
      difference: formatCurrency(comparison_metrics.tax_savings_lifetime),
      lowerIsBetter: true,
    },
    {
      label: 'Guaranteed Income',
      valueA: scenario_a.has_guaranteed_income ? 'Yes (SS/Pension)' : 'None',
      valueB: scenario_b.has_guaranteed_income ? 'Yes' : 'No',
      improved: scenario_b.has_guaranteed_income && !scenario_a.has_guaranteed_income,
      isBoolean: true,
    },
    {
      label: 'Tax-Free Income',
      valueA: scenario_a.has_tax_free_income ? 'Yes' : 'None',
      valueB: scenario_b.has_tax_free_income ? 'Yes' : 'None',
      improved: scenario_b.has_tax_free_income && !scenario_a.has_tax_free_income,
      isBoolean: true,
    },
    {
      label: 'Money Lasts Until Age',
      valueA: scenario_a.money_runs_out_age ? `${scenario_a.money_runs_out_age}` : '95+',
      valueB: scenario_b.money_runs_out_age ? `${scenario_b.money_runs_out_age}` : '95+',
      improved: comparison_metrics.longevity_improvement_years > 0,
      difference: comparison_metrics.longevity_improvement_years > 0 
        ? `+${comparison_metrics.longevity_improvement_years} years` 
        : undefined,
    },
    {
      label: 'Market Risk Exposure',
      valueA: scenario_a.market_risk_exposure,
      valueB: scenario_b.market_risk_exposure,
      improved: comparison_metrics.market_risk_reduction,
      isRisk: true,
    },
    {
      label: 'Legacy Value at Age 90',
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
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Header Row */}
        <div className="grid grid-cols-4 gap-4 mb-4 pb-2 border-b">
          <div className="font-medium text-muted-foreground text-sm">Metric</div>
          <div className="font-semibold text-center">
            <span className="text-muted-foreground text-xs block">Scenario A</span>
            Current Path
          </div>
          <div className="font-semibold text-center text-primary">
            <span className="text-muted-foreground text-xs block">Scenario B</span>
            Optimized Strategy
          </div>
          <div className="font-semibold text-center text-sm">
            Improvement
          </div>
        </div>
        
        {/* Metrics Rows */}
        <div className="space-y-3">
          {metrics.map((metric, index) => (
            <div 
              key={metric.label} 
              className={`grid grid-cols-4 gap-4 py-2 ${index % 2 === 0 ? 'bg-muted/30 rounded-lg px-2 -mx-2' : ''}`}
            >
              <div className="text-sm font-medium flex items-center">
                {metric.label}
              </div>
              
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
        
        <Separator className="my-6" />
        
        {/* Summary Row */}
        <div className="bg-primary/5 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm mb-1">Optimization Summary</h4>
              <p className="text-sm text-muted-foreground">
                {comparison_metrics.income_improvement_percent > 0 && (
                  <>
                    The optimized strategy could increase your net retirement income by{' '}
                    <span className="font-medium text-green-600">
                      {formatPercent(comparison_metrics.income_improvement_percent)}
                    </span>
                    {' '}({formatCurrency(comparison_metrics.income_improvement_monthly)}/month).{' '}
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
              </Badge>
            )}
            {comparison.includes_annuity && (
              <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                FIA for Guaranteed Income
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
