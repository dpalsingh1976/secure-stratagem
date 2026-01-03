import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { 
  InfoIcon, 
  Target, 
  TrendingUp, 
  DollarSign, 
  Shield, 
  Compass,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ChevronRight,
  ChevronLeft,
  ArrowRight
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

type FitLevel = 'strong' | 'moderate' | 'explore' | 'not_recommended';

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
  // 2-step wizard state
  const [readinessStep, setReadinessStep] = useState<1 | 2>(1);

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

  // NEW: 3 Gates + Fit Signals Model
  const suitabilityPreview = useMemo(() => {
    const emergencyFundMonths = protectionData.emergency_fund_months || 0;
    
    // === SHARED READINESS GATES ===
    const emergencyOk = emergencyFundMonths >= 3;
    const liquidityOk = planningReadiness.near_term_liquidity_need !== 'high';
    const incomeOk = planningReadiness.income_stability !== 'unstable';
    const debtOk = !(planningReadiness.debt_pressure_level === 'high' && emergencyFundMonths < 6);
    
    const gateFailures = [!emergencyOk, !liquidityOk, !incomeOk, !debtOk].filter(Boolean).length;
    const isBlocked = gateFailures >= 2;
    
    // Build fix-first items from gate failures
    const sharedFixFirst: string[] = [];
    if (!emergencyOk) sharedFixFirst.push('Build 3+ months emergency fund');
    if (!liquidityOk) sharedFixFirst.push('Address near-term liquidity needs');
    if (!incomeOk) sharedFixFirst.push('Stabilize income first');
    if (!debtOk) sharedFixFirst.push('Reduce debt pressure or build reserves');

    // === IUL FIT SIGNALS (score-based, max 6) ===
    let iulScore = 0;
    const iulPositives: string[] = [];
    const iulNegatives: string[] = [...sharedFixFirst];
    
    // +1 Stable income
    if (planningReadiness.income_stability === 'stable') {
      iulScore++;
      iulPositives.push('Stable income');
    }
    
    // +1 Long-term commitment
    const hasLongTermCommitment = 
      ['10-20', '20+'].includes(planningReadiness.funding_commitment_years || '') || 
      protectionData.can_commit_10yr_contributions;
    if (hasLongTermCommitment) {
      iulScore++;
      iulPositives.push('Long-term funding commitment');
    }
    
    // +1 Tax intent
    const hasTaxIntent = 
      planningReadiness.tax_concern_level === 'high' || 
      planningReadiness.wants_tax_free_bucket || 
      protectionData.open_to_tax_diversification;
    if (hasTaxIntent) {
      iulScore++;
      iulPositives.push('Tax diversification interest');
    }
    
    // +1 Legacy/permanent need
    const hasLegacyNeed = 
      planningReadiness.legacy_priority === 'high' || 
      planningReadiness.permanent_coverage_need;
    if (hasLegacyNeed) {
      iulScore++;
      iulPositives.push('Legacy or permanent coverage goals');
    }
    
    // +1 Strong emergency fund
    if (emergencyFundMonths >= 6) {
      iulScore++;
      iulPositives.push('Strong emergency reserves');
    }
    
    // +1 Qualified plan foundation
    const hasQualifiedFoundation = ['some', 'yes', 'not_applicable'].includes(planningReadiness.maxing_qualified_plans || '');
    if (hasQualifiedFoundation) {
      iulScore++;
      iulPositives.push('Solid retirement foundation');
    }

    // Determine IUL fit
    let iulFit: FitLevel;
    if (isBlocked) {
      iulFit = 'not_recommended';
    } else if (iulScore >= 4) {
      iulFit = 'strong';
    } else if (iulScore >= 2) {
      iulFit = 'moderate';
    } else {
      iulFit = 'explore';
    }

    // === ANNUITY FIT SIGNALS (score-based, max 5) ===
    let annuityScore = 0;
    const annuityPositives: string[] = [];
    const annuityNegatives: string[] = [];
    
    // Annuity-specific gates
    const annuityEmergencyIssue = emergencyFundMonths < 3;
    const annuityLiquidityIssue = planningReadiness.near_term_liquidity_need === 'high';
    
    if (annuityEmergencyIssue) annuityNegatives.push('Build 3+ months emergency fund');
    if (annuityLiquidityIssue) annuityNegatives.push('Address near-term liquidity needs');
    
    const annuityBlocked = annuityEmergencyIssue && annuityLiquidityIssue;
    
    // +2 Prefers guaranteed income
    if (protectionData.prefers_guaranteed_income) {
      annuityScore += 2;
      annuityPositives.push('Prefers guaranteed income');
    }
    
    // +1 Sequence risk concern
    if (planningReadiness.sequence_risk_concern === 'high') {
      annuityScore++;
      annuityPositives.push('Concerned about market timing');
    }
    
    // +1 Goal: guaranteed income
    if (profileData.primary_retirement_goal === 'secure_guaranteed_income') {
      annuityScore++;
      annuityPositives.push('Goal: guaranteed income');
    }
    
    // +1 Strong emergency fund
    if (emergencyFundMonths >= 6) {
      annuityScore++;
      annuityPositives.push('Strong emergency reserves');
    }

    // Determine Annuity fit
    let annuityFit: FitLevel;
    if (annuityBlocked) {
      annuityFit = 'not_recommended';
    } else if (annuityScore >= 3) {
      annuityFit = 'strong';
    } else if (annuityScore >= 1) {
      annuityFit = 'moderate';
    } else {
      annuityFit = 'explore';
    }

    // Build reason strings
    const iulReason = isBlocked
      ? `Fix first: ${iulNegatives.slice(0, 2).join(', ')}`
      : iulPositives.length > 0
        ? `Good fit signals: ${iulPositives.slice(0, 2).join(', ')}`
        : 'Answer more questions to refine your assessment';

    const annuityReason = annuityBlocked
      ? `Fix first: ${annuityNegatives.slice(0, 2).join(', ')}`
      : annuityPositives.length > 0
        ? `Good fit signals: ${annuityPositives.slice(0, 2).join(', ')}`
        : 'May benefit from guaranteed income analysis';

    return {
      iul: {
        fit: iulFit,
        positives: iulPositives.slice(0, 3),
        negatives: iulNegatives.slice(0, 2),
        reason: iulReason
      },
      annuity: {
        fit: annuityFit,
        positives: annuityPositives.slice(0, 3),
        negatives: annuityNegatives.slice(0, 2),
        reason: annuityReason
      }
    };
  }, [profileData, protectionData, planningReadiness]);

  const getFitBadgeColor = (fit: string) => {
    switch (fit) {
      case 'strong': return 'bg-green-100 text-green-800 border-green-300';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'explore': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'not_recommended': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getFitIcon = (fit: string) => {
    switch (fit) {
      case 'strong': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'moderate': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'explore': return <Compass className="h-4 w-4 text-blue-600" />;
      case 'not_recommended': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Compass className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getFitLabel = (fit: string) => {
    switch (fit) {
      case 'strong': return 'Strong Fit';
      case 'moderate': return 'Moderate Fit';
      case 'explore': return 'Explore';
      case 'not_recommended': return 'Not a fit yet';
      default: return 'Explore';
    }
  };

  const getBackgroundColor = (fit: string) => {
    switch (fit) {
      case 'strong': return 'bg-green-50 border-green-200';
      case 'moderate': return 'bg-yellow-50 border-yellow-200';
      case 'explore': return 'bg-blue-50 border-blue-200';
      case 'not_recommended': return 'bg-red-50 border-red-200';
      default: return 'bg-muted border-border';
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

        {/* Section 3: Planning Readiness - NEW 2-Step Wizard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-primary" />
              <span>Planning Readiness</span>
            </CardTitle>
            <CardDescription>
              Quick questions to find the best strategies for you
            </CardDescription>
            {/* Step indicator */}
            <div className="flex items-center gap-2 mt-4">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                readinessStep === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                <span className="w-5 h-5 rounded-full bg-background/20 flex items-center justify-center text-xs">1</span>
                Readiness Basics
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                readinessStep === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                <span className="w-5 h-5 rounded-full bg-background/20 flex items-center justify-center text-xs">2</span>
                Goals & Preferences
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Readiness Basics */}
            {readinessStep === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Emergency Fund */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Emergency Fund</Label>
                    <p className="text-sm text-muted-foreground">Months of expenses you could cover</p>
                    <div className="flex items-center space-x-4">
                      <Slider
                        value={[protectionData.emergency_fund_months || 0]}
                        onValueChange={(value) => handleProtectionChange('emergency_fund_months', value[0])}
                        min={0}
                        max={12}
                        step={1}
                        className="flex-1"
                      />
                      <span className="font-semibold text-lg w-20 text-right">
                        {protectionData.emergency_fund_months || 0} mo
                      </span>
                    </div>
                    {(protectionData.emergency_fund_months || 0) < 3 && (
                      <p className="text-xs text-amber-600">Aim for at least 3 months</p>
                    )}
                  </div>

                  {/* Near-term liquidity need */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Major Expenses Coming?</Label>
                    <p className="text-sm text-muted-foreground">Big purchases in the next 3-5 years</p>
                    <Select 
                      value={planningReadiness.near_term_liquidity_need || 'low'} 
                      onValueChange={(value: 'low' | 'medium' | 'high') => handleReadinessChange('near_term_liquidity_need', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">No major expenses planned</SelectItem>
                        <SelectItem value="medium">Some planned expenses</SelectItem>
                        <SelectItem value="high">Major purchase coming soon</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Income stability */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Income Stability</Label>
                    <p className="text-sm text-muted-foreground">How predictable is your income?</p>
                    <Select 
                      value={planningReadiness.income_stability || 'stable'} 
                      onValueChange={(value: 'stable' | 'somewhat_stable' | 'unstable') => handleReadinessChange('income_stability', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stable">Stable & predictable</SelectItem>
                        <SelectItem value="somewhat_stable">Mostly stable, minor fluctuations</SelectItem>
                        <SelectItem value="unstable">Variable or uncertain</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Debt pressure */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Debt Pressure</Label>
                    <p className="text-sm text-muted-foreground">Do debt payments feel burdensome?</p>
                    <Select 
                      value={planningReadiness.debt_pressure_level || 'low'} 
                      onValueChange={(value: 'low' | 'medium' | 'high') => handleReadinessChange('debt_pressure_level', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Manageable, no pressure</SelectItem>
                        <SelectItem value="medium">Some pressure</SelectItem>
                        <SelectItem value="high">Significant pressure</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={() => setReadinessStep(2)} className="gap-2">
                    Continue to Goals
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Goals & Preferences */}
            {readinessStep === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Tax-free bucket checkbox */}
                  <div 
                    className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleReadinessChange('wants_tax_free_bucket', !planningReadiness.wants_tax_free_bucket)}
                  >
                    <Checkbox
                      checked={planningReadiness.wants_tax_free_bucket || false}
                      onCheckedChange={(checked) => handleReadinessChange('wants_tax_free_bucket', checked)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div>
                      <Label className="cursor-pointer font-medium">I want a tax-free income option</Label>
                      <p className="text-sm text-muted-foreground mt-1">Access retirement funds without paying taxes</p>
                    </div>
                  </div>

                  {/* Permanent coverage checkbox */}
                  <div 
                    className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleReadinessChange('permanent_coverage_need', !planningReadiness.permanent_coverage_need)}
                  >
                    <Checkbox
                      checked={planningReadiness.permanent_coverage_need || false}
                      onCheckedChange={(checked) => handleReadinessChange('permanent_coverage_need', checked)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div>
                      <Label className="cursor-pointer font-medium">I want lifelong life insurance</Label>
                      <p className="text-sm text-muted-foreground mt-1">Coverage that never expires</p>
                    </div>
                  </div>

                  {/* Guaranteed income checkbox */}
                  <div 
                    className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleProtectionChange('prefers_guaranteed_income', !protectionData.prefers_guaranteed_income)}
                  >
                    <Checkbox
                      checked={protectionData.prefers_guaranteed_income || false}
                      onCheckedChange={(checked) => handleProtectionChange('prefers_guaranteed_income', checked)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div>
                      <Label className="cursor-pointer font-medium">I prefer guaranteed lifetime income</Label>
                      <p className="text-sm text-muted-foreground mt-1">Income I can't outlive</p>
                    </div>
                  </div>

                  {/* 10+ year commitment checkbox */}
                  <div 
                    className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleProtectionChange('can_commit_10yr_contributions', !protectionData.can_commit_10yr_contributions)}
                  >
                    <Checkbox
                      checked={protectionData.can_commit_10yr_contributions || false}
                      onCheckedChange={(checked) => handleProtectionChange('can_commit_10yr_contributions', checked)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div>
                      <Label className="cursor-pointer font-medium">I can commit to 10+ years of contributions</Label>
                      <p className="text-sm text-muted-foreground mt-1">Consistent funding over time</p>
                    </div>
                  </div>

                  {/* Legacy priority */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Leaving an Inheritance</Label>
                    <p className="text-sm text-muted-foreground">How important is this to you?</p>
                    <Select 
                      value={planningReadiness.legacy_priority || 'medium'} 
                      onValueChange={(value: 'low' | 'medium' | 'high') => handleReadinessChange('legacy_priority', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Not a priority</SelectItem>
                        <SelectItem value="medium">Would be nice</SelectItem>
                        <SelectItem value="high">Very important to me</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sequence risk concern */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Market Timing Worry</Label>
                    <p className="text-sm text-muted-foreground">Worried about retiring during a downturn?</p>
                    <Select 
                      value={planningReadiness.sequence_risk_concern || 'medium'} 
                      onValueChange={(value: 'low' | 'medium' | 'high') => handleReadinessChange('sequence_risk_concern', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Not concerned</SelectItem>
                        <SelectItem value="medium">Somewhat concerned</SelectItem>
                        <SelectItem value="high">Very concerned</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Maxing qualified plans */}
                  <div className="space-y-3 md:col-span-2">
                    <Label className="text-base font-medium">Retirement Account Contributions</Label>
                    <p className="text-sm text-muted-foreground">Are you maxing out 401(k), IRA, or Roth accounts?</p>
                    <Select 
                      value={planningReadiness.maxing_qualified_plans || 'no'} 
                      onValueChange={(value: 'no' | 'some' | 'yes' | 'not_applicable') => handleReadinessChange('maxing_qualified_plans', value)}
                    >
                      <SelectTrigger className="max-w-md">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no">Not maxing any accounts</SelectItem>
                        <SelectItem value="some">Maxing 1-2 accounts</SelectItem>
                        <SelectItem value="yes">Maxing all available</SelectItem>
                        <SelectItem value="not_applicable">Self-employed / no employer plan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setReadinessStep(1)} className="gap-2">
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <p className="text-sm text-muted-foreground self-center">See your results below</p>
                </div>
              </div>
            )}
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
              Based on your inputs, here's how these strategies may fit you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* IUL Preview */}
              <div className={`p-4 rounded-lg border-2 ${getBackgroundColor(suitabilityPreview.iul.fit)}`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">Indexed Universal Life (IUL)</h4>
                  <Badge className={getFitBadgeColor(suitabilityPreview.iul.fit)}>
                    {getFitIcon(suitabilityPreview.iul.fit)}
                    <span className="ml-1">{getFitLabel(suitabilityPreview.iul.fit)}</span>
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{suitabilityPreview.iul.reason}</p>
                
                {/* CTA based on fit */}
                {(suitabilityPreview.iul.fit === 'strong' || suitabilityPreview.iul.fit === 'moderate') && (
                  <Button variant="link" className="p-0 h-auto text-primary gap-1" asChild>
                    <a href="/book">
                      See how this works for you
                      <ArrowRight className="h-3 w-3" />
                    </a>
                  </Button>
                )}
                {suitabilityPreview.iul.fit === 'explore' && (
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-blue-600 gap-1"
                    onClick={() => setReadinessStep(2)}
                  >
                    Answer more questions to refine
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                )}
                {suitabilityPreview.iul.fit === 'not_recommended' && suitabilityPreview.iul.negatives.length > 0 && (
                  <div className="mt-2 text-sm">
                    <p className="font-medium text-red-700 mb-1">What to address:</p>
                    <ul className="list-disc list-inside text-red-600 space-y-0.5">
                      {suitabilityPreview.iul.negatives.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Annuity Preview */}
              <div className={`p-4 rounded-lg border-2 ${getBackgroundColor(suitabilityPreview.annuity.fit)}`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">Annuity</h4>
                  <Badge className={getFitBadgeColor(suitabilityPreview.annuity.fit)}>
                    {getFitIcon(suitabilityPreview.annuity.fit)}
                    <span className="ml-1">{getFitLabel(suitabilityPreview.annuity.fit)}</span>
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{suitabilityPreview.annuity.reason}</p>
                
                {/* CTA based on fit */}
                {(suitabilityPreview.annuity.fit === 'strong' || suitabilityPreview.annuity.fit === 'moderate') && (
                  <Button variant="link" className="p-0 h-auto text-primary gap-1" asChild>
                    <a href="/book">
                      See how this works for you
                      <ArrowRight className="h-3 w-3" />
                    </a>
                  </Button>
                )}
                {suitabilityPreview.annuity.fit === 'explore' && (
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-blue-600 gap-1"
                    onClick={() => setReadinessStep(2)}
                  >
                    Answer more questions to refine
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                )}
                {suitabilityPreview.annuity.fit === 'not_recommended' && suitabilityPreview.annuity.negatives.length > 0 && (
                  <div className="mt-2 text-sm">
                    <p className="font-medium text-red-700 mb-1">What to address:</p>
                    <ul className="list-disc list-inside text-red-600 space-y-0.5">
                      {suitabilityPreview.annuity.negatives.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
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
