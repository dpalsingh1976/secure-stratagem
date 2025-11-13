import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TaxExplainerProps {
  title: string;
  bullets: string[];
  expandable?: boolean;
  changeAssumptionLink?: string;
}

export const TaxExplainer = ({ title, bullets, expandable = false, changeAssumptionLink }: TaxExplainerProps) => {
  const [isExpanded, setIsExpanded] = useState(!expandable);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {expandable && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-primary hover:text-primary/80 transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        )}
      </div>
      
      {isExpanded && (
        <div className="space-y-3">
          {bullets.map((bullet, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">{bullet}</p>
            </div>
          ))}
          
          {changeAssumptionLink && (
            <div className="mt-4 pt-4 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = changeAssumptionLink}
              >
                Change Assumptions
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
