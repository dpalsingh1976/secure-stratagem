import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, TrendingDown, Zap, DollarSign, Clock, Play, Save, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { StressTestScenario, ScenarioParameters, StressTestResults, DbStressTestScenario, mapDbToStressTestScenario } from '@/types/iul';

const predefinedScenarios: Partial<StressTestScenario>[] = [
  {
    name: "Market Crash 2008",
    description: "Simulate 2008-style market crash with 40% decline and 5-year recovery",
    parameters: {
      marketCrashSimulation: {
        crashYear: 5,
        recoveryYears: 5,
        crashSeverity: 40
      }
    }
  },
  {
    name: "Rising Interest Rates",
    description: "Interest rate shock with 3% increase affecting crediting rates",
    parameters: {
      interestRateShock: {
        startYear: 3,
        rateIncrease: 3
      }
    }
  },
  {
    name: "Premium Reduction",
    description: "Client reduces premium by 50% starting year 10",
    parameters: {
      premiumReduction: {
        startYear: 10,
        reductionPercentage: 50
      }
    }
  },
  {
    name: "COI Increase",
    description: "Cost of insurance increases by 25% across all years",
    parameters: {
      coiIncrease: {
        startYear: 1,
        increasePercentage: 25
      }
    }
  },
  {
    name: "Longevity Extension",
    description: "Client lives 10 years longer than expected",
    parameters: {
      longevityExtension: {
        additionalYears: 10
      }
    }
  }
];

