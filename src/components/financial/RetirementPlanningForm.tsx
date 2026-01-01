import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  InfoIcon, 
  Target, 
  TrendingUp, 
  DollarSign, 
  Shield, 
  Compass,
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import type { 
  ProfileGoalsData, 
  IncomeExpensesData, 
  ProtectionHealthData, 
  PlanningReadinessData,
  PrimaryRetirementGoal 
} from '@/types/financial';

interface RetirementPlanningFormProps {
  profileData: ProfileGoalsData;
  incomeData: IncomeExpensesData;
  protectionData: ProtectionHealthData;
  planningReadiness: PlanningReadinessData;
  onProfileChange: (data: ProfileGoalsData) => void;
  onIncomeChange: (data: IncomeExpensesData) => void;
  onProtectionChange: (data: ProtectionHealthData) => void;
  onPlanningReadinessChange: (data: PlanningReadinessData) => void;
  hasEmployerMatch?: boolean;
}

export function RetirementPlanningForm({
  profileData,
  incomeData,
  protectionData,
  planningReadiness,
  onProfileChange,
  onIncomeChange,
  onProtectionChange,
  onPlanningReadinessChange,
  hasEmployerMatch = false
}: RetirementPlanningFormProps) {

  const handleProfileChange = (field: keyof ProfileGoalsData, value: any) => {
    onProfileChange({ ...profileData, [field]: value });
  };

  const handleIncomeChange = (field: keyof IncomeExpensesData, value: any) => {
    onIncomeChange({ ...incomeData, [field]: value });
  };

  const handleProtectionChange = (field: keyof ProtectionHealthData, value: any) => {
    onProtectionChange({ ...protectionData, [field]: value });
  };

  const handleReadinessChange = (field: keyof PlanningReadinessData, value: any) => {
    onPlanningReadinessChange({ ...planningReadiness, [field]: value });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Compute preliminary suitability for real-time preview
  const suitabilityPreview = useMemo(() => {
    const emergencyFundMonths = protectionData.emergency_fund_months || 0;
    
    // IUL Suitability Preview
    const iulDisqualifiers: string[] = [];
    const iulPositives: string[] = [];
    
    if (planningReadiness.income_stability === 'unstable') {
      iulDisqualifiers.push('Income instability');
    }
    if (planningReadiness.near_term_liquidity_need === 'high') {
      iulDisqualifiers.push('High near-term liquidity needs');
    }
    if (emergencyFundMonths < 3) {
      iulDisqualifiers.push('Insufficient emergency fund');
    }
    if (planningReadiness.funding_commitment_years === '3-5') {
      iulDisqualifiers.push('Short funding commitment');
    }
    if (planningReadiness.debt_pressure_level === 'high' && emergencyFundMonths < 6) {
      iulDisqualifiers.push('High debt pressure with low reserves');
    }

    if (planningReadiness.income_stability === 'stable') {
      iulPositives.push('Stable income');
    }
    if (['10-20', '20+'].includes(planningReadiness.funding_commitment_years)) {
      iulPositives.push('Long-term commitment');
    }
    if (planningReadiness.tax_concern_level === 'high' || planningReadiness.wants_tax_free_bucket) {
      iulPositives.push('Tax diversification interest');
    }
    if (emergencyFundMonths >= 6) {
      iulPositives.push('Strong emergency fund');
    }
    if (planningReadiness.legacy_priority === 'high' || planningReadiness.permanent_coverage_need) {
      iulPositives.push('Legacy/permanent coverage goals');
    }

    const iulFit = iulDisqualifiers.length > 0 
      ? 'not_recommended' 
      : iulPositives.length >= 3 
        ? 'strong' 
        : iulPositives.length >= 2 
          ? 'moderate' 
          : 'weak';

    // Annuity Suitability Preview
    const annuityPositives: string[] = [];
    const annuityNegatives: string[] = [];

    if (protectionData.prefers_guaranteed_income) {
      annuityPositives.push('Prefers guaranteed income');
    }
    if (planningReadiness.sequence_risk_concern === 'high') {
      annuityPositives.push('Sequence risk concerns');
    }
    if (profileData.primary_retirement_goal === 'secure_guaranteed_income') {
      annuityPositives.push('Goal: guaranteed income');
    }
    if (planningReadiness.near_term_liquidity_need === 'high') {
      annuityNegatives.push('High liquidity needs');
    }
    if (emergencyFundMonths < 3) {
      annuityNegatives.push('Low emergency fund');
    }

    const annuityFit = annuityNegatives.length >= 2 
      ? 'not_recommended' 
      : annuityPositives.length >= 2 
        ? 'strong' 
        : annuityPositives.length >= 1 
          ? 'moderate' 
          : 'neutral';

    return {
      iul: {
        fit: iulFit,
        positives: iulPositives,
        negatives: iulDisqualifiers,
        reason: iulDisqualifiers.length > 0 
          ? `Address: ${iulDisqualifiers.slice(0, 2).join(', ')}`
          : iulPositives.length > 0 
            ? `Strengths: ${iulPositives.slice(0, 2).join(', ')}`
            : 'Complete more questions for assessment'
      },
      annuity: {
        fit: annuityFit,
        positives: annuityPositives,
        negatives: annuityNegatives,
        reason: annuityNegatives.length >= 2
          ? `Address: ${annuityNegatives.slice(0, 2).join(', ')}`
          : annuityPositives.length > 0
            ? `Strengths: ${annuityPositives.slice(0, 2).join(', ')}`
            : 'May benefit from guaranteed income analysis'
      }
    };
  }, [profileData, protectionData, planningReadiness]);

  const getFitBadgeColor = (fit: string) => {
    switch (fit) {
      case 'strong': return 'bg-green-100 text-green-800 border-green-300';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'weak': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'not_recommended': return 'bg-red-100 text-red-800 border-red-300';
      case 'neutral': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getFitIcon = (fit: string) => {
    switch (fit) {
      case 'strong': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'moderate': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'weak': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'not_recommended': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-8">
        {/* Section 1: Primary Retirement Goal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Compass className="h-5 w-5 text-primary" />
              <span>Primary Retirement Goal</span>
            </CardTitle>
            <CardDescription>
              Select your most important retirement objective - this drives savings allocation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup 
              value={profileData.primary_retirement_goal || 'balanced_growth_protection'} 
              onValueChange={(v: PrimaryRetirementGoal) => handleProfileChange('primary_retirement_goal', v)}
              className="space-y-3"
            >
              <div className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                profileData.primary_retirement_goal === 'maximize_tax_free' ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/30'
              }`}>
                <RadioGroupItem value="maximize_tax_free" id="goal_tax_free" className="mt-1" />
                <div>
                  <Label htmlFor="goal_tax_free" className="font-semibold cursor-pointer">Maximize Tax-Free Retirement Income</Label>
                  <p className="text-sm text-muted-foreground mt-1">Prioritize Roth accounts, HSA, and other tax-free vehicles</p>
                </div>
              </div>
              
              <div className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                profileData.primary_retirement_goal === 'secure_guaranteed_income' ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/30'
              }`}>
                <RadioGroupItem value="secure_guaranteed_income" id="goal_guaranteed" className="mt-1" />
                <div>
                  <Label htmlFor="goal_guaranteed" className="font-semibold cursor-pointer">Secure Guaranteed Lifetime Income</Label>
                  <p className="text-sm text-muted-foreground mt-1">Focus on predictable income with Social Security optimization and annuities</p>
                </div>
              </div>
              
              <div className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                profileData.primary_retirement_goal === 'protect_family' ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/30'
              }`}>
                <RadioGroupItem value="protect_family" id="goal_protect" className="mt-1" />
                <div>
                  <Label htmlFor="goal_protect" className="font-semibold cursor-pointer">Protect Family with Life Insurance</Label>
                  <p className="text-sm text-muted-foreground mt-1">Ensure family financial security with adequate coverage</p>
                </div>
              </div>
              
              <div className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                profileData.primary_retirement_goal === 'balanced_growth_protection' ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/30'
              }`}>
                <RadioGroupItem value="balanced_growth_protection" id="goal_balanced" className="mt-1" />
                <div>
                  <Label htmlFor="goal_balanced" className="font-semibold cursor-pointer">Balance Growth with Protection</Label>
                  <p className="text-sm text-muted-foreground mt-1">Optimize between growth-oriented investments and protective strategies</p>
                </div>
              </div>
              
              <div className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                profileData.primary_retirement_goal === 'minimize_taxes' ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/30'
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

        {/* Section 2: Retirement Savings & Contributions */}
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
                      <InfoIcon className="h-4 w-4 text-muted-foreground" />
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
                  value={incomeData.annual_retirement_contribution || 0}
                  onChange={(e) => handleIncomeChange('annual_retirement_contribution', parseFloat(e.target.value) || 0)}
                  placeholder="Annual 401k/IRA contributions"
                />
                {incomeData.annual_retirement_contribution > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Monthly: {formatCurrency(incomeData.annual_retirement_contribution / 12)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Label>Expected Contribution Growth</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Annual increase in your retirement contributions (e.g., with raises)</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex items-center space-x-4">
                  <Slider
                    value={[incomeData.contribution_growth_rate || 2]}
                    onValueChange={(value) => handleIncomeChange('contribution_growth_rate', value[0])}
                    min={0}
                    max={10}
                    step={0.5}
                    className="flex-1"
                  />
                  <span className="font-semibold text-lg w-16 text-right">{incomeData.contribution_growth_rate || 2}%</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Label>Social Security Confidence</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>How confident are you in your Social Security benefit estimate?</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select 
                  value={incomeData.social_security_confidence || 'medium'} 
                  onValueChange={(value: 'low' | 'medium' | 'high') => handleIncomeChange('social_security_confidence', value)}
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
                      <InfoIcon className="h-4 w-4 text-muted-foreground" />
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
                  value={incomeData.expected_part_time_income || 0}
                  onChange={(e) => handleIncomeChange('expected_part_time_income', parseFloat(e.target.value) || 0)}
                  placeholder="Optional part-time income"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Planning Readiness (Combined IUL + Preferences) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-primary" />
              <span>Planning Readiness</span>
            </CardTitle>
            <CardDescription>
              Help us determine the best retirement strategies for your situation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* A: Income & Funding Commitment */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
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

            {/* B: Liquidity & Near-Term Needs */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
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
                      <SelectItem value="high">High - Major purchase coming</SelectItem>
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

            {/* C: Retirement Savings Foundations */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">C</span>
                Retirement Savings Foundations
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleReadinessChange('contributing_to_401k_match', !planningReadiness.contributing_to_401k_match)}>
                  <Checkbox
                    checked={planningReadiness.contributing_to_401k_match}
                    onCheckedChange={(checked) => handleReadinessChange('contributing_to_401k_match', checked)}
                  />
                  <div>
                    <Label className="cursor-pointer font-medium">Getting employer 401(k) match</Label>
                    <p className="text-sm text-muted-foreground mt-1">
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

            {/* D: Tax Diversification */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
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

                <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
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

            {/* E: Risk & Legacy */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
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

                <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
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

            {/* F: Preferences */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">F</span>
                Preferences
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleProtectionChange('prefers_guaranteed_income', !protectionData.prefers_guaranteed_income)}>
                  <Checkbox
                    checked={protectionData.prefers_guaranteed_income || false}
                    onCheckedChange={(checked) => handleProtectionChange('prefers_guaranteed_income', checked)}
                  />
                  <div>
                    <Label className="cursor-pointer font-medium">Prefer guaranteed lifetime income</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Income you can't outlive
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleProtectionChange('can_commit_10yr_contributions', !protectionData.can_commit_10yr_contributions)}>
                  <Checkbox
                    checked={protectionData.can_commit_10yr_contributions || false}
                    onCheckedChange={(checked) => handleProtectionChange('can_commit_10yr_contributions', checked)}
                  />
                  <div>
                    <Label className="cursor-pointer font-medium">Can commit to 10+ years of contributions</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Consistent funding ability
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleProtectionChange('open_to_tax_diversification', !protectionData.open_to_tax_diversification)}>
                  <Checkbox
                    checked={protectionData.open_to_tax_diversification || false}
                    onCheckedChange={(checked) => handleProtectionChange('open_to_tax_diversification', checked)}
                  />
                  <div>
                    <Label className="cursor-pointer font-medium">Open to tax diversification</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Tax-free income strategies
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Suitability Preview */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-primary" />
              <span>Product Suitability Preview</span>
            </CardTitle>
            <CardDescription>
              Based on your inputs, here's a preliminary view of product fit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* IUL Preview */}
              <div className={`p-4 rounded-lg border-2 ${
                suitabilityPreview.iul.fit === 'strong' ? 'bg-green-50 border-green-200' :
                suitabilityPreview.iul.fit === 'moderate' ? 'bg-yellow-50 border-yellow-200' :
                suitabilityPreview.iul.fit === 'weak' ? 'bg-orange-50 border-orange-200' :
                'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Indexed Universal Life (IUL)</h4>
                  <Badge className={getFitBadgeColor(suitabilityPreview.iul.fit)}>
                    {getFitIcon(suitabilityPreview.iul.fit)}
                    <span className="ml-1 capitalize">{suitabilityPreview.iul.fit.replace('_', ' ')}</span>
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{suitabilityPreview.iul.reason}</p>
              </div>

              {/* Annuity Preview */}
              <div className={`p-4 rounded-lg border-2 ${
                suitabilityPreview.annuity.fit === 'strong' ? 'bg-green-50 border-green-200' :
                suitabilityPreview.annuity.fit === 'moderate' ? 'bg-yellow-50 border-yellow-200' :
                suitabilityPreview.annuity.fit === 'neutral' ? 'bg-gray-50 border-gray-200' :
                'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Annuity</h4>
                  <Badge className={getFitBadgeColor(suitabilityPreview.annuity.fit)}>
                    {getFitIcon(suitabilityPreview.annuity.fit)}
                    <span className="ml-1 capitalize">{suitabilityPreview.annuity.fit.replace('_', ' ')}</span>
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{suitabilityPreview.annuity.reason}</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-4 text-center">
              Full analysis with detailed recommendations will be available in your Retirement Readiness Report.
            </p>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
