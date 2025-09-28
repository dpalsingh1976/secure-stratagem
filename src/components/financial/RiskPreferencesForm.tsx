import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Target, TrendingDown, BookOpen, Zap, Receipt, Leaf } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { InfoIcon } from 'lucide-react';
import type { RiskPreferencesData } from '@/types/financial';

interface RiskPreferencesFormProps {
  data: RiskPreferencesData;
  onChange: (data: RiskPreferencesData) => void;
  onValidationChange: (isValid: boolean) => void;
}

const ETHICAL_EXCLUSIONS = [
  'Tobacco',
  'Alcohol',
  'Gambling', 
  'Weapons/Defense',
  'Fossil Fuels',
  'Nuclear Energy',
  'Animal Testing',
  'Adult Entertainment'
];

const getRiskToleranceLabel = (value: number) => {
  if (value <= 2) return { label: 'Conservative', color: 'text-red-600', description: 'Prioritizes capital preservation' };
  if (value <= 4) return { label: 'Moderate Conservative', color: 'text-orange-600', description: 'Some growth with limited volatility' };
  if (value <= 6) return { label: 'Moderate', color: 'text-yellow-600', description: 'Balanced growth and risk' };
  if (value <= 8) return { label: 'Moderate Aggressive', color: 'text-blue-600', description: 'Higher growth potential acceptable' };
  return { label: 'Aggressive', color: 'text-green-600', description: 'Maximum growth focus' };
};

const getLossAversionLabel = (value: number) => {
  if (value <= 2) return { label: 'Loss Tolerant', color: 'text-green-600', description: 'Comfortable with market volatility' };
  if (value <= 4) return { label: 'Moderate Loss Aversion', color: 'text-yellow-600', description: 'Some concern about losses' };
  if (value <= 6) return { label: 'Loss Averse', color: 'text-orange-600', description: 'Uncomfortable with significant losses' };
  if (value <= 8) return { label: 'Highly Loss Averse', color: 'text-red-600', description: 'Strong preference to avoid losses' };
  return { label: 'Extremely Loss Averse', color: 'text-red-800', description: 'Cannot tolerate any significant losses' };
};

const getKnowledgeLabel = (value: number) => {
  if (value <= 1) return 'Novice';
  if (value <= 2) return 'Basic';
  if (value <= 3) return 'Intermediate';
  if (value <= 4) return 'Advanced';
  return 'Expert';
};

