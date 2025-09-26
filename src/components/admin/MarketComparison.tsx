import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { TrendingUp, TrendingDown, DollarSign, Percent, BarChart3, PieChart, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MarketComparison as IMarketComparison, InvestmentResults } from '@/types/iul';

interface ComparisonSettings {
  initialInvestment: number;
  monthlyContribution: number;
  timeHorizon: number;
  marketAllocation: {
    stocks: number;
    bonds: number;
    cash: number;
  };
  taxRate: number;
  inflationRate: number;
  includeFeesInIUL: boolean;
  includeFeesInMarket: boolean;
}

export const MarketComparison = () => {
  const [selectedIllustration, setSelectedIllustration] = useState('');
  const [illustrations, setIllustrations] = useState<any[]>([]);
  const [settings, setSettings] = useState<ComparisonSettings>({
    initialInvestment: 100000,
    monthlyContribution: 1000,
    timeHorizon: 30,
    marketAllocation: {
      stocks: 70,
      bonds: 25,
      cash: 5
    },
    taxRate: 25,
    inflationRate: 3,
    includeFeesInIUL: true,
    includeFeesInMarket: true
  });
  const [comparison, setComparison] = useState<IMarketComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch available illustrations
  const fetchIllustrations = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('iul_illustrations')
      .select('id, file_name, carrier_name, processing_status')
      .eq('user_id', user.id)
      .eq('processing_status', 'completed')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching illustrations:', error);
      return;
    }

    setIllustrations(data || []);
  };

  // Run comparison analysis
  const runComparison = async () => {
    if (!selectedIllustration) return;

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('market-comparison', {
        body: {
          illustrationId: selectedIllustration,
          settings
        }
      });

      if (error) throw error;

      setComparison(data.comparison);
      
      toast({
        title: "Comparison completed",
        description: "Market vs IUL analysis is ready.",
      });
    } catch (error) {
      console.error('Error running comparison:', error);
      toast({
        title: "Comparison failed",
        description: "Failed to run the comparison analysis. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIllustrations();
  }, [user]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getPerformanceColor = (value: number, reference: number) => {
    if (value > reference) return 'text-green-600';
    if (value < reference) return 'text-red-600';
    return 'text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      {/* Illustration Selection */}
      <div className="space-y-2">
        <Label>Select Processed Illustration</Label>
        <Select value={selectedIllustration} onValueChange={setSelectedIllustration}>
          <SelectTrigger>
            <SelectValue placeholder="Choose an illustration to compare" />
          </SelectTrigger>
          <SelectContent>
            {illustrations.map((illustration) => (
              <SelectItem key={illustration.id} value={illustration.id}>
                <div className="flex items-center gap-2">
                  <span>{illustration.file_name}</span>
                  {illustration.carrier_name && (
                    <Badge variant="outline">{illustration.carrier_name}</Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="settings">Comparison Settings</TabsTrigger>
          <TabsTrigger value="results">Performance Analysis</TabsTrigger>
          <TabsTrigger value="charts">Visual Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Investment Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>Initial Investment</Label>
                  <Input
                    type="number"
                    value={settings.initialInvestment}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      initialInvestment: parseInt(e.target.value) || 0
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Monthly Contribution</Label>
                  <Input
                    type="number"
                    value={settings.monthlyContribution}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      monthlyContribution: parseInt(e.target.value) || 0
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time Horizon (Years)</Label>
                  <Input
                    type="number"
                    value={settings.timeHorizon}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      timeHorizon: parseInt(e.target.value) || 0
                    }))}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Market Portfolio Allocation</h4>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Stocks (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={settings.marketAllocation.stocks}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        marketAllocation: {
                          ...prev.marketAllocation,
                          stocks: parseInt(e.target.value) || 0
                        }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bonds (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={settings.marketAllocation.bonds}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        marketAllocation: {
                          ...prev.marketAllocation,
                          bonds: parseInt(e.target.value) || 0
                        }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cash (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={settings.marketAllocation.cash}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        marketAllocation: {
                          ...prev.marketAllocation,
                          cash: parseInt(e.target.value) || 0
                        }
                      }))}
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Total: {settings.marketAllocation.stocks + settings.marketAllocation.bonds + settings.marketAllocation.cash}%
                </p>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tax Rate (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="50"
                    step="0.1"
                    value={settings.taxRate}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      taxRate: parseFloat(e.target.value) || 0
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Inflation Rate (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={settings.inflationRate}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      inflationRate: parseFloat(e.target.value) || 0
                    }))}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Fee Considerations</h4>
                <div className="flex items-center justify-between">
                  <Label htmlFor="iul-fees">Include IUL Fees & Charges</Label>
                  <Switch
                    id="iul-fees"
                    checked={settings.includeFeesInIUL}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      includeFeesInIUL: checked
                    }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="market-fees">Include Market Investment Fees</Label>
                  <Switch
                    id="market-fees"
                    checked={settings.includeFeesInMarket}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      includeFeesInMarket: checked
                    }))}
                  />
                </div>
              </div>

              <Button 
                onClick={runComparison} 
                disabled={loading || !selectedIllustration}
                className="w-full"
              >
                {loading ? 'Running Comparison...' : 'Run Market Comparison'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {comparison ? (
            <>
              {/* Summary Metrics */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-center">IUL Strategy</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center space-y-2">
                    <p className="text-2xl font-bold">{formatCurrency(comparison.iul.finalValue)}</p>
                    <p className="text-sm text-muted-foreground">Final Value</p>
                    <div className="flex justify-center items-center gap-2">
                      <Badge variant="secondary">{formatPercent(comparison.iul.annualizedReturn)}</Badge>
                      <span className="text-xs text-muted-foreground">Annual Return</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-center">Market Only</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center space-y-2">
                    <p className="text-2xl font-bold">{formatCurrency(comparison.marketOnly.finalValue)}</p>
                    <p className="text-sm text-muted-foreground">Final Value</p>
                    <div className="flex justify-center items-center gap-2">
                      <Badge variant="secondary">{formatPercent(comparison.marketOnly.annualizedReturn)}</Badge>
                      <span className="text-xs text-muted-foreground">Annual Return</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-center">Hybrid Approach</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center space-y-2">
                    <p className="text-2xl font-bold">{formatCurrency(comparison.hybrid.finalValue)}</p>
                    <p className="text-sm text-muted-foreground">Final Value</p>
                    <div className="flex justify-center items-center gap-2">
                      <Badge variant="secondary">{formatPercent(comparison.hybrid.annualizedReturn)}</Badge>
                      <span className="text-xs text-muted-foreground">Annual Return</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Detailed Performance Metrics
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export Report
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Metric</th>
                          <th className="text-center py-2">IUL Strategy</th>
                          <th className="text-center py-2">Market Only</th>
                          <th className="text-center py-2">Hybrid</th>
                        </tr>
                      </thead>
                      <tbody className="space-y-2">
                        <tr className="border-b">
                          <td className="py-2 font-medium">Total Return</td>
                          <td className="text-center">{formatPercent(comparison.iul.totalReturn)}</td>
                          <td className="text-center">{formatPercent(comparison.marketOnly.totalReturn)}</td>
                          <td className="text-center">{formatPercent(comparison.hybrid.totalReturn)}</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 font-medium">Volatility</td>
                          <td className="text-center">{formatPercent(comparison.iul.volatility)}</td>
                          <td className="text-center">{formatPercent(comparison.marketOnly.volatility)}</td>
                          <td className="text-center">{formatPercent(comparison.hybrid.volatility)}</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 font-medium">Max Drawdown</td>
                          <td className="text-center text-red-600">{formatPercent(comparison.iul.maximumDrawdown)}</td>
                          <td className="text-center text-red-600">{formatPercent(comparison.marketOnly.maximumDrawdown)}</td>
                          <td className="text-center text-red-600">{formatPercent(comparison.hybrid.maximumDrawdown)}</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 font-medium">Sharpe Ratio</td>
                          <td className="text-center">{comparison.iul.sharpeRatio.toFixed(2)}</td>
                          <td className="text-center">{comparison.marketOnly.sharpeRatio.toFixed(2)}</td>
                          <td className="text-center">{comparison.hybrid.sharpeRatio.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-medium">Tax Efficiency</td>
                          <td className="text-center">{formatPercent(comparison.iul.taxEfficiency)}</td>
                          <td className="text-center">{formatPercent(comparison.marketOnly.taxEfficiency)}</td>
                          <td className="text-center">{formatPercent(comparison.hybrid.taxEfficiency)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Risk-Return Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>Risk-Return Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <h4 className="font-medium text-green-600">Advantages of IUL</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          Tax-free growth and distributions
                        </li>
                        <li className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          Downside protection with floor rates
                        </li>
                        <li className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          Death benefit protection
                        </li>
                        <li className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          No contribution limits
                        </li>
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium text-orange-600">Market Investment Advantages</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-orange-600" />
                          Unlimited upside potential
                        </li>
                        <li className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-orange-600" />
                          Lower fees and expenses
                        </li>
                        <li className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-orange-600" />
                          Greater liquidity
                        </li>
                        <li className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-orange-600" />
                          Transparency and control
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                  <p>Configure settings and run comparison to see detailed analysis</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="charts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Visual Performance Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              {comparison ? (
                <div className="space-y-6">
                  <p className="text-sm text-muted-foreground">
                    Interactive charts showing growth patterns, risk metrics, and tax efficiency over time.
                  </p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
                      <p className="text-muted-foreground">Growth Comparison Chart</p>
                    </div>
                    <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
                      <p className="text-muted-foreground">Risk-Return Scatter Plot</p>
                    </div>
                    <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
                      <p className="text-muted-foreground">Tax Efficiency Analysis</p>
                    </div>
                    <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
                      <p className="text-muted-foreground">Drawdown Comparison</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <PieChart className="h-12 w-12 mx-auto mb-4" />
                  <p>Run a comparison analysis to generate interactive charts</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};