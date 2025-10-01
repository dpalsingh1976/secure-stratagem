import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Download, Share2, AlertTriangle, CheckCircle, Info, TrendingUp, TrendingDown, Shield, DollarSign } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatPercentage } from '@/utils/riskComputation';
import type { 
  ComputedMetrics,
  ProfileGoalsData,
  IncomeExpensesData, 
  AssetFormData,
  LiabilityFormData,
  ProtectionHealthData
} from '@/types/financial';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  metrics: ComputedMetrics;
  profileData: ProfileGoalsData;
  incomeData: IncomeExpensesData;
  assets: AssetFormData[];
  liabilities: LiabilityFormData[];
  protectionData: ProtectionHealthData;
}

interface RiskRecommendation {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  description: string;
  impact: string;
  nextSteps: string[];
  estimatedCost?: string;
}

export function ReportModal({
  isOpen,
  onClose,
  clientId,
  metrics,
  profileData,
  incomeData,
  assets,
  liabilities,
  protectionData
}: ReportModalProps) {
  const [activeTab, setActiveTab] = useState('summary');
  const [isExporting, setIsExporting] = useState(false);

  const getRiskLevel = (score: number) => {
    if (score >= 80) return { 
      label: 'Critical', 
      color: 'bg-red-500', 
      badgeClass: 'bg-red-600 hover:bg-red-600 text-white font-bold'
    };
    if (score >= 60) return { 
      label: 'High', 
      color: 'bg-orange-500', 
      badgeClass: 'bg-orange-600 hover:bg-orange-600 text-white font-bold'
    };
    if (score >= 40) return { 
      label: 'Moderate', 
      color: 'bg-yellow-500', 
      badgeClass: 'bg-yellow-600 hover:bg-yellow-600 text-white font-bold'
    };
    if (score >= 20) return { 
      label: 'Low', 
      color: 'bg-blue-500', 
      badgeClass: 'bg-blue-600 hover:bg-blue-600 text-white font-bold'
    };
    return { 
      label: 'Minimal', 
      color: 'bg-green-500', 
      badgeClass: 'bg-green-600 hover:bg-green-600 text-white font-bold'
    };
  };

  const generateRecommendations = (): RiskRecommendation[] => {
    const recommendations: RiskRecommendation[] = [];
    
    // General recommendation based on DIME assessment
    const totalGaps = [
      metrics.protection_gap > 0,
      metrics.liquidity_runway_months < 6,
      metrics.tax_bucket_never_pct < 20,
      metrics.retirement_gap_mo > 1000
    ].filter(Boolean).length;

    if (totalGaps > 0) {
      recommendations.push({
        id: 'general-recommendation',
        title: 'Financial Planning Consultation Recommended',
        priority: 'high',
        category: 'General',
        description: `Based on your DIME inputs and financial assessment, ${totalGaps > 1 ? 'several areas' : 'an area'} may need attention.`,
        impact: 'Addressing these gaps can help protect your family and secure your retirement.',
        nextSteps: [
          'Review your DIME calculation results carefully',
          'Consider consulting with a licensed financial professional',
          'Explore our calculators to understand different planning strategies',
          'Evaluate your current insurance coverage and retirement savings'
        ]
      });
    }

    // Add specific gap information without product recommendations
    if (metrics.protection_gap > 0) {
      recommendations.push({
        id: 'protection-gap-info',
        title: 'Life Insurance Coverage Gap Identified',
        priority: 'high',
        category: 'Protection',
        description: `Based on your DIME calculation, there is a protection gap of ${formatCurrency(metrics.protection_gap)}.`,
        impact: `Your total family needs are estimated at ${formatCurrency(metrics.dime_need)}.`,
        nextSteps: [
          'Review your current life insurance coverage',
          'Discuss coverage options with a licensed insurance agent',
          'Consider your family\'s long-term financial security needs'
        ]
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      // Save report data first
      const reportData = {
        summary: {
          client_name: `${profileData.name_first} ${profileData.name_last}`,
          generated_date: new Date().toISOString(),
          overall_risk_score: metrics.scores_jsonb.overall,
          net_worth: metrics.net_worth,
          key_metrics: {
            protection_gap: metrics.protection_gap,
            liquidity_months: metrics.liquidity_runway_months,
            concentration_pct: metrics.top_concentration_pct,
            retirement_gap: metrics.retirement_gap_mo
          }
        },
        recommendations: generateRecommendations(),
        tax_buckets: {
          tax_now: { percent: metrics.tax_bucket_now_pct, amount: assets.filter(a => a.tax_wrapper === 'TAX_NOW').reduce((sum, a) => sum + a.current_value, 0) },
          tax_later: { percent: metrics.tax_bucket_later_pct, amount: assets.filter(a => a.tax_wrapper === 'TAX_LATER').reduce((sum, a) => sum + a.current_value, 0) },
          tax_never: { percent: metrics.tax_bucket_never_pct, amount: assets.filter(a => a.tax_wrapper === 'TAX_NEVER').reduce((sum, a) => sum + a.current_value, 0) }
        },
        coverage_analysis: {
          dime_need: metrics.dime_need,
          protection_gap: metrics.protection_gap,
          disability_gap: metrics.disability_gap,
          ltc_gap: metrics.ltc_gap
        }
      };

      const { error } = await supabase
        .from('reports')
        .insert([{
          client_id: clientId,
          report_jsonb: reportData as any,
          pdf_url: null // Would be generated by a background service
        }]);

      if (error) throw error;

      toast({
        title: "Report saved",
        description: "Risk assessment report has been saved successfully."
      });
    } catch (error) {
      console.error('Error exporting report:', error);
      toast({
        title: "Export failed",
        description: "There was an error exporting the report.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const recommendations = generateRecommendations();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">
                Financial Risk Assessment Report
              </DialogTitle>
              <p className="text-gray-600 mt-2">
                {profileData.name_first} {profileData.name_last} • Generated {new Date().toLocaleDateString()}
              </p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={exportToPDF} disabled={isExporting}>
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export PDF'}
              </Button>
              <Button variant="outline">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="tax-buckets">Tax Buckets</TabsTrigger>
            <TabsTrigger value="coverage">Coverage & Income</TabsTrigger>
            <TabsTrigger value="appendix">Appendix</TabsTrigger>
          </TabsList>

          <div className="overflow-y-auto flex-1 mt-4">
            <TabsContent value="summary" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${getRiskLevel(metrics.scores_jsonb.overall).color}`} />
                    <span>Overall Risk Score: {metrics.scores_jsonb.overall}/100</span>
                    <Badge className={getRiskLevel(metrics.scores_jsonb.overall).badgeClass}>
                      {getRiskLevel(metrics.scores_jsonb.overall).label}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Comprehensive risk assessment across all financial planning areas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{formatCurrency(metrics.net_worth)}</div>
                      <div className="text-sm text-gray-600">Net Worth</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{formatPercentage(metrics.liquid_pct)}</div>
                      <div className="text-sm text-gray-600">Liquid Assets</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{metrics.liquidity_runway_months.toFixed(1)}</div>
                      <div className="text-sm text-gray-600">Months Liquidity</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{formatPercentage(metrics.top_concentration_pct)}</div>
                      <div className="text-sm text-gray-600">Top Concentration</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {Object.entries({
                      'Protection': metrics.scores_jsonb.protection,
                      'Liquidity': metrics.scores_jsonb.liquidity,
                      'Concentration': metrics.scores_jsonb.concentration,
                      'Volatility/Sequence': metrics.scores_jsonb.volatility_sequence,
                      'Longevity': metrics.scores_jsonb.longevity,
                      'Inflation': metrics.scores_jsonb.inflation,
                      'Tax': metrics.scores_jsonb.tax
                     }).map(([category, score]) => {
                      const level = getRiskLevel(score);
                      return (
                        <div key={category} className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1">
                            <span className="font-medium w-40">{category}</span>
                            <Progress value={score} className="flex-1" />
                            <span className="text-sm font-medium w-16">{score}/100</span>
                          </div>
                          <Badge className={level.badgeClass}>
                            {level.label}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              {recommendations.map((rec, index) => (
                <Card key={rec.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-lg font-semibold">#{index + 1}</div>
                        {rec.priority === 'high' && <AlertTriangle className="h-5 w-5 text-red-500" />}
                        {rec.priority === 'medium' && <Info className="h-5 w-5 text-yellow-500" />}
                        {rec.priority === 'low' && <CheckCircle className="h-5 w-5 text-green-500" />}
                        <span>{rec.title}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{rec.category}</Badge>
                        <Badge 
                          variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}
                        >
                          {rec.priority} priority
                        </Badge>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-700">{rec.description}</p>
                    
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">Expected Impact</h4>
                      <p className="text-blue-800">{rec.impact}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Next Steps:</h4>
                      <ul className="space-y-1">
                        {rec.nextSteps.map((step, stepIndex) => (
                          <li key={stepIndex} className="flex items-start space-x-2">
                            <span className="text-primary mt-1">•</span>
                            <span className="text-gray-700">{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {rec.estimatedCost && (
                      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                        <strong>Estimated Cost:</strong> {rec.estimatedCost}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="tax-buckets" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tax Bucket Strategy: The 3-Bucket Approach</CardTitle>
                  <CardDescription>
                    Optimize tax efficiency by strategically allocating assets across three tax treatment categories
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Tax Now Bucket */}
                    <Card className="border-2 border-red-200">
                      <CardHeader className="bg-red-50">
                        <CardTitle className="text-lg text-red-800">TAX NOW (Taxable)</CardTitle>
                        <CardDescription className="text-red-700">
                          Pay taxes annually on growth and income
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="text-center mb-4">
                          <div className="text-3xl font-bold text-red-800">
                            {formatPercentage(metrics.tax_bucket_now_pct)}
                          </div>
                          <div className="text-sm text-gray-600">of total assets</div>
                          <div className="text-lg font-semibold mt-2">
                            {formatCurrency(assets.filter(a => a.tax_wrapper === 'TAX_NOW').reduce((sum, a) => sum + a.current_value, 0))}
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <h5 className="font-semibold text-sm mb-2">Best Used For:</h5>
                            <ul className="text-sm space-y-1 text-gray-700">
                              <li>• Liquidity and flexibility</li>
                              <li>• Short-term goals</li>
                              <li>• Tax-loss harvesting</li>
                            </ul>
                          </div>
                          
                          <div>
                            <h5 className="font-semibold text-sm mb-2">Examples:</h5>
                            <ul className="text-sm space-y-1 text-gray-700">
                              <li>• Brokerage accounts</li>
                              <li>• Savings accounts</li>
                              <li>• Taxable bonds</li>
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Tax Later Bucket */}
                    <Card className="border-2 border-yellow-200">
                      <CardHeader className="bg-yellow-50">
                        <CardTitle className="text-lg text-yellow-800">TAX LATER (Deferred)</CardTitle>
                        <CardDescription className="text-yellow-700">
                          Defer taxes until withdrawal in retirement
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="text-center mb-4">
                          <div className="text-3xl font-bold text-yellow-800">
                            {formatPercentage(metrics.tax_bucket_later_pct)}
                          </div>
                          <div className="text-sm text-gray-600">of total assets</div>
                          <div className="text-lg font-semibold mt-2">
                            {formatCurrency(assets.filter(a => a.tax_wrapper === 'TAX_LATER').reduce((sum, a) => sum + a.current_value, 0))}
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <h5 className="font-semibold text-sm mb-2">Best Used For:</h5>
                            <ul className="text-sm space-y-1 text-gray-700">
                              <li>• Current tax deductions</li>
                              <li>• Long-term growth</li>
                              <li>• Retirement income</li>
                            </ul>
                          </div>
                          
                          <div>
                            <h5 className="font-semibold text-sm mb-2">Examples:</h5>
                            <ul className="text-sm space-y-1 text-gray-700">
                              <li>• 401(k) / 403(b)</li>
                              <li>• Traditional IRA</li>
                              <li>• Annuities</li>
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Tax Never Bucket */}
                    <Card className="border-2 border-green-200">
                      <CardHeader className="bg-green-50">
                        <CardTitle className="text-lg text-green-800">TAX NEVER (Tax-Free)</CardTitle>
                        <CardDescription className="text-green-700">
                          Tax-free growth and tax-free distributions
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="text-center mb-4">
                          <div className="text-3xl font-bold text-green-800">
                            {formatPercentage(metrics.tax_bucket_never_pct)}
                          </div>
                          <div className="text-sm text-gray-600">of total assets</div>
                          <div className="text-lg font-semibold mt-2">
                            {formatCurrency(assets.filter(a => a.tax_wrapper === 'TAX_NEVER').reduce((sum, a) => sum + a.current_value, 0))}
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <h5 className="font-semibold text-sm mb-2">Best Used For:</h5>
                            <ul className="text-sm space-y-1 text-gray-700">
                              <li>• Legacy planning</li>
                              <li>• Sequence risk buffer</li>
                              <li>• Tax diversification</li>
                            </ul>
                          </div>
                          
                          <div>
                            <h5 className="font-semibold text-sm mb-2">Examples:</h5>
                            <ul className="text-sm space-y-1 text-gray-700">
                              <li>• Roth IRA/401(k)</li>
                              <li>• HSA</li>
                              <li>• Life insurance CV</li>
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Separator />

                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold mb-4 text-gray-900">Suggested Optimization Strategy</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3 text-gray-800">Target Allocation</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">TAX NOW (Liquidity)</span>
                            <span className="font-semibold">20-30%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">TAX LATER (Growth)</span>
                            <span className="font-semibold">40-50%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">TAX NEVER (Protection)</span>
                            <span className="font-semibold">20-30%</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3 text-gray-800">Action Items</h4>
                        <ul className="space-y-2 text-sm">
                          {metrics.tax_bucket_never_pct < 20 && (
                            <li className="flex items-start space-x-2">
                              <TrendingUp className="h-4 w-4 text-green-600 mt-0.5" />
                              <span>Increase tax-free bucket via Roth conversions</span>
                            </li>
                          )}
                          {metrics.tax_bucket_now_pct > 40 && (
                            <li className="flex items-start space-x-2">
                              <TrendingDown className="h-4 w-4 text-red-600 mt-0.5" />
                              <span>Reduce taxable exposure through tax-advantaged accounts</span>
                            </li>
                          )}
                          <li className="flex items-start space-x-2">
                            <DollarSign className="h-4 w-4 text-blue-600 mt-0.5" />
                            <span>Consider life insurance for additional tax-free growth</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="coverage" className="space-y-6">
              {/* DIME Calculation Summary - Simplified and Clear */}
              <Card className="border-4 border-primary shadow-xl">
                <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-white">
                  <CardTitle className="flex items-center gap-3 text-3xl">
                    <Shield className="h-8 w-8" />
                    <span>DIME Life Insurance Need Assessment</span>
                  </CardTitle>
                  <CardDescription className="text-white/90 text-lg">
                    Simple calculation of your total family protection need
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-8 space-y-8">
                  {/* DIME Components in Large, Clear Cards */}
                  <div>
                    <h3 className="text-xl font-bold mb-4 text-gray-700">What Makes Up Your Protection Need:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl text-white shadow-lg">
                        <div className="text-lg font-bold mb-2 flex items-center gap-2">
                          <span className="text-3xl">D</span> 
                          <span>Debts & Final Expenses</span>
                        </div>
                        <div className="text-4xl font-black mb-2">
                          {formatCurrency(liabilities.reduce((sum, l) => sum + l.balance, 0) + 15000)}
                        </div>
                        <div className="text-blue-100 text-sm">
                          All debts + $15,000 final expenses
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl text-white shadow-lg">
                        <div className="text-lg font-bold mb-2 flex items-center gap-2">
                          <span className="text-3xl">I</span>
                          <span>Income Replacement</span>
                        </div>
                        <div className="text-4xl font-black mb-2">
                          {formatCurrency((incomeData.w2_income + incomeData.business_income) * 10 * 0.8 / 12)}
                        </div>
                        <div className="text-purple-100 text-sm">
                          10 years of income at 80% replacement
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl text-white shadow-lg">
                        <div className="text-lg font-bold mb-2 flex items-center gap-2">
                          <span className="text-3xl">M</span>
                          <span>Mortgage Balance</span>
                        </div>
                        <div className="text-4xl font-black mb-2">
                          {formatCurrency(liabilities.filter(l => l.type === 'mortgage_primary' || l.type === 'mortgage_rental').reduce((sum, l) => sum + l.balance, 0))}
                        </div>
                        <div className="text-green-100 text-sm">
                          Outstanding home loan balance
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-xl text-white shadow-lg">
                        <div className="text-lg font-bold mb-2 flex items-center gap-2">
                          <span className="text-3xl">E</span>
                          <span>Education Expenses</span>
                        </div>
                        <div className="text-4xl font-black mb-2">
                          {formatCurrency(profileData.dependents * 50000)}
                        </div>
                        <div className="text-orange-100 text-sm">
                          $50,000 per child for education
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Line Results - Big and Clear */}
                  <div className="border-t-4 border-dashed border-gray-300 pt-8">
                    <h3 className="text-2xl font-bold mb-6 text-center text-gray-800">Your Protection Summary:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-8 bg-blue-50 rounded-xl border-2 border-blue-200 shadow-md">
                        <div className="text-sm font-semibold text-blue-700 mb-2 uppercase tracking-wide">Total Need (DIME)</div>
                        <div className="text-5xl font-black text-blue-900 mb-2">{formatCurrency(metrics.dime_need)}</div>
                        <div className="text-xs text-blue-600">What your family needs</div>
                      </div>
                      
                      <div className="text-center p-8 bg-green-50 rounded-xl border-2 border-green-200 shadow-md">
                        <div className="text-sm font-semibold text-green-700 mb-2 uppercase tracking-wide">Current Coverage</div>
                        <div className="text-5xl font-black text-green-900 mb-2">
                          {formatCurrency(protectionData.term_life_coverage + protectionData.permanent_life_db)}
                        </div>
                        <div className="text-xs text-green-600">What you have now</div>
                      </div>
                      
                      <div className="text-center p-8 bg-red-50 rounded-xl border-4 border-red-400 shadow-lg">
                        <div className="text-sm font-bold text-red-700 mb-2 uppercase tracking-wide flex items-center justify-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Protection Gap
                        </div>
                        <div className="text-5xl font-black text-red-900 mb-2">{formatCurrency(metrics.protection_gap)}</div>
                        <div className="text-xs text-red-700 font-semibold">Additional coverage needed</div>
                      </div>
                    </div>
                  </div>

                  {/* General Recommendation - Clear and Simple */}
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-4 border-amber-300 p-8 rounded-xl shadow-lg">
                    <h4 className="text-2xl font-bold text-amber-900 mb-4 flex items-center gap-3">
                      <AlertTriangle className="h-6 w-6" />
                      What This Means For You
                    </h4>
                    <p className="text-lg text-amber-900 leading-relaxed mb-4">
                      {metrics.protection_gap > 0 
                        ? `Based on your DIME calculation, you may have a protection gap of ${formatCurrency(metrics.protection_gap)}. This means your family may not be fully protected if something happens to you.` 
                        : 'Based on your DIME calculation, your current life insurance coverage appears adequate for your family\'s needs.'}
                    </p>
                    <p className="text-base text-amber-800 font-semibold bg-white/50 p-4 rounded-lg">
                      📋 <strong>Next Step:</strong> For a complete strategy tailored to your specific situation, please consult with a licensed financial professional who can review all your options.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <Card>
                  <CardHeader>
                    <CardTitle>Retirement Income Planning</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Monthly Income Goal</div>
                        <div className="text-2xl font-bold">{formatCurrency(profileData.desired_monthly_income)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Projected Sources</div>
                        <div className="text-2xl font-bold">{formatCurrency(incomeData.social_security + incomeData.pension_income)}</div>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="text-sm text-yellow-700 font-medium">Monthly Gap</div>
                      <div className="text-3xl font-bold text-yellow-800">{formatCurrency(metrics.retirement_gap_mo)}</div>
                    </div>

                    <div className="text-sm space-y-2">
                      <div>• <strong>Social Security:</strong> {formatCurrency(incomeData.social_security)}/mo</div>
                      <div>• <strong>Pension:</strong> {formatCurrency(incomeData.pension_income)}/mo</div>
                      <div>• <strong>Portfolio Withdrawal:</strong> Need to fund gap</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Disability Protection</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Monthly Income Need (60%)</div>
                        <div className="text-2xl font-bold">{formatCurrency((incomeData.w2_income + incomeData.business_income) * 0.6)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Current Coverage</div>
                        <div className="text-2xl font-bold">{formatCurrency(0)}</div>
                      </div>
                    </div>
                    
                    {metrics.disability_gap > 0 ? (
                      <div className="bg-red-50 p-4 rounded-lg">
                        <div className="text-sm text-red-700 font-medium">Coverage Gap</div>
                        <div className="text-3xl font-bold text-red-800">{formatCurrency(metrics.disability_gap)}</div>
                      </div>
                    ) : (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-sm text-green-700 font-medium">Coverage Status</div>
                        <div className="text-lg font-bold text-green-800">Adequate</div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Long-Term Care Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Average LTC Cost</div>
                        <div className="text-2xl font-bold">{formatCurrency(5000)}/mo</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Current Coverage</div>
                        <div className="text-2xl font-bold">{formatCurrency(protectionData.ltc_daily_benefit * 30)}/mo</div>
                      </div>
                    </div>
                    
                    {metrics.ltc_gap > 0 ? (
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <div className="text-sm text-orange-700 font-medium">Coverage Gap</div>
                        <div className="text-3xl font-bold text-orange-800">{formatCurrency(metrics.ltc_gap)}</div>
                      </div>
                    ) : (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-sm text-green-700 font-medium">Coverage Status</div>
                        <div className="text-lg font-bold text-green-800">Adequate</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="appendix" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Key Assumptions & Disclosures</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div>
                    <h4 className="font-semibold mb-2">Planning Assumptions:</h4>
                    <ul className="space-y-1 text-gray-700">
                      <li>• Average portfolio return: 6% annually</li>
                      <li>• Inflation rate: 3% annually</li>
                      <li>• Life expectancy: Age 92</li>
                      <li>• Income replacement in retirement: 80%</li>
                      <li>• Education costs: $50,000 per dependent</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Risk Score Methodology:</h4>
                    <ul className="space-y-1 text-gray-700">
                      <li>• Scores range from 0 (no risk) to 100 (critical risk)</li>
                      <li>• Overall score is weighted average of individual risk categories</li>
                      <li>• Weightings: Protection 20%, Volatility 20%, Longevity 15%, Tax 15%, Liquidity 10%, Concentration 10%, Inflation 10%</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Important Disclosures:</h4>
                    <ul className="space-y-1 text-gray-700">
                      <li>• This analysis is for educational purposes only and does not constitute investment advice</li>
                      <li>• All projections are hypothetical and not guaranteed</li>
                      <li>• Insurance products require underwriting and suitability analysis</li>
                      <li>• Consult qualified professionals before making financial decisions</li>
                      <li>• Past performance does not guarantee future results</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}