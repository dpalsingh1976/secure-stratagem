import { useNavigate } from "react-router-dom";
import {
  Shield,
  DollarSign,
  TrendingUp,
  CheckCircle,
  XCircle,
  Calendar,
  Lock,
  Percent,
  HelpCircle,
  ArrowRight,
  AlertTriangle,
  Building2,
  PiggyBank,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const Annuities = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center bg-gradient-to-br from-white via-amber-50/30 to-white overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>
        <div className="relative z-10 container-financial">
          <div className="max-w-4xl mx-auto text-center animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-amber-600 text-white rounded-full px-6 py-2 mb-8 text-sm font-semibold">
              <Shield className="w-4 h-4" />
              Guaranteed Retirement Income
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 font-heading leading-tight">
              Fixed Index Annuities
              <span className="block text-amber-600">Explained</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              Understand how Fixed Index Annuities (FIAs) can provide guaranteed lifetime income, 
              principal protection, and growth potential for a secure retirement.
            </p>

            <Button
              size="lg"
              className="bg-amber-600 hover:bg-amber-700 text-white text-lg px-8 py-6 shadow-lg"
              onClick={() => navigate("/admin/risk-intake")}
            >
              Take the Suitability Assessment
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* What is a Fixed Index Annuity? */}
      <section className="section-padding bg-white">
        <div className="container-financial">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 font-heading">What is a Fixed Index Annuity?</h2>
            <p className="text-xl text-muted-foreground">
              A Fixed Index Annuity (FIA) is an insurance contract that provides the potential for interest 
              based on the performance of a market index (like the S&P 500), while protecting your principal 
              from market losses. It's designed to help you accumulate savings for retirement and can provide 
              guaranteed income for life.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-200">
              <CardHeader>
                <div className="p-4 rounded-full bg-amber-100 w-fit mb-4">
                  <Shield className="w-8 h-8 text-amber-600" />
                </div>
                <CardTitle className="text-xl">Principal Protection</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Your initial investment is protected from market downturns. Even if the market drops 30%, 
                  your principal stays safe with a guaranteed floor (typically 0%).
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-200">
              <CardHeader>
                <div className="p-4 rounded-full bg-amber-100 w-fit mb-4">
                  <TrendingUp className="w-8 h-8 text-amber-600" />
                </div>
                <CardTitle className="text-xl">Index-Linked Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Earn interest credits based on market index performance without direct market exposure. 
                  Participate in gains up to a cap rate while avoiding losses.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-200">
              <CardHeader>
                <div className="p-4 rounded-full bg-amber-100 w-fit mb-4">
                  <DollarSign className="w-8 h-8 text-amber-600" />
                </div>
                <CardTitle className="text-xl">Guaranteed Income</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Optional income riders provide guaranteed lifetime income you can't outlive, 
                  giving you predictable cash flow throughout retirement.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How Fixed Index Annuities Work */}
      <section className="section-padding" style={{ backgroundColor: "hsl(45 93% 97%)" }}>
        <div className="container-financial">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 font-heading">How Fixed Index Annuities Work</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              FIAs work in two main phases: accumulation and income distribution
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
            <Card className="bg-white">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-amber-100">
                    <PiggyBank className="w-6 h-6 text-amber-600" />
                  </div>
                  <CardTitle className="text-xl">Accumulation Phase</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  During this phase, you make premium payments and your money grows based on index performance:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Make a lump sum or series of premium payments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Choose index strategies (S&P 500, NASDAQ, etc.)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Earn interest credits based on index gains</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Interest is locked in and compounds tax-deferred</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-amber-100">
                    <DollarSign className="w-6 h-6 text-amber-600" />
                  </div>
                  <CardTitle className="text-xl">Income Phase</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  When you're ready, convert your accumulated value into guaranteed income:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Activate your income rider for lifetime payments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Receive guaranteed monthly/annual income</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Income continues even if account value reaches zero</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Joint options available for spousal coverage</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Key Terms */}
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold mb-6 text-center">Key Terms to Understand</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Percent className="w-5 h-5 text-amber-600" />
                  <span className="font-semibold">Cap Rate</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  The maximum interest you can earn in a crediting period. If the cap is 10% and the index gains 15%, you earn 10%.
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-5 h-5 text-amber-600" />
                  <span className="font-semibold">Participation Rate</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  The percentage of index gains credited to your account. At 80% participation, a 10% index gain credits 8%.
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-amber-600" />
                  <span className="font-semibold">Floor</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  The minimum interest rate, typically 0%. Protects your principal from market losses.
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-5 h-5 text-amber-600" />
                  <span className="font-semibold">Surrender Period</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  The time frame (typically 5-10 years) during which early withdrawals may incur surrender charges.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who Is an Annuity Right For? */}
      <section className="section-padding bg-white">
        <div className="container-financial">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 font-heading">Who Is a Fixed Index Annuity Right For?</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              FIAs are powerful tools for the right situation, but they're not for everyone
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card className="bg-gradient-to-br from-green-50 to-white border-green-200">
              <CardHeader>
                <CardTitle className="text-xl text-green-700 flex items-center gap-2">
                  <CheckCircle className="w-6 h-6" />
                  Strong Fit If You...
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Are within 10-15 years of retirement or already retired</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Want guaranteed income you can't outlive</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Prioritize principal protection over maximum growth</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Have a 6+ month emergency fund in place</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Are concerned about outliving your savings</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Want to reduce sequence-of-returns risk in retirement</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-white border-red-200">
              <CardHeader>
                <CardTitle className="text-xl text-red-700 flex items-center gap-2">
                  <XCircle className="w-6 h-6" />
                  May Not Be Ideal If You...
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>Need access to all your funds in the next 5-10 years</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>Want full market participation and maximum growth</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>Have variable or unstable income</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>Haven't built adequate emergency reserves</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>Are under 50 with 20+ years until retirement</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>Are uncomfortable with long-term commitments</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <Button
              size="lg"
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => navigate("/admin/risk-intake")}
            >
              Take the Suitability Assessment
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Common Misconceptions */}
      <section className="section-padding" style={{ backgroundColor: "hsl(45 93% 97%)" }}>
        <div className="container-financial">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 font-heading">Common Misconceptions</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Let's clear up some common myths about Fixed Index Annuities
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="item-1" className="bg-white rounded-lg border px-6">
                <AccordionTrigger className="text-left">
                  <span className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    "Annuities have high hidden fees"
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  Fixed Index Annuities typically have no explicit annual fees for the base contract. 
                  Costs are built into the product design through cap rates and participation rates. 
                  Optional riders (like income guarantees) do have fees, usually 0.5-1.5% annually, 
                  and are clearly disclosed. Compare this to managed investment accounts that often 
                  charge 1-2% in advisory fees plus fund expenses.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="bg-white rounded-lg border px-6">
                <AccordionTrigger className="text-left">
                  <span className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    "You lose all your money if you die"
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  Most FIAs include a death benefit that pays your beneficiaries at least your account 
                  value (often a return of premium minimum). Many contracts offer enhanced death benefits. 
                  Even with income riders, many include "return of premium" features that ensure your 
                  heirs receive any remaining value.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="bg-white rounded-lg border px-6">
                <AccordionTrigger className="text-left">
                  <span className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    "Annuities are only for retirees"
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  While FIAs are excellent for near-retirees and retirees, they can also benefit 
                  individuals in their 50s who want to start building a guaranteed income base for 
                  retirement. The longer your accumulation period, the more time for growth and the 
                  larger your eventual income benefit.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="bg-white rounded-lg border px-6">
                <AccordionTrigger className="text-left">
                  <span className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    "Fixed index annuities are the same as variable annuities"
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  These are fundamentally different products. Variable annuities invest directly in 
                  the market through subaccounts, exposing you to market losses. FIAs never expose 
                  your principal to market risk—they only credit interest based on index performance. 
                  Your worst case in an FIA is typically 0% (no gain), not a loss.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="bg-white rounded-lg border px-6">
                <AccordionTrigger className="text-left">
                  <span className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    "Insurance companies can change the terms anytime"
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  While cap rates and participation rates can be adjusted annually (within guaranteed 
                  minimums), the core guarantees—like your floor protection and income rider benefits—are 
                  contractually locked in. The minimum guaranteed rates are stated in your contract and 
                  cannot be changed. Choose carriers with strong financial ratings for added security.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* Understanding Annuity Mechanics */}
      <section className="section-padding bg-white">
        <div className="container-financial">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 font-heading">Understanding Annuity Mechanics</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Key features every FIA buyer should understand
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <Card className="bg-white border">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Lock className="w-6 h-6 text-amber-600" />
                  <CardTitle>Surrender Charges</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Surrender charges apply if you withdraw more than the free amount (typically 10% annually) 
                  during the surrender period. Charges start high (7-10%) and decrease each year until they 
                  reach 0%.
                </p>
                <div className="bg-amber-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-amber-800">
                    Example: A 7-year surrender schedule might be: 7%, 6%, 5%, 4%, 3%, 2%, 1%, then 0%
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <DollarSign className="w-6 h-6 text-amber-600" />
                  <CardTitle>Income Riders (GLWB)</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Guaranteed Lifetime Withdrawal Benefit (GLWB) riders provide income you can't outlive. 
                  Your "income base" grows at a guaranteed rate (5-8% simple or compound) until you 
                  activate income.
                </p>
                <div className="bg-amber-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-amber-800">
                    Typical payout: 5-6% of income base at age 65, increasing for later activation
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-6 h-6 text-amber-600" />
                  <CardTitle>Index Options</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Most FIAs offer multiple crediting strategies. You can allocate across different 
                  indexes and methods to diversify your interest potential.
                </p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Point-to-point: Compares index value at start/end of period</li>
                  <li>• Monthly average: Uses average of monthly index values</li>
                  <li>• Fixed account: Guaranteed fixed interest rate option</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-white border">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-amber-600" />
                  <CardTitle>Bonus Credits</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Some FIAs offer premium bonuses (5-10% added to your account). However, these often 
                  come with longer surrender periods or lower cap rates.
                </p>
                <div className="bg-amber-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-amber-800">
                    Important: Compare total value over time, not just the bonus percentage
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FIA vs Other Products */}
      <section className="section-padding" style={{ backgroundColor: "hsl(45 93% 97%)" }}>
        <div className="container-financial">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 font-heading">FIA vs Other Retirement Products</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Understanding how Fixed Index Annuities compare to alternatives
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-lg">FIA vs. CDs</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>FIA advantage:</strong> Higher growth potential, tax deferral</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span><strong>CD advantage:</strong> Full liquidity, FDIC insurance, shorter terms</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-lg">FIA vs. Bonds</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>FIA advantage:</strong> Principal protection, no interest rate risk</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Bond advantage:</strong> More liquidity, potential for higher yields</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-lg">FIA vs. 401(k)/IRA</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>FIA advantage:</strong> Guaranteed income, principal protection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span><strong>401(k) advantage:</strong> Employer match, higher contribution limits</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-lg">FIA vs. Immediate Annuities</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>FIA advantage:</strong> Flexibility, growth potential, access to funds</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span><strong>SPIA advantage:</strong> Higher initial income, simpler structure</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Key Questions */}
      <section className="section-padding bg-white">
        <div className="container-financial">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 font-heading">Key Questions to Ask</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Before purchasing an FIA, make sure you can answer these questions
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-200">
              <CardContent className="pt-6">
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="p-1.5 rounded-full bg-amber-100 mt-0.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold">What is the surrender period and schedule?</p>
                      <p className="text-sm text-muted-foreground">Understand how long your money is committed and what charges apply for early withdrawal.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="p-1.5 rounded-full bg-amber-100 mt-0.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold">What are the current and minimum guaranteed cap rates?</p>
                      <p className="text-sm text-muted-foreground">Current rates can change; minimums are locked in your contract.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="p-1.5 rounded-full bg-amber-100 mt-0.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold">What income rider options are available and what do they cost?</p>
                      <p className="text-sm text-muted-foreground">Compare rider fees, rollup rates, and payout percentages.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="p-1.5 rounded-full bg-amber-100 mt-0.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold">What is the financial strength rating of the insurance carrier?</p>
                      <p className="text-sm text-muted-foreground">Look for A-rated or better carriers from AM Best, S&P, or Moody's.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="p-1.5 rounded-full bg-amber-100 mt-0.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold">What are the total annual charges?</p>
                      <p className="text-sm text-muted-foreground">Include rider fees, administrative fees, and any other recurring costs.</p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Next Steps CTA */}
      <section className="section-padding bg-amber-600">
        <div className="container-financial">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6 font-heading text-white">
              Ready to Explore Fixed Index Annuities?
            </h2>
            <p className="text-xl text-amber-100 mb-8">
              Take our suitability assessment to see if an FIA fits your retirement strategy, 
              or schedule a consultation with an advisor.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-amber-600 hover:bg-amber-50 text-lg px-8"
                onClick={() => navigate("/admin/risk-intake")}
              >
                Take Suitability Assessment
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-amber-700 text-lg px-8"
                onClick={() => navigate("/tax-bucket-estimator")}
              >
                Try Tax Bucket Estimator
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-amber-700 text-lg px-8"
                onClick={() => navigate("/contact")}
              >
                <Calendar className="w-5 h-5 mr-2" />
                Schedule Consultation
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 bg-muted/30">
        <div className="container-financial">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <Building2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>
                <strong>Important Disclosure:</strong> This content is for educational purposes only and 
                does not constitute financial, tax, or legal advice. Fixed Index Annuities are insurance 
                products, not investments. Guarantees are backed by the claims-paying ability of the issuing 
                insurance company. Consult with a qualified financial professional to determine if an FIA 
                is appropriate for your individual situation.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Annuities;
