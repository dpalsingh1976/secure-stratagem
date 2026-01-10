import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Users, DollarSign, Shield, Target, BarChart3, X, TrendingUp } from 'lucide-react';

interface RiskIntakeProps {
  isModal?: boolean;
  onClose?: () => void;
}
import { ProfileGoalsForm } from '@/components/financial/ProfileGoalsForm';
import { IncomeExpensesForm } from '@/components/financial/IncomeExpensesForm';
import { AssetsForm } from '@/components/financial/AssetsForm';
import { LiabilitiesForm } from '@/components/financial/LiabilitiesForm';
import { ProtectionHealthForm } from '@/components/financial/ProtectionHealthForm';
import { RetirementPlanningForm } from '@/components/financial/RetirementPlanningForm';

import { ReportModal } from '@/components/financial/ReportModal';
import { computeRiskMetrics } from '@/utils/riskComputation';
import { computeRetirementReadiness } from '@/engine/retirement';
import type { 
  Client, 
  ProfileGoalsData, 
  IncomeExpensesData, 
  AssetFormData, 
  LiabilityFormData, 
  ProtectionHealthData, 
  ComputedMetrics,
  PlanningReadinessData
} from '@/types/financial';
import type { RetirementReadinessResult } from '@/types/retirement';
import { getDefaultPlanningReadiness } from '@/engine/retirement/iulSuitability';

const STEPS = [
  { id: 'profile', label: 'Profile & Goals', icon: Users, description: 'Client information and retirement goals' },
  { id: 'income', label: 'Income & Expenses', icon: DollarSign, description: 'Monthly income sources and expenses' },
  { id: 'assets', label: 'Assets', icon: BarChart3, description: 'All investments and holdings' },
  { id: 'liabilities', label: 'Liabilities', icon: FileText, description: 'Debts and obligations' },
  { id: 'retirement', label: 'Retirement Planning', icon: TrendingUp, description: 'Goals, savings & product suitability' },
  { id: 'protection', label: 'Protection & Health', icon: Shield, description: 'Insurance coverage' }
];

