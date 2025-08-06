import { useState } from "react";
import AssessmentForm from "@/components/AssessmentForm";
import ChatBot from "@/components/ChatBot";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface AssessmentData {
  age: string;
  annualIncome: string;
  maritalStatus: string;
  dependents: string;
  monthlyExpenses: string;
  totalDebt: string;
  emergencyFund: string;
  homeValue: string;
  lifeInsurance: string;
  retirementSavings: string;
  investmentAccounts: string;
  employerBenefits: string;
  retirementAge: string;
  retirementIncome: string;
  riskTolerance: string;
  estatePlanning: string;
}

const Assessment = () => {
  const handleAssessmentSubmit = (data: AssessmentData) => {
    // Here we would normally call an API to calculate risk scores
    // For now, we'll redirect to results with the data
    console.log("Assessment data:", data);
    
    // Store data in sessionStorage and redirect to results
    sessionStorage.setItem('assessmentData', JSON.stringify(data));
    window.location.href = '/results';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="container-financial py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.history.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold font-heading">Smart Risk Analyzer</h1>
                <p className="text-sm text-muted-foreground">AI-Powered Financial Risk Assessment</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">Secure Assessment</div>
              <div className="text-xs text-muted-foreground">Your data is protected</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="section-padding">
        <div className="container-financial">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-4 font-heading">
              Complete Your Risk Assessment
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Answer a few questions to get your personalized financial risk analysis. 
              This assessment takes about 5 minutes and is completely confidential.
            </p>
          </div>

          <AssessmentForm onSubmit={handleAssessmentSubmit} />
        </div>
      </main>

      <ChatBot />
    </div>
  );
};

export default Assessment;