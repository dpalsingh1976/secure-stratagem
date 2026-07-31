import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LabelWithHelp } from "@/components/financial/FieldHelp";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, User, DollarSign, Shield, Target } from "lucide-react";

interface AssessmentData {
  // Step 1: Personal Info
  age: string;
  annualIncome: string;
  maritalStatus: string;
  dependents: string;
  
  // Step 2: Financial Snapshot
  monthlyExpenses: string;
  totalDebt: string;
  emergencyFund: string;
  homeValue: string;
  
  // Step 3: Current Protection
  lifeInsurance: string;
  retirementSavings: string;
  investmentAccounts: string;
  employerBenefits: string;
  
  // Step 4: Goals & Planning
  retirementAge: string;
  retirementIncome: string;
  riskTolerance: string;
  estatePlanning: string;
}

interface AssessmentFormProps {
  onSubmit: (data: AssessmentData) => void;
  onClose?: () => void;
}

const AssessmentForm = ({ onSubmit, onClose }: AssessmentFormProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<AssessmentData>({
    age: "",
    annualIncome: "",
    maritalStatus: "",
    dependents: "",
    monthlyExpenses: "",
    totalDebt: "",
    emergencyFund: "",
    homeValue: "",
    lifeInsurance: "",
    retirementSavings: "",
    investmentAccounts: "",
    employerBenefits: "",
    retirementAge: "",
    retirementIncome: "",
    riskTolerance: "",
    estatePlanning: ""
  });

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const updateFormData = (field: keyof AssessmentData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      onSubmit(formData);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getStepIcon = (step: number) => {
    switch (step) {
      case 1: return User;
      case 2: return DollarSign;
      case 3: return Shield;
      case 4: return Target;
      default: return User;
    }
  };

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1: return "Personal Information";
      case 2: return "Financial Snapshot";
      case 3: return "Current Protection";
      case 4: return "Goals & Planning";
      default: return "";
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <LabelWithHelp
                  htmlFor="age"
                  label="Age"
                  help="Your current age. It sets your time horizon to retirement and strongly affects insurance cost and how much risk your plan can absorb."
                />
                <Select value={formData.age} onValueChange={(value) => updateFormData("age", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your age" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 51 }, (_, i) => i + 20).map(age => (
                      <SelectItem key={age} value={age.toString()}>{age}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <LabelWithHelp
                  htmlFor="income"
                  label="Annual Income"
                  help="Your household gross pay before taxes, from all sources. Used to size income replacement, savings capacity, and retirement targets."
                />
                <Select value={formData.annualIncome} onValueChange={(value) => updateFormData("annualIncome", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select income range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under50k">Under $50,000</SelectItem>
                    <SelectItem value="50k-75k">$50,000 - $75,000</SelectItem>
                    <SelectItem value="75k-100k">$75,000 - $100,000</SelectItem>
                    <SelectItem value="100k-150k">$100,000 - $150,000</SelectItem>
                    <SelectItem value="150k-200k">$150,000 - $200,000</SelectItem>
                    <SelectItem value="200k-300k">$200,000 - $300,000</SelectItem>
                    <SelectItem value="over300k">Over $300,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <LabelWithHelp
                  htmlFor="marital"
                  label="Marital Status"
                  help="Affects your tax filing status and who would depend on your income. This assessment is scored for you as an individual."
                />
                <Select value={formData.maritalStatus} onValueChange={(value) => updateFormData("maritalStatus", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="married">Married</SelectItem>
                    <SelectItem value="divorced">Divorced</SelectItem>
                    <SelectItem value="widowed">Widowed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <LabelWithHelp
                  htmlFor="dependents"
                  label="Number of Dependents"
                  help="Anyone financially reliant on you — children, or family you support. Each dependent raises your protection and education need."
                />
                <Select value={formData.dependents} onValueChange={(value) => updateFormData("dependents", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select number" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0</SelectItem>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4+">4 or more</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <LabelWithHelp
                  htmlFor="expenses"
                  label="Monthly Expenses"
                  help="Everything you spend in a typical month: housing, food, insurance, loan payments, and discretionary spending. Drives your emergency fund target and savings capacity."
                />
                <Select value={formData.monthlyExpenses} onValueChange={(value) => updateFormData("monthlyExpenses", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under3k">Under $3,000</SelectItem>
                    <SelectItem value="3k-5k">$3,000 - $5,000</SelectItem>
                    <SelectItem value="5k-8k">$5,000 - $8,000</SelectItem>
                    <SelectItem value="8k-12k">$8,000 - $12,000</SelectItem>
                    <SelectItem value="over12k">Over $12,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <LabelWithHelp
                  htmlFor="debt"
                  label="Total Debt (excluding mortgage)"
                  help="Credit cards, auto loans, student loans, and personal loans. Leave your mortgage out — it is captured by home value. High non-mortgage debt raises your risk score."
                />
                <Select value={formData.totalDebt} onValueChange={(value) => updateFormData("totalDebt", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No debt</SelectItem>
                    <SelectItem value="under25k">Under $25,000</SelectItem>
                    <SelectItem value="25k-50k">$25,000 - $50,000</SelectItem>
                    <SelectItem value="50k-100k">$50,000 - $100,000</SelectItem>
                    <SelectItem value="over100k">Over $100,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <LabelWithHelp
                  htmlFor="emergency"
                  label="Emergency Fund"
                  help="Cash you can reach immediately, measured in months of expenses. Three to six months is the general benchmark; less than that leaves you exposed to a job loss or medical event."
                />
                <Select value={formData.emergencyFund} onValueChange={(value) => updateFormData("emergencyFund", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select amount" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No emergency fund</SelectItem>
                    <SelectItem value="1-3months">1-3 months expenses</SelectItem>
                    <SelectItem value="3-6months">3-6 months expenses</SelectItem>
                    <SelectItem value="6+months">6+ months expenses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <LabelWithHelp
                  htmlFor="home"
                  label="Home Value"
                  help="The current market value of the home you own, or choose the rent option. Used for net worth and to estimate the mortgage protection your family would need."
                />
                <Select value={formData.homeValue} onValueChange={(value) => updateFormData("homeValue", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rent">I rent</SelectItem>
                    <SelectItem value="under300k">Under $300,000</SelectItem>
                    <SelectItem value="300k-500k">$300,000 - $500,000</SelectItem>
                    <SelectItem value="500k-750k">$500,000 - $750,000</SelectItem>
                    <SelectItem value="over750k">Over $750,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <LabelWithHelp
                  htmlFor="life-insurance"
                  label="Life Insurance Coverage"
                  help="The total death benefit already in force across all policies, including any coverage through work. Compared against your calculated need to find your protection gap."
                />
                <Select value={formData.lifeInsurance} onValueChange={(value) => updateFormData("lifeInsurance", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select coverage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No coverage</SelectItem>
                    <SelectItem value="under100k">Under $100,000</SelectItem>
                    <SelectItem value="100k-250k">$100,000 - $250,000</SelectItem>
                    <SelectItem value="250k-500k">$250,000 - $500,000</SelectItem>
                    <SelectItem value="500k-1m">$500,000 - $1,000,000</SelectItem>
                    <SelectItem value="over1m">Over $1,000,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <LabelWithHelp
                  htmlFor="retirement"
                  label="Retirement Savings"
                  help="Combined balance of your 401(k), IRA, and pension accounts. This is the base your retirement projection grows from."
                />
                <Select value={formData.retirementSavings} onValueChange={(value) => updateFormData("retirementSavings", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select amount" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No savings</SelectItem>
                    <SelectItem value="under50k">Under $50,000</SelectItem>
                    <SelectItem value="50k-100k">$50,000 - $100,000</SelectItem>
                    <SelectItem value="100k-250k">$100,000 - $250,000</SelectItem>
                    <SelectItem value="250k-500k">$250,000 - $500,000</SelectItem>
                    <SelectItem value="over500k">Over $500,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <LabelWithHelp
                  htmlFor="investments"
                  label="Investment Accounts"
                  help="Taxable brokerage, mutual fund, and savings balances outside retirement accounts. These are typically your most flexible, liquid assets."
                />
                <Select value={formData.investmentAccounts} onValueChange={(value) => updateFormData("investmentAccounts", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select amount" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No investments</SelectItem>
                    <SelectItem value="under25k">Under $25,000</SelectItem>
                    <SelectItem value="25k-50k">$25,000 - $50,000</SelectItem>
                    <SelectItem value="50k-100k">$50,000 - $100,000</SelectItem>
                    <SelectItem value="over100k">Over $100,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <LabelWithHelp
                  htmlFor="benefits"
                  label="Employer Benefits"
                  help="What your job provides: group life, disability, health, and a retirement match. Employer coverage usually ends when the job does, so it is counted differently from personal coverage."
                />
                <Select value={formData.employerBenefits} onValueChange={(value) => updateFormData("employerBenefits", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select coverage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No employer benefits</SelectItem>
                    <SelectItem value="basic">Basic life insurance only</SelectItem>
                    <SelectItem value="standard">Standard package</SelectItem>
                    <SelectItem value="comprehensive">Comprehensive package</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <LabelWithHelp
                  htmlFor="retirement-age"
                  label="Planned Retirement Age"
                  help="When you intend to stop working. Retiring earlier means fewer years to save and more years to fund, which raises your required savings rate."
                />
                <Select value={formData.retirementAge} onValueChange={(value) => updateFormData("retirementAge", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select age" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="55">55</SelectItem>
                    <SelectItem value="60">60</SelectItem>
                    <SelectItem value="62">62</SelectItem>
                    <SelectItem value="65">65</SelectItem>
                    <SelectItem value="67">67</SelectItem>
                    <SelectItem value="70">70</SelectItem>
                    <SelectItem value="never">Never retire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <LabelWithHelp
                  htmlFor="retirement-income"
                  label="Desired Retirement Income"
                  help="What share of today’s income you want in retirement. Most planners use 70-80%, since work costs and payroll taxes disappear."
                />
                <Select value={formData.retirementIncome} onValueChange={(value) => updateFormData("retirementIncome", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select percentage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="60">60% of current income</SelectItem>
                    <SelectItem value="70">70% of current income</SelectItem>
                    <SelectItem value="80">80% of current income</SelectItem>
                    <SelectItem value="90">90% of current income</SelectItem>
                    <SelectItem value="100">100% of current income</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <LabelWithHelp
                  htmlFor="risk-tolerance"
                  label="Risk Tolerance"
                  help="How much market swing you can accept without changing course. Conservative favors guarantees and protection; aggressive favors growth with more volatility."
                />
                <Select value={formData.riskTolerance} onValueChange={(value) => updateFormData("riskTolerance", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tolerance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conservative">Conservative</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="aggressive">Aggressive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <LabelWithHelp
                  htmlFor="estate"
                  label="Estate Planning"
                  help="Whether you have a will, trust, and up-to-date beneficiary designations. Without them, state law decides how your assets pass on."
                />
                <Select value={formData.estatePlanning} onValueChange={(value) => updateFormData("estatePlanning", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No estate planning</SelectItem>
                    <SelectItem value="basic">Basic will only</SelectItem>
                    <SelectItem value="standard">Will and trust</SelectItem>
                    <SelectItem value="comprehensive">Comprehensive estate plan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const StepIcon = getStepIcon(currentStep);

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="card-financial">
        <CardHeader className="text-center pb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-primary rounded-xl">
              <StepIcon className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-heading">
            Step {currentStep} of {totalSteps}: {getStepTitle(currentStep)}
          </CardTitle>
          <CardDescription className="text-lg">
            {currentStep === 1 && "Tell us about yourself and your family"}
            {currentStep === 2 && "Help us understand your financial situation"}
            {currentStep === 3 && "What protection do you currently have?"}
            {currentStep === 4 && "What are your future goals and plans?"}
          </CardDescription>
          <Progress value={progress} className="w-full mt-4" />
          <div className="text-sm text-muted-foreground mt-2">
            {Math.round(progress)}% Complete
          </div>
        </CardHeader>

        <CardContent className="pb-8">
          {renderStepContent()}
          
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            
            <Button
              className="btn-primary"
              onClick={nextStep}
            >
              {currentStep === totalSteps ? "Get My Risk Analysis" : "Next Step"}
              {currentStep < totalSteps && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssessmentForm;