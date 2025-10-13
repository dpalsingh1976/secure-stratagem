import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useDropzone } from "react-dropzone";

interface PolicyDocument {
  id: string;
  original_filename: string;
  analysis_status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  file_size: number;
  guest_name?: string;
  guest_email?: string;
  processing_progress?: number;
}

const Policies = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<PolicyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('id, original_filename, analysis_status, created_at, file_size, guest_name, guest_email, processing_progress')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments((data || []) as PolicyDocument[]);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load documents"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (files: File[]) => {
    if (files.length === 0) return;

    const file = files[0];
    
    // Validate file
    if (!file.type.includes('pdf') && !file.type.includes('document')) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a PDF or DOC file"
      });
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "File size must be less than 20MB"
      });
      return;
    }

    setUploading(true);

    try {
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${fileName}`;

      // Get guest info from sessionStorage if available
      const guestName = sessionStorage.getItem('guestName');
      const guestEmail = sessionStorage.getItem('guestEmail');

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create document record
      const { data: document, error: insertError } = await supabase
        .from('documents')
        .insert({
          original_filename: file.name,
          filename: fileName,
          storage_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          upload_status: 'uploaded',
          analysis_status: 'pending',
          guest_name: guestName,
          guest_email: guestEmail
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Clear guest info
      sessionStorage.removeItem('guestName');
      sessionStorage.removeItem('guestEmail');

      toast({
        title: "Upload successful",
        description: "Your policy is being processed..."
      });

      // Trigger parsing
      await supabase.functions.invoke('parse-policy', {
        body: { documentId: document.id }
      });

      // Refresh list
      fetchDocuments();

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Deleted",
        description: "Document deleted successfully"
      });

      fetchDocuments();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete document"
      });
    }
  };

  const handleAnalyze = async (id: string) => {
    try {
      toast({
        title: "Starting analysis",
        description: "This may take a minute..."
      });

      await supabase.functions.invoke('analyze-policy-rag', {
        body: { documentId: id }
      });

      toast({
        title: "Analysis complete",
        description: "View your report"
      });

      fetchDocuments();
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        variant: "destructive",
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleUpload,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: false,
    disabled: uploading
  });

  const getStatusBadge = (status: string, progress?: number) => {
    if (status === 'processing' && progress !== undefined && progress > 0) {
      return (
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-500"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Processing</Badge>
          <div className="flex items-center gap-2">
            <Progress value={progress} className="w-24 h-2" />
            <span className="text-sm text-muted-foreground">{progress}%</span>
          </div>
        </div>
      );
    }
    
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Analyzed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Processing</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Policy Documents</h1>
          <p className="text-muted-foreground mb-8">Upload and analyze your insurance policies</p>

          {/* Upload Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Upload New Policy</CardTitle>
              <CardDescription>Drag and drop or click to select a PDF or DOC file (max 20MB)</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary'
                } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input {...getInputProps()} />
                {uploading ? (
                  <div>
                    <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
                    <p className="text-lg font-medium">Uploading...</p>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    {isDragActive ? (
                      <p className="text-lg font-medium">Drop the file here</p>
                    ) : (
                      <>
                        <p className="text-lg font-medium mb-2">Drop your policy here or click to browse</p>
                        <p className="text-sm text-muted-foreground">PDF, DOC, or DOCX files only</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Documents List */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Your Policies</h2>
            
            {loading ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" />
                  <p>Loading documents...</p>
                </CardContent>
              </Card>
            ) : documents.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No documents uploaded yet</p>
                </CardContent>
              </Card>
            ) : (
              documents.map((doc) => (
                <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <FileText className="w-10 h-10 text-primary" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{doc.original_filename}</h3>
                          <p className="text-sm text-muted-foreground">
                            Uploaded {new Date(doc.created_at).toLocaleDateString()} • 
                            {(doc.file_size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          {doc.guest_name && (
                            <p className="text-sm text-muted-foreground">
                              Uploaded by: {doc.guest_name} ({doc.guest_email})
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {getStatusBadge(doc.analysis_status, doc.processing_progress)}
                        
                        {doc.analysis_status === 'completed' && (
                          <Button onClick={() => navigate(`/policies/${doc.id}`)}>
                            View Report
                          </Button>
                        )}
                        
                        {doc.analysis_status === 'pending' && (
                          <Button onClick={() => handleAnalyze(doc.id)} variant="outline">
                            Analyze Now
                          </Button>
                        )}
                        
                        {doc.analysis_status === 'failed' && (
                          <Button onClick={() => handleAnalyze(doc.id)} variant="outline">
                            Retry Analysis
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(doc.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Policies;
