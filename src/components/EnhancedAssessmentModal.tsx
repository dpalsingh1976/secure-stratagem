import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Mail, Phone, User, Download } from "lucide-react";
import AssessmentForm from "@/components/AssessmentForm";
import EnhancedResultsModal from "@/components/EnhancedResultsModal";
import { useToast } from "@/components/ui/use-toast";

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

interface ContactInfo {
  name: string;
  email: string;
  phone: string;
}

interface EnhancedAssessmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EnhancedAssessmentModal = ({ open, onOpenChange }: EnhancedAssessmentModalProps) => {
  const [step, setStep] = useState<'contact' | 'assessment' | 'results'>('contact');
  const [contactInfo, setContactInfo] = useState<ContactInfo>({ name: '', email: '', phone: '' });
  const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(null);
  const { toast } = useToast();

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactInfo.name || !contactInfo.email) {
      toast({
        title: "Required Information",
        description: "Please provide your name and email to continue.",
        variant: "destructive"
      });
      return;
    }
    setStep('assessment');
  };

  const handleAssessmentSubmit = (data: AssessmentData) => {
    setAssessmentData(data);
    setStep('results');
  };

  const handleClose = () => {
    setStep('contact');
    setContactInfo({ name: '', email: '', phone: '' });
    setAssessmentData(null);
    onOpenChange(false);
  };

  const isContactFormValid = contactInfo.name.trim() && contactInfo.email.trim();

  return (
    <>
      {/* Contact Information Step */}
      <Dialog open={open && step === 'contact'} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-heading text-center text-gradient-primary">
              Get Your Free Risk Assessment
            </DialogTitle>
          </DialogHeader>
          
          <Card className="card-financial">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-lg">Your Information</CardTitle>
              <CardDescription>
                We'll use this to personalize your risk analysis and send you the results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Full Name *
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={contactInfo.name}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your full name"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={contactInfo.email}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email address"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone Number (Optional)
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={contactInfo.phone}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter your phone number"
                    className="mt-1"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full btn-primary"
                  disabled={!isContactFormValid}
                >
                  Start Assessment
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                
                <p className="text-xs text-muted-foreground text-center">
                  Your information is secure and will only be used to provide your personalized risk assessment.
                </p>
              </form>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>

      {/* Assessment Step */}
      <Dialog open={open && step === 'assessment'} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-heading text-center">
              Complete Your Risk Assessment
            </DialogTitle>
            <p className="text-center text-muted-foreground">
              For {contactInfo.name} • {contactInfo.email}
            </p>
          </DialogHeader>
          <div className="mt-4">
            <AssessmentForm 
              onSubmit={handleAssessmentSubmit} 
              onClose={() => setStep('contact')} 
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Results Step */}
      {step === 'results' && assessmentData && (
        <EnhancedResultsModal
          open={true}
          onOpenChange={(open) => !open && handleClose()}
          assessmentData={assessmentData}
          contactInfo={contactInfo}
          onClose={handleClose}
        />
      )}
    </>
  );
};

export default EnhancedAssessmentModal;