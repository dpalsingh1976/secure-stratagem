import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Calculator, TrendingUp, PiggyBank, Star } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const TAX_BUCKETS = [
  {
    id: 'tax_free',
    title: 'Tax-Free Bucket',
    subtitle: 'Pay Never',
    description: 'Tax-free growth and withdrawals in retirement',
    icon: Star,
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
    examples: ['Roth IRA', 'Roth 401(k)', 'HSA', 'Life Insurance Cash Value']
  },
  {
    id: 'tax_deferred',
    title: 'Tax-Deferred Bucket',
    subtitle: 'Pay Later',
    description: 'Tax-deferred growth, taxed upon withdrawal',
    icon: PiggyBank,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 border-yellow-200',
    examples: ['401(k)', 'Traditional IRA', 'Annuities', '403(b)']
  },
  {
    id: 'taxable',
    title: 'Taxable Bucket',
    subtitle: 'Pay Now',
    description: 'Taxed annually on income and capital gains',
    icon: TrendingUp,
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200',
    examples: ['Brokerage Accounts', 'CDs', 'Bonds', 'Savings']
  }
];

export default function TaxBucketEstimator() {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [bucketAmounts, setBucketAmounts] = useState({
    tax_free: 0,
    tax_deferred: 0,
    taxable: 0
  });

  const totalAmount = Object.values(bucketAmounts).reduce((sum, amount) => sum + amount, 0);

  const getPercentage = (amount: number) => {
    if (totalAmount === 0) return 0;
    return (amount / totalAmount) * 100;
  };

  const handleAmountChange = (bucketId: string, value: string) => {
    setBucketAmounts(prev => ({
      ...prev,
      [bucketId]: parseFloat(value) || 0
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateTaxSavings = () => {
    const taxFreeGrowth = bucketAmounts.tax_free * 0.07 * 20; // 7% growth for 20 years
    const taxSavings = taxFreeGrowth * 0.22; // Assuming 22% tax rate
    return taxSavings;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
<Button variant="outline" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">7702 Tax Bucket Estimator</h1>
              <p className="text-gray-600">Compare tax advantages across different investment buckets</p>
            </div>
          </div>
        </div>

        {/* Tax Bucket Input Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {TAX_BUCKETS.map((bucket) => {
            const Icon = bucket.icon;
            const amount = bucketAmounts[bucket.id as keyof typeof bucketAmounts];
            const percentage = getPercentage(amount);

            return (
              <Card key={bucket.id} className={`${bucket.bgColor} hover:shadow-lg transition-shadow`}>
                <CardHeader>
                  <CardTitle className={`flex items-center space-x-3 ${bucket.color}`}>
                    <Icon className="h-6 w-6" />
                    <div>
                      <div className="text-lg">{bucket.title}</div>
                      <div className="text-sm font-normal">{bucket.subtitle}</div>
                    </div>
                  </CardTitle>
                  <CardDescription className="text-gray-700">
                    {bucket.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor={`amount-${bucket.id}`}>Current Amount</Label>
                      <Input
                        id={`amount-${bucket.id}`}
                        type="number"
                        placeholder="Enter amount"
                        value={amount || ''}
                        onChange={(e) => handleAmountChange(bucket.id, e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Portfolio %</span>
                      <Badge variant="outline">{percentage.toFixed(1)}%</Badge>
                    </div>
                    
                    <Progress value={percentage} className="h-2" />
                    
                    <div className="text-xs text-gray-600">
                      <div className="font-medium mb-1">Examples:</div>
                      <ul className="list-disc list-inside space-y-0.5">
                        {bucket.examples.slice(0, 2).map((example, idx) => (
                          <li key={idx}>{example}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Summary and Analysis */}
        {totalAmount > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  <span>Portfolio Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-2xl font-bold text-primary">
                    Total: {formatCurrency(totalAmount)}
                  </div>
                  
                  <div className="space-y-3">
                    {TAX_BUCKETS.map((bucket) => {
                      const amount = bucketAmounts[bucket.id as keyof typeof bucketAmounts];
                      const percentage = getPercentage(amount);
                      
                      return (
                        <div key={bucket.id} className="flex justify-between items-center">
                          <span className="font-medium">{bucket.title}</span>
                          <div className="text-right">
                            <div>{formatCurrency(amount)}</div>
                            <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tax Advantage Analysis</CardTitle>
                <CardDescription>
                  Potential long-term tax savings from tax-free bucket optimization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="text-lg font-semibold text-green-800">
                      Estimated 20-Year Tax Savings
                    </div>
                    <div className="text-2xl font-bold text-green-900">
                      {formatCurrency(calculateTaxSavings())}
                    </div>
                    <div className="text-sm text-green-700 mt-2">
                      Based on 7% annual growth and 22% tax rate
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">Optimization Recommendations:</h4>
                    <ul className="text-sm space-y-1 text-gray-700">
                      <li>• Maximize Roth IRA contributions ($6,500-$7,500 annually)</li>
                      <li>• Consider Roth 401(k) over traditional if eligible</li>
                      <li>• Utilize HSA for triple tax advantage</li>
                      <li>• Explore life insurance cash value strategies</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Professional Note */}
        {hasRole('advisor') && (
          <Card className="mt-6">
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">
                <strong>Advisory Note:</strong> This calculator provides general estimates for educational purposes. 
                Consider individual tax situations, income levels, and retirement timelines when making specific 
                recommendations. Consult tax professionals for complex scenarios.
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}