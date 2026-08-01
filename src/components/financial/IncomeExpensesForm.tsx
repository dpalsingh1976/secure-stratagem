import React, { useMemo, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { HelpCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LabelWithHelp } from '@/components/financial/FieldHelp';
import type { IncomeExpensesData, ExpenseDetail, FilingStatus } from '@/types/financial';

const FIXED_ITEMS: { key: keyof ExpenseDetail; label: string; help: string; placeholder: string }[] = [
  { key: 'mortgage_rent', label: 'Mortgage / Rent', help: 'Your total monthly housing payment — principal and interest on your mortgage, or rent if you rent. Include HOA dues here if they are part of your regular payment.', placeholder: 'e.g., 2200' },
  { key: 'property_tax_home_insurance', label: 'Property Taxes & Home Insurance', help: 'Monthly cost of property taxes and homeowners or renters insurance. If they are escrowed inside your mortgage payment, leave this at 0 so you do not double count.', placeholder: 'e.g., 450' },
  { key: 'utilities', label: 'Utilities', help: 'Electricity, gas, water, sewer, and trash. Use a 12-month average so summer and winter swings even out.', placeholder: 'e.g., 300' },
  { key: 'auto_loans', label: 'Auto Loan / Lease Payments', help: 'Total monthly payments on all vehicles you finance or lease.', placeholder: 'e.g., 500' },
  { key: 'student_loans', label: 'Student Loan Payments', help: 'Monthly required payments on federal and private student loans, for you and any loans you co-signed and pay.', placeholder: 'e.g., 250' },
  { key: 'credit_cards_other_loans', label: 'Credit Cards & Other Loan Payments', help: 'Monthly amount you actually pay toward credit cards, personal loans, and lines of credit. Enter your typical payment, not the balance.', placeholder: 'e.g., 300' },
  { key: 'insurance_premiums', label: 'Insurance Premiums', help: 'Health, dental, auto, life, and disability premiums you pay each month, including amounts deducted from your paycheck if they were not already removed from your take-home pay.', placeholder: 'e.g., 400' },
  { key: 'childcare_tuition', label: 'Childcare & Tuition', help: 'Daycare, after-school care, nanny costs, and school or college tuition paid monthly.', placeholder: 'e.g., 800' },
  { key: 'phone_internet_subscriptions', label: 'Phone, Internet & Subscriptions', help: 'Mobile plans, home internet, streaming services, software, and recurring memberships such as a gym.', placeholder: 'e.g., 250' },
  { key: 'other_essential', label: 'Other Essential', help: 'Any other must-pay monthly cost that does not fit the categories above — alimony, child support, medical payment plans, storage, and similar.', placeholder: 'e.g., 0' },
];

const VARIABLE_ITEMS: { key: keyof ExpenseDetail; label: string; help: string; placeholder: string }[] = [
  { key: 'groceries_household', label: 'Groceries & Household', help: 'Food you buy for home, cleaning products, toiletries, and other household supplies.', placeholder: 'e.g., 700' },
  { key: 'dining_entertainment', label: 'Dining Out & Entertainment', help: 'Restaurants, takeout, coffee, bars, movies, events, and hobbies.', placeholder: 'e.g., 400' },
  { key: 'shopping_clothing', label: 'Shopping & Clothing', help: 'Clothing, shoes, electronics, home goods, and general non-essential purchases.', placeholder: 'e.g., 200' },
  { key: 'travel_vacations', label: 'Travel & Vacations', help: 'Take your typical yearly travel spending and divide by 12 so it shows up as a monthly amount.', placeholder: 'e.g., 250' },
  { key: 'gifts_giving_personal_care', label: 'Gifts, Giving & Personal Care', help: 'Gifts, charitable giving and tithing, haircuts, grooming, and other personal care.', placeholder: 'e.g., 150' },
  { key: 'other_discretionary', label: 'Other Discretionary', help: 'Any other flexible spending you could cut back on if your income dropped.', placeholder: 'e.g., 0' },
];


interface IncomeExpensesFormProps {
  data: IncomeExpensesData;
  onChange: (data: IncomeExpensesData) => void;
  onValidationChange: (isValid: boolean) => void;
  filingStatus?: FilingStatus;
}

export function IncomeExpensesForm({ data, onChange, onValidationChange, filingStatus }: IncomeExpensesFormProps) {


  const detail = data.expense_detail ?? {};
  const detailed = !!data.use_detailed_expenses;

  const handleInputChange = (field: keyof IncomeExpensesData, value: any) => {
    const newData = { ...data, [field]: value };
    onChange(newData);
    onValidationChange(true);
  };

  const sumItems = (items: { key: keyof ExpenseDetail }[], d: ExpenseDetail) =>
    items.reduce((sum, i) => sum + (Number(d[i.key]) || 0), 0);

  const fixedSubtotal = useMemo(() => sumItems(FIXED_ITEMS, detail), [data.expense_detail]);
  const variableSubtotal = useMemo(() => sumItems(VARIABLE_ITEMS, detail), [data.expense_detail]);

  const handleDetailChange = (field: keyof ExpenseDetail, value: number) => {
    const nextDetail = { ...detail, [field]: value };
    onChange({
      ...data,
      expense_detail: nextDetail,
      fixed_expenses: sumItems(FIXED_ITEMS, nextDetail),
      variable_expenses: sumItems(VARIABLE_ITEMS, nextDetail),
    });
    onValidationChange(true);
  };

  const toggleDetailed = (on: boolean) => {
    if (on) {
      onChange({
        ...data,
        use_detailed_expenses: true,
        expense_detail: detail,
        fixed_expenses: sumItems(FIXED_ITEMS, detail),
        variable_expenses: sumItems(VARIABLE_ITEMS, detail),
      });
    } else {
      onChange({ ...data, use_detailed_expenses: false });
    }
    onValidationChange(true);
  };


  // Income and expenses are both MONTHLY. W-2 amounts are after-tax take-home.
  // Income is per-individual — spouse income is not combined here.
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
            <CardDescription>Enter your <strong>monthly</strong> income. W-2 income should be <strong>after tax</strong> (net take-home pay)</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <LabelWithHelp
                label="Monthly W-2 Income (after tax / take-home)"
                help="The amount that actually lands in your bank account each month from your job — after federal and state taxes, Social Security, Medicare, and payroll deductions. Do not enter your gross salary. If you are paid every two weeks, multiply one paycheck by 26 and divide by 12."
              />
              <Input type="number" placeholder="e.g., 7500" value={data.w2_income} onChange={(e) => handleInputChange('w2_income', parseFloat(e.target.value) || 0)} />
              <p className="text-xs text-muted-foreground mt-1">Enter your net take-home pay after taxes and payroll deductions.</p>
            </div>
            <div>
              <LabelWithHelp
                label="Business Income (Monthly)"
                help="Average monthly profit you take home from self-employment, a side business, or a partnership — after business expenses and estimated taxes. Enter 0 if this does not apply."
              />
              <Input type="number" placeholder="e.g., 0" value={data.business_income} onChange={(e) => handleInputChange('business_income', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <LabelWithHelp
                label="Rental Income (Monthly)"
                help="Net rent you collect each month from investment property, after the mortgage, taxes, insurance, and upkeep on that property. Enter 0 if you own no rentals."
              />
              <Input type="number" placeholder="e.g., 0" value={data.rental_income} onChange={(e) => handleInputChange('rental_income', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <LabelWithHelp
                label="Social Security (Monthly)"
                help="Social Security, pension, disability, or annuity payments you already receive each month. Leave at 0 if you have not started collecting yet — future benefits are projected separately."
              />
              <Input type="number" placeholder="e.g., 0" value={data.social_security} onChange={(e) => handleInputChange('social_security', parseFloat(e.target.value) || 0)} />
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
