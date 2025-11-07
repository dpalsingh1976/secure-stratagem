import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const IULComparison = () => {
  const { toast } = useToast();
  const [caseId, setCaseId] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [vectorStoreId, setVectorStoreId] = useState('');
  const [comparisonData, setComparisonData] = useState<any>(null);

  const createCase = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('iul_cases')
        .insert({ title: 'New Comparison' })
        .select()
        .single();

      if (error) throw error;
      
      setCaseId(data.id);
      toast({ title: 'Case Created', description: `Case ID: ${data.id}` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const uploadFiles = async () => {
    if (!caseId || !files) {
      toast({ title: 'Error', description: 'Case ID and files required', variant: 'destructive' });
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('caseId', caseId);
      
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });

      const { data, error } = await supabase.functions.invoke('iul-upload', {
        body: formData,
      });

      if (error) throw error;
      
      toast({ 
        title: 'Upload Complete', 
        description: `Uploaded & parsed: ${data.count} file(s)` 
      });
    } catch (error: any) {
      toast({ title: 'Upload Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const indexFiles = async () => {
    if (!caseId) {
      toast({ title: 'Error', description: 'Case ID required', variant: 'destructive' });
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('iul-index', {
        body: { caseId },
      });

      if (error) throw error;
      
      setVectorStoreId(data.vectorStoreId);
      toast({ 
        title: 'Indexing Complete', 
        description: `Vector Store ID: ${data.vectorStoreId}` 
      });
    } catch (error: any) {
      toast({ title: 'Index Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const comparePolices = async () => {
    if (!caseId) {
      toast({ title: 'Error', description: 'Case ID required', variant: 'destructive' });
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('iul-compare', {
        body: { caseId, annualPremium: 10000 },
      });

      if (error) throw error;
      
      setComparisonData(data);
      toast({ title: 'Comparison Complete' });
    } catch (error: any) {
      toast({ title: 'Comparison Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-foreground">IUL Policy Comparison</h1>

        {/* Case Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Case Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Input
                placeholder="Case ID (or create new)"
                value={caseId}
                onChange={(e) => setCaseId(e.target.value)}
                className="flex-1"
              />
              <Button onClick={createCase} disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : 'Create Case'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Upload */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>1. Upload & Extract</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="file"
              accept=".pdf"
              multiple
              onChange={(e) => setFiles(e.target.files)}
            />
            <Button onClick={uploadFiles} disabled={loading || !caseId}>
              {loading ? <Loader2 className="animate-spin" /> : 'Upload & Extract'}
            </Button>
          </CardContent>
        </Card>

        {/* Index */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>2. Index (File Search)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={indexFiles} disabled={loading || !caseId}>
              {loading ? <Loader2 className="animate-spin" /> : 'Index Files'}
            </Button>
            {vectorStoreId && (
              <p className="text-sm text-muted-foreground">
                Vector Store ID: <code className="bg-muted px-2 py-1 rounded">{vectorStoreId}</code>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Compare */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>3. Compare</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={comparePolices} disabled={loading || !caseId}>
              {loading ? <Loader2 className="animate-spin" /> : 'Compare Policies'}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {comparisonData && (
          <>
            {/* Comparison Table */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Comparison Table</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        {comparisonData.table.headers.map((h: string, i: number) => (
                          <th key={i} className="border border-border p-2 bg-muted font-semibold text-left">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonData.table.rows.map((row: string[], i: number) => (
                        <tr key={i}>
                          {row.map((cell, j) => (
                            <td key={j} className="border border-border p-2">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Narrative */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Analysis Narrative</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-foreground">{comparisonData.narrative}</p>
              </CardContent>
            </Card>

            {/* Charts */}
            <Card>
              <CardHeader>
                <CardTitle>Fee Drag Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded overflow-x-auto text-sm">
                  {JSON.stringify(comparisonData.charts, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default IULComparison;
