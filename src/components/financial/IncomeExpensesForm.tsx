import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { TooltipProvider } from '@/components/ui/tooltip';
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
      </div>
    </TooltipProvider>
  );
}
