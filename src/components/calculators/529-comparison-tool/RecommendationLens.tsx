import { Lightbulb, CheckCircle2, AlertTriangle, TrendingUp, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RecommendationResult } from "@/types/plan529VsIul";

interface RecommendationLensProps {
  recommendation: RecommendationResult;
}

function getRecommendationDisplay(rec: '529_first' | 'iul_consideration' | 'hybrid') {
  switch (rec) {
    case '529_first':
      return {
        label: '529 Plan First',
        description: 'Prioritize 529 for education savings',
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        borderColor: 'border-blue-200 dark:border-blue-800',
        bgColor: 'bg-blue-50/50 dark:bg-blue-900/20',
      };
    case 'iul_consideration':
      return {
        label: 'Consider IUL',
        description: 'IUL may offer advantages for your situation',
        color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
        borderColor: 'border-emerald-200 dark:border-emerald-800',
        bgColor: 'bg-emerald-50/50 dark:bg-emerald-900/20',
      };
    case 'hybrid':
      return {
        label: 'Hybrid Approach',
        description: 'Combine 529 + IUL for optimal flexibility',
        color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
        borderColor: 'border-purple-200 dark:border-purple-800',
        bgColor: 'bg-purple-50/50 dark:bg-purple-900/20',
      };
  }
}

function getConfidenceBadge(level: 'high' | 'medium' | 'low') {
  switch (level) {
    case 'high':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300">High Confidence</Badge>;
    case 'medium':
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300">Medium Confidence</Badge>;
    case 'low':
      return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300">Low Confidence</Badge>;
  }
}

export function RecommendationLens({ recommendation }: RecommendationLensProps) {
  const display = getRecommendationDisplay(recommendation.primaryRecommendation);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-amber-500" />
        <h3 className="text-lg font-semibold text-foreground">Recommendation</h3>
      </div>

      <Card className={`${display.borderColor} border-2`}>
        <CardHeader className={display.bgColor}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <Badge className={display.color}>
                {display.label}
              </Badge>
              {getConfidenceBadge(recommendation.confidenceLevel)}
            </div>
          </div>
          <CardTitle className="text-base font-normal text-muted-foreground mt-2">
            {display.description}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 pt-4">
          {/* Summary */}
          <p className="text-sm text-foreground leading-relaxed">
            {recommendation.summary}
          </p>

          {/* Why bullets */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              Why this recommendation
            </h4>
            <ul className="space-y-2 pl-6">
              {recommendation.whyBullets.map((bullet, index) => (
                <li key={index} className="text-sm text-muted-foreground list-disc">
                  {bullet}
                </li>
              ))}
            </ul>
          </div>

          {/* Considerations */}
          {recommendation.considerations.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-border">
              <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                Important considerations
              </h4>
              <ul className="space-y-2 pl-6">
                {recommendation.considerations.map((consideration, index) => (
                  <li key={index} className="text-sm text-muted-foreground list-disc">
                    {consideration}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Decision Framework */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            General Guidance Framework
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3 text-sm">
            <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">If education probability is high →</span>{' '}
              lean toward 529 for tax-free growth
            </p>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">If education is uncertain + flexibility is important →</span>{' '}
              consider properly designed IUL
            </p>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 shrink-0" />
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Often best approach →</span>{' '}
              fund 529 up to expected education cost; place excess in IUL for flexibility
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
