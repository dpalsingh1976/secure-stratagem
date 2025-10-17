import { useState } from "react";
import { Shield, Calculator, FileText, Lock, TrendingUp, CheckCircle, Award, ArrowRight, BarChart3, PieChart, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import heroImage from "@/assets/hero-financial.jpg";
import RiskIntake from "@/pages/RiskIntake";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [showRiskAssessment, setShowRiskAssessment] = useState(false);


  const calculators = [
    {
      title: "DIME Life Insurance Calculator",
      description: "Calculate your exact life insurance needs using the DIME method",
      icon: Target,
      color: "primary",
      path: "/admin/risk-intake",
    },
    {
      title: "7702 Tax-Free Estimator",
      description: "Compare tax-free, tax-deferred, and taxable retirement strategies",
      icon: PieChart,
      color: "secondary",
      path: "/tax-bucket-estimator",
    },
    {
      title: "IUL vs 401k/IRA Comparison",
      description: "Stress test IUL against traditional retirement accounts",
      icon: BarChart3,
      color: "accent",
      path: "/stress-test",
    },
    {
      title: "Annuity Income Calculator",
      description: "Estimate guaranteed lifetime income from annuities",
      icon: PieChart,
      color: "primary",
      path: "/annuity-calculator",
    },
    {
      title: "Longevity Risk Calculator",
      description: "Calculate how long your retirement savings will last",
      icon: Calculator,
      color: "secondary",
      path: "/longevity-calculator",
    },
    {
      title: "Inflation Stress Test",
      description: "Analyze market volatility and inflation impact on savings",
      icon: BarChart3,
      color: "accent",
      path: "/inflation-stress-test",
    },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      primary: "bg-primary/10 text-primary",
      secondary: "bg-secondary/10 text-secondary",
      accent: "bg-accent/10 text-accent",
      purple: "bg-purple-100 text-purple-600"
    };
    return colors[color as keyof typeof colors] || colors.primary;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="Financial Planning" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/90 to-primary/80"></div>
        </div>

        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        {/* Content */}
        <div className="relative z-10 container-financial">
          <div className="max-w-4xl animate-fade-in-up">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 font-heading leading-tight">
              Plan a Secure,
              <span className="block text-accent">Tax-Free Retirement</span>
              Today
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-2xl leading-relaxed">
              Discover risks, calculate your needs, and explore advanced retirement strategies with professional-grade tools.
            </p>

            {/* Primary CTA - Highly Visible */}
            <div className="mb-8 flex justify-center">
              <Button 
                size="lg" 
                className="bg-accent hover:bg-accent/90 text-white text-xl px-12 py-8 shadow-2xl hover:shadow-accent/50 transform hover:scale-105 transition-all font-bold border-4 border-white/20"
                onClick={() => setShowRiskAssessment(true)}
              >
                <FileText className="w-6 h-6 mr-3" />
                Start Risk Assessment Now
                <ArrowRight className="w-6 h-6 ml-3" />
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap gap-8 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-secondary" />
                <span>Professional Grade Tools</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-secondary" />
                <span>AI-Powered Insights</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-secondary" />
                <span>Detailed PDF Reports</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-2 bg-white/60 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>


      {/* Calculators Section */}
      <section id="calculators" className="section-padding bg-white">
        <div className="container-financial">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 font-heading">
              Retirement Calculators
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Professional tools to calculate, compare, and optimize your retirement strategy
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {calculators.map((calc, index) => {
              const Icon = calc.icon;
              return (
                <Card 
                  key={index}
                  className="card-financial hover:shadow-financial transition-all cursor-pointer group"
                  onClick={() => navigate(calc.path)}
                >
                  <CardHeader>
                    <div className={`p-4 rounded-lg ${getColorClasses(calc.color)} w-fit mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-8 h-8" />
                    </div>
                    <CardTitle className="text-xl mb-2">{calc.title}</CardTitle>
                    <CardDescription className="text-base">{calc.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      Calculate Now
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="section-padding bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container-financial">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 font-heading">
              Why Choose <span className="text-primary">Secure Future Planner</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive analysis backed by professional expertise and cutting-edge technology
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="card-financial text-center hover:shadow-financial transition-all">
              <CardHeader>
                <div className="mx-auto mb-4 p-4 bg-gradient-primary rounded-full w-fit">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl">Data-Driven Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Advanced algorithms analyze your complete financial picture across all risk categories with precision and accuracy
                </p>
              </CardContent>
            </Card>

            <Card className="card-financial text-center hover:shadow-financial transition-all">
              <CardHeader>
                <div className="mx-auto mb-4 p-4 bg-gradient-secondary rounded-full w-fit">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl">Personalized Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Get specific action steps tailored to your unique situation, goals, and risk tolerance
                </p>
              </CardContent>
            </Card>

            <Card className="card-financial text-center hover:shadow-financial transition-all">
              <CardHeader>
                <div className="mx-auto mb-4 p-4 bg-gradient-accent rounded-full w-fit">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl">Professional Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Work with licensed advisors who understand tax-efficient strategies and comprehensive planning
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />

      {/* Risk Assessment Modal */}
      <Dialog open={showRiskAssessment} onOpenChange={setShowRiskAssessment}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Financial Risk Assessment</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[95vh]">
            <RiskIntake isModal={true} onClose={() => setShowRiskAssessment(false)} />
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default Index;
