import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FileText, Shield, AlertTriangle, HelpCircle, Download, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

interface Coverage {
  type: string;
  limit: string;
  deductible: string | null;
  riders: string[];
}

interface Exclusion {
  category: string;
  description: string;
  impact: string;
}

interface Gap {
  gap_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  business_impact: string;
  remedy: string;
}

interface PolicyAnalysis {
  id: string;
  coverages: Coverage[];
  exclusions: Exclusion[];
  gaps: Gap[];
  client_questions: string[];
  summary: string;
}

interface Document {
  id: string;
  original_filename: string;
  created_at: string;
  analysis_status: string;
  guest_name?: string;
  guest_email?: string;
}

const PolicyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [document, setDocument] = useState<Document | null>(null);
  const [analysis, setAnalysis] = useState<PolicyAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchDocumentAndAnalysis();
    }
  }, [id]);

  const fetchDocumentAndAnalysis = async () => {
    try {
      // Fetch document
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .single();

      if (docError) throw docError;
      setDocument(docData as Document);

      // Fetch analysis
      const { data: analysisData, error: analysisError } = await supabase
        .from('policy_analyses')
        .select('*')
        .eq('document_id', id)
        .single();

      if (analysisError && analysisError.code !== 'PGRST116') {
        throw analysisError;
      }

      setAnalysis(analysisData as unknown as PolicyAnalysis || null);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load policy details"
      });
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleDownloadPDF = async () => {
    toast({
      title: "Coming soon",
      description: "PDF download will be available shortly"
    });
    // TODO: Implement PDF generation
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto py-12 px-4">
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto py-12 px-4">
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-lg">Document not found</p>
              <Button onClick={() => navigate('/policies')} className="mt-4">
                Back to Policies
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto py-12 px-4">
          <Card>
            <CardContent className="p-12 text-center">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
              <p className="text-lg mb-4">Analysis not available yet</p>
              <p className="text-muted-foreground mb-4">
                This policy has not been analyzed. Click below to start the analysis.
              </p>
              <Button onClick={() => navigate('/policies')}>
                Back to Policies
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/policies')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Policies
            </Button>
            
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">{document.original_filename}</h1>
                <p className="text-muted-foreground">
                  Uploaded {new Date(document.created_at).toLocaleDateString()}
                </p>
                {document.guest_name && (
                  <p className="text-sm text-muted-foreground">
                    By: {document.guest_name} ({document.guest_email})
                  </p>
                )}
              </div>
              <Button onClick={handleDownloadPDF}>
                <Download className="w-4 h-4 mr-2" />
                Download PDF Report
              </Button>
            </div>
          </div>

          {/* Summary Card */}
          <Card className="mb-8 bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Executive Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg">{analysis.summary}</p>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="coverage" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="coverage">Coverage</TabsTrigger>
              <TabsTrigger value="exclusions">Exclusions</TabsTrigger>
              <TabsTrigger value="gaps">Gaps & Suggestions</TabsTrigger>
              <TabsTrigger value="questions">Questions</TabsTrigger>
            </TabsList>

            {/* Coverage Tab */}
            <TabsContent value="coverage" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-500" />
                    Policy Coverage
                  </CardTitle>
                  <CardDescription>
                    Overview of your insurance coverage types and limits
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analysis.coverages.map((coverage, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-lg">{coverage.type}</h3>
                        <Badge variant="outline">{coverage.limit}</Badge>
                      </div>
                      {coverage.deductible && (
                        <p className="text-sm text-muted-foreground mb-2">
                          Deductible: {coverage.deductible}
                        </p>
                      )}
                      {coverage.riders && coverage.riders.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium mb-1">Riders:</p>
                          <div className="flex flex-wrap gap-2">
                            {coverage.riders.map((rider, idx) => (
                              <Badge key={idx} variant="secondary">{rider}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Exclusions Tab */}
            <TabsContent value="exclusions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    Policy Exclusions
                  </CardTitle>
                  <CardDescription>
                    Important exclusions and limitations in your coverage
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analysis.exclusions.map((exclusion, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-orange-50">
                      <h3 className="font-semibold text-lg mb-2">{exclusion.category}</h3>
                      <p className="text-sm mb-2">{exclusion.description}</p>
                      <div className="mt-3 p-3 bg-white rounded border-l-4 border-orange-500">
                        <p className="text-sm font-medium text-orange-900">Impact:</p>
                        <p className="text-sm text-orange-800">{exclusion.impact}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Gaps & Suggestions Tab */}
            <TabsContent value="gaps" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    Coverage Gaps & Recommendations
                  </CardTitle>
                  <CardDescription>
                    Identified risks and actionable steps to improve your coverage
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analysis.gaps.map((gap, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-lg">{gap.gap_type}</h3>
                        <Badge className={getSeverityColor(gap.severity)}>
                          {gap.severity.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="p-3 bg-red-50 rounded border-l-4 border-red-500">
                          <p className="text-sm font-medium text-red-900 mb-1">Business Impact:</p>
                          <p className="text-sm text-red-800">{gap.business_impact}</p>
                        </div>
                        
                        <div className="p-3 bg-green-50 rounded border-l-4 border-green-500">
                          <p className="text-sm font-medium text-green-900 mb-1">Recommended Action:</p>
                          <p className="text-sm text-green-800">{gap.remedy}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Questions Tab */}
            <TabsContent value="questions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-blue-500" />
                    Questions for You
                  </CardTitle>
                  <CardDescription>
                    Additional information needed to complete your assessment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.client_questions.map((question, index) => (
                      <div key={index} className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center font-medium">
                          {index + 1}
                        </span>
                        <p className="text-sm flex-1">{question}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PolicyDetail;
