import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Landmark,
  TrendingUp,
  Shield,
  PiggyBank,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  HelpCircle,
  ArrowRight,
  BookOpen,
  Calculator,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const IULBanking = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <Navigation />

      {/* Hero Section */}
      <section className="container-financial py-16 md:py-24">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-4 bg-primary/10 rounded-2xl">
              <Landmark className="w-12 h-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Indexed Universal Life (IUL) Explained
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Understand how IUL works, who it's designed for, and whether it might fit your retirement strategy. Get
            honest, balanced information to make informed decisions.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/admin/risk-intake")} className="gap-2">
              <Calculator className="w-5 h-5" />
              Take the Suitability Assessment
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/iul-compare")} className="gap-2">
              <TrendingUp className="w-5 h-5" />
              Compare IUL Scenarios
            </Button>
          </div>
        </div>
      </section>

      {/* What is IUL? Section */}
      <section className="bg-card border-y border-border">
        <div className="container-financial py-16">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold text-foreground">What is IUL?</h2>
            </div>

            <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
              <p>
                <strong className="text-foreground">Indexed Universal Life (IUL)</strong> is a type of permanent life
                insurance that combines a death benefit with a cash value component. Unlike term insurance, IUL builds
                cash value over time that you can access during your lifetime.
              </p>

              <div className="grid md:grid-cols-3 gap-6 not-prose mt-8">
                <Card className="border-primary/20">
                  <CardHeader className="pb-3">
                    <Shield className="w-8 h-8 text-primary mb-2" />
                    <CardTitle className="text-lg">Death Benefit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Permanent protection for your beneficiaries, typically income tax-free under IRC §101(a).
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-primary/20">
                  <CardHeader className="pb-3">
                    <PiggyBank className="w-8 h-8 text-primary mb-2" />
                    <CardTitle className="text-lg">Cash Value</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      A savings component that grows tax-deferred and can be accessed via loans or withdrawals.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-primary/20">
                  <CardHeader className="pb-3">
                    <TrendingUp className="w-8 h-8 text-primary mb-2" />
                    <CardTitle className="text-lg">Index-Linked Growth</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Returns tied to market indexes (like S&P 500) without direct market exposure or downside risk.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-muted/50 p-6 rounded-lg border border-border mt-8 not-prose">
                <h4 className="font-semibold text-foreground mb-3">How IUL Differs from Other Life Insurance</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">vs. Term:</span>
                    <span>IUL is permanent with cash value; term expires with no cash value</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">vs. Whole Life:</span>
                    <span>
                      IUL has flexible premiums and index-linked returns; whole life has fixed premiums and guaranteed
                      rates
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">vs. Variable UL:</span>
                    <span>
                      IUL has a floor protecting against losses; VUL has direct market exposure with potential losses
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Infinite Banking Concept */}
      <section className="bg-primary/5 border-y border-border">
        <div className="container-financial py-16">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <Landmark className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold text-foreground">The Infinite Banking Concept</h2>
            </div>

            <p className="text-lg text-muted-foreground mb-8">
              Infinite Banking uses the cash value in your IUL policy as a personal banking system, allowing you to
              borrow against your policy for major purchases while your cash value continues to earn interest.
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4 text-foreground">How It Works</h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">
                      <strong className="text-foreground">Borrow against cash value</strong> at competitive rates
                      (typically 5-8%)
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">
                      <strong className="text-foreground">Your full cash value continues earning</strong> even while you
                      have a loan outstanding
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">
                      <strong className="text-foreground">No credit check or approval process</strong> — it's your money
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">
                      <strong className="text-foreground">Flexible repayment</strong> — pay back on your own schedule
                    </span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4 text-foreground">Common Use Cases</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-card rounded-lg border border-border">
                    <p className="font-medium text-foreground">Vehicle Purchases</p>
                    <p className="text-sm text-muted-foreground">
                      Finance cars through your policy instead of dealerships
                    </p>
                  </div>
                  <div className="p-3 bg-card rounded-lg border border-border">
                    <p className="font-medium text-foreground">Real Estate Down Payments</p>
                    <p className="text-sm text-muted-foreground">Access capital for investment properties</p>
                  </div>
                  <div className="p-3 bg-card rounded-lg border border-border">
                    <p className="font-medium text-foreground">Business Opportunities</p>
                    <p className="text-sm text-muted-foreground">Quick access to capital without bank approval</p>
                  </div>
                  <div className="p-3 bg-card rounded-lg border border-border">
                    <p className="font-medium text-foreground">Retirement Income</p>
                    <p className="text-sm text-muted-foreground">Tax-free income stream via policy loans</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Important:</strong> Outstanding loans reduce your death benefit.
                  If loans exceed cash value, the policy may lapse with potential tax consequences. Proper funding and
                  management are essential.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who Is IUL Right For? */}
      <section className="container-financial py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-foreground">Who Is IUL Right For?</h2>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Good Fit */}
            <Card className="border-green-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-6 h-6" />
                  Strong Fit If You...
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-1" />
                  <span className="text-muted-foreground">
                    Have stable income and can commit to 10+ years of premiums
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-1" />
                  <span className="text-muted-foreground">Are already maxing tax-advantaged accounts (401k, IRA)</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-1" />
                  <span className="text-muted-foreground">Want tax diversification in retirement</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-1" />
                  <span className="text-muted-foreground">Are in a high tax bracket (25%+)</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-1" />
                  <span className="text-muted-foreground">Have a permanent life insurance need</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-1" />
                  <span className="text-muted-foreground">Want downside protection from market volatility</span>
                </div>
              </CardContent>
            </Card>

            {/* Not Ideal */}
            <Card className="border-red-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <XCircle className="w-6 h-6" />
                  Not Ideal If You...
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-1" />
                  <span className="text-muted-foreground">Have unstable or variable income</span>
                </div>
                <div className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-1" />
                  <span className="text-muted-foreground">May need the funds within 10 years</span>
                </div>
                <div className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-1" />
                  <span className="text-muted-foreground">Haven't built a 6-month emergency fund yet</span>
                </div>
                <div className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-1" />
                  <span className="text-muted-foreground">Aren't getting your full 401k employer match</span>
                </div>
                <div className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-1" />
                  <span className="text-muted-foreground">Only need temporary life insurance coverage</span>
                </div>
                <div className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-1" />
                  <span className="text-muted-foreground">Want full market upside participation</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Button size="lg" onClick={() => navigate("/admin/risk-intake")} className="gap-2">
              <HelpCircle className="w-5 h-5" />
              Take Our Suitability Assessment
            </Button>
            <p className="text-sm text-muted-foreground mt-3">
              Answer a few questions to see if IUL might be appropriate for your situation
            </p>
          </div>
        </div>
      </section>

      {/* Common Misconceptions */}
      <section className="bg-card border-y border-border">
        <div className="container-financial py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-foreground">Common Misconceptions</h2>

            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="item-1" className="border rounded-lg px-4">
                <AccordionTrigger className="text-left">
                  <span className="flex items-center gap-3">
                    <span className="text-red-500 font-bold">Myth:</span>
                    "IUL is a scam"
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  <p className="mb-2">
                    <strong className="text-green-600">Reality:</strong> IUL is a regulated insurance product offered by
                    licensed, state-regulated insurance companies. It's been available for decades and is subject to
                    strict oversight.
                  </p>
                  <p>
                    The concerns typically arise from poorly designed policies, underfunding, or misrepresentation by
                    salespeople — not the product itself. When properly structured and funded, IUL can be an effective
                    part of a retirement strategy.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="border rounded-lg px-4">
                <AccordionTrigger className="text-left">
                  <span className="flex items-center gap-3">
                    <span className="text-red-500 font-bold">Myth:</span>
                    "You'll lose money in the market"
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  <p className="mb-2">
                    <strong className="text-green-600">Reality:</strong> IUL has a floor (typically 0%) that protects
                    your cash value from market losses. If the index drops 20%, your cash value doesn't decrease due to
                    that loss.
                  </p>
                  <p>
                    However, policy charges (Cost of Insurance, administrative fees) are still deducted regardless of
                    market performance, which can reduce cash value in low-return years.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="border rounded-lg px-4">
                <AccordionTrigger className="text-left">
                  <span className="flex items-center gap-3">
                    <span className="text-red-500 font-bold">Myth:</span>
                    "Returns are guaranteed"
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  <p className="mb-2">
                    <strong className="text-green-600">Reality:</strong> Only the floor is guaranteed. The cap,
                    participation rate, and spreads can be adjusted by the insurance company (within contractual
                    limits).
                  </p>
                  <p>
                    Illustrations showing projected returns are hypothetical. Actual performance depends on index
                    performance, crediting method, and policy charges. Always look at both illustrated AND guaranteed
                    columns in any illustration.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="border rounded-lg px-4">
                <AccordionTrigger className="text-left">
                  <span className="flex items-center gap-3">
                    <span className="text-red-500 font-bold">Myth:</span>
                    "IUL should replace your 401k"
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  <p className="mb-2">
                    <strong className="text-green-600">Reality:</strong> IUL is a complement, not a replacement. You
                    should first maximize employer matching contributions in your 401k before considering IUL.
                  </p>
                  <p>
                    The value of IUL is tax diversification — having "tax-never" money alongside "tax-later" (401k) and
                    "tax-now" (brokerage) buckets for optimal retirement income planning.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="border rounded-lg px-4">
                <AccordionTrigger className="text-left">
                  <span className="flex items-center gap-3">
                    <span className="text-red-500 font-bold">Myth:</span>
                    "All IUL policies are the same"
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  <p className="mb-2">
                    <strong className="text-green-600">Reality:</strong> There's significant variation in policy design,
                    caps, crediting methods, and internal costs between carriers.
                  </p>
                  <p>
                    Some policies emphasize higher caps, others focus on lower COI charges. The "best" policy depends on
                    your specific goals, age, and how you plan to use the policy. Comparison is essential.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* Understanding Policy Mechanics */}
      <section className="container-financial py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-foreground">Understanding Policy Mechanics</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cost of Insurance (COI)</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p className="mb-3">
                  Monthly charges that pay for your death benefit. COI increases as you age, which is why sufficient
                  funding early is critical.
                </p>
                <p className="text-sm bg-muted/50 p-3 rounded-lg">
                  <strong>Key Point:</strong> If cash value can't cover COI, you'll need to pay out-of-pocket or risk
                  policy lapse.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Surrender Charges</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p className="mb-3">
                  Fees charged if you cancel the policy early, typically during the first 10-15 years. These decrease
                  over time and eventually reach zero.
                </p>
                <p className="text-sm bg-muted/50 p-3 rounded-lg">
                  <strong>Key Point:</strong> This is why IUL requires a long-term commitment. Early exit can result in
                  significant losses.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Policy Loans</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p className="mb-3">
                  Borrow against your cash value at stated loan rates (fixed or variable). Interest accrues, and unpaid
                  loans reduce your death benefit.
                </p>
                <p className="text-sm bg-muted/50 p-3 rounded-lg">
                  <strong>Key Point:</strong> With "wash loans" or "zero-cost loans," the loan rate equals the crediting
                  rate on borrowed funds.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Illustrated vs. Guaranteed Values</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p className="mb-3">
                  Illustrations show hypothetical scenarios. Only "guaranteed" columns reflect the worst-case assuming
                  the floor rate every year.
                </p>
                <p className="text-sm bg-muted/50 p-3 rounded-lg">
                  <strong>Key Point:</strong> Always review the guaranteed column. If the policy doesn't work at
                  guaranteed rates, it may be under-designed.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Risk Considerations */}
      <section className="bg-destructive/5 border-y border-destructive/10">
        <div className="container-financial py-16">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="w-8 h-8 text-destructive" />
              <h2 className="text-3xl font-bold text-foreground">Risk Considerations</h2>
            </div>

            <p className="text-lg text-muted-foreground mb-8">
              IUL is not right for everyone. Understanding these risks is essential before making a decision.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-card rounded-lg border border-border">
                <div className="w-8 h-8 bg-destructive/10 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-destructive font-bold text-sm">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Underfunding Risk</h4>
                  <p className="text-muted-foreground">
                    If you don't fund the policy adequately or miss premiums, rising COI charges can deplete cash value
                    and cause the policy to lapse. Lapse can trigger taxable income on previous gains.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-card rounded-lg border border-border">
                <div className="w-8 h-8 bg-destructive/10 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-destructive font-bold text-sm">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Carrier Financial Strength</h4>
                  <p className="text-muted-foreground">
                    Your policy is only as strong as the insurance company backing it. Choose carriers with A+ ratings
                    from AM Best, Moody's, or S&P. A carrier failure could impact your policy.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-card rounded-lg border border-border">
                <div className="w-8 h-8 bg-destructive/10 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-destructive font-bold text-sm">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Long-Term Commitment Required</h4>
                  <p className="text-muted-foreground">
                    IUL is designed for 10-15+ year time horizons. Early surrender means losing money to surrender
                    charges and potentially not recovering policy costs.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-card rounded-lg border border-border">
                <div className="w-8 h-8 bg-destructive/10 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-destructive font-bold text-sm">4</span>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Cap and Rate Changes</h4>
                  <p className="text-muted-foreground">
                    Insurance companies can adjust caps, participation rates, and spreads within contractual limits.
                    Today's 10% cap may become 8% in the future based on market conditions.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-card rounded-lg border border-border">
                <div className="w-8 h-8 bg-destructive/10 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-destructive font-bold text-sm">5</span>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Loan Management Required</h4>
                  <p className="text-muted-foreground">
                    If policy loans plus accrued interest exceed cash value, the policy will lapse. This creates a
                    taxable event on all gains. Active management of loans is essential for retirement income
                    strategies.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Tools & Next Steps */}
      <section className="container-financial py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 text-foreground">Ready to Learn More?</h2>
          <p className="text-lg text-muted-foreground mb-10">
            Use our tools to explore whether IUL might be right for your situation, or speak with an advisor.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-8 pb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calculator className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-foreground">Suitability Assessment</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Answer questions about your financial situation to see if IUL may be appropriate
                </p>
                <Button onClick={() => navigate("/admin/risk-intake")} className="w-full">
                  Start Assessment
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-8 pb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-foreground">Compare Scenarios</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload illustrations and compare multiple IUL policies side-by-side
                </p>
                <Button variant="outline" onClick={() => navigate("/iul-compare")} className="w-full">
                  Compare Policies
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-8 pb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-foreground">Strategy Session</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Speak with an advisor about your specific situation and goals
                </p>
                <Button variant="outline" onClick={() => navigate("/contact")} className="w-full">
                  Book a Call
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Disclaimer Footer */}
      <section className="bg-muted/50 border-t border-border">
        <div className="container-financial py-8">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-sm text-muted-foreground">
              <strong>Disclaimer:</strong> This content is for educational purposes only and does not constitute
              financial, tax, or legal advice. Indexed Universal Life insurance involves risk and may not be suitable
              for everyone. Policy features, costs, and benefits vary by carrier and state. Consult with a licensed
              insurance professional and your tax advisor before making any decisions. Past index performance does not
              guarantee future results.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default IULBanking;
