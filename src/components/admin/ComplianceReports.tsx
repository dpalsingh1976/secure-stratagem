import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, FileText, Download, AlertCircle, CheckCircle, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ComplianceReport, SuitabilityAnalysis, AlternativeProduct } from '@/types/iul';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: string[];
}

const reportTemplates: ReportTemplate[] = [
  {
    id: 'naic-275',
    name: 'NAIC Best Interest (Model #275)',
    description: 'Comprehensive compliance report following NAIC Model Regulation #275',
    sections: ['Suitability Analysis', 'Basis for Recommendation', 'Alternatives Considered', 'Disclosures', 'Risk Factors']
  },
  {
    id: 'dol-fiduciary',
    name: 'DOL Fiduciary Standard',
    description: 'Department of Labor fiduciary standard compliance documentation',
    sections: ['Fiduciary Analysis', 'Client Best Interest', 'Fee Disclosure', 'Conflict of Interest']
  },
  {
    id: 'sec-ria',
    name: 'SEC RIA Compliance',
    description: 'SEC Registered Investment Adviser compliance requirements',
    sections: ['Investment Adviser Analysis', 'Form ADV Disclosures', 'Supervision Requirements']
  },
  {
    id: 'custom',
    name: 'Custom Report',
    description: 'Build a custom compliance report with selected sections',
    sections: ['Custom Analysis', 'Tailored Recommendations', 'Specific Disclosures']
  }
];

