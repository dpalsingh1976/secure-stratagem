import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, CreditCard, Home, GraduationCap, Car } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { LiabilityFormData, LiabilityType } from '@/types/financial';

interface LiabilitiesFormProps {
  data: LiabilityFormData[];
  onChange: (data: LiabilityFormData[]) => void;
  clientId: string | null;
  onValidationChange: (isValid: boolean) => void;
}

const LIABILITY_TYPE_CONFIG: Record<LiabilityType, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
  defaultRate: number;
}> = {
  mortgage_primary: { label: 'Primary Mortgage', icon: Home, category: 'Real Estate', defaultRate: 6.5 },
  mortgage_rental: { label: 'Rental Property Mortgage', icon: Home, category: 'Real Estate', defaultRate: 7.0 },
  heloc: { label: 'Home Equity Line of Credit', icon: Home, category: 'Real Estate', defaultRate: 8.0 },
  student_loan: { label: 'Student Loan', icon: GraduationCap, category: 'Education', defaultRate: 5.5 },
  auto_loan: { label: 'Auto Loan', icon: Car, category: 'Transportation', defaultRate: 7.5 },
  credit_card: { label: 'Credit Card', icon: CreditCard, category: 'Consumer', defaultRate: 18.0 },
  business_loan: { label: 'Business Loan', icon: CreditCard, category: 'Business', defaultRate: 8.5 },
  personal_loan: { label: 'Personal Loan', icon: CreditCard, category: 'Consumer', defaultRate: 12.0 }
};

export function LiabilitiesForm({ data, onChange, clientId, onValidationChange }: LiabilitiesFormProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const addLiability = () => {
    const newLiability: LiabilityFormData = {
      type: 'credit_card',
      balance: 0,
      rate: LIABILITY_TYPE_CONFIG.credit_card.defaultRate,
      term_months: 0,
      payment_monthly: 0,
      variable: false,
      deductible: false,
      notes: ''
    };
    onChange([...data, newLiability]);
    setEditingIndex(data.length);
  };

  const updateLiability = (index: number, updatedLiability: LiabilityFormData) => {
    const newData = [...data];
    newData[index] = updatedLiability;
    onChange(newData);
  };

  const removeLiability = (index: number) => {
    const newData = data.filter((_, i) => i !== index);
    onChange(newData);
    setEditingIndex(null);
  };

  const saveLiability = async (index: number) => {
    // For all users during intake flow, defer DB persistence to bulk RPC save at form completion
    // This avoids RLS violations since guest users can't write directly to the liabilities table
    setEditingIndex(null);
    toast({
      title: "Liability updated",
      description: "Liability will be saved when you complete the assessment."
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const totalDebt = data.reduce((sum, liability) => sum + liability.balance, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Liabilities & Debts</h3>
          <p className="text-sm text-gray-600">
            Total Debt: {formatCurrency(totalDebt)}
          </p>
        </div>
        <Button onClick={addLiability} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add Liability</span>
        </Button>
      </div>

      {data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-32 space-y-4">
            <CreditCard className="h-12 w-12 text-gray-400" />
            <p className="text-gray-500 text-center">
              No liabilities added yet. Include mortgages, loans, and credit cards for comprehensive analysis.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {data.map((liability, index) => {
            const config = LIABILITY_TYPE_CONFIG[liability.type];
            const Icon = config.icon;
            
            return (
              <Card key={index} className={editingIndex === index ? 'ring-2 ring-primary' : ''}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Icon className="h-5 w-5 text-gray-600" />
                      <div>
                        <div className="font-semibold">{config.label}</div>
                        <div className="text-sm text-gray-600">{config.category}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(liability.balance)}</div>
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
                        onClick={() => removeLiability(index)}
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
                        <Label htmlFor={`type-${index}`}>Liability Type</Label>
                        <Select
                          value={liability.type}
                          onValueChange={(value: LiabilityType) => {
                            const newRate = LIABILITY_TYPE_CONFIG[value].defaultRate;
                            updateLiability(index, { 
                              ...liability, 
                              type: value,
                              rate: newRate
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(LIABILITY_TYPE_CONFIG).map(([key, config]) => (
                              <SelectItem key={key} value={key}>
                                {config.label} ({config.category})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`balance-${index}`}>Current Balance</Label>
                        <Input
                          id={`balance-${index}`}
                          type="number"
                          min="0"
                          value={liability.balance}
                          onChange={(e) => updateLiability(index, { ...liability, balance: parseFloat(e.target.value) || 0 })}
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`notes-${index}`}>Notes</Label>
                      <Textarea
                        id={`notes-${index}`}
                        value={liability.notes}
                        onChange={(e) => updateLiability(index, { ...liability, notes: e.target.value })}
                        placeholder="Additional information about this liability..."
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t">
                      <Button variant="outline" onClick={() => setEditingIndex(null)}>
                        Cancel
                      </Button>
                      <Button onClick={() => saveLiability(index)}>
                        Save Liability
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Summary Cards */}
      {data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Home className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">
                  {formatCurrency(data.filter(l => l.type.includes('mortgage') || l.type === 'heloc').reduce((sum, l) => sum + l.balance, 0))}
                </div>
                <div className="text-sm text-gray-600">Real Estate Debt</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <CreditCard className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">
                  {formatCurrency(data.filter(l => l.type === 'credit_card').reduce((sum, l) => sum + l.balance, 0))}
                </div>
                <div className="text-sm text-gray-600">Credit Cards</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <GraduationCap className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">
                  {formatCurrency(data.filter(l => l.type === 'student_loan').reduce((sum, l) => sum + l.balance, 0))}
                </div>
                <div className="text-sm text-gray-600">Student Loans</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Car className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">
                  {formatCurrency(data.filter(l => l.type === 'auto_loan').reduce((sum, l) => sum + l.balance, 0))}
                </div>
                <div className="text-sm text-gray-600">Auto Loans</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}