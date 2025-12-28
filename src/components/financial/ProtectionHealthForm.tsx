import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, Heart, User, Activity, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { InfoIcon } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { ProtectionHealthData, PlanningReadinessData } from '@/types/financial';

interface ProtectionHealthFormProps {
  data: ProtectionHealthData;
  planningReadiness: PlanningReadinessData;
  onChange: (data: ProtectionHealthData) => void;
  onPlanningReadinessChange: (data: PlanningReadinessData) => void;
  onValidationChange: (isValid: boolean) => void;
  hasEmployerMatch?: boolean;
}

export function ProtectionHealthForm({ 
  data, 
  planningReadiness,
  onChange, 
  onPlanningReadinessChange,
  onValidationChange,
  hasEmployerMatch = false
}: ProtectionHealthFormProps) {
  const [isIULSectionOpen, setIsIULSectionOpen] = React.useState(true);

  const handleInputChange = (field: keyof ProtectionHealthData, value: any) => {
    const newData = { ...data, [field]: value };
    onChange(newData);
    onValidationChange(true);
  };

  const handleReadinessChange = (field: keyof PlanningReadinessData, value: any) => {
    const newData = { ...planningReadiness, [field]: value };
    onPlanningReadinessChange(newData);
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

        {/* Retirement Suitability Questions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5 text-primary" />
              <span>Retirement Planning Preferences</span>
            </CardTitle>
            <CardDescription>
              Help us understand your preferences for retirement planning solutions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleInputChange('prefers_guaranteed_income', !data.prefers_guaranteed_income)}>
                  <Checkbox
                    checked={data.prefers_guaranteed_income || false}
                    onCheckedChange={(checked) => handleInputChange('prefers_guaranteed_income', checked)}
                  />
                  <div>
                    <Label className="cursor-pointer font-medium">I prefer guaranteed lifetime income</Label>
                    <p className="text-sm text-gray-500 mt-1">
                      Would you value having income you can't outlive, even if it means potentially lower total returns?
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleInputChange('can_commit_10yr_contributions', !data.can_commit_10yr_contributions)}>
                  <Checkbox
                    checked={data.can_commit_10yr_contributions || false}
                    onCheckedChange={(checked) => handleInputChange('can_commit_10yr_contributions', checked)}
                  />
                  <div>
                    <Label className="cursor-pointer font-medium">I can commit to 10+ years of contributions</Label>
                    <p className="text-sm text-gray-500 mt-1">
                      Are you able to make consistent contributions for at least 10 years?
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleInputChange('open_to_tax_diversification', !data.open_to_tax_diversification)}>
                  <Checkbox
                    checked={data.open_to_tax_diversification || false}
                    onCheckedChange={(checked) => handleInputChange('open_to_tax_diversification', checked)}
                  />
                  <div>
                    <Label className="cursor-pointer font-medium">I'm interested in tax diversification</Label>
                    <p className="text-sm text-gray-500 mt-1">
                      Would you like to explore tax-free retirement income strategies?
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Label>Liquidity Needs (Next 3-5 Years)</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoIcon className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>How likely are you to need access to large sums of money soon?</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select 
                    value={data.liquidity_need_next_5yr || 'medium'} 
                    onValueChange={(value: 'low' | 'medium' | 'high') => handleInputChange('liquidity_need_next_5yr', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select liquidity need" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low - No major expenses expected</SelectItem>
                      <SelectItem value="medium">Medium - Some planned expenses</SelectItem>
                      <SelectItem value="high">High - Major purchase or expense coming</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Suitability Summary */}
                <div className={`p-4 rounded-lg ${
                  data.can_commit_10yr_contributions && data.open_to_tax_diversification && data.liquidity_need_next_5yr !== 'high'
                    ? 'bg-green-50 border-2 border-green-200'
                    : data.prefers_guaranteed_income
                    ? 'bg-blue-50 border-2 border-blue-200'
                    : 'bg-gray-50 border-2 border-gray-200'
                }`}>
                  <h4 className="font-semibold mb-2">
                    {data.can_commit_10yr_contributions && data.open_to_tax_diversification && data.liquidity_need_next_5yr !== 'high'
                      ? '✓ Good fit for tax-advantaged strategies'
                      : data.prefers_guaranteed_income
                      ? '✓ May benefit from guaranteed income solutions'
                      : 'We\'ll find the right fit for you'}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Your answers help us recommend appropriate retirement planning strategies.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* IUL & Long-Term Strategy Suitability Section */}
        <Card className="border-2 border-primary/20">
          <Collapsible open={isIULSectionOpen} onOpenChange={setIsIULSectionOpen}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <span>IUL & Long-Term Strategy Suitability</span>
                  </div>
                  <Badge variant="outline" className="ml-2">
                    {isIULSectionOpen ? 'Click to collapse' : 'Click to expand'}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Help us determine if Indexed Universal Life or other long-term strategies are right for you
                </CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-6">
                {/* Section A: Income Stability & Commitment */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">A</span>
                    Income & Funding Commitment
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>How stable is your income?</Label>
                      <Select 
                        value={planningReadiness.income_stability} 
                        onValueChange={(value: 'stable' | 'somewhat_stable' | 'unstable') => handleReadinessChange('income_stability', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="stable">Stable - Predictable income</SelectItem>
                          <SelectItem value="somewhat_stable">Somewhat Stable - Minor fluctuations</SelectItem>
                          <SelectItem value="unstable">Unstable - Variable or uncertain</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>How long can you commit to funding?</Label>
                      <Select 
                        value={planningReadiness.funding_commitment_years} 
                        onValueChange={(value: '3-5' | '5-10' | '10-20' | '20+') => handleReadinessChange('funding_commitment_years', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3-5">3-5 years</SelectItem>
                          <SelectItem value="5-10">5-10 years</SelectItem>
                          <SelectItem value="10-20">10-20 years</SelectItem>
                          <SelectItem value="20+">20+ years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Confidence in consistent funding?</Label>
                      <Select 
                        value={planningReadiness.funding_discipline} 
                        onValueChange={(value: 'high' | 'medium' | 'low') => handleReadinessChange('funding_discipline', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High - Very confident</SelectItem>
                          <SelectItem value="medium">Medium - Mostly confident</SelectItem>
                          <SelectItem value="low">Low - Uncertain</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Section B: Liquidity & Short-term Needs */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">B</span>
                    Liquidity & Near-Term Needs
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Major expense expected in next 3-5 years?</Label>
                      <Select 
                        value={planningReadiness.near_term_liquidity_need} 
                        onValueChange={(value: 'low' | 'medium' | 'high') => handleReadinessChange('near_term_liquidity_need', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low - No major expenses planned</SelectItem>
                          <SelectItem value="medium">Medium - Some planned expenses</SelectItem>
                          <SelectItem value="high">High - Major purchase coming (home, education, etc.)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Do debt payments feel like pressure?</Label>
                      <Select 
                        value={planningReadiness.debt_pressure_level} 
                        onValueChange={(value: 'low' | 'medium' | 'high') => handleReadinessChange('debt_pressure_level', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low - Manageable</SelectItem>
                          <SelectItem value="medium">Medium - Some pressure</SelectItem>
                          <SelectItem value="high">High - Significant pressure</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Section C: Retirement Basics */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">C</span>
                    Retirement Savings Foundations
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleReadinessChange('contributing_to_401k_match', !planningReadiness.contributing_to_401k_match)}>
                      <Checkbox
                        checked={planningReadiness.contributing_to_401k_match}
                        onCheckedChange={(checked) => handleReadinessChange('contributing_to_401k_match', checked)}
                      />
                      <div>
                        <Label className="cursor-pointer font-medium">Getting employer 401(k) match</Label>
                        <p className="text-sm text-gray-500 mt-1">
                          {hasEmployerMatch ? 'Contributing enough to get full employer match' : 'Check if applicable'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Maxing qualified plans (401k/IRA/Roth)?</Label>
                      <Select 
                        value={planningReadiness.maxing_qualified_plans} 
                        onValueChange={(value: 'no' | 'some' | 'yes' | 'not_applicable') => handleReadinessChange('maxing_qualified_plans', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no">No - Not maxing any</SelectItem>
                          <SelectItem value="some">Some - Maxing 1-2 accounts</SelectItem>
                          <SelectItem value="yes">Yes - Maxing all available</SelectItem>
                          <SelectItem value="not_applicable">N/A - Self-employed or no access</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Section D: Tax Concerns */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">D</span>
                    Tax Diversification
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Estimated tax bracket</Label>
                      <Select 
                        value={planningReadiness.current_tax_bracket} 
                        onValueChange={(value: '10-12' | '22' | '24' | '32' | '35+' | 'not_sure') => handleReadinessChange('current_tax_bracket', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10-12">10-12%</SelectItem>
                          <SelectItem value="22">22%</SelectItem>
                          <SelectItem value="24">24%</SelectItem>
                          <SelectItem value="32">32%</SelectItem>
                          <SelectItem value="35+">35%+</SelectItem>
                          <SelectItem value="not_sure">Not sure</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Concern about taxes in retirement?</Label>
                      <Select 
                        value={planningReadiness.tax_concern_level} 
                        onValueChange={(value: 'low' | 'medium' | 'high') => handleReadinessChange('tax_concern_level', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low - Not a priority</SelectItem>
                          <SelectItem value="medium">Medium - Somewhat concerned</SelectItem>
                          <SelectItem value="high">High - Major concern</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleReadinessChange('wants_tax_free_bucket', !planningReadiness.wants_tax_free_bucket)}>
                      <Checkbox
                        checked={planningReadiness.wants_tax_free_bucket}
                        onCheckedChange={(checked) => handleReadinessChange('wants_tax_free_bucket', checked)}
                      />
                      <div>
                        <Label className="cursor-pointer font-medium">Want tax-free income option</Label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section E & F: Risk & Legacy */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">E</span>
                    Risk Concerns & Legacy Goals
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Worried about retiring in a downturn?</Label>
                      <Select 
                        value={planningReadiness.sequence_risk_concern} 
                        onValueChange={(value: 'low' | 'medium' | 'high') => handleReadinessChange('sequence_risk_concern', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low - Not concerned</SelectItem>
                          <SelectItem value="medium">Medium - Somewhat concerned</SelectItem>
                          <SelectItem value="high">High - Very concerned</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Importance of leaving inheritance?</Label>
                      <Select 
                        value={planningReadiness.legacy_priority} 
                        onValueChange={(value: 'low' | 'medium' | 'high') => handleReadinessChange('legacy_priority', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low - Not a priority</SelectItem>
                          <SelectItem value="medium">Medium - Would be nice</SelectItem>
                          <SelectItem value="high">High - Very important</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleReadinessChange('permanent_coverage_need', !planningReadiness.permanent_coverage_need)}>
                      <Checkbox
                        checked={planningReadiness.permanent_coverage_need}
                        onCheckedChange={(checked) => handleReadinessChange('permanent_coverage_need', checked)}
                      />
                      <div>
                        <Label className="cursor-pointer font-medium">Want lifelong life insurance</Label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Suitability Indicator */}
                <div className={`p-4 rounded-lg border-2 ${
                  planningReadiness.income_stability === 'stable' && 
                  ['10-20', '20+'].includes(planningReadiness.funding_commitment_years) &&
                  planningReadiness.near_term_liquidity_need !== 'high' &&
                  data.emergency_fund_months >= 6
                    ? 'bg-green-50 border-green-300'
                    : planningReadiness.income_stability === 'unstable' ||
                      planningReadiness.funding_commitment_years === '3-5' ||
                      data.emergency_fund_months < 3
                    ? 'bg-red-50 border-red-300'
                    : 'bg-yellow-50 border-yellow-300'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {planningReadiness.income_stability === 'stable' && 
                     ['10-20', '20+'].includes(planningReadiness.funding_commitment_years) &&
                     planningReadiness.near_term_liquidity_need !== 'high' &&
                     data.emergency_fund_months >= 6 ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : planningReadiness.income_stability === 'unstable' ||
                        planningReadiness.funding_commitment_years === '3-5' ||
                        data.emergency_fund_months < 3 ? (
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    )}
                    <h4 className="font-semibold">
                      {planningReadiness.income_stability === 'stable' && 
                       ['10-20', '20+'].includes(planningReadiness.funding_commitment_years) &&
                       planningReadiness.near_term_liquidity_need !== 'high' &&
                       data.emergency_fund_months >= 6
                        ? 'Strong foundation for IUL consideration'
                        : planningReadiness.income_stability === 'unstable' ||
                          planningReadiness.funding_commitment_years === '3-5' ||
                          data.emergency_fund_months < 3
                        ? 'Fundamentals need attention first'
                        : 'May be suitable with some considerations'}
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Your full IUL suitability analysis will be shown in the report.
                  </p>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      </div>
    </TooltipProvider>
  );
}