export const ComplianceReports = () => {
  const [selectedIllustration, setSelectedIllustration] = useState('');
  const [illustrations, setIllustrations] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [clientInfo, setClientInfo] = useState({
    name: '',
    age: '',
    riskTolerance: '',
    investmentObjective: '',
    timeHorizon: '',
    liquidityNeeds: '',
    netWorth: '',
    annualIncome: ''
  });
  const [advisorInfo, setAdvisorInfo] = useState({
    name: '',
    firmName: '',
    licenseNumber: '',
    credentials: ''
  });
  const [suitabilityAnalysis, setSuitabilityAnalysis] = useState<SuitabilityAnalysis>({
    clientObjectives: [],
    riskTolerance: '',
    timeHorizon: '',
    liquidityNeeds: '',
    productAlignment: '',
    justification: ''
  });
  const [basisForRecommendation, setBasisForRecommendation] = useState('');
  const [alternatives, setAlternatives] = useState<AlternativeProduct[]>([]);
  const [disclosures, setDisclosures] = useState<string[]>([]);
  const [generatedReport, setGeneratedReport] = useState<ComplianceReport | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Standard compliance disclosures
  const standardDisclosures = [
    'This illustration is not a contract and is subject to change',
    'Actual results may vary from illustrated values',
    'Premium payments are required to keep the policy in force',
    'Cost of insurance charges may increase over time',
    'Loan interest is charged on outstanding loan balances',
    'Surrendering the policy may result in surrender charges',
    'Tax treatment depends on individual circumstances'
  ];

  // Common alternative products
  const commonAlternatives = [
    { productType: 'Term Life + Investments', description: 'Separate term life insurance with market investments', whyNotSuitable: '' },
    { productType: 'Whole Life Insurance', description: 'Traditional whole life with guaranteed values', whyNotSuitable: '' },
    { productType: 'Variable Universal Life', description: 'UL with separate account investment options', whyNotSuitable: '' },
    { productType: '401(k) / IRA', description: 'Tax-qualified retirement accounts', whyNotSuitable: '' },
    { productType: 'Taxable Investment Account', description: 'Non-qualified investment portfolio', whyNotSuitable: '' }
  ];

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

  // Generate compliance report
  const generateReport = async () => {
    if (!selectedIllustration || !selectedTemplate) return;

    setLoading(true);

    try {
      const reportData = {
        illustrationId: selectedIllustration,
        templateId: selectedTemplate,
        clientInfo,
        advisorInfo,
        suitabilityAnalysis,
        basisForRecommendation,
        alternatives,
        disclosures
      };

      const { data, error } = await supabase.functions.invoke('generate-compliance-report', {
        body: reportData
      });

      if (error) throw error;

      setGeneratedReport(data.report);
      
      toast({
        title: "Report generated",
        description: "Your compliance report is ready for review and download.",
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Report generation failed",
        description: "Failed to generate the compliance report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Add alternative product
  const addAlternative = (product: AlternativeProduct) => {
    setAlternatives(prev => [...prev, product]);
  };

  // Update alternative product
  const updateAlternative = (index: number, field: keyof AlternativeProduct, value: string) => {
    setAlternatives(prev => prev.map((alt, i) => 
      i === index ? { ...alt, [field]: value } : alt
    ));
  };

  // Remove alternative product
  const removeAlternative = (index: number) => {
    setAlternatives(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    fetchIllustrations();
  }, [user]);

  useEffect(() => {
    // Initialize alternatives with common products
    if (alternatives.length === 0) {
      setAlternatives(commonAlternatives);
    }
    // Initialize disclosures
    if (disclosures.length === 0) {
      setDisclosures(standardDisclosures);
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Compliance Report Generator</h3>
          <p className="text-sm text-muted-foreground">
            Generate NAIC Best Interest and other compliance reports
          </p>
        </div>
        <Button onClick={generateReport} disabled={loading || !selectedIllustration || !selectedTemplate}>
          {loading ? 'Generating...' : 'Generate Report'}
        </Button>
      </div>

      <Tabs defaultValue="setup" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="analysis">Suitability</TabsTrigger>
          <TabsTrigger value="alternatives">Alternatives</TabsTrigger>
          <TabsTrigger value="report">Report</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-6">
          {/* Illustration and Template Selection */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Select Illustration</Label>
              <Select value={selectedIllustration} onValueChange={setSelectedIllustration}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an illustration" />
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

            <div className="space-y-2">
              <Label>Compliance Template</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template" />
                </SelectTrigger>
                <SelectContent>
                  {reportTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div>
                        <p className="font-medium">{template.name}</p>
                        <p className="text-xs text-muted-foreground">{template.description}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>Client Name</Label>
                  <Input
                    value={clientInfo.name}
                    onChange={(e) => setClientInfo(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="John Smith"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Age</Label>
                  <Input
                    type="number"
                    value={clientInfo.age}
                    onChange={(e) => setClientInfo(prev => ({ ...prev, age: e.target.value }))}
                    placeholder="45"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Risk Tolerance</Label>
                  <Select 
                    value={clientInfo.riskTolerance} 
                    onValueChange={(value) => setClientInfo(prev => ({ ...prev, riskTolerance: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select risk tolerance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conservative">Conservative</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="aggressive">Aggressive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Investment Objective</Label>
                  <Input
                    value={clientInfo.investmentObjective}
                    onChange={(e) => setClientInfo(prev => ({ ...prev, investmentObjective: e.target.value }))}
                    placeholder="Retirement planning"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time Horizon</Label>
                  <Input
                    value={clientInfo.timeHorizon}
                    onChange={(e) => setClientInfo(prev => ({ ...prev, timeHorizon: e.target.value }))}
                    placeholder="20 years"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Annual Income</Label>
                  <Input
                    value={clientInfo.annualIncome}
                    onChange={(e) => setClientInfo(prev => ({ ...prev, annualIncome: e.target.value }))}
                    placeholder="$150,000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Advisor Information */}
          <Card>
            <CardHeader>
              <CardTitle>Advisor Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Advisor Name</Label>
                  <Input
                    value={advisorInfo.name}
                    onChange={(e) => setAdvisorInfo(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Jane Advisor"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Firm Name</Label>
                  <Input
                    value={advisorInfo.firmName}
                    onChange={(e) => setAdvisorInfo(prev => ({ ...prev, firmName: e.target.value }))}
                    placeholder="ABC Financial Services"
                  />
                </div>
                <div className="space-y-2">
                  <Label>License Number</Label>
                  <Input
                    value={advisorInfo.licenseNumber}
                    onChange={(e) => setAdvisorInfo(prev => ({ ...prev, licenseNumber: e.target.value }))}
                    placeholder="12345678"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Credentials</Label>
                  <Input
                    value={advisorInfo.credentials}
                    onChange={(e) => setAdvisorInfo(prev => ({ ...prev, credentials: e.target.value }))}
                    placeholder="CFP, CLU, ChFC"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Suitability Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Product Alignment Justification</Label>
                <Textarea
                  value={suitabilityAnalysis.justification}
                  onChange={(e) => setSuitabilityAnalysis(prev => ({ 
                    ...prev, 
                    justification: e.target.value 
                  }))}
                  placeholder="Explain why this IUL product is suitable for the client's specific situation..."
                  className="min-h-[100px]"
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Basis for Recommendation</Label>
                <Textarea
                  value={basisForRecommendation}
                  onChange={(e) => setBasisForRecommendation(e.target.value)}
                  placeholder="Provide detailed basis for recommending this specific IUL product..."
                  className="min-h-[150px]"
                />
                <p className="text-xs text-muted-foreground">
                  Include specific reasons why this product meets the client's needs, objectives, and circumstances.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Compliance Checklist */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                NAIC Best Interest Checklist
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                'Client profile and risk assessment completed',
                'Investment objectives documented',
                'Alternative products considered and documented',
                'Fees and expenses disclosed',
                'Potential conflicts of interest identified',
                'Product features and limitations explained',
                'Tax implications discussed',
                'Liquidity considerations addressed'
              ].map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox id={`checklist-${index}`} />
                  <Label 
                    htmlFor={`checklist-${index}`} 
                    className="text-sm font-normal cursor-pointer"
                  >
                    {item}
                  </Label>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alternatives" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alternative Products Considered</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {alternatives.map((alternative, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{alternative.productType}</h4>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => removeAlternative(index)}
                    >
                      Remove
                    </Button>
                  </div>
                  
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Product Description</Label>
                      <Textarea
                        value={alternative.description}
                        onChange={(e) => updateAlternative(index, 'description', e.target.value)}
                        placeholder="Describe the alternative product..."
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Why Not Suitable</Label>
                      <Textarea
                        value={alternative.whyNotSuitable}
                        onChange={(e) => updateAlternative(index, 'whyNotSuitable', e.target.value)}
                        placeholder="Explain why this alternative is not suitable..."
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button 
                variant="outline" 
                onClick={() => addAlternative({ 
                  productType: 'Custom Alternative', 
                  description: '', 
                  whyNotSuitable: '' 
                })}
              >
                Add Alternative Product
              </Button>
            </CardContent>
          </Card>

          {/* Disclosures */}
          <Card>
            <CardHeader>
              <CardTitle>Required Disclosures</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {disclosures.map((disclosure, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <Checkbox 
                    id={`disclosure-${index}`} 
                    defaultChecked 
                  />
                  <Label 
                    htmlFor={`disclosure-${index}`} 
                    className="text-sm font-normal cursor-pointer leading-relaxed"
                  >
                    {disclosure}
                  </Label>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="report" className="space-y-6">
          {generatedReport ? (
            <>
              {/* Report Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Compliance Report Generated
                    </span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <Button size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-sm font-medium">Client</p>
                      <p className="text-sm text-muted-foreground">{generatedReport.clientName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Advisor</p>
                      <p className="text-sm text-muted-foreground">{generatedReport.advisorName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Generated</p>
                      <p className="text-sm text-muted-foreground">{new Date(generatedReport.generatedDate).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-3">
                    <h4 className="font-medium">Report Sections</h4>
                    <div className="grid gap-2 md:grid-cols-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Suitability Analysis</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Basis for Recommendation</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Alternative Products</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Risk Disclosures</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Report Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Report Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/20 p-6 rounded-lg space-y-4 max-h-96 overflow-y-auto">
                    <div className="text-center border-b pb-4">
                      <h2 className="text-xl font-bold">Compliance Report</h2>
                      <p className="text-sm text-muted-foreground">NAIC Best Interest Analysis</p>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-semibold">Client Information</h3>
                      <p className="text-sm">
                        <strong>Name:</strong> {generatedReport.clientName}<br />
                        <strong>Generated:</strong> {new Date(generatedReport.generatedDate).toLocaleDateString()}<br />
                        <strong>Advisor:</strong> {generatedReport.advisorName}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-semibold">Basis for Recommendation</h3>
                      <p className="text-sm">{generatedReport.basisForRecommendation}</p>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-semibold">Suitability Analysis</h3>
                      <p className="text-sm">{generatedReport.suitabilityAnalysis.justification}</p>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-semibold">Alternative Products Considered</h3>
                      <div className="space-y-2">
                        {generatedReport.alternatives.map((alt, index) => (
                          <div key={index} className="border-l-2 border-muted pl-3">
                            <p className="text-sm font-medium">{alt.productType}</p>
                            <p className="text-xs text-muted-foreground">{alt.whyNotSuitable}</p>
                          </div>
                        ))}
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
                  <FileText className="h-12 w-12 mx-auto mb-4" />
                  <p>Complete all sections and generate your compliance report</p>
                  <p className="text-sm mt-2">
                    Ensure all client information, suitability analysis, and alternatives are documented
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};