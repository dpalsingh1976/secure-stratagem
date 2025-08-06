import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import AssessmentForm from "@/components/AssessmentForm";
import ResultsModal from "@/components/ResultsModal";

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

interface AssessmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AssessmentModal = ({ open, onOpenChange }: AssessmentModalProps) => {
  const [showResults, setShowResults] = useState(false);
  const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(null);

  const handleAssessmentSubmit = (data: AssessmentData) => {
    setAssessmentData(data);
    setShowResults(true);
  };

  const handleClose = () => {
    setShowResults(false);
    setAssessmentData(null);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open && !showResults} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-heading text-center">
              Complete Your Risk Assessment
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <AssessmentForm onSubmit={handleAssessmentSubmit} onClose={() => onOpenChange(false)} />
          </div>
        </DialogContent>
      </Dialog>

      {showResults && assessmentData && (
        <ResultsModal
          open={showResults}
          onOpenChange={setShowResults}
          assessmentData={assessmentData}
          onClose={handleClose}
        />
      )}
    </>
  );
};

export default AssessmentModal;