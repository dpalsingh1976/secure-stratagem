import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Calculator, TrendingUp, AlertCircle, CheckCircle, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const RetirementCalculator = () => {
  const navigate = useNavigate();

  // Input states
  const [currentSavings, setCurrentSavings] = useState(50000);
  const [desiredAnnualIncome, setDesiredAnnualIncome] = useState(50000);
  const [otherIncome, setOtherIncome] = useState(20000);
  const [isOtherIncomeTaxed, setIsOtherIncomeTaxed] = useState(false);
  const [currentAge, setCurrentAge] = useState(35);
  const [retirementAge, setRetirementAge] = useState(65);
  const [withdrawUntilAge, setWithdrawUntilAge] = useState(90);
  const [inflationRate, setInflationRate] = useState(3.4);
  const [currentTaxRate, setCurrentTaxRate] = useState(22);
  const [retirementTaxRate, setRetirementTaxRate] = useState(15);
  const [expectedReturn, setExpectedReturn] = useState(6);
  const [accountType, setAccountType] = useState("traditional");
  const [adjustDepositsForInflation, setAdjustDepositsForInflation] = useState(true);

  // Calculations
  const results = useMemo(() => {
    const yearsToRetirement = Math.max(0, retirementAge - currentAge);
    const yearsOfWithdrawals = Math.max(0, withdrawUntilAge - retirementAge);
    
    if (yearsToRetirement <= 0 || yearsOfWithdrawals <= 0) {
      return null;
    }

    const annualReturn = expectedReturn / 100;
    const inflation = inflationRate / 100;
    const taxCurrent = currentTaxRate / 100;
    const taxRetirement = retirementTaxRate / 100;

    // Calculate future value of current savings
    const futureValueOfSavings = currentSavings * Math.pow(1 + annualReturn, yearsToRetirement);

    // Calculate inflation-adjusted income needed
    const futureAnnualIncome = desiredAnnualIncome * Math.pow(1 + inflation, yearsToRetirement);
    
    // Adjust for other income sources
    let effectiveOtherIncome = otherIncome * Math.pow(1 + inflation, yearsToRetirement);
    if (isOtherIncomeTaxed) {
      effectiveOtherIncome = effectiveOtherIncome * (1 - taxRetirement);
    }
    
    // Net income needed from portfolio
    let netIncomeNeeded = futureAnnualIncome - effectiveOtherIncome;
    
    // Adjust for account type tax treatment
    let grossWithdrawalNeeded = netIncomeNeeded;
    if (accountType === "traditional" || accountType === "401k") {
      // Traditional accounts are taxed on withdrawal
      grossWithdrawalNeeded = netIncomeNeeded / (1 - taxRetirement);
    }
    // Roth and brokerage (assuming long-term capital gains) have different treatments
    // For simplicity, Roth is tax-free, brokerage we assume 15% LTCG
    if (accountType === "brokerage") {
      grossWithdrawalNeeded = netIncomeNeeded / (1 - 0.15);
    }

    // Calculate present value of withdrawals needed (at retirement)
    // Using real rate of return during retirement
    const realReturnInRetirement = (1 + annualReturn) / (1 + inflation) - 1;
    const pvWithdrawals = grossWithdrawalNeeded * 
      ((1 - Math.pow(1 + realReturnInRetirement, -yearsOfWithdrawals)) / realReturnInRetirement);

    // Amount still needed at retirement
    const amountNeeded = Math.max(0, pvWithdrawals - futureValueOfSavings);

    // Calculate required annual contribution
    let annualContribution = 0;
    if (amountNeeded > 0 && yearsToRetirement > 0) {
      if (adjustDepositsForInflation) {
        // Growing annuity formula
        const g = inflation;
        const r = annualReturn;
        if (Math.abs(r - g) < 0.0001) {
          annualContribution = amountNeeded / yearsToRetirement;
        } else {
          annualContribution = amountNeeded * (r - g) / 
            (Math.pow(1 + r, yearsToRetirement) - Math.pow(1 + g, yearsToRetirement));
        }
      } else {
        // Regular annuity formula
        annualContribution = amountNeeded * annualReturn / 
          (Math.pow(1 + annualReturn, yearsToRetirement) - 1);
      }
    }

    // Adjust for tax deduction if traditional/401k
    let taxAdjustedContribution = annualContribution;
    if (accountType === "traditional" || accountType === "401k") {
      // Contribution reduces taxable income, so effective cost is lower
      taxAdjustedContribution = annualContribution * (1 - taxCurrent);
    }

    // Calculate projected balance at retirement with contributions
    let projectedBalance = currentSavings;
    for (let i = 0; i < yearsToRetirement; i++) {
      projectedBalance = projectedBalance * (1 + annualReturn) + annualContribution;
    }

    // Determine status
    const isOnTrack = amountNeeded <= 0;
    const surplus = isOnTrack ? futureValueOfSavings - pvWithdrawals : 0;

    return {
      yearsToRetirement,
      yearsOfWithdrawals,
      futureValueOfSavings,
      futureAnnualIncome,
      pvWithdrawals,
      amountNeeded,
      annualContribution,
      taxAdjustedContribution,
      projectedBalance,
      isOnTrack,
      surplus,
      monthlyContribution: annualContribution / 12,
    };
  }, [
    currentSavings, desiredAnnualIncome, otherIncome, isOtherIncomeTaxed,
    currentAge, retirementAge, withdrawUntilAge, inflationRate,
    currentTaxRate, retirementTaxRate, expectedReturn, accountType, adjustDepositsForInflation
  ]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const InfoTooltip = ({ content }: { content: string }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="h-4 w-4 text-muted-foreground cursor-help inline ml-1" />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p>{content}</p>
      </TooltipContent>
    </Tooltip>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container-financial section-padding">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Calculator className="h-8 w-8 text-primary" />
              Retirement Savings Calculator
            </h1>
            <p className="text-muted-foreground mt-1">
              Calculate how much you need to save annually to reach your retirement goals
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Inputs Card */}
          <Card>
            <CardHeader>
              <CardTitle>Your Information</CardTitle>
              <CardDescription>Enter your details to calculate your retirement needs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Savings */}
              <div className="space-y-2">
                <Label htmlFor="currentSavings">
                  Current Retirement Savings
                  <InfoTooltip content="Total amount currently saved in all retirement accounts" />
                </Label>
                <Input
                  id="currentSavings"
                  type="number"
                  value={currentSavings}
                  onChange={(e) => setCurrentSavings(Number(e.target.value))}
                  className="text-lg"
                />
              </div>

              {/* Desired Income */}
              <div className="space-y-2">
                <Label htmlFor="desiredIncome">
                  Desired Annual Retirement Income
                  <InfoTooltip content="After-tax income you want per year in retirement (today's dollars)" />
                </Label>
                <Input
                  id="desiredIncome"
                  type="number"
                  value={desiredAnnualIncome}
                  onChange={(e) => setDesiredAnnualIncome(Number(e.target.value))}
                  className="text-lg"
                />
              </div>

              {/* Other Income */}
              <div className="space-y-2">
                <Label htmlFor="otherIncome">
                  Annual Income from Other Sources
                  <InfoTooltip content="Social Security, pension, rental income, etc." />
                </Label>
                <Input
                  id="otherIncome"
                  type="number"
                  value={otherIncome}
                  onChange={(e) => setOtherIncome(Number(e.target.value))}
                  className="text-lg"
                />
              </div>

              {/* Other Income Taxed */}
              <div className="flex items-center justify-between">
                <Label htmlFor="otherIncomeTaxed">
                  Will other income be taxed?
                  <InfoTooltip content="If yes, we'll adjust for taxes on Social Security/pension" />
                </Label>
                <Switch
                  id="otherIncomeTaxed"
                  checked={isOtherIncomeTaxed}
                  onCheckedChange={setIsOtherIncomeTaxed}
                />
              </div>

              {/* Ages */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentAge">Current Age</Label>
                  <Input
                    id="currentAge"
                    type="number"
                    value={currentAge}
                    onChange={(e) => setCurrentAge(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retirementAge">Retirement Age</Label>
                  <Input
                    id="retirementAge"
                    type="number"
                    value={retirementAge}
                    onChange={(e) => setRetirementAge(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="withdrawUntilAge">
                    Withdraw Until
                    <InfoTooltip content="Life expectancy or age you want funds to last" />
                  </Label>
                  <Select value={String(withdrawUntilAge)} onValueChange={(v) => setWithdrawUntilAge(Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="86">Age 86</SelectItem>
                      <SelectItem value="89">Age 89</SelectItem>
                      <SelectItem value="92">Age 92</SelectItem>
                      <SelectItem value="95">Age 95</SelectItem>
                      <SelectItem value="100">Age 100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Rates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="inflationRate">
                    Inflation Rate (%)
                    <InfoTooltip content="Historical average is 3.4%" />
                  </Label>
                  <Input
                    id="inflationRate"
                    type="number"
                    step="0.1"
                    value={inflationRate}
                    onChange={(e) => setInflationRate(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expectedReturn">
                    Expected Return (%)
                    <InfoTooltip content="Average annual investment return before retirement" />
                  </Label>
                  <Input
                    id="expectedReturn"
                    type="number"
                    step="0.1"
                    value={expectedReturn}
                    onChange={(e) => setExpectedReturn(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Tax Rates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentTaxRate">
                    Current Tax Rate (%)
                    <InfoTooltip content="Your marginal tax rate while working" />
                  </Label>
                  <Input
                    id="currentTaxRate"
                    type="number"
                    value={currentTaxRate}
                    onChange={(e) => setCurrentTaxRate(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retirementTaxRate">
                    Retirement Tax Rate (%)
                    <InfoTooltip content="Expected tax rate during retirement" />
                  </Label>
                  <Input
                    id="retirementTaxRate"
                    type="number"
                    value={retirementTaxRate}
                    onChange={(e) => setRetirementTaxRate(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Account Type */}
              <div className="space-y-2">
                <Label htmlFor="accountType">
                  Primary Account Type
                  <InfoTooltip content="Determines tax treatment of contributions and withdrawals" />
                </Label>
                <Select value={accountType} onValueChange={setAccountType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="traditional">Traditional IRA/SEP</SelectItem>
                    <SelectItem value="401k">401(k)/403(b)</SelectItem>
                    <SelectItem value="roth">Roth IRA</SelectItem>
                    <SelectItem value="brokerage">Taxable Brokerage</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Adjust for Inflation */}
              <div className="flex items-center justify-between">
                <Label htmlFor="adjustInflation">
                  Increase contributions with inflation?
                  <InfoTooltip content="Grow your annual contributions by inflation rate each year" />
                </Label>
                <Switch
                  id="adjustInflation"
                  checked={adjustDepositsForInflation}
                  onCheckedChange={setAdjustDepositsForInflation}
                />
              </div>
            </CardContent>
          </Card>

          {/* Results Card */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Your Results
              </CardTitle>
              <CardDescription>Based on your inputs, here's your retirement outlook</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {results ? (
                <>
                  {/* Status Indicator */}
                  <div className={`p-4 rounded-lg ${results.isOnTrack ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                    <div className="flex items-start gap-3">
                      {results.isOnTrack ? (
                        <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-6 w-6 text-amber-600 mt-0.5" />
                      )}
                      <div>
                        <p className={`font-semibold ${results.isOnTrack ? 'text-green-800' : 'text-amber-800'}`}>
                          {results.isOnTrack 
                            ? "You're on track for retirement!" 
                            : "Additional savings needed"}
                        </p>
                        <p className={`text-sm ${results.isOnTrack ? 'text-green-700' : 'text-amber-700'}`}>
                          {results.isOnTrack 
                            ? `You have a projected surplus of ${formatCurrency(results.surplus)}`
                            : `You need to save ${formatCurrency(results.annualContribution)} per year`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Required Annual Savings</p>
                      <p className="text-2xl font-bold text-foreground">
                        {formatCurrency(results.annualContribution)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ({formatCurrency(results.monthlyContribution)}/month)
                      </p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">After-Tax Cost</p>
                      <p className="text-2xl font-bold text-foreground">
                        {formatCurrency(results.taxAdjustedContribution)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        (with tax deduction)
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Projected Balance at {retirementAge}</p>
                      <p className="text-2xl font-bold text-primary">
                        {formatCurrency(results.projectedBalance)}
                      </p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Years of Withdrawals</p>
                      <p className="text-2xl font-bold text-foreground">
                        {results.yearsOfWithdrawals} years
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Age {retirementAge} to {withdrawUntilAge}
                      </p>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <h4 className="font-semibold text-foreground mb-2">Summary</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• {results.yearsToRetirement} years until retirement</li>
                      <li>• Future income need: {formatCurrency(results.futureAnnualIncome)}/year (inflation-adjusted)</li>
                      <li>• Current savings will grow to: {formatCurrency(results.futureValueOfSavings)}</li>
                      <li>• Total needed at retirement: {formatCurrency(results.pvWithdrawals)}</li>
                    </ul>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Please enter valid ages (current age &lt; retirement age &lt; withdrawal age)</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 p-4 bg-muted rounded-lg text-center">
          <p className="text-sm text-muted-foreground">
            <strong>Disclaimer:</strong> This calculator provides estimates for educational purposes only. 
            Actual results may vary based on market conditions, tax law changes, and other factors. 
            Consult a financial advisor for personalized advice.
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default RetirementCalculator;
