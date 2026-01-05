import { useState, useMemo } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { WizardStep1 } from "@/components/calculators/529-vs-iul/WizardStep1";
import { WizardStep2 } from "@/components/calculators/529-vs-iul/WizardStep2";
import { WizardStep3 } from "@/components/calculators/529-vs-iul/WizardStep3";
import { ResultsDashboard } from "@/components/calculators/529-vs-iul/ResultsDashboard";
import { Plan529VsIulInputs, DEFAULT_INPUTS } from "@/types/plan529VsIul";
import { compute529VsIulComparison } from "@/engine/comparisons/plan529VsIul";

const STEPS = [
  { id: 1, title: "Goals", description: "What are you planning for?" },
  { id: 2, title: "Certainty", description: "How sure is education?" },
  { id: 3, title: "Funding", description: "Contribution details" },
];

export default function Plan529VsIul() {
  const [currentStep, setCurrentStep] = useState(1);
  const [showResults, setShowResults] = useState(false);
  const [inputs, setInputs] = useState<Plan529VsIulInputs>(DEFAULT_INPUTS);

  const progress = showResults ? 100 : ((currentStep - 1) / STEPS.length) * 100;

  const handleInputChange = <K extends keyof Plan529VsIulInputs>(
    key: K,
    value: Plan529VsIulInputs[K]
  ) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const canProceed = useMemo(() => {
    if (currentStep === 1) return inputs.goals.length > 0;
    return true;
  }, [currentStep, inputs.goals.length]);

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowResults(true);
    }
  };

  const handleBack = () => {
    if (showResults) {
      setShowResults(false);
    } else if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleReset = () => {
    setInputs(DEFAULT_INPUTS);
    setCurrentStep(1);
    setShowResults(false);
  };

  const result = useMemo(() => {
    if (showResults) {
      return compute529VsIulComparison(inputs);
    }
    return null;
  }, [showResults, inputs]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            529 vs IUL Comparison
          </h1>
          <p className="text-lg text-muted-foreground">
            18-Year Education & Flex Savings Planning
          </p>
        </div>

        {/* Progress */}
        {!showResults && (
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {STEPS.map((step) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-2 ${
                    currentStep === step.id
                      ? "text-primary font-medium"
                      : currentStep > step.id
                      ? "text-green-600 dark:text-green-400"
                      : "text-muted-foreground"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 ${
                      currentStep === step.id
                        ? "border-primary bg-primary text-primary-foreground"
                        : currentStep > step.id
                        ? "border-green-600 bg-green-600 text-white dark:border-green-400 dark:bg-green-400"
                        : "border-muted-foreground/30"
                    }`}
                  >
                    {currentStep > step.id ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm">{step.title}</p>
                  </div>
                </div>
              ))}
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Content */}
        <Card className="mb-8">
          <CardContent className="p-6 md:p-8">
            {showResults && result ? (
              <ResultsDashboard result={result} inputs={inputs} />
            ) : (
              <>
                {currentStep === 1 && (
                  <WizardStep1
                    goals={inputs.goals}
                    onGoalsChange={(goals) => handleInputChange("goals", goals)}
                  />
                )}
                {currentStep === 2 && (
                  <WizardStep2
                    educationProbability={inputs.educationProbability}
                    scholarshipLikely={inputs.scholarshipLikely}
                    nonTraditionalPath={inputs.nonTraditionalPath}
                    onEducationProbabilityChange={(value) =>
                      handleInputChange("educationProbability", value)
                    }
                    onScholarshipLikelyChange={(value) =>
                      handleInputChange("scholarshipLikely", value)
                    }
                    onNonTraditionalPathChange={(value) =>
                      handleInputChange("nonTraditionalPath", value)
                    }
                  />
                )}
                {currentStep === 3 && (
                  <WizardStep3
                    inputs={inputs}
                    onInputChange={handleInputChange}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 && !showResults}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="flex gap-2">
            {showResults && (
              <Button variant="outline" onClick={handleReset}>
                Start Over
              </Button>
            )}
            {!showResults && (
              <Button onClick={handleNext} disabled={!canProceed}>
                {currentStep === STEPS.length ? "See Results" : "Continue"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
