import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Download, 
  TrendingUp, 
  Shield, 
  AlertTriangle, 
  DollarSign,
  Calendar,
  CheckCircle2,
  XCircle,
  ArrowRight
} from 'lucide-react';
import { calculateAllRisks, calculateLifeInsuranceRisk, calculateLongevityRisk, formatCurrency } from '@/utils/riskCalculations';
import { RiskInputs } from '@/types/riskTypes';

const FNAReport = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const data = location.state as { inputs: RiskInputs; clientName?: string } | null;

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground mb-4">No assessment data found.</p>
            <Button onClick={() => navigate('/admin/risk-intake')} className="w-full">
              Start New Assessment
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { inputs, clientName = 'Client' } = data;
  const riskScores = calculateAllRisks(inputs);
  const lifeInsuranceData = calculateLifeInsuranceRisk(inputs);
  const longevityData = calculateLongevityRisk(inputs);

  const getRiskLevel = (score: number) => {
    if (score >= 80) return { label: 'Critical', color: 'risk-critical', bgColor: 'bg-red-50' };
    if (score >= 60) return { label: 'High', color: 'risk-high', bgColor: 'bg-orange-50' };
    if (score >= 30) return { label: 'Moderate', color: 'risk-medium', bgColor: 'bg-yellow-50' };
    return { label: 'Low', color: 'risk-low', bgColor: 'bg-green-50' };
  };

  const overallRisk = getRiskLevel(riskScores.overall);

  const handleGeneratePDF = async () => {
    // Placeholder for PDF generation
    alert('PDF generation will be implemented with backend integration');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container-financial py-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button onClick={handleGeneratePDF} className="btn-accent">
              <Download className="w-4 h-4 mr-2" />
              Generate PDF Report
            </Button>
          </div>
        </div>
      </div>

      <div className="container-financial py-8 max-w-5xl">
        {/* Report Header */}
        <Card className="mb-8 shadow-xl">
          <CardHeader className="bg-gradient-primary text-white">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-3xl mb-2">Financial Need Analysis Report</CardTitle>
                <CardDescription className="text-white/90 text-lg">
                  Comprehensive Risk Assessment for {clientName}
                </CardDescription>
                <p className="text-white/80 text-sm mt-2">
                  Generated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <Badge className={`${overallRisk.bgColor} ${overallRisk.color} text-lg px-4 py-2 border-2`}>
                {overallRisk.label} Risk
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Overall Risk Score</span>
                  <span className="text-2xl font-bold">{riskScores.overall}%</span>
                </div>
                <Progress value={riskScores.overall} className="h-3" />
              </div>
              
              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                  {riskScores.overall >= 60
                    ? 'Your assessment reveals significant financial risks that require immediate attention. Review each section below for specific recommendations.'
                    : riskScores.overall >= 30
                    ? 'Your financial plan has some areas that need improvement. Focus on the high-priority items identified below.'
                    : 'Your financial foundation is solid. Continue monitoring and optimizing the areas highlighted below.'}
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>

        {/* 1. Insurance Gap Analysis */}
        <Card className="mb-8 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary rounded-lg">
                <Shield className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-2xl">Life Insurance Gap Analysis</CardTitle>
                <CardDescription>Protection needs vs. current coverage</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 border">
                <p className="text-sm text-muted-foreground mb-1">Total Need (DIME Method)</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(lifeInsuranceData.need)}</p>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 border">
                <p className="text-sm text-muted-foreground mb-1">Current Coverage</p>
                <p className="text-2xl font-bold text-secondary">{formatCurrency(lifeInsuranceData.available)}</p>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-br from-red-50 to-red-100 border border-red-200">
                <p className="text-sm text-red-700 mb-1">Protection Gap</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(lifeInsuranceData.gap)}</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Coverage Adequacy</span>
                <Badge className={getRiskLevel(riskScores.lifeInsurance).bgColor + ' ' + getRiskLevel(riskScores.lifeInsurance).color}>
                  {getRiskLevel(riskScores.lifeInsurance).label}
                </Badge>
              </div>
              <Progress value={100 - riskScores.lifeInsurance} className="h-3" />
              <p className="text-xs text-muted-foreground mt-1">
                {100 - riskScores.lifeInsurance}% of protection needs met
              </p>
            </div>

            <Alert variant={riskScores.lifeInsurance >= 60 ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Key Finding:</strong> {lifeInsuranceData.gap > 0
                  ? `You have a ${formatCurrency(lifeInsuranceData.gap)} gap in life insurance coverage. This means your family would face significant financial shortfall if the unexpected occurred.`
                  : 'Your life insurance coverage appears adequate for your current needs. Continue to review annually as circumstances change.'}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Recommendations:</h4>
              <ul className="space-y-2 text-sm">
                {lifeInsuranceData.gap > 0 && (
                  <>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Consider term life insurance to cover the {formatCurrency(lifeInsuranceData.gap)} gap cost-effectively</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Explore permanent policies with cash value accumulation for long-term wealth building</span>
                    </li>
                  </>
                )}
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Review beneficiary designations annually and after major life events</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* 2. Market Risk Analysis */}
        <Card className="mb-8 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-accent rounded-lg">
                <TrendingUp className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <CardTitle className="text-2xl">Market & Volatility Risk</CardTitle>
                <CardDescription>Exposure to market downturns and sequence risk</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Market Risk Exposure</span>
                <Badge className={getRiskLevel(riskScores.market).bgColor + ' ' + getRiskLevel(riskScores.market).color}>
                  {riskScores.market}% Risk Score
                </Badge>
              </div>
              <Progress value={riskScores.market} className="h-3" />
            </div>

            <Alert>
              <DollarSign className="h-4 w-4" />
              <AlertDescription>
                <strong>Market Protection Strategy:</strong> Consider allocating a portion of assets to tax-free accumulation vehicles with downside protection, such as properly structured Index Universal Life (IUL) policies or fixed indexed annuities.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border bg-gradient-to-br from-blue-50 to-blue-100">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Benefits of Tax-Free Alternatives
                </h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Principal protection from market crashes</li>
                  <li>• Tax-free growth and distributions</li>
                  <li>• No required minimum distributions (RMDs)</li>
                  <li>• Potential for upside participation</li>
                </ul>
              </div>
              <div className="p-4 rounded-lg border bg-gradient-to-br from-slate-50 to-slate-100">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-orange-600" />
                  Traditional Investment Risks
                </h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Direct exposure to market volatility</li>
                  <li>• Sequence of returns risk near retirement</li>
                  <li>• Taxation on all growth and distributions</li>
                  <li>• Forced RMDs may create tax burden</li>
                </ul>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Recommendations:</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Allocate 20-30% of retirement assets to principal-protected alternatives</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Review our Stress Testing tool to compare IUL vs traditional investments</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Consider dollar-cost averaging into safer positions as retirement approaches</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* 3. Tax Risk Analysis */}
        <Card className="mb-8 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-secondary rounded-lg">
                <DollarSign className="w-6 h-6 text-secondary-foreground" />
              </div>
              <div>
                <CardTitle className="text-2xl">Tax Diversification Risk</CardTitle>
                <CardDescription>Current tax bucket allocation and optimization opportunities</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Tax Efficiency Risk</span>
                <Badge className={getRiskLevel(riskScores.tax).bgColor + ' ' + getRiskLevel(riskScores.tax).color}>
                  {riskScores.tax}% Risk Score
                </Badge>
              </div>
              <Progress value={riskScores.tax} className="h-3" />
            </div>

            <Alert variant={riskScores.tax >= 60 ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Tax Concentration Risk:</strong> {!inputs.hasEstateDocs || !inputs.beneficiariesUpdated
                  ? 'Missing estate documents and beneficiary updates expose you to unnecessary tax liability and probate costs. '
                  : ''}
                Diversifying into tax-free buckets can significantly reduce lifetime tax drag and increase net retirement income.
              </AlertDescription>
            </Alert>

            <div className="p-6 rounded-lg border bg-gradient-to-br from-slate-50 to-slate-100">
              <h4 className="font-semibold mb-4">Tax Bucket Diversification</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Tax-Deferred (401k, IRA)</span>
                    <span className="text-sm font-semibold">~65%</span>
                  </div>
                  <Progress value={65} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">Taxed at ordinary income rates + RMDs required</p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Taxable (Brokerage)</span>
                    <span className="text-sm font-semibold">~30%</span>
                  </div>
                  <Progress value={30} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">Capital gains tax + annual dividend tax</p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Tax-Free (Roth, IUL, HSA)</span>
                    <span className="text-sm font-semibold text-red-600">~5%</span>
                  </div>
                  <Progress value={5} className="h-2" />
                  <p className="text-xs text-red-600 mt-1 font-medium">⚠️ Underdiversified - Opportunity for improvement</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Recommendations:</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Target 30-40% of retirement assets in tax-free buckets for optimal flexibility</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Maximize Roth conversions in low-income years before RMDs begin</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Consider overfunded IUL for supplemental tax-free retirement income</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Use our 7702 Estimator to compare tax-free vs tax-deferred accumulation</span>
                </li>
                {!inputs.hasEstateDocs && (
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    <span className="text-orange-700">Update estate documents immediately to avoid probate and minimize estate taxes</span>
                  </li>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* 4. Longevity Risk Analysis */}
        <Card className="mb-8 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-600 rounded-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Longevity & Retirement Risk</CardTitle>
                <CardDescription>Probability of outliving your assets</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 border">
                <p className="text-sm text-muted-foreground mb-1">Retirement Years</p>
                <p className="text-2xl font-bold">{inputs.lifeExpectancyAge - inputs.plannedRetirementAge} years</p>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 border">
                <p className="text-sm text-muted-foreground mb-1">Annual Need</p>
                <p className="text-2xl font-bold">{formatCurrency(inputs.monthlyExpenses * 12)}</p>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
                <p className="text-sm text-purple-700 mb-1">Potential Shortfall</p>
                <p className="text-2xl font-bold text-purple-600">
                  {longevityData.yearsShort > 0 ? `${longevityData.yearsShort} years` : 'Covered'}
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Retirement Income Adequacy</span>
                <Badge className={getRiskLevel(riskScores.longevity).bgColor + ' ' + getRiskLevel(riskScores.longevity).color}>
                  {getRiskLevel(riskScores.longevity).label}
                </Badge>
              </div>
              <Progress value={100 - riskScores.longevity} className="h-3" />
              <p className="text-xs text-muted-foreground mt-1">
                {100 - riskScores.longevity}% of retirement income needs covered
              </p>
            </div>

            <Alert variant={riskScores.longevity >= 60 ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Longevity Risk Finding:</strong> {longevityData.lifetimeGap > 0
                  ? `Based on current projections, you may face a ${formatCurrency(longevityData.lifetimeGap)} lifetime shortfall in retirement income. Consider guaranteed income sources to reduce this risk.`
                  : 'Your current retirement plan appears adequate. Continue monitoring and adjusting as circumstances change.'}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Recommendations:</h4>
              <ul className="space-y-2 text-sm">
                {longevityData.lifetimeGap > 0 && (
                  <>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Add guaranteed income through annuities or IUL income riders to cover essential expenses</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Consider delaying Social Security to age 70 for maximum benefit (8% increase per year)</span>
                    </li>
                  </>
                )}
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Implement tax-efficient withdrawal strategies to maximize portfolio longevity</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Explore IUL policies with income riders for tax-free supplemental retirement income</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="shadow-xl border-2 border-primary">
          <CardHeader className="bg-gradient-primary text-white">
            <CardTitle className="text-2xl">Next Steps: Take Action</CardTitle>
            <CardDescription className="text-white/90">
              Schedule a complimentary strategy session to address your specific needs
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button size="lg" className="btn-accent h-auto py-4">
                <Calendar className="w-5 h-5 mr-2" />
                <div className="text-left">
                  <div className="font-semibold">Book Strategy Call</div>
                  <div className="text-xs opacity-90">30-minute consultation</div>
                </div>
              </Button>
              <Button size="lg" variant="outline" className="h-auto py-4" onClick={handleGeneratePDF}>
                <Download className="w-5 h-5 mr-2" />
                <div className="text-left">
                  <div className="font-semibold">Download PDF Report</div>
                  <div className="text-xs text-muted-foreground">For your records</div>
                </div>
              </Button>
            </div>

            <div className="pt-4 border-t space-y-3">
              <h4 className="font-semibold">Additional Resources:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button variant="ghost" className="justify-start" onClick={() => navigate('/tax-bucket-estimator')}>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Try 7702 Tax Bucket Estimator
                </Button>
                <Button variant="ghost" className="justify-start" onClick={() => navigate('/stress-test')}>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Compare IUL vs Investments
                </Button>
                <Button variant="ghost" className="justify-start" onClick={() => navigate('/iul')}>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Learn About IUL / Infinite Banking
                </Button>
                <Button variant="ghost" className="justify-start" onClick={() => navigate('/policy-assistant')}>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Upload & Analyze Your Policies
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <div className="mt-6 p-4 bg-slate-100 rounded-lg text-xs text-muted-foreground">
          <p className="font-semibold mb-2">Important Disclosures:</p>
          <p>
            This report is for educational purposes only and does not constitute financial, legal, or tax advice. 
            All calculations are estimates based on information you provided and standard industry assumptions. 
            Actual results may vary. Life insurance and annuity products have fees, expenses, and limitations. 
            Consult with licensed professionals before making financial decisions. Past performance does not guarantee future results.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FNAReport;
