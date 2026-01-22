import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, DollarSign, TrendingUp, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ASSET_TYPE_CONFIG, TAX_WRAPPER_CONFIG } from '@/types/financial';
import type { AssetFormData, AssetType, TaxWrapperType, IncomeExpensesData } from '@/types/financial';

interface AssetsFormProps {
  data: AssetFormData[];
  onChange: (data: AssetFormData[]) => void;
  clientId: string | null;
  onValidationChange: (isValid: boolean) => void;
  incomeData?: IncomeExpensesData;
  onIncomeChange?: (data: IncomeExpensesData) => void;
}

export function AssetsForm({ data, onChange, clientId, onValidationChange, incomeData, onIncomeChange }: AssetsFormProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const addAsset = () => {
    const newAsset: AssetFormData = {
      asset_type: 'cash_checking',
      tax_wrapper: 'TAX_NOW',
      title: '',
      current_value: 0,
      cost_basis: 0,
      fee_bps: 0,
      expected_return_low: 0,
      expected_return_base: 5,
      expected_return_high: 10,
      liquidity_score: 8,
      notes: ''
    };
    onChange([...data, newAsset]);
    setEditingIndex(data.length);
  };

  const updateAsset = (index: number, updatedAsset: AssetFormData) => {
    const newData = [...data];
    newData[index] = updatedAsset;
    onChange(newData);
  };

  const removeAsset = (index: number) => {
    const newData = data.filter((_, i) => i !== index);
    onChange(newData);
    setEditingIndex(null);
  };

  const saveAsset = async (index: number) => {
    // Skip database save if no client ID or temporary ID (unauthenticated user)
    if (!clientId || clientId.startsWith('temp-')) {
      setEditingIndex(null);
      return;
    }

    try {
      const asset = data[index];
      const { error } = await supabase
        .from('assets')
        .upsert({
          client_id: clientId,
          asset_type: asset.asset_type,
          tax_wrapper: asset.tax_wrapper,
          title: asset.title,
          current_value: asset.current_value,
          cost_basis: asset.cost_basis,
          fee_bps: asset.fee_bps,
          expected_return_low: asset.expected_return_low,
          expected_return_base: asset.expected_return_base,
          expected_return_high: asset.expected_return_high,
          liquidity_score: asset.liquidity_score,
          notes: asset.notes
        });

      if (error) throw error;

      toast({
        title: "Asset saved",
        description: "Asset information has been saved successfully."
      });
      setEditingIndex(null);
    } catch (error) {
      console.error('Error saving asset:', error);
      toast({
        title: "Save failed",
        description: "There was an error saving the asset.",
        variant: "destructive"
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getTaxWrapperFromAssetType = (assetType: AssetType): TaxWrapperType => {
    return ASSET_TYPE_CONFIG[assetType]?.defaultTaxWrapper || 'TAX_NOW';
  };

  // Fix: Use defensive handling for NaN/undefined values
  const totalValue = data.reduce((sum, asset) => sum + (Number(asset.current_value) || 0), 0);

  const handleIncomeChange = (field: keyof IncomeExpensesData, value: any) => {
    if (incomeData && onIncomeChange) {
      onIncomeChange({ ...incomeData, [field]: value });
    }
  };

  return (
    <div className="space-y-6">
      {/* Previous 401(k) Rollover Section */}
      {incomeData && onIncomeChange && (
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              <CardTitle>Previous 401(k) Rollover</CardTitle>
            </div>
            <CardDescription>
              Old 401(k)s may be candidates for rollover optimization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <Label className="text-base">Do you have a 401(k) from a previous employer?</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Unused retirement accounts may benefit from consolidation
                </p>
              </div>
              <Switch
                checked={incomeData.has_old_401k || false}
                onCheckedChange={(checked) => handleIncomeChange('has_old_401k', checked)}
              />
            </div>

            {incomeData.has_old_401k && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-primary/30 ml-2">
                <div className="space-y-2">
                  <Label>Approximate Balance</Label>
                  <Input
                    type="number"
                    value={incomeData.old_401k_balance || 0}
                    onChange={(e) => handleIncomeChange('old_401k_balance', parseFloat(e.target.value) || 0)}
                    placeholder="e.g., 125000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Previous Employer (optional)</Label>
                  <Input
                    value={incomeData.old_401k_employer_name || ''}
                    onChange={(e) => handleIncomeChange('old_401k_employer_name', e.target.value)}
                    placeholder="Company name"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Asset Portfolio</h3>
          <p className="text-sm text-gray-600">
            Total Value: {formatCurrency(totalValue)} • {data.length} assets
          </p>
        </div>
        <Button onClick={addAsset} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add Asset</span>
        </Button>
      </div>

      {data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-32 space-y-4">
            <DollarSign className="h-12 w-12 text-gray-400" />
            <p className="text-gray-500 text-center">
              No assets added yet. Click "Add Asset" to get started with your portfolio analysis.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {data.map((asset, index) => (
            <Card key={index} className={editingIndex === index ? 'ring-2 ring-primary' : ''}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-lg font-semibold">
                      {asset.title || `Asset #${index + 1}`}
                    </div>
                    <Badge 
                      variant="outline" 
                      className={TAX_WRAPPER_CONFIG[asset.tax_wrapper]?.color}
                    >
                      {TAX_WRAPPER_CONFIG[asset.tax_wrapper]?.label}
                    </Badge>
                    <Badge variant="secondary">
                      {ASSET_TYPE_CONFIG[asset.asset_type]?.category}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(asset.current_value)}</div>
                      <div className="text-sm text-gray-600">
                        {totalValue > 0 ? ((asset.current_value / totalValue) * 100).toFixed(1) : 0}% of portfolio
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                    >
                      {editingIndex === index ? 'Cancel' : 'Edit'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAsset(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {editingIndex === index && (
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`title-${index}`}>Asset Title</Label>
                      <Input
                        id={`title-${index}`}
                        value={asset.title}
                        onChange={(e) => updateAsset(index, { ...asset, title: e.target.value })}
                        placeholder="e.g., Fidelity 401(k)"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`type-${index}`}>Asset Type</Label>
                      <Select
                        value={asset.asset_type}
                        onValueChange={(value: AssetType) => {
                          const newTaxWrapper = getTaxWrapperFromAssetType(value);
                          updateAsset(index, { 
                            ...asset, 
                            asset_type: value,
                            tax_wrapper: newTaxWrapper
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(ASSET_TYPE_CONFIG).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              {config.label} ({config.category})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`value-${index}`}>Current Value</Label>
                      <Input
                        id={`value-${index}`}
                        type="number"
                        min="0"
                        value={asset.current_value}
                        onChange={(e) => updateAsset(index, { ...asset, current_value: parseFloat(e.target.value) || 0 })}
                        placeholder="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`wrapper-${index}`}>Tax Treatment</Label>
                      <Select
                        value={asset.tax_wrapper}
                        onValueChange={(value: TaxWrapperType) => updateAsset(index, { ...asset, tax_wrapper: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(TAX_WRAPPER_CONFIG).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              {config.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Liquidity Score</Label>
                        <Badge variant="outline">{asset.liquidity_score}/10</Badge>
                      </div>
                      <Slider
                        value={[asset.liquidity_score]}
                        onValueChange={([value]) => updateAsset(index, { ...asset, liquidity_score: value })}
                        max={10}
                        min={1}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Illiquid (1)</span>
                        <span>Very Liquid (10)</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`notes-${index}`}>Notes</Label>
                      <Textarea
                        id={`notes-${index}`}
                        value={asset.notes}
                        onChange={(e) => updateAsset(index, { ...asset, notes: e.target.value })}
                        placeholder="Additional notes about this asset..."
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button variant="outline" onClick={() => setEditingIndex(null)}>
                      Cancel
                    </Button>
                    <Button onClick={() => saveAsset(index)}>
                      Save Asset
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(data.filter(a => a.tax_wrapper === 'TAX_NEVER').reduce((sum, a) => sum + (Number(a.current_value) || 0), 0))}
                </div>
                <div className="text-sm text-gray-600">Tax-Free Assets</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <DollarSign className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(data.filter(a => a.tax_wrapper === 'TAX_LATER').reduce((sum, a) => sum + (Number(a.current_value) || 0), 0))}
                </div>
                <div className="text-sm text-gray-600">Tax-Deferred Assets</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <TrendingUp className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(data.filter(a => a.tax_wrapper === 'TAX_NOW').reduce((sum, a) => sum + (Number(a.current_value) || 0), 0))}
                </div>
                <div className="text-sm text-gray-600">Taxable Assets</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}