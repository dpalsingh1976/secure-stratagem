import { CheckCircle, ArrowRight, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const AssessmentPreview = () => {
  const steps = [
    {
      number: "01",
      title: "Personal Information",
      description: "Age, income, marital status, and dependents",
      duration: "1 min",
      fields: ["Age & Income", "Family Status", "Location", "Employment"]
    },
    {
      number: "02", 
      title: "Financial Snapshot",
      description: "Assets, liabilities, expenses, and emergency fund",
      duration: "2 min",
      fields: ["Monthly Expenses", "Debt Obligations", "Emergency Fund", "Asset Values"]
    },
    {
      number: "03",
      title: "Current Protection",
      description: "Insurance coverage and retirement accounts",
      duration: "1 min", 
      fields: ["Life Insurance", "Retirement Savings", "Investment Accounts", "Other Benefits"]
    },
    {
      number: "04",
      title: "Goals & Planning",
      description: "Retirement timeline and risk tolerance",
      duration: "1 min",
      fields: ["Retirement Age", "Income Goals", "Risk Tolerance", "Legacy Planning"]
    }
  ];

  return (
    <section className="section-padding bg-background">
      <div className="container-financial">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4 font-heading">
            Simple 4-Step Assessment Process
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Our streamlined process makes it easy to get comprehensive risk analysis 
            without overwhelming complexity.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {steps.map((step, index) => (
              <div 
                key={step.number}
                className="relative card-financial group hover:shadow-financial transition-all duration-300"
              >
                {/* Step connector line (except for last step) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary to-primary/30 z-10"></div>
                )}
                
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {step.number}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-foreground font-heading">
                        {step.title}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {step.duration}
                      </div>
                    </div>
                    
                    <p className="text-muted-foreground mb-4">
                      {step.description}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {step.fields.map((field, fieldIndex) => (
                        <div key={fieldIndex} className="flex items-center">
                          <CheckCircle className="w-3 h-3 text-secondary mr-2 flex-shrink-0" />
                          <span className="text-muted-foreground">{field}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Security and privacy assurance */}
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-4 px-6 py-4 bg-muted/50 rounded-xl border border-border">
              <Shield className="w-6 h-6 text-primary" />
              <div className="text-left">
                <div className="font-medium text-foreground">Your Privacy is Protected</div>
                <div className="text-sm text-muted-foreground">Bank-level security • No data stored • GDPR compliant</div>
              </div>
            </div>

            <Button 
              size="lg" 
              className="btn-primary text-lg px-12 py-4 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 group"
              onClick={() => window.location.href = '/assessment'}
            >
              Start Your Risk Assessment
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>

            <div className="text-sm text-muted-foreground">
              ✓ No credit card required • ✓ Instant results • ✓ 100% free assessment
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AssessmentPreview;