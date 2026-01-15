import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Target, 
  Clock, 
  Shield, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Compass,
  Calendar,
  Info
} from 'lucide-react';
import type { 
  ProfileGoalsData, 
  IncomeExpensesData, 
  ProtectionHealthData, 
  PlanningReadinessData,
  SimplifiedRetirementAnswers
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

// Helper to calculate age from DOB
function calculateAge(dob: string): number {
  if (!dob) return 0;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// Derive full backend signals from simplified answers
function deriveBackendSignals(
  answers: SimplifiedRetirementAnswers,
  currentPlanningReadiness: PlanningReadinessData,
  currentProtectionData: ProtectionHealthData
): { planningReadiness: Partial<PlanningReadinessData>; protectionData: Partial<ProtectionHealthData> } {
  
  // Map primary priority to multiple backend signals
  const prioritySignals = {
    predictable_income: {
      prefers_guaranteed_income: true,
      wants_monthly_paycheck_feel: true,
      sequence_risk_concern: 'high' as const,
      legacy_priority: 'medium' as const,
      wants_tax_free_bucket: false,
    },
    tax_efficient: {
      wants_tax_free_bucket: true,
      tax_concern_level: 'high' as const,
      prefers_guaranteed_income: false,
      legacy_priority: 'medium' as const,
      sequence_risk_concern: 'medium' as const,
    },
    growth_protection: {
      sequence_risk_concern: 'high' as const,
      prefers_guaranteed_income: false,
      wants_tax_free_bucket: false,
      legacy_priority: 'medium' as const,
    },
    legacy: {
      legacy_priority: 'high' as const,
      permanent_coverage_need: true,
      prefers_guaranteed_income: false,
      wants_tax_free_bucket: true,
      sequence_risk_concern: 'medium' as const,
    },
    flexibility: {
      near_term_liquidity_need: 'low' as const,
      prefers_guaranteed_income: false,
      wants_tax_free_bucket: false,
      legacy_priority: 'low' as const,
      sequence_risk_concern: 'low' as const,
    },
  };

  // Map lock-up tolerance to funding commitment
  const lockupMap = {
    less_than_5: { funding_commitment_years: '3-5' as const, willingness_illiquidity_years: 4 },
    '5_to_7': { funding_commitment_years: '5-10' as const, willingness_illiquidity_years: 6 },
    '7_plus': { funding_commitment_years: '10-20' as const, willingness_illiquidity_years: 10 },
  };

  // Map market behavior
  const behaviorMap = {
    panic: 'panic_sell' as const,
    uneasy: 'hold' as const,
    calm: 'hold' as const,
  };

  // Map contribution status
  const contributionMap = {
    not_contributing: { maxing_qualified_plans: 'no' as const, contributing_to_401k_match: false },
    contributing_not_maxing: { maxing_qualified_plans: 'some' as const, contributing_to_401k_match: true },
    maxing: { maxing_qualified_plans: 'yes' as const, contributing_to_401k_match: true },
  };

  // Map major expenses to liquidity need
  const expenseMap = {
    none: 'low' as const,
    possibly: 'medium' as const,
    yes: 'high' as const,
  };

  // Map income stability
  const stabilityMap = {
    very_stable: 'stable' as const,
    mostly_stable: 'somewhat_stable' as const,
    variable: 'unstable' as const,
  };

  // Map longevity
  const longevityMap = {
    below_average: 'below_average' as const,
    average: 'average' as const,
    above_average: 'above_average' as const,
  };

  // Map emergency fund to months
  const emergencyMap = {
    less_than_3: 2,
    '3_to_6': 4,
    '6_plus': 8,
  };

  const priorityDerived = answers.primaryPriority ? prioritySignals[answers.primaryPriority] : {};
  const lockupDerived = answers.lockupTolerance ? lockupMap[answers.lockupTolerance] : {};
  const contributionDerived = answers.contributionStatus ? contributionMap[answers.contributionStatus] : {};

  return {
    planningReadiness: {
      ...priorityDerived,
      ...lockupDerived,
      ...contributionDerived,
      behavior_in_down_market: answers.marketBehavior ? behaviorMap[answers.marketBehavior] : undefined,
      near_term_liquidity_need: answers.majorExpenses ? expenseMap[answers.majorExpenses] : currentPlanningReadiness.near_term_liquidity_need,
      income_stability: answers.incomeStability ? stabilityMap[answers.incomeStability] : currentPlanningReadiness.income_stability,
      family_longevity_history: answers.longevity ? longevityMap[answers.longevity] : currentPlanningReadiness.family_longevity_history,
      // Defaults for fields not asked
      funding_discipline: 'medium',
      debt_pressure_level: currentPlanningReadiness.debt_pressure_level || 'low',
    },
    protectionData: {
      emergency_fund_months: answers.emergencyFund ? emergencyMap[answers.emergencyFund] : currentProtectionData.emergency_fund_months,
      prefers_guaranteed_income: answers.primaryPriority === 'predictable_income',
    },
  };
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

  // Calculate time horizon from existing profile data
  const currentAge = calculateAge(profileData.dob);
  const retirementAge = profileData.retirement_age || 65;
  const yearsToRetirement = Math.max(0, retirementAge - currentAge);

  // Track simplified answers for UI state
  const simplifiedAnswers: SimplifiedRetirementAnswers = useMemo(() => ({
    emergencyFund: protectionData.emergency_fund_months >= 6 ? '6_plus' : 
                   protectionData.emergency_fund_months >= 3 ? '3_to_6' : 'less_than_3',
    contributionStatus: planningReadiness.maxing_qualified_plans === 'yes' ? 'maxing' :
                        planningReadiness.maxing_qualified_plans === 'some' || planningReadiness.contributing_to_401k_match ? 'contributing_not_maxing' : 'not_contributing',
    primaryPriority: protectionData.prefers_guaranteed_income ? 'predictable_income' :
                     planningReadiness.wants_tax_free_bucket ? 'tax_efficient' :
                     planningReadiness.legacy_priority === 'high' ? 'legacy' :
                     planningReadiness.sequence_risk_concern === 'high' ? 'growth_protection' : undefined,
    marketBehavior: planningReadiness.behavior_in_down_market === 'panic_sell' ? 'panic' :
                    planningReadiness.behavior_in_down_market === 'hold' ? 'calm' : 'uneasy',
    lockupTolerance: (planningReadiness.willingness_illiquidity_years || 0) >= 7 ? '7_plus' :
                     (planningReadiness.willingness_illiquidity_years || 0) >= 5 ? '5_to_7' : 'less_than_5',
    longevity: planningReadiness.family_longevity_history,
    majorExpenses: planningReadiness.near_term_liquidity_need === 'high' ? 'yes' :
                   planningReadiness.near_term_liquidity_need === 'medium' ? 'possibly' : 'none',
    incomeStability: planningReadiness.income_stability === 'stable' ? 'very_stable' :
                     planningReadiness.income_stability === 'somewhat_stable' ? 'mostly_stable' : 'variable',
  }), [protectionData, planningReadiness]);

  // Handle changes and derive backend signals
  const handleSimplifiedChange = (field: keyof SimplifiedRetirementAnswers, value: string) => {
    const updatedAnswers = { ...simplifiedAnswers, [field]: value };
    const derived = deriveBackendSignals(updatedAnswers, planningReadiness, protectionData);
    
    onPlanningReadinessChange({ ...planningReadiness, ...derived.planningReadiness });
    onProtectionChange({ ...protectionData, ...derived.protectionData });
  };

  // Check if liquidity warning should show
  const showLiquidityWarning = simplifiedAnswers.emergencyFund === 'less_than_3';

  // Suitability preview calculation
  const suitabilityPreview = useMemo(() => {
    const emergencyFundMonths = protectionData.emergency_fund_months || 0;
    
    // Hard gate: emergency fund < 3 months
    const emergencyOk = emergencyFundMonths >= 3;
    const liquidityOk = planningReadiness.near_term_liquidity_need !== 'high';
    const incomeOk = planningReadiness.income_stability !== 'unstable';
    
    const isBlocked = !emergencyOk;

    // IUL scoring
    let iulScore = 0;
    const iulPositives: string[] = [];
    
    if (planningReadiness.income_stability === 'stable') {
      iulScore++;
      iulPositives.push('Stable income');
    }
    if (['10-20', '20+'].includes(planningReadiness.funding_commitment_years || '')) {
      iulScore++;
      iulPositives.push('Long-term commitment');
    }
    if (planningReadiness.wants_tax_free_bucket || planningReadiness.tax_concern_level === 'high') {
      iulScore++;
      iulPositives.push('Tax diversification interest');
    }
    if (planningReadiness.legacy_priority === 'high' || planningReadiness.permanent_coverage_need) {
      iulScore++;
      iulPositives.push('Legacy goals');
    }
    if (emergencyFundMonths >= 6) {
      iulScore++;
      iulPositives.push('Strong reserves');
    }
    if (['some', 'yes'].includes(planningReadiness.maxing_qualified_plans || '')) {
      iulScore++;
      iulPositives.push('Solid retirement foundation');
    }

    let iulFit: FitLevel = isBlocked ? 'not_recommended' : 
                          iulScore >= 4 ? 'strong' : 
                          iulScore >= 2 ? 'moderate' : 'explore';

    // Annuity scoring
    let annuityScore = 0;
    const annuityPositives: string[] = [];
    
    if (protectionData.prefers_guaranteed_income) {
      annuityScore += 2;
      annuityPositives.push('Prefers predictable income');
    }
    if (planningReadiness.sequence_risk_concern === 'high') {
      annuityScore++;
      annuityPositives.push('Values downside protection');
    }
    if (emergencyFundMonths >= 6) {
      annuityScore++;
      annuityPositives.push('Strong reserves');
    }

    let annuityFit: FitLevel = isBlocked ? 'not_recommended' :
                              annuityScore >= 3 ? 'strong' :
                              annuityScore >= 1 ? 'moderate' : 'explore';

    return {
      iul: { fit: iulFit, positives: iulPositives.slice(0, 3) },
      annuity: { fit: annuityFit, positives: annuityPositives.slice(0, 3) },
      isBlocked,
    };
  }, [protectionData, planningReadiness]);

  const getFitBadgeColor = (fit: FitLevel) => {
    switch (fit) {
      case 'strong': return 'bg-green-100 text-green-800 border-green-300';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'explore': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'not_recommended': return 'bg-red-100 text-red-800 border-red-300';
    }
  };

  const getFitIcon = (fit: FitLevel) => {
    switch (fit) {
      case 'strong': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'moderate': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'explore': return <Compass className="h-4 w-4 text-blue-600" />;
      case 'not_recommended': return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getFitLabel = (fit: FitLevel) => {
    switch (fit) {
      case 'strong': return 'Strong Fit';
      case 'moderate': return 'Moderate Fit';
      case 'explore': return 'Explore';
      case 'not_recommended': return 'Focus on basics first';
    }
  };

  // Count answered questions for progress
  const answeredCount = [
    simplifiedAnswers.emergencyFund,
    simplifiedAnswers.contributionStatus,
    simplifiedAnswers.primaryPriority,
    simplifiedAnswers.marketBehavior,
    simplifiedAnswers.lockupTolerance,
    simplifiedAnswers.longevity,
    simplifiedAnswers.majorExpenses,
    simplifiedAnswers.incomeStability,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Time Horizon Display (read-only from existing data) */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="pt-4">
          <div className="flex items-center gap-4">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Based on your profile</p>
              <p className="font-medium">
                Age {currentAge || '—'} → Retire at {retirementAge} ({yearsToRetirement} years)
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Progress</p>
              <p className="font-medium text-primary">{answeredCount}/8 answered</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liquidity Warning */}
      {showLiquidityWarning && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Focus on liquidity first.</strong> Building a 3-6 month emergency fund should be your priority before exploring long-term retirement strategies.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Retirement Planning
          </CardTitle>
          <CardDescription>
            8 quick questions to find the best strategies for you (~2 min)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          
          {/* Question 1: Emergency Fund */}
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">1</span>
              <div className="flex-1">
                <Label className="text-base font-medium">How much do you have set aside for emergencies?</Label>
                <p className="text-sm text-muted-foreground mt-1">This helps ensure you're ready for long-term planning</p>
              </div>
            </div>
            <RadioGroup
              value={simplifiedAnswers.emergencyFund}
              onValueChange={(value) => handleSimplifiedChange('emergencyFund', value)}
              className="grid grid-cols-1 md:grid-cols-3 gap-3 ml-8"
            >
              {[
                { value: 'less_than_3', label: 'Less than 3 months', description: 'of expenses' },
                { value: '3_to_6', label: '3-6 months', description: 'of expenses' },
                { value: '6_plus', label: '6+ months', description: 'of expenses' },
              ].map((option) => (
                <Label
                  key={option.value}
                  htmlFor={`emergency-${option.value}`}
                  className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                    simplifiedAnswers.emergencyFund === option.value ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <RadioGroupItem value={option.value} id={`emergency-${option.value}`} />
                  <div>
                    <p className="font-medium">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                </Label>
              ))}
            </RadioGroup>
          </div>

          {/* Question 2: Contribution Status */}
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">2</span>
              <div className="flex-1">
                <Label className="text-base font-medium">Are you contributing to retirement accounts?</Label>
                <p className="text-sm text-muted-foreground mt-1">Your foundation for retirement savings</p>
              </div>
            </div>
            <RadioGroup
              value={simplifiedAnswers.contributionStatus}
              onValueChange={(value) => handleSimplifiedChange('contributionStatus', value)}
              className="grid grid-cols-1 md:grid-cols-3 gap-3 ml-8"
            >
              {[
                { value: 'not_contributing', label: 'Not contributing', description: 'No 401(k)/IRA contributions' },
                { value: 'contributing_not_maxing', label: 'Contributing', description: 'But not maxing out' },
                { value: 'maxing', label: 'Maxing out', description: 'Employer plans & IRAs' },
              ].map((option) => (
                <Label
                  key={option.value}
                  htmlFor={`contribution-${option.value}`}
                  className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                    simplifiedAnswers.contributionStatus === option.value ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <RadioGroupItem value={option.value} id={`contribution-${option.value}`} />
                  <div>
                    <p className="font-medium">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                </Label>
              ))}
            </RadioGroup>
          </div>

          {/* Question 3: Primary Priority */}
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">3</span>
              <div className="flex-1">
                <Label className="text-base font-medium">What matters MOST to you in retirement?</Label>
                <p className="text-sm text-muted-foreground mt-1">This shapes which strategies we'll explore</p>
              </div>
            </div>
            <RadioGroup
              value={simplifiedAnswers.primaryPriority}
              onValueChange={(value) => handleSimplifiedChange('primaryPriority', value)}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 ml-8"
            >
              {[
                { value: 'predictable_income', label: 'Predictable lifetime income', icon: Shield },
                { value: 'tax_efficient', label: 'Tax-efficient access to money', icon: TrendingUp },
                { value: 'growth_protection', label: 'Growth with downside protection', icon: TrendingUp },
                { value: 'legacy', label: 'Leaving money to family', icon: Target },
                { value: 'flexibility', label: 'Flexibility and access', icon: Clock },
              ].map((option) => (
                <Label
                  key={option.value}
                  htmlFor={`priority-${option.value}`}
                  className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                    simplifiedAnswers.primaryPriority === option.value ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <RadioGroupItem value={option.value} id={`priority-${option.value}`} />
                  <option.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <p className="font-medium text-sm">{option.label}</p>
                </Label>
              ))}
            </RadioGroup>
          </div>

          {/* Question 4: Market Behavior */}
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">4</span>
              <div className="flex-1">
                <Label className="text-base font-medium">If markets dropped 20%, what would you most likely do?</Label>
                <p className="text-sm text-muted-foreground mt-1">Understanding your comfort with volatility</p>
              </div>
            </div>
            <RadioGroup
              value={simplifiedAnswers.marketBehavior}
              onValueChange={(value) => handleSimplifiedChange('marketBehavior', value)}
              className="grid grid-cols-1 md:grid-cols-3 gap-3 ml-8"
            >
              {[
                { value: 'panic', label: 'Panic and sell', description: 'Protect what\'s left' },
                { value: 'uneasy', label: 'Feel uneasy but hold', description: 'Wait it out nervously' },
                { value: 'calm', label: 'Stay calm and wait', description: 'Markets recover' },
              ].map((option) => (
                <Label
                  key={option.value}
                  htmlFor={`market-${option.value}`}
                  className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                    simplifiedAnswers.marketBehavior === option.value ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <RadioGroupItem value={option.value} id={`market-${option.value}`} />
                  <div>
                    <p className="font-medium">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                </Label>
              ))}
            </RadioGroup>
          </div>

          {/* Question 5: Lock-up Tolerance */}
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">5</span>
              <div className="flex-1">
                <Label className="text-base font-medium">How long could you leave money invested without needing it?</Label>
                <p className="text-sm text-muted-foreground mt-1">Some strategies require funds to stay invested longer</p>
              </div>
            </div>
            <RadioGroup
              value={simplifiedAnswers.lockupTolerance}
              onValueChange={(value) => handleSimplifiedChange('lockupTolerance', value)}
              className="grid grid-cols-1 md:grid-cols-3 gap-3 ml-8"
            >
              {[
                { value: 'less_than_5', label: 'Less than 5 years', description: 'Need flexibility' },
                { value: '5_to_7', label: '5-7 years', description: 'Moderate horizon' },
                { value: '7_plus', label: '7+ years', description: 'Long-term focus' },
              ].map((option) => (
                <Label
                  key={option.value}
                  htmlFor={`lockup-${option.value}`}
                  className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                    simplifiedAnswers.lockupTolerance === option.value ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <RadioGroupItem value={option.value} id={`lockup-${option.value}`} />
                  <div>
                    <p className="font-medium">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                </Label>
              ))}
            </RadioGroup>
          </div>

          {/* Question 6: Longevity */}
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">6</span>
              <div className="flex-1">
                <Label className="text-base font-medium">Compared to average, how long do you expect to live?</Label>
                <p className="text-sm text-muted-foreground mt-1">Based on your health and family history</p>
              </div>
            </div>
            <RadioGroup
              value={simplifiedAnswers.longevity}
              onValueChange={(value) => handleSimplifiedChange('longevity', value)}
              className="grid grid-cols-1 md:grid-cols-3 gap-3 ml-8"
            >
              {[
                { value: 'below_average', label: 'Below average', description: 'Health concerns or family history' },
                { value: 'average', label: 'About average', description: 'Typical life expectancy' },
                { value: 'above_average', label: 'Above average', description: 'Good health, longevity in family' },
              ].map((option) => (
                <Label
                  key={option.value}
                  htmlFor={`longevity-${option.value}`}
                  className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                    simplifiedAnswers.longevity === option.value ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <RadioGroupItem value={option.value} id={`longevity-${option.value}`} />
                  <div>
                    <p className="font-medium">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                </Label>
              ))}
            </RadioGroup>
          </div>

          {/* Question 7: Major Expenses */}
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">7</span>
              <div className="flex-1">
                <Label className="text-base font-medium">Do you expect any major expenses in the next 3-5 years?</Label>
                <p className="text-sm text-muted-foreground mt-1">Home, education, medical, business investments</p>
              </div>
            </div>
            <RadioGroup
              value={simplifiedAnswers.majorExpenses}
              onValueChange={(value) => handleSimplifiedChange('majorExpenses', value)}
              className="grid grid-cols-1 md:grid-cols-3 gap-3 ml-8"
            >
              {[
                { value: 'none', label: 'No major expenses', description: 'Nothing significant planned' },
                { value: 'possibly', label: 'Possibly', description: 'Planning for something' },
                { value: 'yes', label: 'Yes, significant', description: 'Expense expected' },
              ].map((option) => (
                <Label
                  key={option.value}
                  htmlFor={`expenses-${option.value}`}
                  className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                    simplifiedAnswers.majorExpenses === option.value ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <RadioGroupItem value={option.value} id={`expenses-${option.value}`} />
                  <div>
                    <p className="font-medium">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                </Label>
              ))}
            </RadioGroup>
          </div>

          {/* Question 8: Income Stability */}
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">8</span>
              <div className="flex-1">
                <Label className="text-base font-medium">How stable is your household income?</Label>
                <p className="text-sm text-muted-foreground mt-1">Job security, income consistency</p>
              </div>
            </div>
            <RadioGroup
              value={simplifiedAnswers.incomeStability}
              onValueChange={(value) => handleSimplifiedChange('incomeStability', value)}
              className="grid grid-cols-1 md:grid-cols-3 gap-3 ml-8"
            >
              {[
                { value: 'very_stable', label: 'Very stable', description: 'Predictable income' },
                { value: 'mostly_stable', label: 'Mostly stable', description: 'Minor fluctuations' },
                { value: 'variable', label: 'Variable or uncertain', description: 'Income varies' },
              ].map((option) => (
                <Label
                  key={option.value}
                  htmlFor={`stability-${option.value}`}
                  className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                    simplifiedAnswers.incomeStability === option.value ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <RadioGroupItem value={option.value} id={`stability-${option.value}`} />
                  <div>
                    <p className="font-medium">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                </Label>
              ))}
            </RadioGroup>
          </div>

        </CardContent>
      </Card>

      {/* Suitability Preview (only show when enough answers) */}
      {answeredCount >= 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Info className="h-4 w-4 text-primary" />
              Strategy Preview
            </CardTitle>
            <CardDescription>
              Based on your answers, here's how protected strategies might fit your situation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Protected Growth Strategy */}
              <div className={`p-4 rounded-lg border-2 ${
                suitabilityPreview.iul.fit === 'strong' ? 'bg-green-50 border-green-200' :
                suitabilityPreview.iul.fit === 'moderate' ? 'bg-yellow-50 border-yellow-200' :
                suitabilityPreview.iul.fit === 'not_recommended' ? 'bg-red-50 border-red-200' :
                'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Tax-Free Growth Strategy</span>
                  <Badge className={getFitBadgeColor(suitabilityPreview.iul.fit)}>
                    {getFitIcon(suitabilityPreview.iul.fit)}
                    <span className="ml-1">{getFitLabel(suitabilityPreview.iul.fit)}</span>
                  </Badge>
                </div>
                {suitabilityPreview.iul.positives.length > 0 && !suitabilityPreview.isBlocked && (
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {suitabilityPreview.iul.positives.map((p, i) => (
                      <li key={i} className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        {p}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Guaranteed Income Strategy */}
              <div className={`p-4 rounded-lg border-2 ${
                suitabilityPreview.annuity.fit === 'strong' ? 'bg-green-50 border-green-200' :
                suitabilityPreview.annuity.fit === 'moderate' ? 'bg-yellow-50 border-yellow-200' :
                suitabilityPreview.annuity.fit === 'not_recommended' ? 'bg-red-50 border-red-200' :
                'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Guaranteed Income Strategy</span>
                  <Badge className={getFitBadgeColor(suitabilityPreview.annuity.fit)}>
                    {getFitIcon(suitabilityPreview.annuity.fit)}
                    <span className="ml-1">{getFitLabel(suitabilityPreview.annuity.fit)}</span>
                  </Badge>
                </div>
                {suitabilityPreview.annuity.positives.length > 0 && !suitabilityPreview.isBlocked && (
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {suitabilityPreview.annuity.positives.map((p, i) => (
                      <li key={i} className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        {p}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {suitabilityPreview.isBlocked && (
              <Alert className="mt-4" variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Build your emergency fund to 3+ months before exploring these strategies. This ensures you have a safety net for unexpected expenses.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
