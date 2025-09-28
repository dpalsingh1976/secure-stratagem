import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Users, DollarSign, Shield, Target, BarChart3 } from 'lucide-react';
import { ProfileGoalsForm } from '@/components/financial/ProfileGoalsForm';
import { IncomeExpensesForm } from '@/components/financial/IncomeExpensesForm';
import { AssetsForm } from '@/components/financial/AssetsForm';
import { LiabilitiesForm } from '@/components/financial/LiabilitiesForm';
import { ProtectionHealthForm } from '@/components/financial/ProtectionHealthForm';
import { RiskPreferencesForm } from '@/components/financial/RiskPreferencesForm';
import { ReportModal } from '@/components/financial/ReportModal';
import { computeRiskMetrics } from '@/utils/riskComputation';
import type { 
  Client, 
  ProfileGoalsData, 
  IncomeExpensesData, 
  AssetFormData, 
  LiabilityFormData, 
  ProtectionHealthData, 
  RiskPreferencesData,
  ComputedMetrics
} from '@/types/financial';

const STEPS = [
  { id: 'profile', label: 'Profile & Goals', icon: Users, description: 'Client information and retirement goals' },
  { id: 'income', label: 'Income & Expenses', icon: DollarSign, description: 'Monthly income sources and expenses' },
  { id: 'assets', label: 'Assets', icon: BarChart3, description: 'All investments and holdings' },
  { id: 'liabilities', label: 'Liabilities', icon: FileText, description: 'Debts and obligations' },
  { id: 'protection', label: 'Protection & Health', icon: Shield, description: 'Insurance coverage and health planning' },
  { id: 'preferences', label: 'Risk Preferences', icon: Target, description: 'Risk tolerance and constraints' }
];

export default function RiskIntake() {
  const { user, hasRole } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [clientId, setClientId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [computedMetrics, setComputedMetrics] = useState<ComputedMetrics | null>(null);

  // Form data states
  const [profileData, setProfileData] = useState<ProfileGoalsData>({
    name_first: '',
    name_last: '',
    dob: '',
    state: '',
    filing_status: 'single',
    dependents: 0,
    retirement_age: 65,
    desired_monthly_income: 0,
    drawdown_tolerance: 25,
    liquidity_buffer_months: 6,
    concentration_threshold: 10,
    insurance_priorities: []
  });

  const [incomeData, setIncomeData] = useState<IncomeExpensesData>({
    w2_income: 0,
    business_income: 0,
    rental_income: 0,
    pension_income: 0,
    social_security: 0,
    annuity_income: 0,
    federal_taxes: 0,
    state_taxes: 0,
    fixed_expenses: 0,
    variable_expenses: 0,
    debt_service: 0,
    employer_match_pct: 0,
    hsa_eligible: false
  });

  const [assets, setAssets] = useState<AssetFormData[]>([]);
  const [liabilities, setLiabilities] = useState<LiabilityFormData[]>([]);
  const [protectionData, setProtectionData] = useState<ProtectionHealthData>({
    term_life_coverage: 0,
    term_life_years: 0,
    permanent_life_cv: 0,
    permanent_life_db: 0,
    disability_coverage: 0,
    disability_benefit: 0,
    ltc_daily_benefit: 0,
    ltc_benefit_period: 0,
    emergency_fund_months: 0
  });

  const [preferencesData, setPreferencesData] = useState<RiskPreferencesData>({
    risk_tolerance: 5,
    loss_aversion: 5,
    investment_knowledge: 3,
    sequence_risk_sensitivity: 'medium',
    tax_sensitivity: 'medium',
    ethical_exclusions: []
  });

  useEffect(() => {
    if (!user || !hasRole('advisor')) {
      window.location.href = '/auth';
    }
  }, [user, hasRole]);

  const progressPercentage = ((currentStep + 1) / STEPS.length) * 100;

  const saveStepData = async (stepData: any, tableName: string) => {
    if (!clientId || !user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from(tableName)
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
    // Save current step data before proceeding
    switch (currentStep) {
      case 0:
        if (!clientId) {
          // Create new client
          const { data: client, error } = await supabase
            .from('clients')
            .insert({
              advisor_id: user?.id,
              name_first: profileData.name_first,
              name_last: profileData.name_last,
              dob: profileData.dob,
              state: profileData.state,
              filing_status: profileData.filing_status,
              household_jsonb: { dependents: profileData.dependents }
            })
            .select()
            .single();

          if (error) {
            toast({
              title: "Error creating client",
              description: error.message,
              variant: "destructive"
            });
            return;
          }

          setClientId(client.id);

          // Save financial profile
          await supabase
            .from('financial_profile')
            .insert({
              client_id: client.id,
              goals_jsonb: {
                retirement_age: profileData.retirement_age,
                desired_monthly_income: profileData.desired_monthly_income,
                drawdown_tolerance: profileData.drawdown_tolerance,
                liquidity_buffer_months: profileData.liquidity_buffer_months,
                concentration_threshold: profileData.concentration_threshold,
                insurance_priorities: profileData.insurance_priorities
              }
            });
        }
        break;
      case 1:
        await saveStepData(
          { 
            income_jsonb: incomeData,
            expenses_jsonb: {
              federal_taxes: incomeData.federal_taxes,
              state_taxes: incomeData.state_taxes,
              fixed_expenses: incomeData.fixed_expenses,
              variable_expenses: incomeData.variable_expenses,
              debt_service: incomeData.debt_service
            }
          },
          'financial_profile'
        );
        break;
      // Assets and liabilities are saved individually as they're added
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
      // Compute risk metrics
      const metrics = await computeRiskMetrics(clientId, {
        profileData,
        incomeData,
        assets,
        liabilities,
        protectionData,
        preferencesData
      });

      // Save computed metrics
      const { error: metricsError } = await supabase
        .from('computed_metrics')
        .upsert({ ...metrics, client_id: clientId });

      if (metricsError) throw metricsError;

      setComputedMetrics(metrics);
      setShowReport(true);

      toast({
        title: "Report generated",
        description: "Risk assessment completed successfully."
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
          <ProtectionHealthForm 
            data={protectionData} 
            onChange={setProtectionData}
            onValidationChange={() => {}} 
          />
        );
      case 5:
        return (
          <RiskPreferencesForm 
            data={preferencesData} 
            onChange={setPreferencesData}
            onValidationChange={() => {}} 
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
              <Button variant="outline" size="sm" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">
                Financial Risk Assessment
              </h1>
            </div>
            <div className="text-sm text-gray-600">
              Step {currentStep + 1} of {STEPS.length}
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
            profileData={profileData}
            incomeData={incomeData}
            assets={assets}
            liabilities={liabilities}
            protectionData={protectionData}
          />
        )}
      </div>
    </div>
  );
}