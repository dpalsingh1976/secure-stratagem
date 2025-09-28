import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { LiabilityFormData } from '@/types/financial';

interface LiabilitiesFormProps {
  data: LiabilityFormData[];
  onChange: (data: LiabilityFormData[]) => void;
  clientId: string | null;
  onValidationChange: (isValid: boolean) => void;
}

export function LiabilitiesForm({ data, onChange, onValidationChange }: LiabilitiesFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Liabilities & Debts</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Liability management interface coming soon.</p>
      </CardContent>
    </Card>
  );
}