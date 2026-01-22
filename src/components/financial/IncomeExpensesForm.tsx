import React, { useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { HelpCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { IncomeExpensesData } from '@/types/financial';

interface IncomeExpensesFormProps {
  data: IncomeExpensesData;
  onChange: (data: IncomeExpensesData) => void;
  onValidationChange: (isValid: boolean) => void;
}

export function IncomeExpensesForm({ data, onChange, onValidationChange }: IncomeExpensesFormProps) {
  const handleInputChange = (field: keyof IncomeExpensesData, value: any) => {
    const newData = { ...data, [field]: value };
    onChange(newData);
    onValidationChange(true);
  };

  // Calculate idle cash (surplus)
  const cashFlowSummary = useMemo(() => {
    const totalIncome = (data.w2_income || 0) + (data.business_income || 0) + (data.rental_income || 0) + (data.social_security || 0);
    const totalExpenses = (data.fixed_expenses || 0) + (data.variable_expenses || 0);
    const idleCash = Math.max(0, totalIncome - totalExpenses);
    return { totalIncome, totalExpenses, idleCash };
  }, [data.w2_income, data.business_income, data.rental_income, data.social_security, data.fixed_expenses, data.variable_expenses]);

  // Auto-update monthly_checking_balance with idle cash
  useEffect(() => {
    if (data.monthly_checking_balance !== cashFlowSummary.idleCash) {
      onChange({ ...data, monthly_checking_balance: cashFlowSummary.idleCash });
    }
  }, [cashFlowSummary.idleCash]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Income Sources</CardTitle>
            <CardDescription>Enter your gross monthly income from all sources</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>W-2 Income</Label>
              <Input type="number" value={data.w2_income} onChange={(e) => handleInputChange('w2_income', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <Label>Business Income</Label>
              <Input type="number" value={data.business_income} onChange={(e) => handleInputChange('business_income', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <Label>Rental Income</Label>
              <Input type="number" value={data.rental_income} onChange={(e) => handleInputChange('rental_income', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <Label>Social Security</Label>
              <Input type="number" value={data.social_security} onChange={(e) => handleInputChange('social_security', parseFloat(e.target.value) || 0)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Expenses</CardTitle>
            <CardDescription>Categorize your monthly spending to help determine your savings capacity</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Essential Fixed Expenses</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="font-medium mb-1">Must-pay bills that stay the same each month:</p>
                    <ul className="text-xs list-disc list-inside space-y-0.5">
                      <li>Mortgage or rent payment</li>
                      <li>Utilities (electric, gas, water)</li>
                      <li>Insurance premiums (health, auto, home)</li>
                      <li>Loan payments (auto, student)</li>
                      <li>Internet, phone, subscriptions</li>
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input 
                type="number" 
                value={data.fixed_expenses} 
                onChange={(e) => handleInputChange('fixed_expenses', parseFloat(e.target.value) || 0)} 
                placeholder="e.g., 3500"
              />
              <p className="text-xs text-muted-foreground">
                Bills you must pay regardless of your budget
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Discretionary Spending</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="font-medium mb-1">Flexible spending you can adjust:</p>
                    <ul className="text-xs list-disc list-inside space-y-0.5">
                      <li>Dining out & takeout</li>
                      <li>Entertainment & hobbies</li>
                      <li>Shopping & clothing</li>
                      <li>Travel & vacations</li>
                      <li>Gifts & personal care</li>
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input 
                type="number" 
                value={data.variable_expenses} 
                onChange={(e) => handleInputChange('variable_expenses', parseFloat(e.target.value) || 0)} 
                placeholder="e.g., 1500"
              />
              <p className="text-xs text-muted-foreground">
                Spending you can reduce if needed
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Cash Flow Summary */}
        <Card className="bg-muted/30 border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Monthly Cash Flow Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total Income</p>
                <p className="text-lg font-semibold text-green-600">{formatCurrency(cashFlowSummary.totalIncome)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total Expenses</p>
                <p className="text-lg font-semibold text-red-600">{formatCurrency(cashFlowSummary.totalExpenses)}</p>
              </div>
              <div className="bg-primary/5 rounded-lg p-2 -m-2">
                <p className="text-xs text-muted-foreground mb-1">Available for Savings</p>
                <p className={`text-xl font-bold ${cashFlowSummary.idleCash > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                  {formatCurrency(cashFlowSummary.idleCash)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {cashFlowSummary.idleCash > 0 ? 'Monthly surplus for investments' : 'No surplus available'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
