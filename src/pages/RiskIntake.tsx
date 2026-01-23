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
    other_guaranteed_income_monthly: 0,
    // Available Cash & Rollover Assets
    monthly_checking_balance: 0,
    has_old_401k: false,
    old_401k_balance: 0,
    old_401k_employer_name: ''
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

  const createClientRecord = async (): Promise<string | null> => {
    // Validate minimum required data
    if (!profileData.name_first || !profileData.state || !profileData.dob) {
      toast({
        title: "Missing required fields",
        description: "Please fill in First Name, State, and Date of Birth.",
        variant: "destructive"
      });
      return null;
    }

    try {
      // Use security definer RPC function to create guest client
      const { data, error } = await supabase.rpc('create_guest_client', {
        p_name_first: profileData.name_first,
        p_name_last: profileData.name_last || '',
        p_email: profileData.email || null,
        p_dob: profileData.dob,
        p_state: profileData.state,
        p_filing_status: profileData.filing_status || 'single',
        p_household_jsonb: {
          dependents: profileData.dependents || 0,
          retirement_age: profileData.retirement_age,
          desired_monthly_income: profileData.desired_monthly_income,
          primary_retirement_goal: profileData.primary_retirement_goal,
          retirement_lifestyle: profileData.retirement_lifestyle,
          spending_target_method: profileData.spending_target_method,
          spending_percent_of_income: profileData.spending_percent_of_income,
          planned_retirement_state: profileData.planned_retirement_state
        }
      });

      if (error) throw error;

      toast({
        title: "Client record created",
        description: `Profile saved for ${profileData.name_first} ${profileData.name_last}.`
      });

      return data; // Returns the new client UUID
    } catch (error) {
      console.error('Error creating client record:', error);
      toast({
        title: "Error saving profile",
        description: "Could not save client data. Continuing with local-only mode.",
        variant: "destructive"
      });
      return null;
    }
  };

  const saveAllFormData = async (id: string) => {
    try {
      // Use RPC functions to bypass RLS for guest data saving
      
      // Save financial profile via RPC
      const { error: profileError } = await supabase.rpc('save_guest_financial_profile', {
        p_client_id: id,
        p_income_jsonb: JSON.parse(JSON.stringify(incomeData)),
        p_expenses_jsonb: JSON.parse(JSON.stringify({
          fixed_expenses: incomeData.fixed_expenses,
          variable_expenses: incomeData.variable_expenses,
          debt_service: incomeData.debt_service
        })),
        p_goals_jsonb: JSON.parse(JSON.stringify({
          retirement_age: profileData.retirement_age,
          desired_monthly_income: profileData.desired_monthly_income,
          insurance_priorities: profileData.insurance_priorities,
          primary_retirement_goal: profileData.primary_retirement_goal
        })),
        p_preferences_jsonb: JSON.parse(JSON.stringify({
          liquidity_need_next_5yr: protectionData.liquidity_need_next_5yr,
          prefers_guaranteed_income: protectionData.prefers_guaranteed_income,
          can_commit_10yr_contributions: protectionData.can_commit_10yr_contributions,
          open_to_tax_diversification: protectionData.open_to_tax_diversification
        }))
      });
      
      if (profileError) {
        console.error('Error saving financial profile:', profileError);
      }

      // Save assets via RPC if any exist
      if (assets.length > 0) {
        const assetsToSave = assets.map(asset => ({
          asset_type: asset.asset_type,
          description: asset.title || asset.notes || '',
          current_value: asset.current_value,
          tax_wrapper: asset.tax_wrapper,
          owner: 'primary'
        }));
        
        const { error: assetsError } = await supabase.rpc('save_guest_assets', {
          p_client_id: id,
          p_assets: assetsToSave
        });
        
        if (assetsError) {
          console.error('Error saving assets:', assetsError);
        }
      }

      // Save liabilities via RPC if any exist
      if (liabilities.length > 0) {
        const liabilitiesToSave = liabilities.map(l => ({
          liability_type: l.type,
          description: l.notes || '',
          balance: l.balance,
          interest_rate: l.rate,
          monthly_payment: l.payment_monthly
        }));
        
        const { error: liabilitiesError } = await supabase.rpc('save_guest_liabilities', {
          p_client_id: id,
          p_liabilities: liabilitiesToSave
        });
        
        if (liabilitiesError) {
          console.error('Error saving liabilities:', liabilitiesError);
        }
      }

      // Save insurances via RPC
      const insurancesToSave = [];
      
      if (protectionData.term_life_coverage > 0) {
        insurancesToSave.push({
          insurance_type: 'life_term',
          provider: '',
          policy_number: '',
          coverage_amount: protectionData.term_life_coverage,
          premium_annual: 0,
          beneficiary: ''
        });
      }

      if (protectionData.permanent_life_db > 0) {
        insurancesToSave.push({
          insurance_type: 'life_whole',
          provider: '',
          policy_number: '',
          coverage_amount: protectionData.permanent_life_db,
          premium_annual: 0,
          beneficiary: ''
        });
      }

      if (insurancesToSave.length > 0) {
        const { error: insurancesError } = await supabase.rpc('save_guest_insurances', {
          p_client_id: id,
          p_insurances: insurancesToSave
        });
        
        if (insurancesError) {
          console.error('Error saving insurances:', insurancesError);
        }
      }

      console.log('All form data saved successfully for client:', id);
    } catch (error) {
      console.error('Error saving form data:', error);
    }
  };

  const handleNext = async () => {
    // After ProfileGoalsForm (step 0), create client record
    if (currentStep === 0 && !clientId) {
      setIsLoading(true);
      const newClientId = await createClientRecord();
      setIsLoading(false);
      
      if (newClientId) {
        setClientId(newClientId);
      } else {
        // Fall back to temp ID if client creation fails
        setClientId(`temp-${Date.now()}`);
      }
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step - save all data and generate report
      if (clientId && !clientId.startsWith('temp-')) {
        await saveAllFormData(clientId);
      }
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
            incomeData={incomeData}
            onIncomeChange={setIncomeData}
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