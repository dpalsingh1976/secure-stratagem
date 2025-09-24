import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RiskProgressRing from "@/components/RiskProgressRing";
import { Shield, Clock, TrendingUp, AlertTriangle, ArrowRight } from "lucide-react";
import { RiskInputs, RiskScores } from "@/types/riskTypes";
import { formatCurrency } from "@/utils/riskCalculations";
import { getRiskLevel } from "@/utils/riskCalculations";

interface RiskScoreModalProps {
  children: React.ReactNode;
  riskScores: RiskScores;
  riskInputs: RiskInputs;
}

const WEIGHTS = { 
  life: 0.35, 
  longevity: 0.35, 
  market: 0.15, 
  tax: 0.15 
};

const RiskScoreModal = ({ children, riskScores, riskInputs }: RiskScoreModalProps) => {
  const [open, setOpen] = useState(false);

  // Calculate weighted contributions
  const contributions = [
    {
      category: "Life Insurance Gap",
      exposure: riskScores.lifeInsurance,
      weight: WEIGHTS.life,
      weightedPoints: Math.round(riskScores.lifeInsurance * WEIGHTS.life),
      icon: Shield,
      color: "text-red-600"
    },
    {
      category: "Longevity Risk", 
      exposure: riskScores.longevity,
      weight: WEIGHTS.longevity,
      weightedPoints: Math.round(riskScores.longevity * WEIGHTS.longevity),
      icon: Clock,
      color: "text-orange-600"
    },
    {
      category: "Market Risk",
      exposure: riskScores.market,
      weight: WEIGHTS.market,
      weightedPoints: Math.round(riskScores.market * WEIGHTS.market),
      icon: TrendingUp,
      color: "text-yellow-600"
    },
    {
      category: "Tax & Estate Risk",
      exposure: riskScores.tax,
      weight: WEIGHTS.tax,
      weightedPoints: Math.round(riskScores.tax * WEIGHTS.tax),
      icon: AlertTriangle,
      color: "text-blue-600"
    }
  ];

  // Find top driver
  const topDriver = contributions.reduce((max, current) => 
    current.weightedPoints > max.weightedPoints ? current : max
  );

  const level = getRiskLevel(riskScores.overall);
  const isCritical = contributions.some(c => c.exposure >= 90) || riskScores.overall >= 80;
  const finalLevel = isCritical ? "Critical" : level;

  // Top driver content templates
  const getTopDriverContent = () => {
    if (topDriver.category === "Life Insurance Gap") {
      const need = riskInputs.debtsTotal + riskInputs.mortgageBalance + riskInputs.finalExpensesEstimate + 
                   riskInputs.educationFundNeeded + 
                   (riskInputs.incomeReplacementYears * (riskInputs.annualIncome * (1 - riskInputs.spouseIncomeOffsetPct / 100)));
      const available = riskInputs.currentLifeCoverage + riskInputs.liquidAssets;
      const gap = Math.max(0, need - available);
      const per100k = need > 0 ? Math.round((100000 / need) * 100) : 0;

      return {
        headline: `Coverage Gap: ${riskScores.lifeInsurance}% shortfall ⚠️`,
        graphic: "Need vs. Have",
        body: `Your coverage is too low compared to your family's needs. This means that if income stops, your family may face a shortfall of ${riskScores.lifeInsurance}% in meeting daily expenses, education, and long-term commitments.`,
        cta: "Schedule a free strategy session",
        microProof: `Add ${per100k}% gap reduction for each extra $100k of coverage.`,
        needVsHave: { need: formatCurrency(need), have: formatCurrency(available), gap: formatCurrency(gap) }
      };
    }

    if (topDriver.category === "Longevity Risk") {
      const retYears = riskInputs.lifeExpectancyAge - riskInputs.plannedRetirementAge;
      const retNeed = riskInputs.monthlyExpenses * 12;
      const guaranteedIncome = riskInputs.retirementIncomeSourcesAnnual;
      const portfolioIncome = riskInputs.investableAssets * (riskInputs.withdrawalRatePct / 100);
      const annualGap = Math.max(0, retNeed - (guaranteedIncome + portfolioIncome));
      const yearsShort = retNeed > 0 ? Math.round(annualGap * retYears / retNeed) : 0;
      const yearsFunded = Math.max(0, retYears - yearsShort);

      return {
        headline: `Don't Outlive Your Money: ${riskScores.longevity}% exposure ⏳`,
        graphic: "Years Funded vs Years Needed",
        body: `At your current trajectory, you may run out of income ${yearsShort} years before age ${riskInputs.lifeExpectancyAge}. Healthcare and inflation magnify this risk.`,
        cta: "Get a guaranteed lifetime income quote",
        yearsFunded: `${yearsFunded} funded / ${retYears} needed`
      };
    }

    if (topDriver.category === "Market Risk") {
      const portfolioValue = riskInputs.investableAssets;
      const currentWithdrawal = portfolioValue * (riskInputs.withdrawalRatePct / 100);
      const drawdownValue = portfolioValue * 0.8;
      const newWithdrawal = drawdownValue * (riskInputs.withdrawalRatePct / 100);
      const drawdownImpact = Math.round(currentWithdrawal - newWithdrawal);

      return {
        headline: `Portfolio Shock Risk: ${riskScores.market}% 🌊`,
        graphic: "-20% Drawdown",
        body: "A sharp downturn could derail goals unless you add buffers and downside protection.",
        cta: "See protection options",
        drawdownImpact: formatCurrency(drawdownImpact)
      };
    }

    // Tax & Estate Risk
    return {
      headline: `Silent Tax & Transfer Drag: ${riskScores.tax}% 🧾`,
      graphic: "To You vs To Taxes/Probate",
      body: "Uncoordinated withdrawals and missing estate docs can siphon away wealth your family should receive.",
      cta: "Optimize taxes & beneficiaries",
      taxRate: `${riskInputs.taxRatePct || 22}%`
    };
  };

  const topDriverContent = getTopDriverContent();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-[760px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Your Risk Score: {riskScores.overall} — {finalLevel}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Mini Ring */}
          <div className="flex justify-center">
            <RiskProgressRing 
              score={riskScores.overall} 
              size={120} 
              strokeWidth={8}
              showScore={true}
            />
          </div>

          {/* How we calculated it */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How we calculated it</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Score is a weighted blend of coverage gaps, longevity exposure, market exposure, and tax/estate leakage.
              </p>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Category</th>
                      <th className="text-center py-2">Exposure %</th>
                      <th className="text-center py-2">Weight</th>
                      <th className="text-center py-2">Weighted Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contributions.map((contrib, idx) => {
                      const Icon = contrib.icon;
                      return (
                        <tr key={idx} className="border-b">
                          <td className="py-2">
                            <div className="flex items-center gap-2">
                              <Icon className={`w-4 h-4 ${contrib.color}`} />
                              {contrib.category}
                            </div>
                          </td>
                          <td className="text-center py-2">{contrib.exposure}%</td>
                          <td className="text-center py-2">{Math.round(contrib.weight * 100)}%</td>
                          <td className="text-center py-2 font-medium">{contrib.weightedPoints}</td>
                        </tr>
                      );
                    })}
                    <tr className="border-t-2 font-bold">
                      <td className="py-2">Total Score</td>
                      <td className="text-center py-2">—</td>
                      <td className="text-center py-2">—</td>
                      <td className="text-center py-2">{riskScores.overall}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {isCritical && (
                <p className="text-sm text-red-600 mt-3 font-medium">
                  ⚠️ If any single category is Critical (≥90%), your overall level is set to Critical to surface urgent action.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Top Driver Panel */}
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <div className="flex items-center gap-2">
                <topDriver.icon className={`w-6 h-6 ${topDriver.color}`} />
                <CardTitle className="text-lg">Top Priority</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-bold text-lg mb-2">{topDriverContent.headline}</h4>
                <div className="text-sm text-muted-foreground mb-2">{topDriverContent.graphic}</div>
                <p className="text-foreground">{topDriverContent.body}</p>
              </div>

              {/* Visual elements for specific risks */}
              {topDriver.category === "Life Insurance Gap" && topDriverContent.needVsHave && (
                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Need: {topDriverContent.needVsHave.need}</span>
                    <span>Have: {topDriverContent.needVsHave.have}</span>
                  </div>
                  <div className="w-full bg-background rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-green-500 h-full" 
                      style={{ width: `${Math.min(100, (riskInputs.currentLifeCoverage + riskInputs.liquidAssets) / (riskInputs.debtsTotal + riskInputs.mortgageBalance + riskInputs.finalExpensesEstimate + riskInputs.educationFundNeeded + (riskInputs.incomeReplacementYears * riskInputs.annualIncome)) * 100)}%` }}
                    />
                  </div>
                  <div className="text-sm text-red-600 mt-1">Gap: {topDriverContent.needVsHave.gap}</div>
                </div>
              )}

              {topDriver.category === "Longevity Risk" && topDriverContent.yearsFunded && (
                <div className="bg-muted p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">{topDriverContent.yearsFunded}</div>
                </div>
              )}

              {topDriver.category === "Market Risk" && topDriverContent.drawdownImpact && (
                <div className="bg-muted p-3 rounded-lg">
                  <div className="text-sm">
                    <span className="text-red-600 font-medium">-20% Impact:</span> {topDriverContent.drawdownImpact}/yr less sustainable income
                  </div>
                </div>
              )}

              {topDriverContent.microProof && (
                <div className="text-xs text-muted-foreground">
                  {topDriverContent.microProof}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button className="flex-1" onClick={() => setOpen(false)}>
              {topDriverContent.cta}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              Try what-ifs
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RiskScoreModal;