import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calculator, Brain, TrendingUp, Shield, Clock, CheckCircle } from "lucide-react";

const AIAnalysisPreview = () => {
  const [showMethodology, setShowMethodology] = useState(false);

  return (
    <section className="py-16 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-heading font-bold mb-4">
            Advanced AI-Powered Risk Analysis
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See exactly how our AI analyzes your financial situation and calculates your risk scores with complete transparency.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* AI Analysis Preview */}
          <Card className="card-financial border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                AI Financial Risk Analysis
                <Badge variant="secondary" className="ml-auto">Live Example</Badge>
              </CardTitle>
              <CardDescription>
                Advanced machine learning algorithms analyze your complete financial picture
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Sample AI Insights
                </h4>
                <div className="text-sm space-y-2 text-muted-foreground">
                  <p>• <strong>Life Insurance Gap:</strong> Your current coverage of $250K falls short of the recommended $750K (10x income rule)</p>
                  <p>• <strong>Retirement Projection:</strong> At current savings rate, you may need to work 3 additional years</p>
                  <p>• <strong>Risk Mitigation:</strong> Consider increasing 401k contribution by 2% and exploring term life insurance</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">4</div>
                  <div className="text-xs text-muted-foreground">Risk Categories</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">20+</div>
                  <div className="text-xs text-muted-foreground">Data Points</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Calculation Methodology Preview */}
          <Card className="card-financial">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Risk Calculation Transparency
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowMethodology(!showMethodology)}
                >
                  {showMethodology ? 'Hide Details' : 'Show Details'}
                </Button>
              </div>
              <CardDescription>
                See exactly how your risk scores are calculated using industry standards
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Sample Risk Scores */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Life Insurance Gap</span>
                  <div className="flex items-center gap-2">
                    <Progress value={65} className="w-20 h-2" />
                    <span className="text-sm font-medium">65%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Retirement Risk</span>
                  <div className="flex items-center gap-2">
                    <Progress value={45} className="w-20 h-2" />
                    <span className="text-sm font-medium">45%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Market Risk</span>
                  <div className="flex items-center gap-2">
                    <Progress value={30} className="w-20 h-2" />
                    <span className="text-sm font-medium">30%</span>
                  </div>
                </div>
              </div>

              {showMethodology && (
                <div className="border rounded-lg p-4 bg-muted/30">
                  <h4 className="font-semibold text-sm mb-2">Sample: Life Insurance Calculation</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Annual Income:</span>
                      <span className="font-medium">$75,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Recommended Coverage (10x):</span>
                      <span className="font-medium">$750,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current Coverage:</span>
                      <span className="font-medium">$250,000</span>
                    </div>
                    <div className="flex justify-between border-t pt-1">
                      <span>Coverage Gap:</span>
                      <span className="font-medium text-orange-600">$500,000 (65%)</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Based on industry-standard financial planning methodologies</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features List */}
        <div className="mt-12 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">AI-Powered Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Advanced algorithms analyze 20+ financial data points to provide personalized insights
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calculator className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Transparent Calculations</h3>
            <p className="text-sm text-muted-foreground">
              See exactly how each risk score is calculated with detailed methodology breakdowns
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Industry Standards</h3>
            <p className="text-sm text-muted-foreground">
              Based on proven financial planning methodologies used by professional advisors
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIAnalysisPreview;