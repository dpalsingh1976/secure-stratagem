import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DollarSign, Calendar, AlertTriangle, Info } from "lucide-react";
import { Plan529VsIulResult, Plan529VsIulInputs } from "@/types/plan529VsIul";
import { formatCurrency, formatPercent } from "@/engine/comparisons/plan529VsIul";
import { InfiniteBankingComparison } from "./InfiniteBankingComparison";
import { ComparisonTable, generateScorecardItems } from "./ComparisonTable";
import { RecommendationLens } from "./RecommendationLens";
import { IULEducation } from "./IULEducation";
import { ComplianceFooter } from "./ComplianceFooter";
interface ResultsDashboardProps {
  result: Plan529VsIulResult;
  inputs: Plan529VsIulInputs;
}

export function ResultsDashboard({ result, inputs }: ResultsDashboardProps) {
  const scorecardItems = generateScorecardItems();

  return (
    <div className="space-y-8">
      {/* Summary KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Contributed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(result.totalContributed)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Over {inputs.yearsToGoal} years
            </p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
              529 Projected Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
              {formatCurrency(result.fv529Gross)}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              {formatPercent(result.assumptionsUsed.return529)} assumed return
            </p>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50/50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              IUL Cash Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">
              {formatCurrency(result.fvIulCashValueGross)}
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
              {formatPercent(result.assumptionsUsed.returnIulNet)} illustrative net
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Time Horizon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">
              {inputs.yearsToGoal} years
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Child age: {inputs.childAge} → 18
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Risk Flags */}
      {(result.policyLoanRiskFlag || result.rothRolloverPossible > 0) && (
        <div className="flex flex-wrap gap-3">
          {result.policyLoanRiskFlag && (
            <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
              <AlertTriangle className="h-4 w-4" />
              <span>High loan-to-value ratio may increase policy lapse risk</span>
            </div>
          )}
          {result.rothRolloverPossible > 0 && (
            <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
              <Info className="h-4 w-4" />
              <span>Roth rollover available: up to {formatCurrency(result.rothRolloverPossible)}</span>
            </div>
          )}
        </div>
      )}

      {/* Infinite Banking Comparison */}
      <InfiniteBankingComparison result={result} inputs={inputs} />

      <Separator />

      {/* Comparison Table */}
      <ComparisonTable scorecardItems={scorecardItems} />

      <Separator />

      {/* Recommendation */}
      <RecommendationLens recommendation={result.recommendation} />

      <Separator />

      {/* IUL Education */}
      <IULEducation />

      {/* Assumptions */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Assumptions Used</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">529 Return Rate:</span>
              <span className="font-medium">{formatPercent(result.assumptionsUsed.return529)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">IUL Net Return:</span>
              <span className="font-medium">{formatPercent(result.assumptionsUsed.returnIulNet)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Inflation:</span>
              <span className="font-medium">{formatPercent(result.assumptionsUsed.inflation)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">529 Penalty Rate:</span>
              <span className="font-medium">{formatPercent(result.assumptionsUsed.penaltyRate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Federal Tax Rate:</span>
              <span className="font-medium">{formatPercent(result.assumptionsUsed.federalTaxRate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Years to Goal:</span>
              <span className="font-medium">{result.assumptionsUsed.years}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Footer */}
      <ComplianceFooter />
    </div>
  );
}
