import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, ExternalLink } from 'lucide-react';
import { RiskModalContent, RiskInputs, RiskType } from '@/types/riskTypes';
import { generateLifeInsuranceContent, generateLongevityContent, generateMarketContent, generateTaxEstateContent } from '@/utils/riskModalContent';
import RiskChart from './RiskChart';
import { useToast } from '@/components/ui/use-toast';

interface RiskExplanationDrawerProps {
  riskType: RiskType;
  exposurePct: number;
  inputs: RiskInputs;
}

const RiskExplanationDrawer: React.FC<RiskExplanationDrawerProps> = ({ riskType, exposurePct, inputs }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  // Generate content based on risk type
  const getContent = (): RiskModalContent => {
    switch (riskType) {
      case 'lifeInsurance':
        return generateLifeInsuranceContent(inputs, exposurePct);
      case 'longevity':
        return generateLongevityContent(inputs, exposurePct);
      case 'market':
        return generateMarketContent(inputs, exposurePct);
      case 'taxEstate':
        return generateTaxEstateContent(inputs, exposurePct);
      default:
        throw new Error(`Unknown risk type: ${riskType}`);
    }
  };

  const content = getContent();

  const handleAction = (actionId: string) => {
    // Handle different action IDs
    switch (actionId) {
      case 'openCoveragePlanner':
      case 'openPolicyCompare':
      case 'openAnnuityQuote':
      case 'openLongevityScenarios':
      case 'openProtection':
      case 'openMarketScenario':
      case 'openTaxEstatePlanner':
        toast({
          title: "Feature Coming Soon",
          description: "This planning tool will be available in the next update.",
        });
        break;
      case 'downloadEstateChecklist':
        toast({
          title: "Download Started",
          description: "Your estate planning checklist will download shortly.",
        });
        break;
      default:
        toast({
          title: "Action",
          description: `${actionId} selected`,
        });
    }
    setIsOpen(false);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-xs text-muted-foreground hover:text-primary p-1 h-auto ml-2"
        onClick={() => setIsOpen(true)}
      >
        <HelpCircle className="w-3 h-3 mr-1" />
        Why this risk?
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {content.title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Chart */}
            <div className="flex justify-center">
              <RiskChart 
                kind={content.chart.kind}
                valuePct={content.chart.valuePct}
                caption={content.chart.caption}
                size={140}
              />
            </div>

            {/* What we used */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">What we used:</h4>
              <div className="flex flex-wrap gap-2">
                {content.chips.map((chip, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {chip}
                  </Badge>
                ))}
              </div>
            </div>

            {/* How we calculated it */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">How we calculated it:</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {content.explainer}
              </p>
            </div>

            {/* Impact */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Impact:</h4>
              <ul className="space-y-1">
                {content.impact.map((impact, index) => (
                  <li key={index} className="text-sm text-muted-foreground leading-relaxed flex items-start">
                    <span className="text-primary mr-2">•</span>
                    {impact}
                  </li>
                ))}
              </ul>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
              <Button 
                className="flex-1"
                onClick={() => handleAction(content.ctaPrimary.actionId)}
              >
                {content.ctaPrimary.label}
              </Button>
              
              {content.ctaSecondary && (
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => handleAction(content.ctaSecondary.actionId)}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {content.ctaSecondary.label}
                </Button>
              )}
            </div>

            <div className="flex justify-end">
              <Button variant="ghost" onClick={() => setIsOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RiskExplanationDrawer;