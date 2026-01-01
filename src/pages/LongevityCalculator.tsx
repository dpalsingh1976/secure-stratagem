import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ArrowLeft, Clock, TrendingUp } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function LongevityCalculator() {
  const navigate = useNavigate();
  const [currentAge, setCurrentAge] = useState(55);
  const [currentSavings, setCurrentSavings] = useState(500000);
  const [yearlyExpenses, setYearlyExpenses] = useState(60000);
  const [expectedLifespan, setExpectedLifespan] = useState(90);
  const [expectedReturn, setExpectedReturn] = useState(6);

  const calculateRunway = () => {
    const yearsInRetirement = expectedLifespan - currentAge;
    let balance = currentSavings;
    let yearsUntilDepletion = 0;
    
    for (let year = 0; year < yearsInRetirement; year++) {
      if (balance <= 0) break;
      balance = balance * (1 + expectedReturn / 100) - yearlyExpenses;
      yearsUntilDepletion++;
    }
    
    return {
      yearsUntilDepletion,
      depletionAge: currentAge + yearsUntilDepletion,
      totalNeeded: yearlyExpenses * yearsInRetirement,
      shortfall: Math.max(0, (yearlyExpenses * yearsInRetirement) - currentSavings)
    };
  };

  const results = calculateRunway();
  const runwayPercentage = (results.yearsUntilDepletion / (expectedLifespan - currentAge)) * 100;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getRiskLevel = () => {
    const yearsShort = expectedLifespan - results.depletionAge;
    if (yearsShort <= 0) return { label: 'Secure', color: 'text-green-600', bgColor: 'bg-green-50' };
    if (yearsShort <= 5) return { label: 'Moderate Risk', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    if (yearsShort <= 10) return { label: 'High Risk', color: 'text-orange-600', bgColor: 'bg-orange-50' };
    return { label: 'Critical Risk', color: 'text-red-600', bgColor: 'bg-red-50' };
  };

  const risk = getRiskLevel();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container-financial py-16">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
<Button variant="outline" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-4xl font-bold font-heading">Longevity Risk Calculator</h1>
              <p className="text-xl text-muted-foreground mt-2">
                Calculate how long your retirement savings will last
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="card-financial">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Retirement Inputs
                </CardTitle>
                <CardDescription>Enter your retirement scenario</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="currentAge">Current Age</Label>
                  <Input
                    id="currentAge"
                    type="number"
                    min="40"
                    max="80"
                    value={currentAge}
                    onChange={(e) => setCurrentAge(Number(e.target.value))}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="savings">Current Retirement Savings</Label>
                  <Input
                    id="savings"
                    type="number"
                    value={currentSavings}
                    onChange={(e) => setCurrentSavings(Number(e.target.value))}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="expenses">Yearly Expenses</Label>
                  <Input
                    id="expenses"
                    type="number"
                    value={yearlyExpenses}
                    onChange={(e) => setYearlyExpenses(Number(e.target.value))}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="lifespan">Expected Lifespan</Label>
                  <Input
                    id="lifespan"
                    type="number"
                    min="70"
                    max="110"
                    value={expectedLifespan}
                    onChange={(e) => setExpectedLifespan(Number(e.target.value))}
                    className="mt-2"
                  />
                  <p className="text-sm text-muted-foreground mt-1">Average US lifespan: 77-79 years</p>
                </div>

                <div>
                  <Label htmlFor="return">Expected Annual Return (%)</Label>
                  <Input
                    id="return"
                    type="number"
                    min="0"
                    max="15"
                    step="0.5"
                    value={expectedReturn}
                    onChange={(e) => setExpectedReturn(Number(e.target.value))}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className={`card-financial border-2 ${risk.bgColor} border-${risk.color}/20`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-secondary" />
                  Longevity Analysis
                </CardTitle>
                <CardDescription>Your retirement runway</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className={`p-6 rounded-lg border-2 ${risk.bgColor}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {results.depletionAge < expectedLifespan && (
                      <AlertTriangle className={`w-5 h-5 ${risk.color}`} />
                    )}
                    <Badge className={risk.color}>{risk.label}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mb-1">Money Lasts Until Age</div>
                  <div className={`text-4xl font-bold ${risk.color} mb-4`}>
                    {results.depletionAge}
                  </div>
                  <Progress value={runwayPercentage} className="h-3" />
                  <div className="text-sm text-muted-foreground mt-2">
                    {results.yearsUntilDepletion} years of runway ({Math.round(runwayPercentage)}%)
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm">Years in Retirement</span>
                    <Badge variant="outline">{expectedLifespan - currentAge} years</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm">Total Needed</span>
                    <Badge variant="outline">{formatCurrency(results.totalNeeded)}</Badge>
                  </div>
                  {results.shortfall > 0 && (
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                      <span className="text-sm text-red-700">Potential Shortfall</span>
                      <Badge className="bg-red-600">{formatCurrency(results.shortfall)}</Badge>
                    </div>
                  )}
                </div>

                {results.depletionAge < expectedLifespan && (
                  <div className="bg-accent/10 p-4 rounded-lg border border-accent/20">
                    <h4 className="font-semibold text-accent mb-2">Solutions to Consider:</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>✓ Immediate or deferred annuity for guaranteed income</li>
                      <li>✓ Indexed Universal Life (IUL) for tax-free withdrawals</li>
                      <li>✓ Part-time work in early retirement years</li>
                      <li>✓ Reduce expenses by 10-15%</li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="card-financial mt-8">
            <CardContent className="p-6">
              <div className="text-sm text-muted-foreground">
                <strong>Planning Note:</strong> This calculator assumes level withdrawals and steady returns, which may not reflect reality. 
                Market volatility, inflation, healthcare costs, and sequence-of-returns risk can significantly impact longevity. 
                For a full strategy solution, please consult a licensed financial professional.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
