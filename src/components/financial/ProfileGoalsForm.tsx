import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { LabelWithHelp } from '@/components/financial/FieldHelp';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users } from 'lucide-react';
import { TooltipProvider } from '@/components/ui/tooltip';
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
                <LabelWithHelp
                  htmlFor="firstName"
                  label="First Name *"
                  help="Your legal first name. It appears on your risk report and on any application we prepare for you."
                />
                <Input
                  id="firstName"
                  value={data.name_first}
                  onChange={(e) => handleInputChange('name_first', e.target.value)}
                  placeholder="Enter first name"
                />
              </div>

              <div className="space-y-2">
                <LabelWithHelp
                  htmlFor="lastName"
                  label="Last Name *"
                  help="Your legal last name, matching your government-issued ID."
                />
                <Input
                  id="lastName"
                  value={data.name_last}
                  onChange={(e) => handleInputChange('name_last', e.target.value)}
                  placeholder="Enter last name"
                />
              </div>

              <div className="space-y-2">
                <LabelWithHelp
                  htmlFor="email"
                  label="Email Address *"
                  help="Where we send your completed risk report. It is also how your advisor identifies your file, so use an address you check."
                />
                <Input
                  id="email"
                  type="email"
                  value={data.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="your.email@example.com"
                />
              </div>

              <div className="space-y-2">
                <LabelWithHelp
                  htmlFor="dob"
                  label="Date of Birth *"
                  help="Your age drives nearly every number in this analysis: years until retirement, life-insurance pricing, Social Security timing, and how long your savings must last."
                />
                <Input
                  id="dob"
                  type="date"
                  value={data.dob}
                  onChange={(e) => handleInputChange('dob', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <LabelWithHelp
                  htmlFor="state"
                  label="State of Residence *"
                  help="State income tax rates and insurance product availability differ by state, so where you live changes both your tax picture and which solutions you qualify for."
                />
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
                <LabelWithHelp
                  htmlFor="dependents"
                  label="Number of Dependents"
                  help="People who rely on your income — children, or anyone else you support. Each dependent adds an education and support cost to your life-insurance need."
                />
                <Input
                  id="dependents"
                  type="number"
                  min="0"
                  max="10"
                  value={data.dependents}
                  onChange={(e) => handleInputChange('dependents', parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <LabelWithHelp
                  htmlFor="maritalStatus"
                  label="Marital Status"
                  help="Sets your tax filing status, which affects tax brackets and retirement contribution limits. Note: this assessment is calculated for you individually — a spouse should complete their own assessment."
                />
                <Select value={data.filing_status} onValueChange={(value: FilingStatus) => handleInputChange('filing_status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select marital status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="married_joint">Married</SelectItem>
                    <SelectItem value="married_separate">Separated / Divorced</SelectItem>
                    <SelectItem value="head_household">Widowed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}