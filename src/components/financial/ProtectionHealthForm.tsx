import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ProtectionHealthData } from '@/types/financial';

interface ProtectionHealthFormProps {
  data: ProtectionHealthData;
  onChange: (data: ProtectionHealthData) => void;
  onValidationChange: (isValid: boolean) => void;
}

export function ProtectionHealthForm({ data, onChange, onValidationChange }: ProtectionHealthFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Protection & Health Coverage</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Insurance and health planning interface coming soon.</p>
      </CardContent>
    </Card>
  );
}