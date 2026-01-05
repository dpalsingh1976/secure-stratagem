import { HelpCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WizardStep2Props {
  educationProbability: number;
  scholarshipLikely: boolean;
  nonTraditionalPath: boolean;
  onEducationProbabilityChange: (value: number) => void;
  onScholarshipLikelyChange: (value: boolean) => void;
  onNonTraditionalPathChange: (value: boolean) => void;
}

function getProbabilityLabel(probability: number): { label: string; color: string } {
  if (probability >= 90) return { label: 'Very High', color: 'text-green-600 dark:text-green-400' };
  if (probability >= 70) return { label: 'High', color: 'text-emerald-600 dark:text-emerald-400' };
  if (probability >= 50) return { label: 'Moderate', color: 'text-amber-600 dark:text-amber-400' };
  if (probability >= 30) return { label: 'Low', color: 'text-orange-600 dark:text-orange-400' };
  return { label: 'Very Low', color: 'text-red-600 dark:text-red-400' };
}

export function WizardStep2({
  educationProbability,
  scholarshipLikely,
  nonTraditionalPath,
  onEducationProbabilityChange,
  onScholarshipLikelyChange,
  onNonTraditionalPathChange,
}: WizardStep2Props) {
  const probabilityInfo = getProbabilityLabel(educationProbability);

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">How sure are you education will be needed?</h2>
        <p className="text-muted-foreground">
          This affects how we weigh flexibility vs. tax advantages.
        </p>
      </div>

      {/* Education Probability Slider */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">Education Probability</Label>
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${probabilityInfo.color}`}>
              {educationProbability}% — {probabilityInfo.label}
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Estimate the likelihood that your child will use these funds for qualified education expenses (college, university, trade school, etc.).</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        <Slider
          value={[educationProbability]}
          onValueChange={(values) => onEducationProbabilityChange(values[0])}
          min={0}
          max={100}
          step={5}
          className="py-4"
        />
        
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0% — Very Uncertain</span>
          <span>100% — Definitely Education</span>
        </div>
      </div>

      {/* Toggle Options */}
      <div className="space-y-6 pt-4 border-t border-border">
        {/* Scholarship Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Label htmlFor="scholarship" className="text-base font-medium">
                Scholarship Likely?
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>If your child is likely to receive scholarships (academic, athletic, etc.), you may end up with excess 529 funds.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-sm text-muted-foreground">
              Academic, athletic, or need-based scholarships expected
            </p>
          </div>
          <Switch
            id="scholarship"
            checked={scholarshipLikely}
            onCheckedChange={onScholarshipLikelyChange}
          />
        </div>

        {/* Non-Traditional Path Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Label htmlFor="nontraditional" className="text-base font-medium">
                May Choose Non-Traditional Path?
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Trade school, entrepreneurship, military service, or other paths may not qualify as "qualified education expenses" for 529 purposes.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-sm text-muted-foreground">
              Trade school, business, military, or other career paths
            </p>
          </div>
          <Switch
            id="nontraditional"
            checked={nonTraditionalPath}
            onCheckedChange={onNonTraditionalPathChange}
          />
        </div>
      </div>

      {/* Contextual Guidance */}
      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
        <p className="text-sm font-medium text-foreground">What this means:</p>
        {educationProbability >= 75 && !scholarshipLikely && !nonTraditionalPath && (
          <p className="text-sm text-muted-foreground">
            ✓ High education certainty suggests 529 may be advantageous for tax-free growth.
          </p>
        )}
        {(educationProbability < 50 || scholarshipLikely || nonTraditionalPath) && (
          <p className="text-sm text-muted-foreground">
            ⚠️ Uncertainty suggests flexibility may be valuable—IUL could be worth considering.
          </p>
        )}
        {scholarshipLikely && (
          <p className="text-sm text-muted-foreground">
            💡 Scholarship potential increases the risk of 529 overfunding.
          </p>
        )}
        {nonTraditionalPath && (
          <p className="text-sm text-muted-foreground">
            💡 Non-traditional paths may not qualify for 529 tax-free treatment.
          </p>
        )}
      </div>
    </div>
  );
}
