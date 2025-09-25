import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RiskProgressRing from "@/components/RiskProgressRing";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, AlertTriangle, Clock, TrendingUp, Shield, BarChart3, Calendar, Heart, DollarSign, FileText } from "lucide-react";
import { RiskInputs, RiskModalContent } from "@/types/riskTypes";
import { 
  generateLifeInsuranceContent, 
  generateLongevityContent, 
  generateMarketContent, 
  generateTaxEstateContent 
} from "@/utils/riskModalContent";

interface CategoryRiskModalProps {
  children: React.ReactNode;
  category: 'lifeInsurance' | 'longevity' | 'market' | 'tax';
  score: number;
  riskInputs: RiskInputs;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'lifeInsurance': return Heart;
    case 'longevity': return Clock;
    case 'market': return TrendingUp;
    case 'tax': return FileText;
    default: return Shield;
  }
};

const getCategoryData = (category: string, score: number, riskInputs: RiskInputs): RiskModalContent => {
  switch (category) {
    case 'lifeInsurance':
      return generateLifeInsuranceContent(riskInputs, score);
    case 'longevity':
      return generateLongevityContent(riskInputs, score);
    case 'market':
      return generateMarketContent(riskInputs, score);
    case 'tax':
      return generateTaxEstateContent(riskInputs, score);
    default:
      return generateLifeInsuranceContent(riskInputs, score);
  }
};

const CategoryRiskModal = ({ children, category, score, riskInputs }: CategoryRiskModalProps) => {
  const CategoryIcon = getCategoryIcon(category);
  const contentData = getCategoryData(category, score, riskInputs);

  const getRiskLevel = (score: number) => {
    if (score >= 80) return 'Critical';
    if (score >= 60) return 'High';
    if (score >= 30) return 'Moderate';
    return 'Low';
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-600';
    if (score >= 60) return 'text-orange-600';
    if (score >= 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  const level = getRiskLevel(score);

  return (
    <Dialog>
      {children}
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl">
                <CategoryIcon className="w-8 h-8 text-primary" />
              </div>
              <DialogTitle className="text-2xl font-bold">
                {contentData.title}
              </DialogTitle>
            </div>
            
            {/* Score Display */}
            <div className="flex justify-center">
              <RiskProgressRing 
                score={score} 
                size={120} 
                showScore={true}
                label={`${level} Risk`}
              />
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Key Metrics Chips */}
          <Card className="border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Key Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {contentData.chips.map((chip, index) => (
                  <Badge key={index} variant="secondary" className="text-sm py-1 px-3">
                    {chip}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Methodology */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                How We Calculated This
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/80 leading-relaxed">
                {contentData.explainer}
              </p>
            </CardContent>
          </Card>

          {/* Risk Visualization */}
          {contentData.chart && (
            <Card className="border border-red-200 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-red-600" />
                  Risk Exposure Visualization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600 mb-2">
                    {Math.round(contentData.chart.valuePct)}%
                  </div>
                  <p className="text-sm text-foreground/70">{contentData.chart.caption}</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 font-medium">Protected</span>
                    <span className="text-red-600 font-medium">At Risk</span>
                  </div>
                  <Progress 
                    value={100 - contentData.chart.valuePct} 
                    className="h-4 bg-red-100 dark:bg-red-900/30"
                  />
                  <div className="flex justify-between text-xs text-foreground/60">
                    <span>{Math.round(100 - contentData.chart.valuePct)}% covered</span>
                    <span>{Math.round(contentData.chart.valuePct)}% gap</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Impact Assessment */}
          <Card className="border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-50 to-transparent dark:from-orange-950/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                Potential Impact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {contentData.impact.map((impact, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                    <p className="text-foreground leading-relaxed">{impact}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
              <Calendar className="w-4 h-4 mr-2" />
              {contentData.ctaPrimary.label}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button variant="outline" className="flex-1">
              <DollarSign className="w-4 h-4 mr-2" />
              {contentData.ctaSecondary.label}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryRiskModal;