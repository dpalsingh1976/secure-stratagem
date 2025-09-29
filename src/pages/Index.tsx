import { Shield, Calculator, FileText, Upload, TestTube, Landmark, TrendingUp, CheckCircle, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  const mainTools = [
    {
      title: "7702 Tax Bucket Estimator",
      description: "Compare tax-free, tax-deferred, and taxable accumulation strategies",
      icon: Calculator,
      color: "accent",
      path: "/tax-bucket-estimator",
      features: [
        "Model different tax scenarios",
        "Visualize lifetime tax savings",
        "Optimize retirement income"
      ]
    },
    {
      title: "Risk Assessment",
      description: "Comprehensive financial needs analysis with personalized report",
      icon: FileText,
      color: "primary",
      path: "/admin/risk-intake",
      features: [
        "Life insurance gap analysis",
        "Retirement adequacy projection",
        "Market & tax risk assessment"
      ]
    },
    {
      title: "Smart Policy Assistant",
      description: "Upload policies and get AI-powered insights",
      icon: Upload,
      color: "secondary",
      path: "/policy-assistant",
      features: [
        "Upload policy documents",
        "Ask questions about coverage",
        "Get instant AI analysis"
      ],
      comingSoon: true
    },
    {
      title: "Stress Testing Tool",
      description: "Compare IUL vs traditional investments under various scenarios",
      icon: TestTube,
      color: "accent",
      path: "/stress-test",
      features: [
        "Model market conditions",
        "Analyze sequence risk",
        "Compare tax-free income"
      ],
      comingSoon: true
    },
    {
      title: "IUL / Infinite Banking",
      description: "Learn about tax-free wealth building strategies (Members Only)",
      icon: Landmark,
      color: "purple",
      path: "/iul",
      features: [
        "How infinite banking works",
        "Policy loan strategies",
        "Interactive calculators"
      ],
      protected: true,
      comingSoon: true
    }
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-95"></div>
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 container-financial text-center text-white">
          <div className="animate-fade-in-up">
            <h1 className="text-financial-hero text-balance mb-6 font-heading">
              Discover Your Hidden
              <span className="text-accent block sm:inline"> Financial Risks</span>
            </h1>
            
            <p className="text-financial-subtitle text-balance mb-12 max-w-3xl mx-auto opacity-95">
              Comprehensive risk assessment and tax-efficient planning tools to secure your family's financial future
            </p>

            {/* Three CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 max-w-4xl mx-auto">
              <Button 
                size="lg" 
                className="btn-accent text-lg px-8 py-6 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all w-full sm:w-auto"
                onClick={() => navigate('/admin/risk-intake')}
              >
                <FileText className="w-5 h-5 mr-2" />
                Start Risk Assessment
              </Button>
              <Button 
                size="lg" 
                variant="secondary"
                className="text-lg px-8 py-6 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all w-full sm:w-auto"
                onClick={() => navigate('/policy-assistant')}
              >
                <Upload className="w-5 h-5 mr-2" />
                Upload Policy
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-8 py-6 bg-white/10 border-white/30 hover:bg-white/20 shadow-xl w-full sm:w-auto"
                onClick={() => navigate('/iul')}
              >
                <Landmark className="w-5 h-5 mr-2" />
                Explore IUL <span className="ml-2 text-xs">(Members)</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-2 bg-white/60 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="section-padding bg-white">
        <div className="container-financial">
          <div className="text-center mb-12 animate-fade-in-up">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 font-heading">
              Your Financial Command Center
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Professional-grade tools to analyze, optimize, and protect your wealth
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {mainTools.map((tool, index) => {
              const Icon = tool.icon;
              return (
                <Card 
                  key={index}
                  className={`card-financial hover:shadow-[var(--shadow-financial)] transition-all ${
                    !tool.comingSoon ? 'cursor-pointer' : 'opacity-90'
                  }`}
                  onClick={() => !tool.comingSoon && navigate(tool.path)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-3 rounded-lg ${getColorClasses(tool.color)}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      {tool.protected && (
                        <span className="px-2 py-1 text-xs bg-accent text-accent-foreground rounded-full font-medium">
                          Members Only
                        </span>
                      )}
                      {tool.comingSoon && !tool.protected && (
                        <span className="px-2 py-1 text-xs bg-slate-200 text-slate-600 rounded-full font-medium">
                          Coming Soon
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-lg">{tool.title}</CardTitle>
                    <CardDescription>{tool.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-4">
                      {tool.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className={`w-full ${!tool.comingSoon ? `btn-${tool.color}` : ''}`}
                      variant={tool.comingSoon ? "outline" : "default"}
                      disabled={tool.comingSoon}
                    >
                      {tool.comingSoon ? "Coming Soon" : "Get Started"}
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
              Why Choose <span className="text-accent">Smart Risk Analyzer</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive analysis backed by professional expertise
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="card-financial text-center">
              <CardHeader>
                <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-fit">
                  <TrendingUp className="w-8 h-8 text-primary" />
                </div>
                <CardTitle>Data-Driven Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Advanced algorithms analyze your complete financial picture across all risk categories
                </p>
              </CardContent>
            </Card>

            <Card className="card-financial text-center">
              <CardHeader>
                <div className="mx-auto mb-4 p-4 bg-secondary/10 rounded-full w-fit">
                  <Shield className="w-8 h-8 text-secondary" />
                </div>
                <CardTitle>Personalized Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Get specific action steps tailored to your unique situation and goals
                </p>
              </CardContent>
            </Card>

            <Card className="card-financial text-center">
              <CardHeader>
                <div className="mx-auto mb-4 p-4 bg-accent/10 rounded-full w-fit">
                  <Award className="w-8 h-8 text-accent" />
                </div>
                <CardTitle>Professional Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Work with licensed advisors who understand tax-efficient strategies
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
