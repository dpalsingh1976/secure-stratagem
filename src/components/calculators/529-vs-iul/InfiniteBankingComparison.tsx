import { Banknote, TrendingUp, XCircle, CheckCircle2, ArrowRight, Landmark } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plan529VsIulResult, Plan529VsIulInputs } from "@/types/plan529VsIul";
import { formatCurrency } from "@/engine/comparisons/plan529VsIul";

interface InfiniteBankingComparisonProps {
  result: Plan529VsIulResult;
  inputs: Plan529VsIulInputs;
}

export function InfiniteBankingComparison({ result, inputs }: InfiniteBankingComparisonProps) {
  const { infiniteBanking, fvIulCashValueGross } = result;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Landmark className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Infinite Banking: Income Generation Comparison</h3>
      </div>

      {/* Feature Comparison Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* IUL Card */}
        <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-900/10">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
                <Banknote className="h-5 w-5" />
                IUL - Infinite Banking
              </CardTitle>
              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                Family Bank
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <FeatureRow icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />} text="Generate tax-free income via policy loans" />
              <FeatureRow icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />} text="Cash value continues growing during income phase" />
              <FeatureRow icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />} text="Access funds for any purpose, any time" />
              <FeatureRow icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />} text="No penalties or restrictions on use" />
              <FeatureRow icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />} text="Death benefit protection for family" />
            </div>
          </CardContent>
        </Card>

        {/* 529 Card */}
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-900/10">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2 text-blue-800 dark:text-blue-200">
                <Landmark className="h-5 w-5" />
                529 Plan
              </CardTitle>
              <Badge variant="outline" className="border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300">
                Education Only
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <FeatureRow icon={<XCircle className="h-4 w-4 text-red-500" />} text="Cannot generate ongoing income" />
              <FeatureRow icon={<XCircle className="h-4 w-4 text-red-500" />} text="Funds must be spent, not borrowed against" />
              <FeatureRow icon={<XCircle className="h-4 w-4 text-red-500" />} text="Restricted to qualified education expenses" />
              <FeatureRow icon={<XCircle className="h-4 w-4 text-red-500" />} text="10% penalty + taxes on non-education use" />
              <FeatureRow icon={<XCircle className="h-4 w-4 text-red-500" />} text="No death benefit protection" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* IUL Income Projection */}
      <Card className="border-primary/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            IUL Income Projection (After {inputs.yearsToGoal} Year Accumulation)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Cash Value at Year {inputs.yearsToGoal}</p>
              <p className="text-xl font-bold text-foreground">{formatCurrency(fvIulCashValueGross)}</p>
            </div>
            <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
              <p className="text-sm text-emerald-700 dark:text-emerald-300">Annual Tax-Free Income</p>
              <p className="text-xl font-bold text-emerald-800 dark:text-emerald-200">
                {formatCurrency(infiniteBanking.iulAnnualIncomeAvailable)}/yr
              </p>
            </div>
            <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
              <p className="text-sm text-emerald-700 dark:text-emerald-300">Total Income ({infiniteBanking.iulIncomeYears} Years)</p>
              <p className="text-xl font-bold text-emerald-800 dark:text-emerald-200">
                {formatCurrency(infiniteBanking.iulTotalIncomeProjected)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Cash Value Remaining</p>
              <p className="text-xl font-bold text-foreground">
                {formatCurrency(infiniteBanking.iulCashValueAfterIncome)}
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            * Based on 5% sustainable withdrawal rate via policy loans. Cash value continues to grow at illustrated rate during income phase.
          </p>
        </CardContent>
      </Card>

      {/* Visual Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Lifecycle Comparison</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* IUL Timeline */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">IUL Path</p>
            <div className="flex items-center gap-2 flex-wrap">
              <TimelineStep label={`Accumulation (${inputs.yearsToGoal} yrs)`} active />
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              <TimelineStep label="Tax-Free Income via Loans" active />
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              <TimelineStep label="Legacy / Death Benefit" active />
            </div>
          </div>

          {/* 529 Timeline */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">529 Path</p>
            <div className="flex items-center gap-2 flex-wrap">
              <TimelineStep label={`Accumulation (${inputs.yearsToGoal} yrs)`} />
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              <TimelineStep label="Spend on Education OR Pay Penalties" warning />
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              <TimelineStep label="Done" disabled />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Why 529 Cannot Be a Family Bank */}
      <div className="bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          <strong>Why 529 cannot be used for Infinite Banking:</strong> {infiniteBanking.reason529CannotDoIB}
        </p>
      </div>
    </div>
  );
}

function FeatureRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-sm text-foreground">{text}</span>
    </div>
  );
}

function TimelineStep({ label, active, warning, disabled }: { label: string; active?: boolean; warning?: boolean; disabled?: boolean }) {
  let className = "px-3 py-1.5 rounded-full text-xs font-medium ";
  
  if (active) {
    className += "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300";
  } else if (warning) {
    className += "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300";
  } else if (disabled) {
    className += "bg-muted text-muted-foreground";
  } else {
    className += "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300";
  }

  return <span className={className}>{label}</span>;
}
