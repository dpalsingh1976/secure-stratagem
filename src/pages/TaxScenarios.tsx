import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { ComplianceFooter } from "@/components/tax/ComplianceFooter";
import { TaxKPI } from "@/components/tax/TaxKPI";
import { TaxChartCard } from "@/components/tax/TaxChartCard";
import { TaxExplainer } from "@/components/tax/TaxExplainer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, Calculator, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function TaxScenarios() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("401k");
  const [presets, setPresets] = useState<any[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  
  // 401k inputs
  const [inputs401k, setInputs401k] = useState({
    annual_contrib: 6000,
    years: 35,
    pre_tax_rate_now: 0.33,
    assumed_return: 0.075,
    draw_mode: "interest",
    retire_return: 0.075,
    retire_bracket: 0.33,
    ssi_annual: 28000,
    filing_status: "mfj"
  });

  // Roth/LIRP inputs
  const [inputsRoth, setInputsRoth] = useState({
    annual_contrib_after_tax: 4020,
    years: 35,
    assumed_return: 0.075,
    draw_mode: "interest",
    retire_return: 0.075,
    ssi_annual: 28000
  });

  // Results
  const [results401k, setResults401k] = useState<any>(null);
  const [resultsRoth, setResultsRoth] = useState<any>(null);

  // Load presets
  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    const { data, error } = await supabase
      .from('tax_presets' as any)
      .select('*')
      .eq('is_active', true);
    
    if (!error && data) {
      setPresets(data);
    }
  };

  const applyPreset = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset && preset.inputs) {
      const presetInputs = preset.inputs as any;
      setInputs401k({
        annual_contrib: presetInputs.annual_contrib || 6000,
        years: presetInputs.years || 35,
        pre_tax_rate_now: presetInputs.pre_tax_rate_now || 0.33,
        assumed_return: presetInputs.assumed_return || 0.075,
        draw_mode: presetInputs.draw_mode || "interest",
        retire_return: presetInputs.retire_return || 0.075,
        retire_bracket: presetInputs.retire_bracket || 0.33,
        ssi_annual: presetInputs.ssi_annual || 28000,
        filing_status: presetInputs.filing_status || "mfj"
      });
      
      setInputsRoth({
        annual_contrib_after_tax: presetInputs.annual_contrib_after_tax || 4020,
        years: presetInputs.years || 35,
        assumed_return: presetInputs.assumed_return || 0.075,
        draw_mode: presetInputs.draw_mode || "interest",
        retire_return: presetInputs.retire_return || 0.075,
        ssi_annual: presetInputs.ssi_annual || 28000
      });

      toast({
        title: "Preset Applied",
        description: `Loaded scenario: ${preset.name}`,
      });
    }
  };

  const calculate401k = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('calc-401k', {
        body: inputs401k
      });

      if (error) throw error;
      setResults401k(data.data);
      
      toast({
        title: "Calculation Complete",
        description: "401(k) scenario analyzed successfully",
      });
    } catch (error: any) {
      toast({
        title: "Calculation Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateRoth = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('calc-roth-lirp', {
        body: inputsRoth
      });

      if (error) throw error;
      setResultsRoth(data.data);
      
      toast({
        title: "Calculation Complete",
        description: "Roth/LIRP scenario analyzed successfully",
      });
    } catch (error: any) {
      toast({
        title: "Calculation Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const compareScenarios = () => {
    if (results401k && resultsRoth) {
      sessionStorage.setItem('tax_401k_results', JSON.stringify(results401k));
      sessionStorage.setItem('tax_roth_results', JSON.stringify(resultsRoth));
      sessionStorage.setItem('tax_401k_inputs', JSON.stringify(inputs401k));
      sessionStorage.setItem('tax_roth_inputs', JSON.stringify(inputsRoth));
      navigate('/tax-compare');
    } else {
      toast({
        title: "Run Both Calculations",
        description: "Please calculate both scenarios before comparing",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container-financial section-padding">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-foreground">401(k) vs Roth/LIRP Analyzer</h1>
            <p className="text-muted-foreground mt-2">
              Compare pre-tax and after-tax retirement strategies with SSI impact analysis
            </p>
          </div>
        </div>

        {/* Preset Selector */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-4">
            <Label htmlFor="preset-select">Load Example Scenario:</Label>
            <Select value={selectedPreset} onValueChange={(value) => {
              setSelectedPreset(value);
              applyPreset(value);
            }}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select a preset..." />
              </SelectTrigger>
              <SelectContent>
                {presets.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id}>
                    {preset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="401k">Pre-Tax (401k)</TabsTrigger>
            <TabsTrigger value="roth">After-Tax (Roth/LIRP)</TabsTrigger>
          </TabsList>

          <TabsContent value="401k" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                401(k) Scenario Inputs
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="annual_contrib">Annual Contribution ($)</Label>
                  <Input
                    id="annual_contrib"
                    type="number"
                    value={inputs401k.annual_contrib}
                    onChange={(e) => setInputs401k({...inputs401k, annual_contrib: Number(e.target.value)})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="years">Years to Retirement</Label>
                  <Input
                    id="years"
                    type="number"
                    value={inputs401k.years}
                    onChange={(e) => setInputs401k({...inputs401k, years: Number(e.target.value)})}
                  />
                </div>

                <div>
                  <Label htmlFor="pre_tax_rate">Current Tax Rate (%)</Label>
                  <Input
                    id="pre_tax_rate"
                    type="number"
                    value={inputs401k.pre_tax_rate_now * 100}
                    onChange={(e) => setInputs401k({...inputs401k, pre_tax_rate_now: Number(e.target.value) / 100})}
                  />
                </div>

                <div>
                  <Label htmlFor="assumed_return">Expected Return (%)</Label>
                  <Input
                    id="assumed_return"
                    type="number"
                    step="0.1"
                    value={inputs401k.assumed_return * 100}
                    onChange={(e) => setInputs401k({...inputs401k, assumed_return: Number(e.target.value) / 100})}
                  />
                </div>

                <div>
                  <Label htmlFor="retire_bracket">Retirement Tax Rate (%)</Label>
                  <Input
                    id="retire_bracket"
                    type="number"
                    value={inputs401k.retire_bracket * 100}
                    onChange={(e) => setInputs401k({...inputs401k, retire_bracket: Number(e.target.value) / 100})}
                  />
                </div>

                <div>
                  <Label htmlFor="ssi_annual">Annual Social Security ($)</Label>
                  <Input
                    id="ssi_annual"
                    type="number"
                    value={inputs401k.ssi_annual}
                    onChange={(e) => setInputs401k({...inputs401k, ssi_annual: Number(e.target.value)})}
                  />
                </div>

                <div>
                  <Label htmlFor="draw_mode">Distribution Method</Label>
                  <Select 
                    value={inputs401k.draw_mode} 
                    onValueChange={(value) => setInputs401k({...inputs401k, draw_mode: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="interest">Interest Only</SelectItem>
                      <SelectItem value="swr">Safe Withdrawal Rate</SelectItem>
                      <SelectItem value="fixed_period">Fixed Period</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="filing_status">Filing Status</Label>
                  <Select 
                    value={inputs401k.filing_status} 
                    onValueChange={(value) => setInputs401k({...inputs401k, filing_status: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mfj">Married Filing Jointly</SelectItem>
                      <SelectItem value="single">Single</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={calculate401k} 
                disabled={loading}
                className="mt-6 w-full md:w-auto"
              >
                {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                Calculate 401(k) Scenario
              </Button>
            </Card>

            {results401k && (
              <>
                <div className="grid md:grid-cols-3 gap-4">
                  <TaxKPI
                    label="Balance at Retirement"
                    value={results401k.balance_at_retire}
                    tooltip="Total account value when you retire"
                  />
                  <TaxKPI
                    label="Annual Gross Income"
                    value={results401k.gross_income}
                    tooltip="Income before taxes"
                  />
                  <TaxKPI
                    label="Annual Net Income"
                    value={results401k.net_income}
                    tooltip="Income after all taxes"
                    highlight
                  />
                  <TaxKPI
                    label="Total Annual Tax"
                    value={results401k.total_annual_tax}
                    tooltip="Combined 401(k) + SSI taxes"
                    highlight
                  />
                  <TaxKPI
                    label="SSI Tax Impact"
                    value={results401k.ssi_tax_due}
                    tooltip="Tax on Social Security due to Provisional Income"
                    highlight
                  />
                  <TaxKPI
                    label="Tax Payback Period"
                    value={`${results401k.payback_years.toFixed(1)} years`}
                    tooltip="Years to repay accumulated tax savings"
                  />
                </div>

                <TaxChartCard
                  title="Annual Income Breakdown"
                  subtitle="Comparison of gross income, taxes, and net income"
                  data={[{
                    category: '401(k)',
                    gross: results401k.gross_income,
                    taxes: results401k.total_annual_tax,
                    ssi_tax: results401k.ssi_tax_due,
                    net: results401k.net_income
                  }]}
                  chartType="bar"
                  dataKeys={[
                    { key: 'gross', name: 'Gross Income', color: 'hsl(var(--chart-1))' },
                    { key: 'taxes', name: 'Total Tax', color: 'hsl(var(--chart-2))' },
                    { key: 'ssi_tax', name: 'SSI Tax', color: 'hsl(var(--destructive))' },
                    { key: 'net', name: 'Net Income', color: 'hsl(var(--chart-3))' }
                  ]}
                />

                <TaxExplainer
                  title="Key Insights"
                  bullets={[
                    `Your 401(k) provides $${(inputs401k.annual_contrib * inputs401k.pre_tax_rate_now * inputs401k.years).toLocaleString()} in front-end tax savings over ${inputs401k.years} years.`,
                    `Retirement distributions trigger $${results401k.total_annual_tax.toLocaleString()} in annual taxes.`,
                    `${((results401k.taxable_ssi / inputs401k.ssi_annual) * 100).toFixed(0)}% of your Social Security becomes taxable due to Provisional Income.`,
                    `Your effective tax rate including SSI impact is ${(results401k.effective_rate_incl_ssi * 100).toFixed(1)}%.`,
                    `Over 30 years, you'll pay approximately $${results401k.cum_tax_30.toLocaleString()} in taxes.`
                  ]}
                />
              </>
            )}
          </TabsContent>

          <TabsContent value="roth" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Roth/LIRP Scenario Inputs
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="roth_contrib">Annual After-Tax Contribution ($)</Label>
                  <Input
                    id="roth_contrib"
                    type="number"
                    value={inputsRoth.annual_contrib_after_tax}
                    onChange={(e) => setInputsRoth({...inputsRoth, annual_contrib_after_tax: Number(e.target.value)})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="roth_years">Years to Retirement</Label>
                  <Input
                    id="roth_years"
                    type="number"
                    value={inputsRoth.years}
                    onChange={(e) => setInputsRoth({...inputsRoth, years: Number(e.target.value)})}
                  />
                </div>

                <div>
                  <Label htmlFor="roth_return">Expected Return (%)</Label>
                  <Input
                    id="roth_return"
                    type="number"
                    step="0.1"
                    value={inputsRoth.assumed_return * 100}
                    onChange={(e) => setInputsRoth({...inputsRoth, assumed_return: Number(e.target.value) / 100})}
                  />
                </div>

                <div>
                  <Label htmlFor="roth_ssi">Annual Social Security ($)</Label>
                  <Input
                    id="roth_ssi"
                    type="number"
                    value={inputsRoth.ssi_annual}
                    onChange={(e) => setInputsRoth({...inputsRoth, ssi_annual: Number(e.target.value)})}
                  />
                </div>

                <div>
                  <Label htmlFor="roth_draw_mode">Distribution Method</Label>
                  <Select 
                    value={inputsRoth.draw_mode} 
                    onValueChange={(value) => setInputsRoth({...inputsRoth, draw_mode: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="interest">Interest Only</SelectItem>
                      <SelectItem value="swr">Safe Withdrawal Rate</SelectItem>
                      <SelectItem value="fixed_period">Fixed Period</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={calculateRoth} 
                disabled={loading}
                className="mt-6 w-full md:w-auto"
              >
                {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                Calculate Roth/LIRP Scenario
              </Button>
            </Card>

            {resultsRoth && (
              <>
                <div className="grid md:grid-cols-3 gap-4">
                  <TaxKPI
                    label="Balance at Retirement"
                    value={resultsRoth.balance_at_retire}
                    tooltip="Total account value when you retire"
                  />
                  <TaxKPI
                    label="Annual Tax-Free Income"
                    value={resultsRoth.annual_tax_free_income}
                    tooltip="100% tax-free distributions"
                    highlight
                  />
                  <TaxKPI
                    label="Annual Net Income"
                    value={resultsRoth.net_income}
                    tooltip="Income + full Social Security"
                    highlight
                  />
                  <TaxKPI
                    label="Total Annual Tax"
                    value={0}
                    tooltip="No taxes on Roth/LIRP distributions"
                    trend="up"
                  />
                  <TaxKPI
                    label="Social Security Retained"
                    value={resultsRoth.ssi_retained}
                    tooltip="Full SSI benefit (not taxed)"
                    highlight
                    trend="up"
                  />
                  <TaxKPI
                    label="Lifetime Tax Savings"
                    value={results401k ? results401k.cum_tax_30 : 0}
                    tooltip="vs 401(k) over 30 years"
                    trend="up"
                  />
                </div>

                <TaxExplainer
                  title="Key Advantages"
                  bullets={[
                    `All distributions are 100% tax-free.`,
                    `Your full Social Security benefit of $${resultsRoth.ssi_retained.toLocaleString()} is preserved annually.`,
                    `No Provisional Income impact means 0% of SSI is taxable.`,
                    `No payback period needed - you keep all your income.`,
                    results401k ? `Over 30 years, you save $${results401k.cum_tax_30.toLocaleString()} compared to 401(k).` : ''
                  ].filter(Boolean)}
                />
              </>
            )}
          </TabsContent>
        </Tabs>

        {(results401k || resultsRoth) && (
          <div className="flex gap-4 mt-8">
            <Button 
              onClick={compareScenarios}
              size="lg"
              disabled={!results401k || !resultsRoth}
            >
              Compare Both Scenarios
            </Button>
            <Button 
              variant="outline"
              size="lg"
              onClick={() => navigate('/tax-agent')}
            >
              Talk to AI Agent
            </Button>
          </div>
        )}
      </div>

      <ComplianceFooter />
      <Footer />
    </div>
  );
}
