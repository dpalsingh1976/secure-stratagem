import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Shield, Heart, User, Activity } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { InfoIcon } from 'lucide-react';
import type { ProtectionHealthData } from '@/types/financial';

interface ProtectionHealthFormProps {
  data: ProtectionHealthData;
  onChange: (data: ProtectionHealthData) => void;
  onValidationChange: (isValid: boolean) => void;
}

export function ProtectionHealthForm({ data, onChange, onValidationChange }: ProtectionHealthFormProps) {
  const handleInputChange = (field: keyof ProtectionHealthData, value: any) => {
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

  const calculateAnnualPremium = (coverage: number, age: number = 40): number => {
    // Simplified term life premium calculation
    const baseRate = 1.5; // per $1000 of coverage
    const ageMultiplier = 1 + (age - 30) * 0.05;
    return (coverage / 1000) * baseRate * ageMultiplier;
  };

  return (
    <TooltipProvider>
      <div className="space-y-8">
        {/* Life Insurance Coverage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-primary" />
              <span>Life Insurance Coverage</span>
            </CardTitle>
            <CardDescription>
              Current life insurance policies and coverage amounts for financial protection analysis.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Term Life Insurance</h4>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="termCoverage">Death Benefit Amount</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoIcon className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Total death benefit from all term life insurance policies</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="termCoverage"
                    type="number"
                    min="0"
                    value={data.term_life_coverage}
                    onChange={(e) => handleInputChange('term_life_coverage', parseFloat(e.target.value) || 0)}
                    placeholder="Enter death benefit amount"
                  />
                  {data.term_life_coverage > 0 && (
                    <div className="text-sm text-gray-600">
                      Estimated annual premium: {formatCurrency(calculateAnnualPremium(data.term_life_coverage))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="termYears">Years Remaining</Label>
                  <Select 
                    value={data.term_life_years?.toString() || ''} 
                    onValueChange={(value) => handleInputChange('term_life_years', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select term length" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 Years</SelectItem>
                      <SelectItem value="10">10 Years</SelectItem>
                      <SelectItem value="15">15 Years</SelectItem>
                      <SelectItem value="20">20 Years</SelectItem>
                      <SelectItem value="30">30 Years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Permanent Life Insurance</h4>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="permanentDB">Death Benefit</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoIcon className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Death benefit from whole life, universal life, or IUL policies</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="permanentDB"
                    type="number"
                    min="0"
                    value={data.permanent_life_db}
                    onChange={(e) => handleInputChange('permanent_life_db', parseFloat(e.target.value) || 0)}
                    placeholder="Enter death benefit amount"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="permanentCV">Cash Value</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoIcon className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Current cash surrender value available for loans or withdrawals</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="permanentCV"
                    type="number"
                    min="0"
                    value={data.permanent_life_cv}
                    onChange={(e) => handleInputChange('permanent_life_cv', parseFloat(e.target.value) || 0)}
                    placeholder="Enter cash value amount"
                  />
                </div>
              </div>
            </div>

            {/* Coverage Summary */}
            {(data.term_life_coverage > 0 || data.permanent_life_db > 0) && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-blue-900">Total Life Insurance Coverage</h4>
                    <p className="text-blue-700">
                      {formatCurrency(data.term_life_coverage + data.permanent_life_db)}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-blue-100">
                    {data.permanent_life_cv > 0 ? `${formatCurrency(data.permanent_life_cv)} Cash Value` : 'Term Only'}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Disability Insurance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5 text-primary" />
              <span>Disability Insurance</span>
            </CardTitle>
            <CardDescription>
              Income protection in case of inability to work due to disability.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="disabilityCoverage">Coverage Type</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Own occupation vs any occupation coverage</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select 
                  value={data.disability_coverage?.toString() || ''} 
                  onValueChange={(value) => handleInputChange('disability_coverage', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select coverage type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No Coverage</SelectItem>
                    <SelectItem value="1">Own Occupation</SelectItem>
                    <SelectItem value="2">Any Occupation</SelectItem>
                    <SelectItem value="3">Modified Own Occupation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="disabilityBenefit">Monthly Benefit</Label>
                <Input
                  id="disabilityBenefit"
                  type="number"
                  min="0"
                  value={data.disability_benefit}
                  onChange={(e) => handleInputChange('disability_benefit', parseFloat(e.target.value) || 0)}
                  placeholder="Enter monthly benefit amount"
                />
                {data.disability_benefit > 0 && (
                  <div className="text-sm text-gray-600">
                    Annual benefit: {formatCurrency(data.disability_benefit * 12)}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Long-Term Care Insurance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Heart className="h-5 w-5 text-primary" />
              <span>Long-Term Care Insurance</span>
            </CardTitle>
            <CardDescription>
              Coverage for long-term care services including nursing home, assisted living, and home care.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="ltcDailyBenefit">Daily Benefit Amount</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Maximum daily benefit payable for qualified LTC services</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="ltcDailyBenefit"
                  type="number"
                  min="0"
                  value={data.ltc_daily_benefit}
                  onChange={(e) => handleInputChange('ltc_daily_benefit', parseFloat(e.target.value) || 0)}
                  placeholder="Enter daily benefit amount"
                />
                {data.ltc_daily_benefit > 0 && (
                  <div className="text-sm text-gray-600">
                    Monthly benefit: {formatCurrency(data.ltc_daily_benefit * 30)}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ltcBenefitPeriod">Benefit Period (Years)</Label>
                <Select 
                  value={data.ltc_benefit_period?.toString() || ''} 
                  onValueChange={(value) => handleInputChange('ltc_benefit_period', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select benefit period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No Coverage</SelectItem>
                    <SelectItem value="2">2 Years</SelectItem>
                    <SelectItem value="3">3 Years</SelectItem>
                    <SelectItem value="5">5 Years</SelectItem>
                    <SelectItem value="10">10 Years</SelectItem>
                    <SelectItem value="999">Lifetime</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {data.ltc_daily_benefit > 0 && data.ltc_benefit_period > 0 && (
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-semibold text-purple-900">Total LTC Benefit Pool</h4>
                <p className="text-purple-700">
                  {data.ltc_benefit_period === 999 
                    ? 'Lifetime Coverage' 
                    : formatCurrency(data.ltc_daily_benefit * 365 * data.ltc_benefit_period)
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Emergency Fund */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-primary" />
              <span>Emergency Fund</span>
            </CardTitle>
            <CardDescription>
              Liquid funds available for unexpected expenses and financial emergencies.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="emergencyFund">Current Emergency Fund (Months of Expenses)</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>How many months of living expenses you have in readily accessible savings</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="emergencyFund"
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={data.emergency_fund_months}
                  onChange={(e) => handleInputChange('emergency_fund_months', parseFloat(e.target.value) || 0)}
                  placeholder="Enter months of expenses"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className={`p-4 rounded-lg text-center ${data.emergency_fund_months >= 6 ? 'bg-green-100' : 'bg-red-100'}`}>
                  <div className="font-semibold text-sm">Recommended</div>
                  <div className="text-2xl font-bold">3-6</div>
                  <div className="text-xs">months</div>
                </div>
                <div className={`p-4 rounded-lg text-center ${data.emergency_fund_months >= 9 ? 'bg-green-100' : 'bg-yellow-100'}`}>
                  <div className="font-semibold text-sm">Conservative</div>
                  <div className="text-2xl font-bold">6-12</div>
                  <div className="text-xs">months</div>
                </div>
                <div className={`p-4 rounded-lg text-center ${data.emergency_fund_months >= 12 ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <div className="font-semibold text-sm">Ultra Safe</div>
                  <div className="text-2xl font-bold">12+</div>
                  <div className="text-xs">months</div>
                </div>
              </div>

              {data.emergency_fund_months > 0 && (
                <div className={`p-4 rounded-lg ${
                  data.emergency_fund_months >= 6 ? 'bg-green-50' : 
                  data.emergency_fund_months >= 3 ? 'bg-yellow-50' : 'bg-red-50'
                }`}>
                  <div className={`font-semibold ${
                    data.emergency_fund_months >= 6 ? 'text-green-800' : 
                    data.emergency_fund_months >= 3 ? 'text-yellow-800' : 'text-red-800'
                  }`}>
                    Emergency Fund Status: {
                      data.emergency_fund_months >= 6 ? 'Adequate' : 
                      data.emergency_fund_months >= 3 ? 'Minimal' : 'Insufficient'
                    }
                  </div>
                  <div className="text-sm mt-1 text-gray-600">
                    {data.emergency_fund_months < 3 
                      ? 'Consider building emergency fund to at least 3 months of expenses'
                      : data.emergency_fund_months < 6 
                      ? 'Good start! Consider expanding to 6+ months for better security'
                      : 'Excellent emergency fund coverage'
                    }
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