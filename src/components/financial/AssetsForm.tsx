import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import type { AssetFormData } from '@/types/financial';

interface AssetsFormProps {
  data: AssetFormData[];
  onChange: (data: AssetFormData[]) => void;
  clientId: string | null;
  onValidationChange: (isValid: boolean) => void;
}

export function AssetsForm({ data, onChange, onValidationChange }: AssetsFormProps) {
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
      liquidity_score: 5,
      notes: ''
    };
    onChange([...data, newAsset]);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Asset Portfolio</h3>
        <Button onClick={addAsset}>
          <Plus className="h-4 w-4 mr-2" />
          Add Asset
        </Button>
      </div>

      {data.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-gray-500">No assets added yet. Click "Add Asset" to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {data.map((asset, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-base">Asset #{index + 1}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Asset management interface would be here</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}