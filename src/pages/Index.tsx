import { useState } from "react";
import {
  Shield,
  Calculator,
  TrendingUp,
  CheckCircle,
  Target,
  ClipboardList,
  BarChart3,
  DollarSign,
  ArrowRight,
  PieChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import RiskIntake from "@/pages/RiskIntake";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [showRiskAssessment, setShowRiskAssessment] = useState(false);

  const calculators = [
    {
      title: "7702 Tax-Free Estimator",
      description: "Compare tax-free, tax-deferred, and taxable retirement strategies",
      icon: PieChart,
      color: "primary",
      path: "/tax-bucket-estimator",
    },
    {
      title: "529 vs IUL Comparison",
      description: "Compare education-first vs flexible-family-bank strategies with scenario testing",
      icon: Target,
      color: "secondary",
      path: "/529-vs-iul",
    },
    {
      title: "Inflation Stress Test",
      description: "Analyze market volatility and inflation impact on savings",
      icon: BarChart3,
      color: "accent",
      path: "/inflation-stress-test",
    },
    {
      title: "Retirement Calculator",
      description: "Calculate how much to save annually to reach your retirement goal",
      icon: Calculator,
      color: "primary",
      path: "/retirement-calculator",
    },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      primary: "bg-primary/10 text-primary",
      secondary: "bg-secondary/10 text-secondary",
      accent: "bg-accent/10 text-accent",
    };
    return colors[color as keyof typeof colors] || colors.primary;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section - Clean White Background */}
      <section className="relative min-h-[85vh] flex items-center bg-gradient-to-br from-white via-green-50/30 to-white overflow-hidden">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>

        <div className="relative z-10 container-financial">
          <div className="max-w-4xl mx-auto text-center animate-fade-in-up">
            {/* Green Badge */}
            <div className="inline-flex items-center gap-2 bg-primary text-white rounded-full px-6 py-2 mb-8 text-sm font-semibold">
              <Shield className="w-4 h-4" />
              Professional Financial Risk Assessment
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 font-heading leading-tight">
              Plan a Secure,
              <span className="block text-primary">Tax-Free Retirement</span>
              Today
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
              Discover risks, calculate your needs, and explore advanced retirement strategies with professional-grade
              tools.
            </p>

            {/* Two CTAs Side-by-Side */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white text-lg px-8 py-6 shadow-lg"
                onClick={() => setShowRiskAssessment(true)}
              >
                <ClipboardList className="w-5 h-5 mr-2" />
                Start Risk Assessment Now
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-6 text-muted-foreground text-sm">
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
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="section-padding" style={{ backgroundColor: "hsl(142 71% 97%)" }}>
        <div className="container-financial">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 font-heading text-foreground">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our proven 3-step process helps you discover risks, understand solutions, and implement your personalized
              strategy
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Step 1 */}
            <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all">
              <CardHeader>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-primary rounded-full">
                    <ClipboardList className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-4xl font-bold text-primary/20">01</div>
                </div>
                <CardTitle className="text-2xl mb-3">Complete Risk Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Answer questions about your financial situation to identify protection gaps
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Financial goals & timeline</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Tax situation analysis</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Current coverage review</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all">
              <CardHeader>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-primary rounded-full">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-4xl font-bold text-primary/20">02</div>
                </div>
                <CardTitle className="text-2xl mb-3">Review Your Results</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Get detailed analysis with risk scores and personalized recommendations
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">IUL fit score & analysis</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Tax bucket visualization</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Personalized recommendations</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all">
              <CardHeader>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-primary rounded-full">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-4xl font-bold text-primary/20">03</div>
                </div>
                <CardTitle className="text-2xl mb-3">Explore Your Solution</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Use calculators and connect with advisors to implement your strategy
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Detailed product education</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Real-world case studies</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Schedule consultation</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Calculators Section */}
      <section id="calculators" className="section-padding bg-white">
        <div className="container-financial">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 font-heading">Retirement Calculators</h2>
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
                  className="hover:shadow-lg transition-all cursor-pointer group border"
                  onClick={() => navigate(calc.path)}
                >
                  <CardHeader>
                    <div
                      className={`p-4 rounded-lg ${getColorClasses(calc.color)} w-fit mb-4 group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="w-8 h-8" />
                    </div>
                    <CardTitle className="text-xl mb-2">{calc.title}</CardTitle>
                    <CardDescription className="text-base">{calc.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      className="w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all"
                    >
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

      {/* Comprehensive Financial Solutions */}
      <section id="solutions" className="section-padding bg-gradient-to-br from-slate-50 to-white">
        <div className="container-financial">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 font-heading">Comprehensive Financial Solutions</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              We offer a range of strategies tailored to your unique situation and goals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* IUL */}
            <Card className="bg-white border hover:shadow-lg transition-all">
              <CardHeader>
                <div className="mb-4">
                  <TrendingUp className="w-12 h-12 text-primary" />
                </div>
                <CardTitle className="text-2xl mb-3">Indexed Universal Life (IUL)</CardTitle>
                <CardDescription className="text-base">
                  Tax-free growth, downside protection, lifetime income through Infinite Banking Concept
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">0% floor protects from market losses</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Tax-free policy loans</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Death benefit protection</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full" onClick={() => navigate("/iul-banking")}>
                  Learn More
                </Button>
              </CardContent>
            </Card>

            {/* Term Life */}
            <Card className="bg-white border hover:shadow-lg transition-all">
              <CardHeader>
                <div className="mb-4">
                  <Shield className="w-12 h-12 text-primary" />
                </div>
                <CardTitle className="text-2xl mb-3">Term Life Insurance</CardTitle>
                <CardDescription className="text-base">
                  Cost-effective protection for family during working years and income-earning period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Affordable premiums</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">High coverage amounts</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Convertible options</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full" onClick={() => navigate("/admin/risk-intake")}>
                  Check Your Fit
                </Button>
              </CardContent>
            </Card>

            {/* Annuities */}
            <Card className="bg-white border hover:shadow-lg transition-all">
              <CardHeader>
                <div className="mb-4">
                  <DollarSign className="w-12 h-12 text-primary" />
                </div>
                <CardTitle className="text-2xl mb-3">Fixed Index Annuities</CardTitle>
                <CardDescription className="text-base">
                  Guaranteed lifetime income with growth potential for secure retirement cash flow
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Guaranteed income for life</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Principal protection</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Tax-deferred growth</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full" onClick={() => navigate("/annuities")}>
                  Learn More
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-primary">
        <div className="container-financial text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6 font-heading text-white">
            Ready to Secure Your Financial Future?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Take the first step with our comprehensive risk assessment. Get personalized insights in just 5 minutes.
          </p>
          <Button
            size="lg"
            className="bg-accent hover:bg-accent/90 text-white text-lg px-10 py-6 shadow-lg"
            onClick={() => setShowRiskAssessment(true)}
          >
            Start Your Free Assessment
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
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
