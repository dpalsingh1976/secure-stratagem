import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Wallet, 
  RefreshCw, 
  TrendingUp, 
  Shield, 
  Heart,
  Clock,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Info,
  BarChart3
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { OtherAssetType } from '@/types/retirement';

export interface AllocationSources {
  idle_checking_cash: number;
  old_401k_rollover: number;
  monthly_savings_capacity: number;
  total_available_for_allocation: number;
  suggested_iul_allocation: number;
  suggested_annuity_allocation: number;
}

interface AllocationInputCardProps {
  allocationSources: AllocationSources;
  protectionGap: number;
  incomeGapMonthly: number;
  onIULAllocationChange: (amount: number) => void;
  onAnnuityAllocationChange: (amount: number) => void;
  onOtherAssetTypeChange: (type: OtherAssetType) => void;
  iulAllocation: number;
  annuityAllocation: number;
  otherAssetType: OtherAssetType;
  iulEligible: boolean;
  annuityEligible: boolean;
  iulExclusionReason?: string;
  annuityExclusionReason?: string;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export function AllocationInputCard({
  allocationSources,
  protectionGap,
  incomeGapMonthly,
  onIULAllocationChange,
  onAnnuityAllocationChange,
  onOtherAssetTypeChange,
  iulAllocation,
  annuityAllocation,
  otherAssetType,
  iulEligible,
  annuityEligible,
  iulExclusionReason,
  annuityExclusionReason
}: AllocationInputCardProps) {
  const totalAllocated = iulAllocation + annuityAllocation;
  const remainingToAllocate = allocationSources.total_available_for_allocation - totalAllocated;
  const isOverAllocated = remainingToAllocate < 0;

  return (
    <TooltipProvider>
      <Card className="w-full border-2 border-primary/20">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wallet className="h-5 w-5 text-primary" />
            Available Allocation Sources
          </CardTitle>
          <CardDescription>
            These funds may be redirected to optimize your retirement strategy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Allocation Sources Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Idle Checking Cash</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(allocationSources.idle_checking_cash)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                After expenses & investments
              </p>
            </div>

            <div className="p-4 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Old 401(k) Rollover</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(allocationSources.old_401k_rollover)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Available for optimization
              </p>
            </div>

            <div className="p-4 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Monthly Capacity</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(allocationSources.monthly_savings_capacity)}/mo
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Ongoing contribution potential
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between">
              <span className="font-medium">Total Available for New Allocations:</span>
              <span className="text-xl font-bold text-primary">
                {formatCurrency(allocationSources.total_available_for_allocation)}
              </span>
            </div>
          </div>

          <Separator />

          {/* Two Risks Framework */}
          <div>
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Two Risks to Solve
            </h4>
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* Risk 1: Dying Too Soon */}
              <div className="p-4 rounded-lg border-l-4 border-red-500 bg-red-50 dark:bg-red-950/20">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="h-4 w-4 text-red-600" />
                  <h5 className="font-semibold text-red-900 dark:text-red-400">Risk of Dying Too Soon</h5>
                </div>
                <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                  If something happens to you, your family needs protection
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-red-700 dark:text-red-300">Protection Gap:</span>
                    <span className="font-semibold text-red-800 dark:text-red-200">
                      {formatCurrency(protectionGap)}
                    </span>
                  </div>
                </div>
                {protectionGap > 0 && (
                  <p className="mt-3 text-xs bg-white/50 dark:bg-white/10 p-2 rounded">
                    💡 <strong>Solution:</strong> IUL provides tax-free death benefit plus living benefits through cash value
                  </p>
                )}
              </div>

              {/* Risk 2: Living Too Long */}
              <div className="p-4 rounded-lg border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <h5 className="font-semibold text-amber-900 dark:text-amber-400">Risk of Living Too Long</h5>
                </div>
                <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                  Running out of money before running out of life
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-amber-700 dark:text-amber-300">Monthly Income Gap:</span>
                    <span className="font-semibold text-amber-800 dark:text-amber-200">
                      {formatCurrency(incomeGapMonthly)}
                    </span>
                  </div>
                </div>
                {incomeGapMonthly > 0 && (
                  <p className="mt-3 text-xs bg-white/50 dark:bg-white/10 p-2 rounded">
                    💡 <strong>Solution:</strong> Guaranteed Income Strategy provides lifetime income you cannot outlive
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Allocation Inputs */}
          <div>
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              ✏️ Your Allocation Preferences
            </h4>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* IUL Allocation */}
              <div className={`p-4 rounded-lg border ${iulEligible ? 'border-blue-200 bg-blue-50/50 dark:bg-blue-950/20' : 'border-muted bg-muted/30'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <Label className="font-medium">Tax-Free Growth (IUL)</Label>
                  </div>
                  {iulEligible ? (
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Eligible
                    </Badge>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="bg-muted text-muted-foreground cursor-help">
                          <Info className="h-3 w-3 mr-1" />
                          Not Recommended
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>{iulExclusionReason || 'Does not meet suitability criteria'}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Annual Premium</Label>
                  <Input
                    type="number"
                    value={iulAllocation || ''}
                    onChange={(e) => onIULAllocationChange(parseFloat(e.target.value) || 0)}
                    placeholder={iulEligible ? formatCurrency(allocationSources.suggested_iul_allocation) : '0'}
                    disabled={!iulEligible}
                    className="text-lg"
                  />
                  <p className="text-xs text-muted-foreground">
                    Source: Idle checking cash / ongoing contributions
                  </p>
                </div>
                
                {iulEligible && allocationSources.suggested_iul_allocation > 0 && (
                  <p className="mt-2 text-xs text-blue-700 dark:text-blue-300">
                    Suggested: {formatCurrency(allocationSources.suggested_iul_allocation)}/year based on protection gap
                  </p>
                )}
              </div>

              {/* Annuity Allocation */}
              <div className={`p-4 rounded-lg border ${annuityEligible ? 'border-purple-200 bg-purple-50/50 dark:bg-purple-950/20' : 'border-muted bg-muted/30'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-purple-600" />
                    <Label className="font-medium">Guaranteed Income (FIA)</Label>
                  </div>
                  {annuityEligible ? (
                    <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Eligible
                    </Badge>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="bg-muted text-muted-foreground cursor-help">
                          <Info className="h-3 w-3 mr-1" />
                          Not Recommended
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>{annuityExclusionReason || 'Does not meet suitability criteria'}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">One-Time Premium</Label>
                  <Input
                    type="number"
                    value={annuityAllocation || ''}
                    onChange={(e) => onAnnuityAllocationChange(parseFloat(e.target.value) || 0)}
                    placeholder={annuityEligible ? formatCurrency(allocationSources.suggested_annuity_allocation) : '0'}
                    disabled={!annuityEligible}
                    className="text-lg"
                  />
                  <p className="text-xs text-muted-foreground">
                    Source: Old 401(k) rollover / lump sum
                  </p>
                </div>
                
                {annuityEligible && allocationSources.suggested_annuity_allocation > 0 && (
                  <p className="mt-2 text-xs text-purple-700 dark:text-purple-300">
                    Suggested: {formatCurrency(allocationSources.suggested_annuity_allocation)} based on income gap
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Alternative Investment Comparison */}
          <div>
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Compare Against Traditional Investment
            </h4>
            
            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <Label className="font-medium">What if I invested the same amount in...</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    See a third comparison column showing traditional investment outcomes
                  </p>
                </div>
              </div>
              
              <Select
                value={otherAssetType}
                onValueChange={(value) => onOtherAssetTypeChange(value as OtherAssetType)}
              >
                <SelectTrigger className="w-full md:w-[280px]">
                  <SelectValue placeholder="Select asset type to compare" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Don't show alternative</SelectItem>
                  <SelectItem value="stocks">Stock Index Fund (7% avg return)</SelectItem>
                  <SelectItem value="balanced">60/40 Balanced Fund (5.5% avg return)</SelectItem>
                  <SelectItem value="bonds">Bond Fund (3.5% avg return)</SelectItem>
                </SelectContent>
              </Select>
              
              {otherAssetType !== 'none' && totalAllocated > 0 && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Comparing {formatCurrency(totalAllocated)} allocated to IUL/FIA vs same amount in {
                    otherAssetType === 'stocks' ? 'Stock Index Fund' :
                    otherAssetType === 'balanced' ? '60/40 Balanced Fund' : 'Bond Fund'
                  }
                </p>
              )}
            </div>
          </div>

          {/* Allocation Summary */}
          <div className={`p-4 rounded-lg border ${isOverAllocated ? 'border-red-300 bg-red-50 dark:bg-red-950/20' : 'border-green-300 bg-green-50 dark:bg-green-950/20'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isOverAllocated ? (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
                <span className="font-medium">
                  {isOverAllocated ? 'Over-Allocated' : 'Allocation Summary'}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  Total Allocated: {formatCurrency(totalAllocated)}
                </p>
                <p className={`font-semibold ${isOverAllocated ? 'text-red-600' : 'text-green-600'}`}>
                  Remaining: {formatCurrency(Math.abs(remainingToAllocate))} {isOverAllocated && '(over)'}
                </p>
              </div>
            </div>
            {isOverAllocated && (
              <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                ⚠️ Your allocations exceed available sources. Please reduce one or both amounts.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
