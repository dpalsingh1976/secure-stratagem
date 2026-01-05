import { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { RiskTolerance, LiquidityNeed, IULDesignGoal, Plan529VsIulInputs } from "@/types/plan529VsIul";
import { Slider } from "@/components/ui/slider";

interface WizardStep3Props {
  inputs: Plan529VsIulInputs;
  onInputChange: <K extends keyof Plan529VsIulInputs>(key: K, value: Plan529VsIulInputs[K]) => void;
}

const TAX_BRACKETS = [
  { value: '0.10', label: '10%' },
  { value: '0.12', label: '12%' },
  { value: '0.22', label: '22%' },
  { value: '0.24', label: '24%' },
  { value: '0.32', label: '32%' },
  { value: '0.35', label: '35%' },
  { value: '0.37', label: '37%' },
];

function TooltipIcon({ content }: { content: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <HelpCircle className="h-4 w-4 text-muted-foreground" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p>{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function WizardStep3({ inputs, onInputChange }: WizardStep3Props) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleNumberChange = (key: keyof Plan529VsIulInputs, value: string) => {
    const numValue = parseFloat(value) || 0;
    onInputChange(key, numValue as Plan529VsIulInputs[typeof key]);
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">Funding & Tax Details</h2>
        <p className="text-muted-foreground">
          Enter your savings plan details for an accurate comparison.
        </p>
      </div>

      {/* Basic Inputs Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Child Age */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="childAge">Child's Current Age</Label>
            <TooltipIcon content="Age of the child you're saving for (0-17 years)." />
          </div>
          <Input
            id="childAge"
            type="number"
            min={0}
            max={17}
            value={inputs.childAge}
            onChange={(e) => {
              const age = Math.min(17, Math.max(0, parseInt(e.target.value) || 0));
              onInputChange('childAge', age);
              onInputChange('yearsToGoal', 18 - age);
            }}
          />
        </div>

        {/* Years to Goal */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="yearsToGoal">Years to Goal</Label>
            <TooltipIcon content="Number of years until funds are needed (typically age 18)." />
          </div>
          <Input
            id="yearsToGoal"
            type="number"
            min={1}
            max={25}
            value={inputs.yearsToGoal}
            onChange={(e) => handleNumberChange('yearsToGoal', e.target.value)}
          />
        </div>

        {/* Monthly Contribution */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="monthlyContribution">Monthly Contribution</Label>
            <TooltipIcon content="Amount you plan to contribute each month." />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id="monthlyContribution"
              type="number"
              min={0}
              className="pl-7"
              value={inputs.monthlyContribution}
              onChange={(e) => handleNumberChange('monthlyContribution', e.target.value)}
            />
          </div>
        </div>

        {/* Initial Lump Sum */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="initialLumpSum">Initial Lump Sum (Optional)</Label>
            <TooltipIcon content="One-time initial contribution, if any." />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id="initialLumpSum"
              type="number"
              min={0}
              className="pl-7"
              value={inputs.initialLumpSum}
              onChange={(e) => handleNumberChange('initialLumpSum', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Risk Tolerance */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Label>Risk Tolerance</Label>
          <TooltipIcon content="Affects assumed return rates. Higher risk = higher potential returns but more volatility." />
        </div>
        <div className="flex gap-2">
          {(['conservative', 'balanced', 'growth'] as RiskTolerance[]).map((level) => (
            <Button
              key={level}
              type="button"
              variant={inputs.riskTolerance === level ? 'default' : 'outline'}
              className="flex-1 capitalize"
              onClick={() => onInputChange('riskTolerance', level)}
            >
              {level}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center">
          {inputs.riskTolerance === 'conservative' && '529: ~4.5% | IUL: ~4% (illustrative net)'}
          {inputs.riskTolerance === 'balanced' && '529: ~5.5% | IUL: ~5% (illustrative net)'}
          {inputs.riskTolerance === 'growth' && '529: ~6.5% | IUL: ~6% (illustrative net)'}
        </p>
      </div>

      {/* Liquidity Need */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Label>Liquidity Need</Label>
          <TooltipIcon content="How important is accessing funds for non-education purposes?" />
        </div>
        <div className="flex gap-2">
          {(['low', 'medium', 'high'] as LiquidityNeed[]).map((level) => (
            <Button
              key={level}
              type="button"
              variant={inputs.liquidityNeed === level ? 'default' : 'outline'}
              className="flex-1 capitalize"
              onClick={() => onInputChange('liquidityNeed', level)}
            >
              {level}
            </Button>
          ))}
        </div>
      </div>

      {/* Tax Section */}
      <div className="space-y-4 pt-4 border-t border-border">
        <h3 className="font-medium text-foreground">Tax Information</h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          {/* Federal Tax Bracket */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Federal Tax Bracket at Withdrawal</Label>
              <TooltipIcon content="Your expected marginal tax rate when funds are withdrawn." />
            </div>
            <Select
              value={inputs.federalTaxBracket.toString()}
              onValueChange={(value) => onInputChange('federalTaxBracket', parseFloat(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select tax bracket" />
              </SelectTrigger>
              <SelectContent>
                {TAX_BRACKETS.map((bracket) => (
                  <SelectItem key={bracket.value} value={bracket.value}>
                    {bracket.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* State Tax Benefit */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label>State Tax Benefit</Label>
                <TooltipIcon content="Some states offer tax deductions or credits for 529 contributions." />
              </div>
              <Switch
                checked={inputs.stateTaxBenefitEnabled}
                onCheckedChange={(checked) => onInputChange('stateTaxBenefitEnabled', checked)}
              />
            </div>
            {inputs.stateTaxBenefitEnabled && (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  type="number"
                  min={0}
                  className="pl-7"
                  placeholder="Annual benefit amount"
                  value={inputs.stateTaxBenefitAmount}
                  onChange={(e) => handleNumberChange('stateTaxBenefitAmount', e.target.value)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mixed Scenario Slider */}
      <div className="space-y-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <Label>Mixed Scenario: % Used for Education</Label>
          <TooltipIcon content="For the 'Mixed Usage' scenario, what percentage of funds would go to qualified education?" />
        </div>
        <Slider
          value={[inputs.percentUsedForEducation]}
          onValueChange={(values) => onInputChange('percentUsedForEducation', values[0])}
          min={0}
          max={100}
          step={5}
          className="py-2"
        />
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">0% — All non-education</span>
          <span className="font-medium text-primary">{inputs.percentUsedForEducation}%</span>
          <span className="text-muted-foreground">100% — All education</span>
        </div>
      </div>

      {/* Advanced Settings */}
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between">
            Advanced Settings
            {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-6 pt-4">
          {/* Roth Rollover */}
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label>Consider Roth Rollover (529 → Roth IRA)</Label>
                <TooltipIcon content="Starting 2024, unused 529 funds can be rolled into a Roth IRA (up to $35,000 lifetime, with restrictions)." />
              </div>
              <Switch
                checked={inputs.considerRothRollover}
                onCheckedChange={(checked) => onInputChange('considerRothRollover', checked)}
              />
            </div>
            {inputs.considerRothRollover && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm">Lifetime Rollover Limit</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      type="number"
                      className="pl-7"
                      value={inputs.rothRolloverLimit}
                      onChange={(e) => handleNumberChange('rothRolloverLimit', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Annual Roth Contribution Limit</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      type="number"
                      className="pl-7"
                      value={inputs.annualRothLimit}
                      onChange={(e) => handleNumberChange('annualRothLimit', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* IUL Design Options */}
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
            <h4 className="font-medium">IUL Design Assumptions</h4>
            
            <div className="space-y-2">
              <Label>Design Goal</Label>
              <div className="flex gap-2">
                {(['cash_focused', 'balanced'] as IULDesignGoal[]).map((goal) => (
                  <Button
                    key={goal}
                    type="button"
                    variant={inputs.iulDesignGoal === goal ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => onInputChange('iulDesignGoal', goal)}
                  >
                    {goal === 'cash_focused' ? 'Max Cash Value' : 'Balanced'}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label>MEC Risk Guard</Label>
                <TooltipIcon content="Assumes policy is designed to avoid Modified Endowment Contract (MEC) status." />
              </div>
              <Switch
                checked={inputs.mecRiskGuard}
                onCheckedChange={(checked) => onInputChange('mecRiskGuard', checked)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-sm">Max Loan-to-Value Ratio</Label>
                <TooltipIcon content="Maximum percentage of cash value accessible via policy loans (typically 70-90%)." />
              </div>
              <Slider
                value={[inputs.maxLoanToValueRatio * 100]}
                onValueChange={(values) => onInputChange('maxLoanToValueRatio', values[0] / 100)}
                min={50}
                max={95}
                step={5}
              />
              <p className="text-sm text-center text-muted-foreground">
                {Math.round(inputs.maxLoanToValueRatio * 100)}%
              </p>
            </div>
          </div>

          {/* Inflation Assumption */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Inflation Assumption</Label>
              <TooltipIcon content="Annual inflation rate for adjusting values (default 3%)." />
            </div>
            <Slider
              value={[inputs.inflationAssumption * 100]}
              onValueChange={(values) => onInputChange('inflationAssumption', values[0] / 100)}
              min={1}
              max={6}
              step={0.5}
            />
            <p className="text-sm text-center text-muted-foreground">
              {(inputs.inflationAssumption * 100).toFixed(1)}%
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