export default function RiskIntake({ isModal = false, onClose }: RiskIntakeProps = {}) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [clientId, setClientId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [computedMetrics, setComputedMetrics] = useState<ComputedMetrics | null>(null);
  const [retirementResult, setRetirementResult] = useState<RetirementReadinessResult | null>(null);

  // Form data states
  const [profileData, setProfileData] = useState<ProfileGoalsData>({
    name_first: '',
    name_last: '',
    email: '',
    dob: '',
    state: '',
    filing_status: 'single',
    dependents: 0,
    retirement_age: 65,
    desired_monthly_income: 0,
    insurance_priorities: [],
    primary_retirement_goal: 'balanced_growth_protection',
    retirement_lifestyle: 'comfortable',
    spending_target_method: 'fixed',
    spending_percent_of_income: 80,
    planned_retirement_state: ''
  });

  const [incomeData, setIncomeData] = useState<IncomeExpensesData>({
    w2_income: 0,
    business_income: 0,
    rental_income: 0,
    pension_income: 0,
    social_security: 0,
    annuity_income: 0,
    fixed_expenses: 0,
    variable_expenses: 0,
    debt_service: 0,
    employer_match_pct: 0,
    hsa_eligible: false,
    annual_retirement_contribution: 0,
    contribution_growth_rate: 2,
    social_security_confidence: 'medium',
    expected_part_time_income: 0,
    monthly_retirement_income_goal_net: 0,
    other_guaranteed_income_monthly: 0
  });

  const [assets, setAssets] = useState<AssetFormData[]>([]);
  const [liabilities, setLiabilities] = useState<LiabilityFormData[]>([]);
  const [protectionData, setProtectionData] = useState<ProtectionHealthData>({
    term_life_coverage: 0,
    term_life_years: 0,
    permanent_life_cv: 0,
    permanent_life_db: 0,
    ltc_daily_benefit: 0,
    ltc_benefit_period: 0,
    emergency_fund_months: 0,
    prefers_guaranteed_income: false,
    liquidity_need_next_5yr: 'medium',
    can_commit_10yr_contributions: false,
    open_to_tax_diversification: false,
    existing_db_pension_monthly: 0
  });
  
  const [planningReadiness, setPlanningReadiness] = useState<PlanningReadinessData>(
    getDefaultPlanningReadiness()
  );



  const progressPercentage = ((currentStep + 1) / STEPS.length) * 100;

  const saveStepData = async (stepData: any) => {
    // Skip database save if no client ID (unauthenticated user)
    if (!clientId) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('financial_profile')
        .upsert({ ...stepData, client_id: clientId })
        .select();

      if (error) throw error;

      toast({
        title: "Data saved",
        description: "Step data has been automatically saved."
      });
    } catch (error) {
      console.error('Error saving step data:', error);
      toast({
        title: "Save failed",
        description: "There was an error saving your data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = async () => {
    // For first step, generate a temporary client ID for unauthenticated users
    if (currentStep === 0 && !clientId) {
      // Generate temporary ID for local tracking
      const tempId = `temp-${Date.now()}`;
      setClientId(tempId);
    }

    // Save to database only if we have a real (non-temporary) client ID
    if (currentStep === 1 && clientId && !clientId.startsWith('temp-')) {
      await saveStepData({ 
        income_jsonb: incomeData,
        expenses_jsonb: {
          fixed_expenses: incomeData.fixed_expenses,
          variable_expenses: incomeData.variable_expenses,
          debt_service: incomeData.debt_service
        }
      });
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step - compute metrics and show report
      await generateReport();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const generateReport = async () => {
    if (!clientId) return;

    setIsLoading(true);
    try {
      // Compute risk metrics (works with temp ID for unauthenticated users)
      const metrics = await computeRiskMetrics(clientId, {
        profileData,
        incomeData,
        assets,
        liabilities,
        protectionData,
        preferencesData: {
          risk_tolerance: 5,
          loss_aversion: 5,
          investment_knowledge: 3,
          sequence_risk_sensitivity: 'medium',
          tax_sensitivity: 'medium',
          ethical_exclusions: []
        }
      });

      // Compute retirement readiness
      const retirement = computeRetirementReadiness(
        profileData,
        incomeData,
        assets,
        liabilities,
        protectionData,
        metrics,
        {
          retirement_lifestyle: profileData.retirement_lifestyle || 'comfortable',
          spending_target_method: profileData.spending_target_method || 'fixed',
          spending_percent_of_income: profileData.spending_percent_of_income || 80,
          planned_retirement_state: profileData.planned_retirement_state || profileData.state,
          annual_retirement_contribution: incomeData.annual_retirement_contribution || 0,
          contribution_growth_rate: incomeData.contribution_growth_rate || 2,
          social_security_confidence: incomeData.social_security_confidence || 'medium',
          expected_part_time_income: incomeData.expected_part_time_income || 0,
          prefers_guaranteed_income: protectionData.prefers_guaranteed_income || false,
          liquidity_need_next_5yr: protectionData.liquidity_need_next_5yr || 'medium',
          can_commit_10yr_contributions: protectionData.can_commit_10yr_contributions || false,
          open_to_tax_diversification: protectionData.open_to_tax_diversification || false
        }
      );

      // Only save to database if not a temporary ID
      if (!clientId.startsWith('temp-')) {
        const { error: metricsError } = await supabase
          .from('computed_metrics')
          .upsert({ ...metrics, client_id: clientId });

        if (metricsError) throw metricsError;
      }

      setComputedMetrics(metrics);
      setRetirementResult(retirement);

      // Show report modal
      setShowReport(true);

      toast({
        title: "Report generated",
        description: "Your comprehensive Retirement Readiness Report is ready."
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Report generation failed",
        description: "There was an error generating the report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <ProfileGoalsForm 
            data={profileData} 
            onChange={setProfileData}
            onValidationChange={() => {}} 
          />
        );
      case 1:
        return (
          <IncomeExpensesForm 
            data={incomeData} 
            onChange={setIncomeData}
            onValidationChange={() => {}} 
          />
        );
      case 2:
        return (
          <AssetsForm 
            data={assets} 
            onChange={setAssets}
            clientId={clientId}
            onValidationChange={() => {}} 
          />
        );
      case 3:
        return (
          <LiabilitiesForm 
            data={liabilities} 
            onChange={setLiabilities}
            clientId={clientId}
            onValidationChange={() => {}} 
          />
        );
      case 4:
        return (
          <RetirementPlanningForm 
            profileData={profileData}
            incomeData={incomeData}
            protectionData={protectionData}
            planningReadiness={planningReadiness}
            onProfileChange={setProfileData}
            onIncomeChange={setIncomeData}
            onProtectionChange={setProtectionData}
            onPlanningReadinessChange={setPlanningReadiness}
            hasEmployerMatch={incomeData.employer_match_pct > 0}
          />
        );
      case 5:
        return (
          <ProtectionHealthForm 
            data={protectionData} 
            planningReadiness={planningReadiness}
            onChange={setProtectionData}
            onPlanningReadinessChange={setPlanningReadiness}
            onValidationChange={() => {}}
            hasEmployerMatch={incomeData.employer_match_pct > 0}
          />
        );
      default:
        return null;
    }
  };

  const currentStepData = STEPS[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
<div className="flex items-center space-x-4">
              {!isModal && (
                <Button variant="outline" size="sm" onClick={() => navigate('/')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Home
                </Button>
              )}
              <h1 className="text-3xl font-bold text-gray-900">
                Financial Risk Assessment
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                Step {currentStep + 1} of {STEPS.length}
              </div>
              {isModal && onClose && (
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-5 h-5" />
                </Button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Progress: {Math.round(progressPercentage)}% Complete
              </span>
              <span className="text-sm text-gray-500">
                {currentStepData.label}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Steps Navigation */}
          <div className="flex justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;

              return (
                <div
                  key={step.id}
                  className={`flex flex-col items-center space-y-2 ${
                    isActive ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-gray-400'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                      isActive
                        ? 'border-primary bg-primary/10'
                        : isCompleted
                        ? 'border-green-600 bg-green-100'
                        : 'border-gray-300 bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-xs font-medium text-center max-w-20">
                    {step.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Step Content */}
        <Card className="shadow-xl">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
            <CardTitle className="flex items-center space-x-3">
              <currentStepData.icon className="h-6 w-6 text-primary" />
              <span>{currentStepData.label}</span>
            </CardTitle>
            <CardDescription className="text-base">
              {currentStepData.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            {renderCurrentStep()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button 
                variant="outline" 
                onClick={handleBack}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              
              <Button 
                onClick={handleNext}
                disabled={isLoading}
                className="min-w-32"
              >
                {isLoading ? (
                  'Processing...'
                ) : currentStep === STEPS.length - 1 ? (
                  'Generate Report'
                ) : (
                  'Next Step'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Report Modal */}
        {showReport && computedMetrics && clientId && (
          <ReportModal
            isOpen={showReport}
            onClose={() => setShowReport(false)}
            clientId={clientId}
            metrics={computedMetrics}
            retirementResult={retirementResult}
            profileData={profileData}
            incomeData={incomeData}
            assets={assets}
            liabilities={liabilities}
            protectionData={protectionData}
            planningReadiness={planningReadiness}
          />
        )}
      </div>
    </div>
  );
}