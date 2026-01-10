import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

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
  PlanningReadinessData 
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
  // 3-step wizard state
  const [readinessStep, setReadinessStep] = useState<1 | 2 | 3>(1);

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

  // Handle goal priority changes
  const handleGoalPriorityChange = (goal: 'guaranteed_income' | 'flexibility_liquidity' | 'legacy_estate' | 'inflation_protection', rank: number) => {
    const currentPriorities = planningReadiness.goal_priorities || {
      guaranteed_income: 1,
      flexibility_liquidity: 2,
      legacy_estate: 3,
      inflation_protection: 4
    };
    
    // Find which goal currently has the new rank
    const otherGoal = Object.entries(currentPriorities).find(([g, r]) => r === rank && g !== goal);
    
    // Swap ranks
    const newPriorities = { ...currentPriorities };
    if (otherGoal) {
      newPriorities[otherGoal[0] as keyof typeof currentPriorities] = currentPriorities[goal];
    }
    newPriorities[goal] = rank;
    
    handleReadinessChange('goal_priorities', newPriorities);
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

    // === ANNUITY FIT SIGNALS (using new engine logic) ===
    let annuityScore = 0;
    const annuityPositives: string[] = [];
    const annuityNegatives: string[] = [];
    const annuityFixFirst: string[] = [];
    
    // Annuity-specific gates
    const annuityEmergencyIssue = emergencyFundMonths < 3;
    const annuityLiquidityIssue = planningReadiness.near_term_liquidity_need === 'high';
    
    // Build fix-first items
    if (annuityEmergencyIssue) {
      annuityNegatives.push('Build 3+ months emergency fund');
      annuityFixFirst.push(`Build emergency fund from ${emergencyFundMonths} to 3-6 months before considering annuity`);
    }
    if (annuityLiquidityIssue) {
      annuityNegatives.push('Address near-term liquidity needs');
      annuityFixFirst.push('Address expected major expenses first—annuity surrender charges apply for 5-10 years');
    }
    
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
      ? `Fix first: ${annuityFixFirst.slice(0, 1).join('')}`
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
        fixFirst: annuityFixFirst.slice(0, 2),
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
        {/* Section 1: Retirement Savings & Contributions */}
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
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                readinessStep === 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                <span className="w-5 h-5 rounded-full bg-background/20 flex items-center justify-center text-xs">3</span>
                Health & Risk Behavior
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
                  <Button onClick={() => setReadinessStep(3)} className="gap-2">
                    Continue to Health & Risk
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Health, Behavior & Goal Ranking */}
            {readinessStep === 3 && (
              <div className="space-y-6">
                {/* Health & Longevity Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Health & Longevity</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Self-assessed health */}
                    <div className="space-y-3">
                      <Label className="text-base font-medium">How would you rate your current health?</Label>
                      <Select 
                        value={planningReadiness.self_assessed_health || 'good'} 
                        onValueChange={(value: 'excellent' | 'good' | 'fair' | 'poor') => handleReadinessChange('self_assessed_health', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="excellent">Excellent</SelectItem>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="fair">Fair</SelectItem>
                          <SelectItem value="poor">Poor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Family longevity history */}
                    <div className="space-y-3">
                      <Label className="text-base font-medium">Based on your family history, how long do you expect to live?</Label>
                      <Select 
                        value={planningReadiness.family_longevity_history || 'average'} 
                        onValueChange={(value: 'below_average' | 'average' | 'above_average') => handleReadinessChange('family_longevity_history', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="below_average">Shorter than average</SelectItem>
                          <SelectItem value="average">Average (mid-80s)</SelectItem>
                          <SelectItem value="above_average">Longer than average</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Longevity concern */}
                    <div className="space-y-3">
                      <Label className="text-base font-medium">How concerned are you about outliving your savings?</Label>
                      <Select 
                        value={planningReadiness.longevity_concern || 'medium'} 
                        onValueChange={(value: 'low' | 'medium' | 'high') => handleReadinessChange('longevity_concern', value)}
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
                  </div>
                </div>

                {/* Investment Behavior Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Investment Experience & Behavior</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Investment experience */}
                    <div className="space-y-3">
                      <Label className="text-base font-medium">What is your investment experience level?</Label>
                      <Select 
                        value={planningReadiness.investment_experience_level || 'intermediate'} 
                        onValueChange={(value: 'novice' | 'intermediate' | 'experienced') => handleReadinessChange('investment_experience_level', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="novice">Novice - Limited experience</SelectItem>
                          <SelectItem value="intermediate">Intermediate - Some experience</SelectItem>
                          <SelectItem value="experienced">Experienced - Extensive experience</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Behavior in down market */}
                    <div className="space-y-3">
                      <Label className="text-base font-medium">If your investments dropped 20% in one year, what would you do?</Label>
                      <Select 
                        value={planningReadiness.behavior_in_down_market || 'hold'} 
                        onValueChange={(value: 'panic_sell' | 'reduce_risk' | 'hold' | 'buy_more' | 'unsure') => handleReadinessChange('behavior_in_down_market', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="panic_sell">Sell everything to stop the losses</SelectItem>
                          <SelectItem value="reduce_risk">Reduce risk / move to safer investments</SelectItem>
                          <SelectItem value="hold">Hold steady and wait for recovery</SelectItem>
                          <SelectItem value="buy_more">Buy more at lower prices</SelectItem>
                          <SelectItem value="unsure">Not sure</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Comfort with complex products */}
                    <div className="space-y-3">
                      <Label className="text-base font-medium">How comfortable are you with complex financial products?</Label>
                      <Select 
                        value={planningReadiness.comfort_with_complex_products || 'medium'} 
                        onValueChange={(value: 'low' | 'medium' | 'high') => handleReadinessChange('comfort_with_complex_products', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low - Prefer simple, straightforward options</SelectItem>
                          <SelectItem value="medium">Medium - Willing to learn</SelectItem>
                          <SelectItem value="high">High - Comfortable with complexity</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Willingness to keep funds illiquid */}
                    <div className="space-y-3">
                      <Label className="text-base font-medium">How many years can you keep funds locked up?</Label>
                      <p className="text-sm text-muted-foreground">Some strategies require funds to stay invested for years</p>
                      <div className="flex items-center space-x-4">
                        <Slider
                          value={[planningReadiness.willingness_illiquidity_years || 7]}
                          onValueChange={(value) => handleReadinessChange('willingness_illiquidity_years', value[0])}
                          min={0}
                          max={15}
                          step={1}
                          className="flex-1"
                        />
                        <span className="font-semibold text-lg w-20 text-right">
                          {planningReadiness.willingness_illiquidity_years || 7} years
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Goal Priority Ranking Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Rank Your Goals (1 = Most Important)</h3>
                  <p className="text-sm text-muted-foreground">This helps us understand which strategies best align with your priorities</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Guaranteed Income */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label className="font-medium">Guaranteed Lifetime Income</Label>
                        <p className="text-sm text-muted-foreground">Income I can't outlive</p>
                      </div>
                      <Select 
                        value={String(planningReadiness.goal_priorities?.guaranteed_income || 1)} 
                        onValueChange={(value) => handleGoalPriorityChange('guaranteed_income', parseInt(value))}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1st</SelectItem>
                          <SelectItem value="2">2nd</SelectItem>
                          <SelectItem value="3">3rd</SelectItem>
                          <SelectItem value="4">4th</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Flexibility / Liquidity */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label className="font-medium">Flexibility / Liquidity</Label>
                        <p className="text-sm text-muted-foreground">Access to funds when needed</p>
                      </div>
                      <Select 
                        value={String(planningReadiness.goal_priorities?.flexibility_liquidity || 2)} 
                        onValueChange={(value) => handleGoalPriorityChange('flexibility_liquidity', parseInt(value))}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1st</SelectItem>
                          <SelectItem value="2">2nd</SelectItem>
                          <SelectItem value="3">3rd</SelectItem>
                          <SelectItem value="4">4th</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Legacy / Estate */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label className="font-medium">Legacy / Estate Value</Label>
                        <p className="text-sm text-muted-foreground">Leave money to heirs</p>
                      </div>
                      <Select 
                        value={String(planningReadiness.goal_priorities?.legacy_estate || 3)} 
                        onValueChange={(value) => handleGoalPriorityChange('legacy_estate', parseInt(value))}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1st</SelectItem>
                          <SelectItem value="2">2nd</SelectItem>
                          <SelectItem value="3">3rd</SelectItem>
                          <SelectItem value="4">4th</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Inflation Protection */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label className="font-medium">Inflation Protection</Label>
                        <p className="text-sm text-muted-foreground">Keep up with rising costs</p>
                      </div>
                      <Select 
                        value={String(planningReadiness.goal_priorities?.inflation_protection || 4)} 
                        onValueChange={(value) => handleGoalPriorityChange('inflation_protection', parseInt(value))}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1st</SelectItem>
                          <SelectItem value="2">2nd</SelectItem>
                          <SelectItem value="3">3rd</SelectItem>
                          <SelectItem value="4">4th</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Peace of Mind */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Peace of Mind</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div 
                      className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => handleReadinessChange('wants_monthly_paycheck_feel', !planningReadiness.wants_monthly_paycheck_feel)}
                    >
                      <Checkbox
                        checked={planningReadiness.wants_monthly_paycheck_feel || false}
                        onCheckedChange={(checked) => handleReadinessChange('wants_monthly_paycheck_feel', checked)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div>
                        <Label className="cursor-pointer font-medium">I want my retirement income to feel like a monthly paycheck</Label>
                        <p className="text-sm text-muted-foreground mt-1">Predictable, steady income I can count on</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-base font-medium">How important is peace of mind vs. maximizing returns?</Label>
                      <Select 
                        value={planningReadiness.sleep_at_night_priority || 'medium'} 
                        onValueChange={(value: 'low' | 'medium' | 'high') => handleReadinessChange('sleep_at_night_priority', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">I'll take more risk for more returns</SelectItem>
                          <SelectItem value="medium">Balance of both</SelectItem>
                          <SelectItem value="high">Peace of mind is most important</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setReadinessStep(2)} className="gap-2">
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <p className="text-sm text-muted-foreground self-center">✓ Assessment complete - see results below</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </TooltipProvider>
  );
}
