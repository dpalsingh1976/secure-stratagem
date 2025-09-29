import Hero from "@/components/Hero";
import RiskCategories from "@/components/RiskCategories";
import Footer from "@/components/Footer";
import EnhancedChatBot from "@/components/EnhancedChatBot";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, BarChart3, Calculator, MessageSquare, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { hasRole } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Hero />
      
      {/* Main Menu Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Financial Planning Tools
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional-grade tools for risk assessment, tax optimization, and intelligent policy analysis. 
              Built for advisors and individuals seeking comprehensive financial insights.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {/* 7702 Estimator */}
            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-blue-50/50 border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Calculator className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl text-gray-900">7702 Estimator</CardTitle>
                <CardDescription className="text-gray-600">
                  Compare tax advantages across Tax-Free, Tax-Deferred, and Taxable investment buckets 
                  with advanced optimization strategies.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2 mb-6 text-gray-700">
                  <li>• Tax bucket allocation analysis</li>
                  <li>• Long-term savings projections</li>
                  <li>• Roth conversion strategies</li>
                  <li>• Life insurance cash value optimization</li>
                </ul>
                <Button asChild className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                  <a href="/tax-bucket-estimator">
                    Start Tax Analysis
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Risk Assessment */}
            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-green-50/50 border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl text-gray-900">Risk Assessment</CardTitle>
                <CardDescription className="text-gray-600">
                  Comprehensive 8-category risk analysis with advanced reporting, 
                  insurance gap analysis, and personalized recommendations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2 mb-6 text-gray-700">
                  <li>• Complete financial profile analysis</li>
                  <li>• Insurance needs calculation (DIME method)</li>
                  <li>• Retirement gap analysis</li>
                  <li>• Professional client reports</li>
                </ul>
                <Button asChild className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
                  <a href="/assessment">
                    Begin Assessment
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Smart Policy Assistant */}
            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-purple-50/50 border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <MessageSquare className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl text-gray-900">Smart Policy Assistant</CardTitle>
                <CardDescription className="text-gray-600">
                  AI-powered assistant for insurance and annuity policy questions with 
                  document analysis and expert guidance.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2 mb-6 text-gray-700">
                  <li>• Policy document analysis</li>
                  <li>• Interactive Q&A interface</li>
                  <li>• Coverage gap identification</li>
                  <li>• Regulatory compliance guidance</li>
                </ul>
                <Button asChild className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700">
                  <a href="/policy-assistant">
                    Get AI Help
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Professional Tools for Advisors */}
          {hasRole('advisor') && (
            <div className="border-t border-gray-200 pt-16">
              <div className="text-center mb-12">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Advanced Advisor Tools
                </h3>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Professional-grade tools for licensed advisors with enhanced compliance, 
                  stress testing, and comprehensive client management capabilities.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="hover:shadow-lg transition-shadow bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-3">
                      <Target className="h-6 w-6 text-primary" />
                      <span>Professional Risk Intake</span>
                    </CardTitle>
                    <CardDescription>
                      Multi-step client assessment with advanced financial profiling and compliance reporting.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild variant="outline" className="w-full">
                      <a href="/admin/risk-intake">
                        Access Professional Tools
                      </a>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-3">
                      <BarChart3 className="h-6 w-6 text-primary" />
                      <span>Analytics & Stress Testing</span>
                    </CardTitle>
                    <CardDescription>
                      Advanced portfolio analysis, market stress testing, and compliance monitoring.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild variant="outline" className="w-full">
                      <a href="/admin/stress-test">
                        View Analytics Dashboard
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Platform Stats */}
          <div className="mt-16 text-center">
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
              <h3 className="text-xl font-semibold mb-6 text-gray-900">
                Comprehensive Financial Planning Platform
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">8</div>
                  <div className="text-sm text-gray-600 font-medium">Risk Categories</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">3</div>
                  <div className="text-sm text-gray-600 font-medium">Tax Buckets</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">25+</div>
                  <div className="text-sm text-gray-600 font-medium">Asset Types</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">AI</div>
                  <div className="text-sm text-gray-600 font-medium">Powered</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <RiskCategories />
      <Footer />
      <EnhancedChatBot />
    </div>
  );
};

export default Index;
