import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Loader2, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface PredictiveInsightsProps {
  userProfile?: any;
  riskScores?: any;
}

const PredictiveInsights = ({ userProfile, riskScores }: PredictiveInsightsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [insights, setInsights] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerateInsights = async () => {
    if (insights) return; // Already loaded

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('predictive-insights', {
        body: {
          userProfile: userProfile || {
            age: 35,
            income: 75000,
            hasKids: true,
            married: true,
            occupation: "Professional",
            healthStatus: "Good",
            investmentExperience: "Moderate"
          },
          riskScores: riskScores || {
            lifeInsurance: 75,
            longevity: 80,
            market: 65,
            tax: 70
          }
        }
      });

      if (error) {
        console.error('Predictive insights error:', error);
        throw error;
      }

      setInsights(data.insights);
      toast({
        title: "Insights Generated",
        description: "Your 20-year financial risk path is ready to review.",
      });
    } catch (error) {
      console.error('Error generating predictive insights:', error);
      toast({
        title: "Error",
        description: "Unable to generate insights. Please try again.",
        variant: "destructive"
      });
      setInsights("I'm sorry, I couldn't generate your predictive insights right now. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          AI-Powered Predictive Insights
        </CardTitle>
        <CardDescription>
          Get a comprehensive 20-year financial risk path tailored to your profile
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border border-primary/20">
            <TrendingUp className="w-8 h-8 text-primary" />
            <div>
              <h4 className="font-semibold text-foreground">Future Risk Analysis</h4>
              <p className="text-sm text-muted-foreground">
                Discover how your financial risks will evolve over the next 20 years
              </p>
            </div>
          </div>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={handleGenerateInsights}
                className="w-full bg-primary hover:bg-primary/90"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate My 20-Year Financial Path
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Your 20-Year Financial Risk Path
                </DialogTitle>
              </DialogHeader>
              
              <ScrollArea className="h-[60vh] pr-4">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <h3 className="text-lg font-semibold">Generating Your Insights...</h3>
                    <p className="text-muted-foreground text-center max-w-md">
                      Our AI is analyzing your financial profile and market trends to create 
                      a personalized 20-year projection of your financial risks and opportunities.
                    </p>
                  </div>
                ) : insights ? (
                  <div className="space-y-4">
                    <div className="bg-muted/50 p-6 rounded-lg">
                      <div className="prose prose-sm max-w-none">
                        {insights.split('\n').map((paragraph, index) => {
                          if (paragraph.trim().startsWith('#')) {
                            return (
                              <h3 key={index} className="text-lg font-semibold mt-6 mb-3 text-primary">
                                {paragraph.replace(/^#+\s*/, '')}
                              </h3>
                            );
                          }
                          if (paragraph.trim().startsWith('**') && paragraph.trim().endsWith('**')) {
                            return (
                              <h4 key={index} className="font-semibold mt-4 mb-2 text-foreground">
                                {paragraph.replace(/\*\*/g, '')}
                              </h4>
                            );
                          }
                          if (paragraph.trim() === '') return null;
                          return (
                            <p key={index} className="mb-3 text-sm leading-relaxed text-foreground">
                              {paragraph}
                            </p>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                      <p className="text-sm text-primary font-medium mb-2">
                        💡 Next Steps Recommended:
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Review these insights with a licensed financial advisor to create an actionable plan 
                        tailored to your specific situation and goals.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary/50" />
                    <h3 className="text-lg font-semibold mb-2">Ready to See Your Future?</h3>
                    <p>Click the button above to generate your personalized 20-year financial projection.</p>
                  </div>
                )}
              </ScrollArea>
              
              <div className="flex justify-end pt-4 border-t">
                <Button onClick={() => setIsOpen(false)}>
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <p className="text-xs text-muted-foreground text-center">
            Powered by advanced AI • Takes 30-60 seconds to generate
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PredictiveInsights;