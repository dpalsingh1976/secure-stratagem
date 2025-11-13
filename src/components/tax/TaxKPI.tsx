import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TaxKPIProps {
  label: string;
  value: string | number;
  delta?: string;
  tooltip?: string;
  highlight?: boolean;
  trend?: 'up' | 'down' | 'neutral';
}

export const TaxKPI = ({ label, value, delta, tooltip, highlight, trend }: TaxKPIProps) => {
  const displayValue = typeof value === 'number' 
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value)
    : value;

  return (
    <div className={`p-4 rounded-lg border ${highlight ? 'bg-primary/5 border-primary/30' : 'bg-background border-border'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-sm">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div className="text-2xl font-bold text-foreground">{displayValue}</div>
      {delta && (
        <div className={`text-sm mt-1 ${
          trend === 'up' ? 'text-green-600' : 
          trend === 'down' ? 'text-red-600' : 
          'text-muted-foreground'
        }`}>
          {delta}
        </div>
      )}
    </div>
  );
};
