import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { InfoIcon, TrendingUp } from 'lucide-react';
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Income Sources</CardTitle>
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
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Fixed Expenses</Label>
              <Input type="number" value={data.fixed_expenses} onChange={(e) => handleInputChange('fixed_expenses', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <Label>Variable Expenses</Label>
              <Input type="number" value={data.variable_expenses} onChange={(e) => handleInputChange('variable_expenses', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <Label>Federal Taxes</Label>
              <Input type="number" value={data.federal_taxes} onChange={(e) => handleInputChange('federal_taxes', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <Label>State Taxes</Label>
              <Input type="number" value={data.state_taxes} onChange={(e) => handleInputChange('state_taxes', parseFloat(e.target.value) || 0)} />
            </div>
          </CardContent>
        </Card>

        {/* Retirement Contributions Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span>Retirement Savings</span>
            </CardTitle>
            <CardDescription>
              Your current retirement contributions and expected income sources
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="annualContribution">Annual Retirement Contribution</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Total annual amount you contribute to 401(k), IRA, etc.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="annualContribution"
                  type="number"
                  min="0"
                  value={data.annual_retirement_contribution || 0}
                  onChange={(e) => handleInputChange('annual_retirement_contribution', parseFloat(e.target.value) || 0)}
                  placeholder="Annual 401k/IRA contributions"
                />
                {data.annual_retirement_contribution > 0 && (
                  <p className="text-sm text-gray-600">
                    Monthly: {formatCurrency(data.annual_retirement_contribution / 12)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Label>Expected Contribution Growth</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Annual increase in your retirement contributions (e.g., with raises)</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex items-center space-x-4">
                  <Slider
                    value={[data.contribution_growth_rate || 2]}
                    onValueChange={(value) => handleInputChange('contribution_growth_rate', value[0])}
                    min={0}
                    max={10}
                    step={0.5}
                    className="flex-1"
                  />
                  <span className="font-semibold text-lg w-16 text-right">{data.contribution_growth_rate || 2}%</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Label>Social Security Confidence</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>How confident are you in your Social Security benefit estimate?</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select 
                  value={data.social_security_confidence || 'medium'} 
                  onValueChange={(value: 'low' | 'medium' | 'high') => handleInputChange('social_security_confidence', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select confidence level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - Haven't checked SSA.gov</SelectItem>
                    <SelectItem value="medium">Medium - Have an estimate</SelectItem>
                    <SelectItem value="high">High - Reviewed SSA statement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="partTimeIncome">Expected Part-Time Retirement Income</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Monthly income from part-time work in retirement (optional)</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="partTimeIncome"
                  type="number"
                  min="0"
                  value={data.expected_part_time_income || 0}
                  onChange={(e) => handleInputChange('expected_part_time_income', parseFloat(e.target.value) || 0)}
                  placeholder="Optional part-time income"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}