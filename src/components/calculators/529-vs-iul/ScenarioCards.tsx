import { GraduationCap, Briefcase, Blend, TrendingUp, TrendingDown, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScenarioResult } from "@/types/plan529VsIul";
import { formatCurrency } from "@/engine/comparisons/plan529VsIul";

interface ScenarioCardsProps {
  scenarios: ScenarioResult[];
}

const SCENARIO_ICONS: Record<string, React.ElementType> = {
  '100% Education': GraduationCap,
  '0% Education': Briefcase,
  'Mixed Usage': Blend,
};

function getWinnerBadge(winner: '529' | 'IUL' | 'tie') {
  switch (winner) {
    case '529':
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">529 Wins</Badge>;
    case 'IUL':
      return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">IUL Wins</Badge>;
    case 'tie':
      return <Badge variant="secondary">Tie</Badge>;
  }
}

export function ScenarioCards({ scenarios }: ScenarioCardsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Scenario Analysis</h3>
      <p className="text-sm text-muted-foreground">
        See how each vehicle performs under different usage scenarios.
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        {scenarios.map((scenario, index) => {
          const Icon = SCENARIO_ICONS[scenario.scenarioName] || Blend;
          const difference = scenario.fv529Net - scenario.fvIulAccessible;
          const isDifferenceMaterial = Math.abs(difference) > 1000;

          return (
            <Card key={index} className="relative overflow-hidden">
              {/* Winner indicator stripe */}
              <div
                className={`absolute top-0 left-0 right-0 h-1 ${
                  scenario.winner === '529'
                    ? 'bg-blue-500'
                    : scenario.winner === 'IUL'
                    ? 'bg-emerald-500'
                    : 'bg-muted'
                }`}
              />

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${
                      index === 0 ? 'bg-blue-100 dark:bg-blue-900/30' :
                      index === 1 ? 'bg-amber-100 dark:bg-amber-900/30' :
                      'bg-purple-100 dark:bg-purple-900/30'
                    }`}>
                      <Icon className={`h-5 w-5 ${
                        index === 0 ? 'text-blue-600 dark:text-blue-400' :
                        index === 1 ? 'text-amber-600 dark:text-amber-400' :
                        'text-purple-600 dark:text-purple-400'
                      }`} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{scenario.scenarioName}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {scenario.scenarioDescription}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Values */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 rounded bg-blue-50 dark:bg-blue-900/20">
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">529 Net</span>
                    <span className="font-semibold text-blue-800 dark:text-blue-200">
                      {formatCurrency(scenario.fv529Net)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2 rounded bg-emerald-50 dark:bg-emerald-900/20">
                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">IUL Accessible</span>
                    <span className="font-semibold text-emerald-800 dark:text-emerald-200">
                      {formatCurrency(scenario.fvIulAccessible)}
                    </span>
                  </div>
                </div>

                {/* Taxes & Penalties (if applicable) */}
                {(scenario.taxesPaid529 > 0 || scenario.penalties529 > 0) && (
                  <div className="pt-2 border-t border-border space-y-1">
                    {scenario.taxesPaid529 > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">529 Taxes Paid</span>
                        <span className="text-red-600 dark:text-red-400">
                          -{formatCurrency(scenario.taxesPaid529)}
                        </span>
                      </div>
                    )}
                    {scenario.penalties529 > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">529 Penalties</span>
                        <span className="text-red-600 dark:text-red-400">
                          -{formatCurrency(scenario.penalties529)}
                        </span>
                      </div>
                    )}
                    {scenario.rothRolloverAmount > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Roth Rollover</span>
                        <span className="text-green-600 dark:text-green-400">
                          {formatCurrency(scenario.rothRolloverAmount)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Difference & Winner */}
                <div className="pt-3 border-t border-border">
                  <div className="flex items-center justify-between mb-2">
                    {getWinnerBadge(scenario.winner)}
                    {isDifferenceMaterial && (
                      <div className="flex items-center gap-1 text-xs">
                        {difference > 0 ? (
                          <>
                            <TrendingUp className="h-3 w-3 text-blue-500" />
                            <span className="text-blue-600 dark:text-blue-400">
                              529 +{formatCurrency(difference)}
                            </span>
                          </>
                        ) : (
                          <>
                            <TrendingUp className="h-3 w-3 text-emerald-500" />
                            <span className="text-emerald-600 dark:text-emerald-400">
                              IUL +{formatCurrency(Math.abs(difference))}
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{scenario.summary}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
