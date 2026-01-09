import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from 'recharts';
import type { ScenarioProjection } from '@/types/retirement';

interface RetirementTimelineProps {
  scenarioA: ScenarioProjection;
  scenarioB: ScenarioProjection;
  retirementAge: number;
}

const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
};

const formatTooltipCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export function RetirementTimeline({ scenarioA, scenarioB, retirementAge }: RetirementTimelineProps) {
  // Prepare chart data - portfolio value over time
  const chartData = scenarioA.yearly_projections.map((projA, index) => {
    const projB = scenarioB.yearly_projections[index];
    return {
      age: projA.age,
      currentPath: projA.portfolio_value,
      optimized: projB?.portfolio_value || 0,
    };
  });

  // Income breakdown data for stacked area chart
  const incomeData = scenarioB.yearly_projections.slice(0, 25).map((proj, index) => {
    const age = proj.age;
    return {
      age,
      socialSecurity: scenarioB.income_sources.social_security * 12,
      pension: scenarioB.income_sources.pension * 12,
      portfolioWithdrawal: scenarioB.income_sources.portfolio_withdrawal * 12,
      iulLoans: (scenarioB.income_sources.iul_loans || 0) * 12,
      annuityIncome: (scenarioB.income_sources.annuity_income || 0) * 12,
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-semibold mb-2">Age {label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-medium">{formatTooltipCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Value Timeline */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Portfolio Value Over Time</span>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                Current Path
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                Optimized
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCurrentPath" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOptimized" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="age" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${value}`}
                  label={{ value: 'Age', position: 'insideBottomRight', offset: -5 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={formatCurrency}
                  width={70}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine 
                  x={90} 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeDasharray="5 5"
                  label={{ value: 'Age 90', position: 'top', fontSize: 10 }}
                />
                <Area
                  type="monotone"
                  dataKey="currentPath"
                  name="Current Path"
                  stroke="hsl(var(--destructive))"
                  fillOpacity={1}
                  fill="url(#colorCurrentPath)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="optimized"
                  name="Optimized Strategy"
                  stroke="hsl(var(--primary))"
                  fillOpacity={1}
                  fill="url(#colorOptimized)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          {/* Key milestones */}
          <div className="mt-4 grid grid-cols-3 gap-4 text-center text-sm">
            <div className="p-2 bg-muted/50 rounded-lg">
              <div className="text-muted-foreground">At Retirement</div>
              <div className="font-semibold text-primary">
                {formatCurrency(scenarioB.portfolio_at_retirement)}
              </div>
            </div>
            <div className="p-2 bg-muted/50 rounded-lg">
              <div className="text-muted-foreground">At Age 90</div>
              <div className="font-semibold text-primary">
                {formatCurrency(scenarioB.legacy_value_at_90)}
              </div>
            </div>
            <div className="p-2 bg-muted/50 rounded-lg">
              <div className="text-muted-foreground">At Age 95</div>
              <div className="font-semibold text-primary">
                {formatCurrency(scenarioB.legacy_value_at_95)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Income Sources Breakdown (Optimized Strategy) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">
            Income Sources Breakdown (Optimized Strategy)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={incomeData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="age" 
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Age', position: 'insideBottomRight', offset: -5 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={formatCurrency}
                  width={70}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="socialSecurity"
                  name="Social Security"
                  stackId="1"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.8}
                />
                <Area
                  type="monotone"
                  dataKey="pension"
                  name="Pension"
                  stackId="1"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.8}
                />
                <Area
                  type="monotone"
                  dataKey="annuityIncome"
                  name="Annuity Income"
                  stackId="1"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.8}
                />
                <Area
                  type="monotone"
                  dataKey="iulLoans"
                  name="IUL Tax-Free Loans"
                  stackId="1"
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.8}
                />
                <Area
                  type="monotone"
                  dataKey="portfolioWithdrawal"
                  name="Portfolio Withdrawal"
                  stackId="1"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0.8}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          {/* Monthly income summary */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
            <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span>SS: {formatCurrency(scenarioB.income_sources.social_security)}/mo</span>
            </div>
            {scenarioB.income_sources.pension > 0 && (
              <div className="flex items-center gap-2 p-2 bg-indigo-50 rounded">
                <div className="w-3 h-3 rounded-full bg-indigo-500" />
                <span>Pension: {formatCurrency(scenarioB.income_sources.pension)}/mo</span>
              </div>
            )}
            {scenarioB.income_sources.annuity_income > 0 && (
              <div className="flex items-center gap-2 p-2 bg-purple-50 rounded">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span>Annuity: {formatCurrency(scenarioB.income_sources.annuity_income)}/mo</span>
              </div>
            )}
            {scenarioB.income_sources.iul_loans > 0 && (
              <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>IUL: {formatCurrency(scenarioB.income_sources.iul_loans)}/mo</span>
              </div>
            )}
            <div className="flex items-center gap-2 p-2 bg-amber-50 rounded">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span>Portfolio: {formatCurrency(scenarioB.income_sources.portfolio_withdrawal)}/mo</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
