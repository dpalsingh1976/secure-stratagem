import Hero from "@/components/Hero";
import RiskCategories from "@/components/RiskCategories";
import Footer from "@/components/Footer";
import EnhancedChatBot from "@/components/EnhancedChatBot";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, BarChart3, FileText, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { hasRole } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Hero />
      
      {/* Professional Tools Section for Advisors */}
      {hasRole('advisor') && (
        <section className="py-16 bg-gradient-to-br from-primary/5 to-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Professional Risk Assessment Tools
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Comprehensive financial planning platform for licensed advisors with advanced risk analysis, 
                tax optimization strategies, and client reporting capabilities.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="hover:shadow-xl transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <Target className="h-6 w-6 text-primary" />
                    <span>Risk Intake Assessment</span>
                  </CardTitle>
                  <CardDescription>
                    Comprehensive multi-step client assessment with 7-category risk analysis, 
                    tax bucket optimization, and professional reporting.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-2 mb-6 text-gray-700">
                    <li>• Complete financial profile capture</li>
                    <li>• DIME method insurance analysis</li>
                    <li>• Tax-free strategy recommendations</li>
                    <li>• Client-facing report generation</li>
                  </ul>
                  <Button asChild className="w-full">
                    <a href="/admin/risk-intake">
                      Start Client Assessment
                    </a>
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-xl transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <BarChart3 className="h-6 w-6 text-primary" />
                    <span>Stress Testing & Analytics</span>
                  </CardTitle>
                  <CardDescription>
                    Advanced portfolio stress testing, market comparison tools, 
                    and compliance reporting for professional use.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-2 mb-6 text-gray-700">
                    <li>• Scenario stress testing</li>
                    <li>• Market comparison analysis</li>
                    <li>• Compliance reporting</li>
                    <li>• Digital twin modeling</li>
                  </ul>
                  <Button asChild variant="outline" className="w-full">
                    <a href="/admin/stress-test">
                      Access Admin Tools
                    </a>
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-xl transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <Shield className="h-6 w-6 text-primary" />
                    <span>Protection Analysis</span>
                  </CardTitle>
                  <CardDescription>
                    Comprehensive insurance needs analysis with gap calculations, 
                    sequence risk modeling, and tax-efficient strategies.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-2 mb-6 text-gray-700">
                    <li>• Life insurance gap analysis</li>
                    <li>• Disability coverage review</li>
                    <li>• Long-term care planning</li>
                    <li>• Sequence risk protection</li>
                  </ul>
                  <Button asChild variant="secondary" className="w-full">
                    <a href="/admin/risk-intake">
                      Analyze Protection Needs
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="mt-12 text-center">
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <h3 className="text-xl font-semibold mb-4 text-gray-900">
                  Production-Grade Financial Planning Platform
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary mb-1">8</div>
                    <div className="text-sm text-gray-600">Risk Categories</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary mb-1">3</div>
                    <div className="text-sm text-gray-600">Tax Buckets</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary mb-1">25+</div>
                    <div className="text-sm text-gray-600">Asset Types</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary mb-1">RBAC</div>
                    <div className="text-sm text-gray-600">Role Security</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
      
      <RiskCategories />
      <Footer />
      <EnhancedChatBot />
    </div>
  );
};

export default Index;
