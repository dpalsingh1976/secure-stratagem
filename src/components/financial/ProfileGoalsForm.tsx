import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { InfoIcon, Users, Target, Shield, Compass } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { ProfileGoalsData, FilingStatus, PrimaryRetirementGoal } from '@/types/financial';

interface ProfileGoalsFormProps {
  data: ProfileGoalsData;
  onChange: (data: ProfileGoalsData) => void;
  onValidationChange: (isValid: boolean) => void;
}

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const INSURANCE_PRIORITIES = [
  'Income Protection',
  'Family Security',
  'Legacy Planning',
  'Tax Efficiency',
  'Business Continuity',
  'Wealth Transfer',
  'Charitable Giving'
];

export function ProfileGoalsForm({ data, onChange, onValidationChange }: ProfileGoalsFormProps) {
  const handleInputChange = (field: keyof ProfileGoalsData, value: any) => {
    const newData = { ...data, [field]: value };
    onChange(newData);

    // Basic validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = newData.name_first.length > 0 && 
                   newData.name_last.length > 0 && 
                   newData.email.length > 0 &&
                   emailRegex.test(newData.email) &&
                   newData.dob.length > 0 && 
                   newData.state.length > 0;
    onValidationChange(isValid);
  };

  const toggleInsurancePriority = (priority: string) => {
    const newPriorities = data.insurance_priorities.includes(priority)
      ? data.insurance_priorities.filter(p => p !== priority)
      : [...data.insurance_priorities, priority];
    
    handleInputChange('insurance_priorities', newPriorities);
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
      <div className="space-y-8">
        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary" />
              <span>Client Information</span>
            </CardTitle>
            <CardDescription>
              Basic demographic and household information for financial planning analysis.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={data.name_first}
                  onChange={(e) => handleInputChange('name_first', e.target.value)}
                  placeholder="Enter first name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={data.name_last}
                  onChange={(e) => handleInputChange('name_last', e.target.value)}
                  placeholder="Enter last name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={data.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="your.email@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth *</Label>
                <Input
                  id="dob"
                  type="date"
                  value={data.dob}
                  onChange={(e) => handleInputChange('dob', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State of Residence *</Label>
                <Select value={data.state} onValueChange={(value) => handleInputChange('state', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filingStatus">Filing Status</Label>
                <Select 
                  value={data.filing_status} 
                  onValueChange={(value: FilingStatus) => handleInputChange('filing_status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select filing status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="married_joint">Married Filing Joint</SelectItem>
                    <SelectItem value="married_separate">Married Filing Separate</SelectItem>
                    <SelectItem value="head_household">Head of Household</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dependents">Number of Dependents</Label>
                <Input
                  id="dependents"
                  type="number"
                  min="0"
                  max="10"
                  value={data.dependents}
                  onChange={(e) => handleInputChange('dependents', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Retirement Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-primary" />
              <span>Retirement Goals</span>
            </CardTitle>
            <CardDescription>
              Define retirement timeline and income objectives for comprehensive planning.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="retirementAge">Target Retirement Age</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>The age at which you plan to stop working full-time</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="retirementAge"
                  type="number"
                  min="50"
                  max="80"
                  value={data.retirement_age}
                  onChange={(e) => handleInputChange('retirement_age', parseInt(e.target.value) || 65)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="retirementLifestyle">Retirement Lifestyle</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Your expected standard of living in retirement</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select 
                  value={data.retirement_lifestyle || 'comfortable'} 
                  onValueChange={(value: 'basic' | 'comfortable' | 'premium') => handleInputChange('retirement_lifestyle', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select lifestyle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic - Essential needs covered</SelectItem>
                    <SelectItem value="comfortable">Comfortable - Current lifestyle maintained</SelectItem>
                    <SelectItem value="premium">Premium - Enhanced lifestyle with travel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Label>Income Target Method</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>How to calculate your retirement income goal</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select 
                  value={data.spending_target_method || 'fixed'} 
                  onValueChange={(value: 'fixed' | 'percent') => handleInputChange('spending_target_method', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed Monthly Amount</SelectItem>
                    <SelectItem value="percent">Percentage of Current Income</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {data.spending_target_method === 'percent' ? (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Label>Income Replacement %</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoIcon className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>What percentage of current income you need in retirement</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Slider
                      value={[data.spending_percent_of_income || 80]}
                      onValueChange={(value) => handleInputChange('spending_percent_of_income', value[0])}
                      min={50}
                      max={100}
                      step={5}
                      className="flex-1"
                    />
                    <span className="font-semibold text-lg w-16 text-right">{data.spending_percent_of_income || 80}%</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="monthlyIncome">Desired Monthly Income (Today's Dollars)</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoIcon className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>After-tax monthly income needed in retirement, in today's purchasing power</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="monthlyIncome"
                    type="number"
                    min="0"
                    value={data.desired_monthly_income}
                    onChange={(e) => handleInputChange('desired_monthly_income', parseFloat(e.target.value) || 0)}
                    placeholder="Enter monthly income need"
                  />
                  {data.desired_monthly_income > 0 && (
                    <p className="text-sm text-gray-600">
                      Annual need: {formatCurrency(data.desired_monthly_income * 12)}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="retirementState">Planned Retirement State</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>State where you plan to live in retirement (affects tax planning)</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select 
                  value={data.planned_retirement_state || data.state} 
                  onValueChange={(value) => handleInputChange('planned_retirement_state', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Same as current state" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="same">Same as current state</SelectItem>
                    {US_STATES.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>


        {/* Primary Retirement Goal - Radio buttons */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Compass className="h-5 w-5 text-primary" />
              <span>Primary Retirement Goal</span>
            </CardTitle>
            <CardDescription>
              Select your most important retirement objective - this determines savings allocation priorities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup 
              value={data.primary_retirement_goal || 'balanced_growth_protection'} 
              onValueChange={(v: PrimaryRetirementGoal) => handleInputChange('primary_retirement_goal', v)}
              className="space-y-4"
            >
              <div className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                data.primary_retirement_goal === 'maximize_tax_free' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <RadioGroupItem value="maximize_tax_free" id="goal_tax_free" className="mt-1" />
                <div>
                  <Label htmlFor="goal_tax_free" className="font-semibold cursor-pointer">Maximize Tax-Free Retirement Income</Label>
                  <p className="text-sm text-muted-foreground mt-1">Prioritize Roth accounts, HSA, and other tax-free vehicles to minimize retirement tax burden</p>
                </div>
              </div>
              
              <div className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                data.primary_retirement_goal === 'secure_guaranteed_income' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <RadioGroupItem value="secure_guaranteed_income" id="goal_guaranteed" className="mt-1" />
                <div>
                  <Label htmlFor="goal_guaranteed" className="font-semibold cursor-pointer">Secure Guaranteed Lifetime Income</Label>
                  <p className="text-sm text-muted-foreground mt-1">Focus on creating predictable income floor with Social Security optimization and annuities</p>
                </div>
              </div>
              
              <div className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                data.primary_retirement_goal === 'protect_family' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <RadioGroupItem value="protect_family" id="goal_protect" className="mt-1" />
                <div>
                  <Label htmlFor="goal_protect" className="font-semibold cursor-pointer">Protect Family with Life Insurance</Label>
                  <p className="text-sm text-muted-foreground mt-1">Ensure family financial security with adequate life insurance coverage</p>
                </div>
              </div>
              
              <div className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                data.primary_retirement_goal === 'balanced_growth_protection' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <RadioGroupItem value="balanced_growth_protection" id="goal_balanced" className="mt-1" />
                <div>
                  <Label htmlFor="goal_balanced" className="font-semibold cursor-pointer">Balance Growth with Protection</Label>
                  <p className="text-sm text-muted-foreground mt-1">Optimize between growth-oriented investments and protective strategies</p>
                </div>
              </div>
              
              <div className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                data.primary_retirement_goal === 'minimize_taxes' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <RadioGroupItem value="minimize_taxes" id="goal_minimize" className="mt-1" />
                <div>
                  <Label htmlFor="goal_minimize" className="font-semibold cursor-pointer">Minimize Taxes in Retirement</Label>
                  <p className="text-sm text-muted-foreground mt-1">Strategic tax diversification to reduce lifetime tax burden</p>
                </div>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Insurance Priorities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-primary" />
              <span>Insurance Planning Priorities</span>
            </CardTitle>
            <CardDescription>
              Select the insurance objectives that are most important to your client (select all that apply)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {INSURANCE_PRIORITIES.map(priority => (
                <div
                  key={priority}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    data.insurance_priorities.includes(priority)
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleInsurancePriority(priority)}
                >
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={data.insurance_priorities.includes(priority)}
                      onChange={() => toggleInsurancePriority(priority)}
                    />
                    <span className="text-sm font-medium">{priority}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}