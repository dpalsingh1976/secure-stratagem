import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, AlertTriangle, Target } from "lucide-react";

interface PredictiveInsightsProps {
  userProfile?: any;
  riskScores?: any;
}

const PredictiveInsights = ({ userProfile, riskScores }: PredictiveInsightsProps) => {
  // Generate rule-based insights without AI
  const generateInsights = () => {
    const insights = [];
    const age = userProfile?.age ? parseInt(userProfile.age) : 35;
    
    if (riskScores?.lifeInsurance >= 60) {
      insights.push({
        type: "critical",
        title: "Life Insurance Action Needed",
        description: "Your current coverage may leave your family with significant financial gaps. Consider increasing coverage before rates rise with age.",
        trend: "down",
        timeframe: "immediate"
      });
    }
    
    if (riskScores?.longevity >= 70) {
      insights.push({
        type: "warning", 
        title: "Retirement Income Gap Projected",
        description: `At age ${age}, your current savings trajectory may not support your desired retirement lifestyle. Consider increasing contributions or guaranteed income solutions.`,
        trend: "down",
        timeframe: "long-term"
      });
    }
    
    if (age < 50 && riskScores?.market >= 50) {
      insights.push({
        type: "opportunity",
        title: "Time is Your Advantage",
        description: "You have years to weather market volatility and grow wealth. Consider strategies that balance growth potential with downside protection.",
        trend: "up", 
        timeframe: "medium-term"
      });
    }
    
    return insights;
  };

  const insights = generateInsights();

  const getIcon = (trend: string) => {
    switch (trend) {
      case "up": return TrendingUp;
      case "down": return TrendingDown;
      default: return Target;
    }
  };

  const getVariant = (type: string) => {
    switch (type) {
      case "critical": return "destructive";
      case "warning": return "secondary";
      case "opportunity": return "default";
      default: return "outline";
    }
  };

  return (
    <Card className="card-financial">
      <CardHeader>
        <CardTitle className="font-heading">Future Outlook</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.length === 0 ? (
            <div className="text-center py-6">
              <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                Complete your assessment to see personalized future projections.
              </p>
            </div>
          ) : (
            insights.map((insight, index) => {
              const Icon = getIcon(insight.trend);
              return (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className={`p-2 rounded-full ${
                    insight.type === 'critical' ? 'bg-red-100 text-red-600' :
                    insight.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-green-100 text-green-600'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-sm">{insight.title}</h4>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        {insight.timeframe}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                  </div>
                </div>
              );
            })
          )}
          
          <div className="mt-4 pt-4 border-t">
            <Button variant="outline" size="sm" className="w-full">
              Schedule Strategy Session
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PredictiveInsights;