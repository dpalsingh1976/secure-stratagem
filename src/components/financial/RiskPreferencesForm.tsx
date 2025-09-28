import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { RiskPreferencesData } from '@/types/financial';

interface RiskPreferencesFormProps {
  data: RiskPreferencesData;
  onChange: (data: RiskPreferencesData) => void;
  onValidationChange: (isValid: boolean) => void;
}

export function RiskPreferencesForm({ data, onChange, onValidationChange }: RiskPreferencesFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk Preferences & Constraints</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Risk preference interface coming soon.</p>
      </CardContent>
    </Card>
  );
}