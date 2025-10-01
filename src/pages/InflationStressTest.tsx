import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingDown, TrendingUp, ArrowLeft, AlertCircle } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function InflationStressTest() {
  const [initialSavings, setInitialSavings] = useState(500000);
  const [expectedReturn, setExpectedReturn] = useState(7);
  const [inflationRate, setInflationRate] = useState(3);
  const [yearsToProject, setYearsToProject] = useState(30);

  const calculateProjections = () => {
    const data = [];
    let stableGrowth = initialSavings;
    let volatileGrowth = initialSavings;
    
    for (let year = 0; year <= yearsToProject; year++) {
      // Stable growth (expected return)
      stableGrowth = stableGrowth * (1 + expectedReturn / 100);
      
      // Volatile growth (simulate market volatility)
      const volatility = 0.15; // 15% standard deviation
      const randomReturn = expectedReturn + (Math.random() - 0.5) * 2 * volatility;
      volatileGrowth = volatileGrowth * (1 + Math.max(-0.4, Math.min(0.4, randomReturn / 100)));
      
      // Real purchasing power (adjusted for inflation)
      const inflationAdjustment = Math.pow(1 + inflationRate / 100, year);
      
      data.push({
        year,
        stable: Math.round(stableGrowth),
        volatile: Math.round(volatileGrowth),
        realValue: Math.round(stableGrowth / inflationAdjustment)
      });
    }
    
    return data;
  };

  const data = calculateProjections();
  const finalStable = data[data.length - 1].stable;
  const finalVolatile = data[data.length - 1].volatile;
  const finalReal = data[data.length - 1].realValue;
  const realLoss = ((finalStable - finalReal) / finalStable) * 100;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container-financial py-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/'}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-4xl font-bold font-heading">Inflation & Market Risk Stress Test</h1>
              <p className="text-xl text-muted-foreground mt-2">
                Compare stable vs. volatile growth and understand inflation impact
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="card-financial">
              <CardHeader>
                <CardTitle>Test Parameters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="savings">Initial Savings</Label>
                  <Input
                    id="savings"
                    type="number"
                    value={initialSavings}
                    onChange={(e) => setInitialSavings(Number(e.target.value))}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="return">Expected Return (%)</Label>
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

                <div>
                  <Label htmlFor="inflation">Inflation Rate (%)</Label>
                  <Input
                    id="inflation"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={inflationRate}
                    onChange={(e) => setInflationRate(Number(e.target.value))}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="years">Years to Project</Label>
                  <Input
                    id="years"
                    type="number"
                    min="10"
                    max="50"
                    value={yearsToProject}
                    onChange={(e) => setYearsToProject(Number(e.target.value))}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="card-financial lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Growth Comparison
                </CardTitle>
                <CardDescription>Stable vs Volatile Growth Over Time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" label={{ value: 'Years', position: 'insideBottom', offset: -5 }} />
                    <YAxis 
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      label={{ value: 'Portfolio Value', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(label) => `Year ${label}`}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="stable" stroke="hsl(var(--primary))" strokeWidth={2} name="Stable Growth" />
                    <Line type="monotone" dataKey="volatile" stroke="hsl(var(--accent))" strokeWidth={2} name="Volatile Growth" />
                    <Line type="monotone" dataKey="realValue" stroke="hsl(var(--secondary))" strokeWidth={2} strokeDasharray="5 5" name="Real Purchasing Power" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="card-financial border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Stable Growth
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary mb-2">{formatCurrency(finalStable)}</div>
                <p className="text-sm text-muted-foreground">Assuming steady {expectedReturn}% returns</p>
              </CardContent>
            </Card>

            <Card className="card-financial border-2 border-accent/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-accent" />
                  Volatile Growth
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-accent mb-2">{formatCurrency(finalVolatile)}</div>
                <p className="text-sm text-muted-foreground">With market volatility factored in</p>
              </CardContent>
            </Card>

            <Card className="card-financial border-2 border-secondary/20 bg-secondary/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-secondary" />
                  Real Purchasing Power
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-secondary mb-2">{formatCurrency(finalReal)}</div>
                <Badge className="bg-red-600">-{realLoss.toFixed(1)}% due to inflation</Badge>
              </CardContent>
            </Card>
          </div>

          <Card className="card-financial">
            <CardHeader>
              <CardTitle>Key Insights & Protection Strategies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-red-600 mb-2">Risks Identified:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Inflation erodes {realLoss.toFixed(1)}% of purchasing power over {yearsToProject} years</li>
                    <li>• Market volatility can significantly reduce portfolio value</li>
                    <li>• Sequence-of-returns risk in early retirement</li>
                    <li>• Traditional savings may not keep pace with inflation</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-green-600 mb-2">Protection Strategies:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>✓ Consider IUL policies with downside protection</li>
                    <li>✓ Fixed indexed annuities provide floor protection</li>
                    <li>✓ Treasury I-Bonds for inflation-protected savings</li>
                    <li>✓ Diversify across tax buckets to manage sequence risk</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-financial mt-6">
            <CardContent className="p-6">
              <div className="text-sm text-muted-foreground">
                <strong>Disclaimer:</strong> This stress test uses simplified modeling and random volatility simulations. 
                Actual market conditions, inflation rates, and investment returns will vary. For a full strategy solution, 
                please consult a licensed financial professional.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
