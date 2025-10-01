import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DollarSign, ArrowLeft, Calendar } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function AnnuityCalculator() {
  const [premium, setPremium] = useState(250000);
  const [age, setAge] = useState(65);
  const [payoutOption, setPayoutOption] = useState<'single' | 'joint'>('single');
  const [deferralYears, setDeferralYears] = useState(0);

  const calculateMonthlyIncome = () => {
    // Simplified calculation - real annuity rates vary by carrier
    const baseRate = 0.055; // 5.5% base payout rate
    const ageAdjustment = (age - 60) * 0.002; // 0.2% per year over 60
    const jointReduction = payoutOption === 'joint' ? 0.008 : 0; // 0.8% reduction for joint
    const deferralBonus = deferralYears * 0.005; // 0.5% per year deferred
    
    const annualRate = baseRate + ageAdjustment - jointReduction + deferralBonus;
    const annualIncome = premium * annualRate;
    return annualIncome / 12;
  };

  const monthlyIncome = calculateMonthlyIncome();
  const annualIncome = monthlyIncome * 12;

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
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/'}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-4xl font-bold font-heading">Annuity Guaranteed Income Calculator</h1>
              <p className="text-xl text-muted-foreground mt-2">
                Estimate lifetime income from an immediate or deferred annuity
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="card-financial">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  Annuity Parameters
                </CardTitle>
                <CardDescription>Enter your annuity details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="premium">Premium Amount</Label>
                  <Input
                    id="premium"
                    type="number"
                    value={premium}
                    onChange={(e) => setPremium(Number(e.target.value))}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="age">Annuitization Age</Label>
                  <Input
                    id="age"
                    type="number"
                    min="50"
                    max="85"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="mt-2"
                  />
                  <p className="text-sm text-muted-foreground mt-1">Age when payments begin</p>
                </div>

                <div>
                  <Label htmlFor="payout">Payout Option</Label>
                  <Select value={payoutOption} onValueChange={(value: 'single' | 'joint') => setPayoutOption(value)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single Life</SelectItem>
                      <SelectItem value="joint">Joint Life (100% Survivor)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="deferral">Deferral Period (Years)</Label>
                  <Input
                    id="deferral"
                    type="number"
                    min="0"
                    max="20"
                    value={deferralYears}
                    onChange={(e) => setDeferralYears(Number(e.target.value))}
                    className="mt-2"
                  />
                  <p className="text-sm text-muted-foreground mt-1">Years to wait before payments start</p>
                </div>
              </CardContent>
            </Card>

            <Card className="card-financial border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-secondary" />
                  Guaranteed Income Results
                </CardTitle>
                <CardDescription>Lifetime income projection</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-6 rounded-lg border-2 border-primary/20">
                  <div className="text-sm text-muted-foreground mb-1">Monthly Guaranteed Income</div>
                  <div className="text-4xl font-bold text-primary mb-4">{formatCurrency(monthlyIncome)}</div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Annual Income:</span>
                    <span className="font-semibold">{formatCurrency(annualIncome)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm">Premium Invested</span>
                    <Badge variant="outline">{formatCurrency(premium)}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm">Payout Type</span>
                    <Badge variant="outline">{payoutOption === 'single' ? 'Single Life' : 'Joint Life'}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm">Starting Age</span>
                    <Badge variant="outline">{age + deferralYears} years</Badge>
                  </div>
                </div>

                <div className="bg-secondary/10 p-4 rounded-lg border border-secondary/20">
                  <h4 className="font-semibold text-secondary mb-2">Key Benefits:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>✓ Guaranteed income for life</li>
                    <li>✓ Protection from market volatility</li>
                    <li>✓ Eliminates longevity risk</li>
                    <li>✓ Predictable retirement budgeting</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="card-financial mt-8">
            <CardContent className="p-6">
              <div className="text-sm text-muted-foreground">
                <strong>Disclaimer:</strong> This calculator provides general estimates for educational purposes only. 
                Actual annuity payouts vary by insurance carrier, contract type, health status, and current interest rates. 
                Consult a licensed financial professional for personalized recommendations and current quotes.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
