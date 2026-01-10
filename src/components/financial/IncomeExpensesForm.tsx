import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { HelpCircle, Wallet, RefreshCw } from 'lucide-react';
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

        {/* NEW: Available Cash & Rollover Assets Section */}
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <CardTitle>Available Cash & Rollover Assets</CardTitle>
            </div>
            <CardDescription>
              Identify funds that may be available for optimized allocation strategies
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Idle Cash in Checking */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Idle Cash in Checking (after monthly spending)</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="font-medium mb-1">Unused cash sitting in your checking account:</p>
                    <p className="text-xs">After paying all bills, investments, and spending, how much typically sits unused month-to-month? This could be redirected to wealth-building strategies.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                type="number"
                value={data.monthly_checking_balance || 0}
                onChange={(e) => handleInputChange('monthly_checking_balance', parseFloat(e.target.value) || 0)}
                placeholder="e.g., 5000"
              />
              <p className="text-xs text-muted-foreground">
                Excess cash not needed for emergency fund or near-term expenses
              </p>
            </div>

            {/* Old 401(k) Rollover */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <RefreshCw className="h-5 w-5 text-primary" />
                  <div>
                    <Label className="text-base">Do you have a 401(k) from a previous employer?</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Old 401(k)s may be candidates for rollover optimization
                    </p>
                  </div>
                </div>
                <Switch
                  checked={data.has_old_401k || false}
                  onCheckedChange={(checked) => handleInputChange('has_old_401k', checked)}
                />
              </div>

              {data.has_old_401k && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-primary/30 ml-2">
                  <div className="space-y-2">
                    <Label>Approximate Balance</Label>
                    <Input
                      type="number"
                      value={data.old_401k_balance || 0}
                      onChange={(e) => handleInputChange('old_401k_balance', parseFloat(e.target.value) || 0)}
                      placeholder="e.g., 125000"
                    />
                    <p className="text-xs text-muted-foreground">
                      Total value of your old 401(k)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Previous Employer (optional)</Label>
                    <Input
                      value={data.old_401k_employer_name || ''}
                      onChange={(e) => handleInputChange('old_401k_employer_name', e.target.value)}
                      placeholder="Company name"
                    />
                    <p className="text-xs text-muted-foreground">
                      For your records
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