export const StressTesting = () => {
  const [selectedIllustration, setSelectedIllustration] = useState('');
  const [illustrations, setIllustrations] = useState<any[]>([]);
  const [scenarios, setScenarios] = useState<StressTestScenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<Partial<StressTestScenario> | null>(null);
  const [customParams, setCustomParams] = useState<ScenarioParameters>({});
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<StressTestResults | null>(null);
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

  // Fetch saved scenarios
  const fetchScenarios = async (illustrationId: string) => {
    if (!user || !illustrationId) return;

    const { data, error } = await supabase
      .from('stress_test_scenarios')
      .select('*')
      .eq('user_id', user.id)
      .eq('illustration_id', illustrationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching scenarios:', error);
      return;
    }

    setScenarios((data as DbStressTestScenario[] || []).map(mapDbToStressTestScenario));
  };

  // Run stress test
  const runStressTest = async () => {
    if (!selectedIllustration || !selectedScenario) return;

    setIsRunning(true);
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const { data, error } = await supabase.functions.invoke('run-stress-test', {
        body: {
          illustrationId: selectedIllustration,
          scenarioName: selectedScenario.name,
          parameters: { ...selectedScenario.parameters, ...customParams }
        }
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (error) throw error;

      setResults(data.results);
      
      toast({
        title: "Stress test completed",
        description: `${selectedScenario.name} scenario analysis is ready.`,
      });

      // Refresh scenarios list
      await fetchScenarios(selectedIllustration);
    } catch (error) {
      console.error('Error running stress test:', error);
      toast({
        title: "Stress test failed",
        description: "Failed to run the stress test. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
      setProgress(0);
    }
  };

  // Save custom scenario
  const saveScenario = async () => {
    if (!selectedIllustration || !selectedScenario?.name) return;

    try {
      const { error } = await supabase
        .from('stress_test_scenarios')
        .insert({
          illustration_id: selectedIllustration,
          user_id: user?.id,
          scenario_name: selectedScenario.name,
          parameters: { ...selectedScenario.parameters, ...customParams },
          results: results || {}
        });

      if (error) throw error;

      toast({
        title: "Scenario saved",
        description: "Your custom stress test scenario has been saved.",
      });

      await fetchScenarios(selectedIllustration);
    } catch (error) {
      console.error('Error saving scenario:', error);
      toast({
        title: "Save failed",
        description: "Failed to save the scenario.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchIllustrations();
  }, [user]);

  useEffect(() => {
    if (selectedIllustration) {
      fetchScenarios(selectedIllustration);
      setResults(null);
    }
  }, [selectedIllustration]);

  const getRiskLevel = (value: number): { level: string; color: string } => {
    if (value >= 80) return { level: 'Critical', color: 'text-red-600' };
    if (value >= 60) return { level: 'High', color: 'text-orange-600' };
    if (value >= 40) return { level: 'Medium', color: 'text-yellow-600' };
    return { level: 'Low', color: 'text-green-600' };
  };

  return (
    <div className="space-y-6">
      {/* Illustration Selection */}
      <div className="space-y-2">
        <Label>Select Processed Illustration</Label>
        <Select value={selectedIllustration} onValueChange={setSelectedIllustration}>
          <SelectTrigger>
            <SelectValue placeholder="Choose an illustration to stress test" />
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

      {selectedIllustration && (
        <Tabs defaultValue="scenarios" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="scenarios">Stress Scenarios</TabsTrigger>
            <TabsTrigger value="results">Test Results</TabsTrigger>
            <TabsTrigger value="comparison">Risk Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="scenarios" className="space-y-6">
            {/* Predefined Scenarios */}
            <Card>
              <CardHeader>
                <CardTitle>Predefined Stress Test Scenarios</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {predefinedScenarios.map((scenario, index) => (
                    <Card 
                      key={index} 
                      className={`cursor-pointer transition-colors ${
                        selectedScenario?.name === scenario.name 
                          ? 'border-primary bg-primary/5' 
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedScenario(scenario)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">{scenario.name}</CardTitle>
                          {scenario.name?.includes('Crash') && <TrendingDown className="h-4 w-4 text-red-500" />}
                          {scenario.name?.includes('Rate') && <Zap className="h-4 w-4 text-yellow-500" />}
                          {scenario.name?.includes('Premium') && <DollarSign className="h-4 w-4 text-blue-500" />}
                          {scenario.name?.includes('COI') && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                          {scenario.name?.includes('Longevity') && <Clock className="h-4 w-4 text-purple-500" />}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-xs text-muted-foreground">{scenario.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Custom Parameters */}
            {selectedScenario && (
              <Card>
                <CardHeader>
                  <CardTitle>Customize Parameters: {selectedScenario.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {selectedScenario.parameters?.premiumReduction && (
                      <>
                        <div className="space-y-2">
                          <Label>Premium Reduction Start Year</Label>
                          <Input
                            type="number"
                            placeholder="10"
                            value={customParams.premiumReduction?.startYear || ''}
                            onChange={(e) => setCustomParams(prev => ({
                              ...prev,
                              premiumReduction: {
                                ...prev.premiumReduction,
                                startYear: parseInt(e.target.value) || 0,
                                reductionPercentage: prev.premiumReduction?.reductionPercentage || 50
                              }
                            }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Reduction Percentage (%)</Label>
                          <Input
                            type="number"
                            placeholder="50"
                            value={customParams.premiumReduction?.reductionPercentage || ''}
                            onChange={(e) => setCustomParams(prev => ({
                              ...prev,
                              premiumReduction: {
                                ...prev.premiumReduction,
                                startYear: prev.premiumReduction?.startYear || 10,
                                reductionPercentage: parseInt(e.target.value) || 0
                              }
                            }))}
                          />
                        </div>
                      </>
                    )}

                    {selectedScenario.parameters?.creditingRateChange && (
                      <>
                        <div className="space-y-2">
                          <Label>Rate Change Start Year</Label>
                          <Input
                            type="number"
                            placeholder="5"
                            value={customParams.creditingRateChange?.startYear || ''}
                            onChange={(e) => setCustomParams(prev => ({
                              ...prev,
                              creditingRateChange: {
                                ...prev.creditingRateChange,
                                startYear: parseInt(e.target.value) || 0,
                                newRate: prev.creditingRateChange?.newRate || 4
                              }
                            }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>New Crediting Rate (%)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="4.0"
                            value={customParams.creditingRateChange?.newRate || ''}
                            onChange={(e) => setCustomParams(prev => ({
                              ...prev,
                              creditingRateChange: {
                                ...prev.creditingRateChange,
                                startYear: prev.creditingRateChange?.startYear || 5,
                                newRate: parseFloat(e.target.value) || 0
                              }
                            }))}
                          />
                        </div>
                      </>
                    )}

                    {selectedScenario.parameters?.marketCrashSimulation && (
                      <>
                        <div className="space-y-2">
                          <Label>Crash Year</Label>
                          <Input
                            type="number"
                            placeholder="5"
                            value={customParams.marketCrashSimulation?.crashYear || ''}
                            onChange={(e) => setCustomParams(prev => ({
                              ...prev,
                              marketCrashSimulation: {
                                ...prev.marketCrashSimulation,
                                crashYear: parseInt(e.target.value) || 0,
                                recoveryYears: prev.marketCrashSimulation?.recoveryYears || 5,
                                crashSeverity: prev.marketCrashSimulation?.crashSeverity || 40
                              }
                            }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Recovery Period (Years)</Label>
                          <Input
                            type="number"
                            placeholder="5"
                            value={customParams.marketCrashSimulation?.recoveryYears || ''}
                            onChange={(e) => setCustomParams(prev => ({
                              ...prev,
                              marketCrashSimulation: {
                                ...prev.marketCrashSimulation,
                                crashYear: prev.marketCrashSimulation?.crashYear || 5,
                                recoveryYears: parseInt(e.target.value) || 0,
                                crashSeverity: prev.marketCrashSimulation?.crashSeverity || 40
                              }
                            }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Crash Severity (%)</Label>
                          <Input
                            type="number"
                            placeholder="40"
                            value={customParams.marketCrashSimulation?.crashSeverity || ''}
                            onChange={(e) => setCustomParams(prev => ({
                              ...prev,
                              marketCrashSimulation: {
                                ...prev.marketCrashSimulation,
                                crashYear: prev.marketCrashSimulation?.crashYear || 5,
                                recoveryYears: prev.marketCrashSimulation?.recoveryYears || 5,
                                crashSeverity: parseInt(e.target.value) || 0
                              }
                            }))}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <Separator />

                  <div className="flex gap-2">
                    <Button 
                      onClick={runStressTest} 
                      disabled={isRunning}
                      className="flex items-center gap-2"
                    >
                      <Play className="h-4 w-4" />
                      {isRunning ? 'Running Test...' : 'Run Stress Test'}
                    </Button>
                    <Button variant="outline" onClick={saveScenario}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Scenario
                    </Button>
                  </div>

                  {isRunning && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Running stress test...</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="w-full" />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Saved Scenarios */}
            {scenarios.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Saved Scenarios</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {scenarios.map((scenario) => (
                      <div key={scenario.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{scenario.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Saved scenario
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedScenario({
                                name: scenario.name,
                                parameters: scenario.parameters
                              });
                              setResults(scenario.results);
                            }}
                          >
                            Load
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            {results ? (
              <>
                {/* Key Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Stress Test Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold">${results.finalCashValue.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Final Cash Value</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{results.averageIRR.toFixed(2)}%</p>
                        <p className="text-sm text-muted-foreground">Average IRR</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">
                          {results.lapseYear ? `Year ${results.lapseYear}` : 'No Lapse'}
                        </p>
                        <p className="text-sm text-muted-foreground">Policy Lapse</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">${results.totalPremiumsPaid.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Total Premiums</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Risk Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Risk Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span>Lapse Risk</span>
                          <div className="flex items-center gap-2">
                            <span className={getRiskLevel(results.riskMetrics.lapseRisk).color}>
                              {getRiskLevel(results.riskMetrics.lapseRisk).level}
                            </span>
                            <Badge variant="outline">{results.riskMetrics.lapseRisk}%</Badge>
                          </div>
                        </div>
                        <Progress value={results.riskMetrics.lapseRisk} className="w-full" />
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span>Volatility Score</span>
                          <div className="flex items-center gap-2">
                            <span className={getRiskLevel(results.riskMetrics.volatilityScore).color}>
                              {getRiskLevel(results.riskMetrics.volatilityScore).level}
                            </span>
                            <Badge variant="outline">{results.riskMetrics.volatilityScore}%</Badge>
                          </div>
                        </div>
                        <Progress value={results.riskMetrics.volatilityScore} className="w-full" />
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span>Maximum Drawdown</span>
                          <Badge variant="outline">{results.riskMetrics.maximumDrawdown}%</Badge>
                        </div>
                        <Progress value={results.riskMetrics.maximumDrawdown} className="w-full" />
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span>Recovery Time</span>
                          <Badge variant="outline">{results.riskMetrics.recoveryTimeYears} years</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground">
                    <TrendingDown className="h-12 w-12 mx-auto mb-4" />
                    <p>Run a stress test to see detailed results here</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="comparison">
            <Card>
              <CardHeader>
                <CardTitle>Scenario Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
                  <p>Compare multiple stress test scenarios side by side</p>
                  <p className="text-sm mt-2">Run multiple scenarios to enable comparison view</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};