export function RiskPreferencesForm({ data, onChange, onValidationChange }: RiskPreferencesFormProps) {
  const handleInputChange = (field: keyof RiskPreferencesData, value: any) => {
    const newData = { ...data, [field]: value };
    onChange(newData);
    onValidationChange(true);
  };

  const toggleExclusion = (exclusion: string) => {
    const newExclusions = data.ethical_exclusions.includes(exclusion)
      ? data.ethical_exclusions.filter(e => e !== exclusion)
      : [...data.ethical_exclusions, exclusion];
    
    handleInputChange('ethical_exclusions', newExclusions);
  };

  const riskTolerance = getRiskToleranceLabel(data.risk_tolerance);
  const lossAversion = getLossAversionLabel(data.loss_aversion);

  return (
    <TooltipProvider>
      <div className="space-y-8">
        {/* Risk Tolerance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-primary" />
              <span>Risk Tolerance Assessment</span>
            </CardTitle>
            <CardDescription>
              Your comfort level with investment volatility and potential losses in pursuit of higher returns.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Label>Investment Risk Tolerance</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoIcon className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p>How comfortable are you with investment volatility? Conservative investors prioritize capital preservation, while aggressive investors accept higher volatility for growth potential.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className={riskTolerance.color}>
                      {riskTolerance.label}
                    </Badge>
                    <div className="text-sm text-gray-600 mt-1">
                      {riskTolerance.description}
                    </div>
                  </div>
                </div>
                <Slider
                  value={[data.risk_tolerance]}
                  onValueChange={([value]) => handleInputChange('risk_tolerance', value)}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Conservative (1)</span>
                  <span>Moderate (5)</span>
                  <span>Aggressive (10)</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Label>Loss Aversion</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoIcon className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p>How much do losses bother you compared to equivalent gains? High loss aversion means you feel losses more acutely than gains of the same amount.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className={lossAversion.color}>
                      {lossAversion.label}
                    </Badge>
                    <div className="text-sm text-gray-600 mt-1">
                      {lossAversion.description}
                    </div>
                  </div>
                </div>
                <Slider
                  value={[data.loss_aversion]}
                  onValueChange={([value]) => handleInputChange('loss_aversion', value)}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Loss Tolerant (1)</span>
                  <span>Moderate (5)</span>
                  <span>Highly Loss Averse (10)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Investment Knowledge */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <span>Investment Knowledge & Experience</span>
            </CardTitle>
            <CardDescription>
              Your understanding of financial markets, investment products, and portfolio management concepts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Label>Investment Knowledge Level</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p>Assess your knowledge of investment concepts like asset allocation, diversification, market cycles, and financial instruments.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Badge variant="outline">
                  {getKnowledgeLabel(data.investment_knowledge)}
                </Badge>
              </div>
              <Slider
                value={[data.investment_knowledge]}
                onValueChange={([value]) => handleInputChange('investment_knowledge', value)}
                max={5}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>Novice (1)</span>
                <span>Intermediate (3)</span>
                <span>Expert (5)</span>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Knowledge Assessment Guide</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium">Novice (1-2):</div>
                  <ul className="text-blue-700 space-y-1 mt-1">
                    <li>• New to investing</li>
                    <li>• Basic understanding of stocks/bonds</li>
                    <li>• Relies on professional guidance</li>
                  </ul>
                </div>
                <div>
                  <div className="font-medium">Expert (4-5):</div>
                  <ul className="text-blue-700 space-y-1 mt-1">
                    <li>• Advanced portfolio management</li>
                    <li>• Understands complex strategies</li>
                    <li>• Makes independent decisions</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Specific Risk Sensitivities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-primary" />
              <span>Specific Risk Sensitivities</span>
            </CardTitle>
            <CardDescription>
              How sensitive you are to specific financial risks that could impact your retirement security.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="sequenceRisk">Sequence of Returns Risk Sensitivity</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p>Risk of poor market returns early in retirement when withdrawing from portfolio. High sensitivity indicates preference for guaranteed income sources.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select
                  value={data.sequence_risk_sensitivity}
                  onValueChange={(value: 'low' | 'medium' | 'high') => handleInputChange('sequence_risk_sensitivity', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sensitivity level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - Comfortable with market-based retirement income</SelectItem>
                    <SelectItem value="medium">Medium - Prefer some guaranteed income sources</SelectItem>
                    <SelectItem value="high">High - Strong preference for guaranteed income</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="taxSensitivity">Tax Sensitivity</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p>How important tax efficiency is in your investment strategy. High sensitivity indicates willingness to use tax-advantaged strategies.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select
                  value={data.tax_sensitivity}
                  onValueChange={(value: 'low' | 'medium' | 'high') => handleInputChange('tax_sensitivity', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sensitivity level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - Tax efficiency is not a priority</SelectItem>
                    <SelectItem value="medium">Medium - Consider tax implications in decisions</SelectItem>
                    <SelectItem value="high">High - Strongly prefer tax-efficient strategies</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ethical & Social Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Leaf className="h-5 w-5 text-primary" />
              <span>Ethical & Social Investment Preferences</span>
            </CardTitle>
            <CardDescription>
              Industries or sectors you prefer to exclude from your investment portfolio based on personal values.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Exclude the following sectors:</Label>
                <p className="text-sm text-gray-600 mt-1">
                  Select any industries you prefer not to invest in for ethical or personal reasons.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {ETHICAL_EXCLUSIONS.map(exclusion => (
                  <div
                    key={exclusion}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      data.ethical_exclusions.includes(exclusion)
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleExclusion(exclusion)}
                  >
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={data.ethical_exclusions.includes(exclusion)}
                        onChange={() => toggleExclusion(exclusion)}
                      />
                      <span className="text-sm font-medium">{exclusion}</span>
                    </div>
                  </div>
                ))}
              </div>

              {data.ethical_exclusions.length > 0 && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900">Selected Exclusions</h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {data.ethical_exclusions.map(exclusion => (
                      <Badge key={exclusion} variant="secondary" className="bg-green-100">
                        {exclusion}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm text-green-700 mt-2">
                    ESG and socially responsible investment options will be prioritized to align with your values.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Risk Profile Summary */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="text-primary">Risk Profile Summary</CardTitle>
            <CardDescription>
              Based on your preferences, here's your investment risk profile for planning recommendations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <div className="text-lg font-semibold">{riskTolerance.label}</div>
                <div className="text-sm text-gray-600">Risk Tolerance</div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <TrendingDown className="h-8 w-8 text-orange-500" />
                </div>
                <div className="text-lg font-semibold">{lossAversion.label}</div>
                <div className="text-sm text-gray-600">Loss Sensitivity</div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <BookOpen className="h-8 w-8 text-blue-500" />
                </div>
                <div className="text-lg font-semibold">{getKnowledgeLabel(data.investment_knowledge)}</div>
                <div className="text-sm text-gray-600">Investment Knowledge</div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <h4 className="font-semibold mb-2">Recommended Strategy Characteristics:</h4>
              <ul className="text-sm space-y-1">
                <li>• {riskTolerance.label} investment approach with {riskTolerance.description.toLowerCase()}</li>
                <li>• {data.sequence_risk_sensitivity === 'high' ? 'Significant allocation to guaranteed income sources' : 
                       data.sequence_risk_sensitivity === 'medium' ? 'Balanced approach with some guaranteed income' : 
                       'Growth-focused with market-based income'}</li>
                <li>• {data.tax_sensitivity === 'high' ? 'Tax-optimized investment vehicles and strategies' : 
                       data.tax_sensitivity === 'medium' ? 'Tax-aware investment selection' : 
                       'Tax efficiency not prioritized'}</li>
                {data.ethical_exclusions.length > 0 && (
                  <li>• ESG/socially responsible investments excluding {data.ethical_exclusions.length} sector(s)</li>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}