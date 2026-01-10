import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calculator,
  Shield,
  DollarSign,
  TrendingUp,
  PiggyBank,
} from 'lucide-react';
import type { ScenarioComparison } from '@/types/retirement';

interface AssumptionsModalProps {
  open: boolean;
  onClose: () => void;
  comparison: ScenarioComparison;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatPercent = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};

export function AssumptionsModal({ open, onClose, comparison }: AssumptionsModalProps) {
  const { scenario_a, scenario_b, calculation_inputs, annuity_eligibility, iul_eligibility } = comparison;
  
  // Default inputs if not provided
  const inputs = calculation_inputs || {
    return_rate: 0.06,
    inflation_rate: 0.03,
    marginal_tax_rate: 0.22,
    withdrawal_rate: 0.04,
    life_expectancy: 95,
    rmd_start_age: 73,
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            How These Numbers Were Calculated
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Accordion type="multiple" defaultValue={['assumptions', 'eligibility']}>
            {/* Section 1: Key Assumptions */}
            <AccordionItem value="assumptions">
              <AccordionTrigger className="text-sm font-semibold">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Key Assumptions Used
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Card className="bg-muted/30">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-muted-foreground">Annual Return (Portfolio)</span>
                        <Badge variant="outline">{formatPercent(inputs.return_rate)}</Badge>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-muted-foreground">Inflation Rate</span>
                        <Badge variant="outline">{formatPercent(inputs.inflation_rate)}</Badge>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-muted-foreground">Marginal Tax Rate</span>
                        <Badge variant="outline">{formatPercent(inputs.marginal_tax_rate)}</Badge>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-muted-foreground">Withdrawal Rate</span>
                        <Badge variant="outline">{formatPercent(inputs.withdrawal_rate)}</Badge>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-muted-foreground">Life Expectancy</span>
                        <Badge variant="outline">Age {inputs.life_expectancy}</Badge>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-muted-foreground">RMD Start Age</span>
                        <Badge variant="outline">Age {inputs.rmd_start_age}</Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">
                      These are conservative industry-standard assumptions. Actual results will vary based on market conditions and individual circumstances.
                    </p>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>

            {/* Section 2: Guaranteed Income Eligibility */}
            <AccordionItem value="eligibility">
              <AccordionTrigger className="text-sm font-semibold">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-purple-600" />
                  Guaranteed Income Eligibility
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  {annuity_eligibility ? (
                    <Card className={annuity_eligibility.is_eligible ? 'border-green-200 bg-green-50/30' : 'border-yellow-200 bg-yellow-50/30'}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          {annuity_eligibility.is_eligible ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-yellow-600" />
                          )}
                          {annuity_eligibility.is_eligible ? 'Included in Optimization' : 'Not Included'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm">
                        <div className="space-y-3">
                          {/* Eligibility Criteria Checklist */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              {annuity_eligibility.prefers_guaranteed ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span>Prefers guaranteed income</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {annuity_eligibility.has_income_gap ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span>Income gap &gt; 15%: {annuity_eligibility.income_gap_percent.toFixed(0)}% gap</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {annuity_eligibility.near_retirement ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span>Near retirement (within 10 years): {annuity_eligibility.years_to_retirement} years away</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {annuity_eligibility.sequence_risk_high ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span>High sequence risk concern</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {annuity_eligibility.guaranteed_coverage_ratio < 0.7 ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span>Guaranteed coverage ratio: {(annuity_eligibility.guaranteed_coverage_ratio * 100).toFixed(0)}% (needs &lt; 70%)</span>
                            </div>
                            
                            <Separator className="my-3" />
                            
                            {/* Minimum Asset Requirement */}
                            <div className="flex items-center gap-2">
                              {annuity_eligibility.has_minimum_assets ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                              )}
                              <span className={!annuity_eligibility.has_minimum_assets ? 'font-semibold text-yellow-700' : ''}>
                                Minimum Asset Threshold ({formatCurrency(annuity_eligibility.minimum_required)}): 
                                {' '}{annuity_eligibility.has_minimum_assets ? 'MET' : 'NOT MET'}
                              </span>
                            </div>
                            
                            <div className="text-xs text-muted-foreground ml-6">
                              Your projected portfolio: {formatCurrency(annuity_eligibility.actual_portfolio)}
                            </div>
                          </div>
                          
                          {/* Exclusion Reason */}
                          {annuity_eligibility.exclusion_reason && (
                            <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                                <strong>Why not included:</strong> {annuity_eligibility.exclusion_reason}
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="bg-muted/30">
                      <CardContent className="pt-4 text-center text-muted-foreground">
                        <p>Eligibility details not available for this comparison.</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* IUL Eligibility */}
                  {iul_eligibility && (
                    <Card className={iul_eligibility.is_eligible ? 'border-blue-200 bg-blue-50/30' : 'border-muted'}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          {iul_eligibility.is_eligible ? (
                            <CheckCircle className="h-4 w-4 text-blue-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                          Tax-Free Income (IUL) Eligibility
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {iul_eligibility.tax_deferred_pct > 60 ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span>Tax-deferred assets &gt; 60%: {iul_eligibility.tax_deferred_pct.toFixed(0)}%</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {iul_eligibility.tax_free_pct < 20 ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span>Tax-free assets &lt; 20%: {iul_eligibility.tax_free_pct.toFixed(0)}%</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {iul_eligibility.high_tax_bracket ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span>High tax bracket</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {iul_eligibility.wants_tax_free ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span>Prefers tax-free income</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {iul_eligibility.has_legacy_priority ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span>Legacy priority</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {iul_eligibility.has_protection_gap ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span>Protection gap exists</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Footer Disclaimer */}
          <p className="text-xs text-muted-foreground text-center pt-2 border-t">
            These calculations are for educational purposes only and do not constitute financial advice. 
            Consult with a qualified professional before making financial decisions.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
