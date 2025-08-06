import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { HelpCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface RiskExplanationModalProps {
  riskCategory: string;
  riskScore: number;
  userProfile?: any;
}

const RiskExplanationModal = ({ riskCategory, riskScore, userProfile }: RiskExplanationModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getRiskLevel = (score: number) => {
    if (score >= 80) return "High";
    if (score >= 60) return "Moderate";
    if (score >= 40) return "Low-Moderate";
    return "Low";
  };

  const handleExplain = async () => {
    if (explanation) return; // Already loaded

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('explain-risk', {
        body: {
          riskCategory,
          riskScore,
          userProfile: userProfile || {
            age: 35,
            income: 75000,
            hasKids: true,
            married: true
          }
        }
      });

      if (error) {
        console.error('Risk explanation error:', error);
        throw error;
      }

      setExplanation(data.explanation);
    } catch (error) {
      console.error('Error getting risk explanation:', error);
      toast({
        title: "Error",
        description: "Unable to generate explanation. Please try again.",
        variant: "destructive"
      });
      setExplanation("I'm sorry, I couldn't generate an explanation right now. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-primary p-1 h-auto"
          onClick={handleExplain}
        >
          <HelpCircle className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Why is your {riskCategory} score {getRiskLevel(riskScore)}?
            <span className="text-sm font-normal text-muted-foreground">
              (Score: {riskScore}/100)
            </span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Analyzing your risk factors...</span>
            </div>
          ) : explanation ? (
            <div className="prose prose-sm max-w-none">
              <div className="bg-muted/50 p-4 rounded-lg">
                {explanation.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-2 last:mb-0 text-sm leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Click the help icon to get AI-powered insights about your risk score.
            </div>
          )}
          
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RiskExplanationModal;