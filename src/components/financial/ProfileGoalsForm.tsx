import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { InfoIcon, Users, Target, Shield } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { ProfileGoalsData, FilingStatus } from '@/types/financial';

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
            </div>
          </CardContent>
        </Card>


        {/* Insurance Priorities */}
        <Card>
          <CardHeader>
            <CardTitle>Insurance Planning Priorities</CardTitle>
            <CardDescription>
              Select the insurance objectives that are most important to your client.
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