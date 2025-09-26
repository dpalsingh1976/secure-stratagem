import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, File, CheckCircle, XCircle, Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { IllustrationUpload, ProcessingStatus, DbIllustrationUpload, mapDbToIllustrationUpload } from '@/types/iul';

export const IllustrationUploader = () => {
  const [uploads, setUploads] = useState<IllustrationUpload[]>([]);
  const [uploading, setUploading] = useState(false);
  const [carrierName, setCarrierName] = useState('');
  const [policyType, setPolicyType] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch existing uploads
  const fetchUploads = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('iul_illustrations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching uploads:', error);
      return;
    }

    setUploads((data as DbIllustrationUpload[] || []).map(mapDbToIllustrationUpload));
  };

  // Upload file to storage
  const uploadFile = async (file: File) => {
    if (!user) throw new Error('User not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    return { fileName: file.name, filePath };
  };

  // Create illustration record
  const createIllustrationRecord = async (fileName: string, filePath: string) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('iul_illustrations')
      .insert({
        user_id: user.id,
        file_name: fileName,
        file_path: filePath,
        carrier_name: carrierName || null,
        policy_type: policyType || null,
        processing_status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  // Process uploaded illustration
  const processIllustration = async (illustrationId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('process-iul-illustration', {
        body: { illustrationId }
      });

      if (error) throw error;

      // Update local state
      setUploads(prev => prev.map(upload => 
        upload.id === illustrationId 
          ? { ...upload, processing_status: 'processing' as ProcessingStatus }
          : upload
      ));

      toast({
        title: "Processing started",
        description: "Your illustration is being processed. This may take a few minutes.",
      });

      return data;
    } catch (error) {
      console.error('Error processing illustration:', error);
      toast({
        title: "Processing failed",
        description: "Failed to start processing the illustration.",
        variant: "destructive",
      });
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);

    try {
      for (const file of acceptedFiles) {
        // Validate file type
        if (file.type !== 'application/pdf') {
          toast({
            title: "Invalid file type",
            description: "Only PDF files are supported.",
            variant: "destructive",
          });
          continue;
        }

        // Validate file size (50MB limit)
        if (file.size > 50 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: "File size must be less than 50MB.",
            variant: "destructive",
          });
          continue;
        }

        // Upload file
        const { fileName, filePath } = await uploadFile(file);

        // Create record
        const illustration = await createIllustrationRecord(fileName, filePath);

        // Add to local state
        setUploads(prev => [mapDbToIllustrationUpload(illustration as DbIllustrationUpload), ...prev]);

        // Start processing
        await processIllustration(illustration.id);

        toast({
          title: "File uploaded",
          description: `${fileName} uploaded successfully and processing started.`,
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload the file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }, [user, carrierName, policyType, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false
  });

  const deleteIllustration = async (id: string, filePath: string) => {
    try {
      // Delete from storage
      await supabase.storage.from('documents').remove([filePath]);

      // Delete from database
      const { error } = await supabase
        .from('iul_illustrations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setUploads(prev => prev.filter(upload => upload.id !== id));

      toast({
        title: "Deleted",
        description: "Illustration deleted successfully.",
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete the illustration.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: ProcessingStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <Loader2 className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: ProcessingStatus) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'processing':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // Load uploads on component mount
  React.useEffect(() => {
    fetchUploads();
  }, [user]);

  return (
    <div className="space-y-6 max-w-none">
      {/* Upload Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="space-y-2">
          <Label htmlFor="carrier">Carrier Name (Optional)</Label>
          <Input
            id="carrier"
            placeholder="e.g., Pacific Life, AIG, etc."
            value={carrierName}
            onChange={(e) => setCarrierName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="policy-type">Policy Type (Optional)</Label>
          <Select value={policyType} onValueChange={setPolicyType}>
            <SelectTrigger>
              <SelectValue placeholder="Select policy type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="iul">Indexed Universal Life</SelectItem>
              <SelectItem value="vul">Variable Universal Life</SelectItem>
              <SelectItem value="ul">Universal Life</SelectItem>
              <SelectItem value="whole-life">Whole Life</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Dropzone */}
      <Card className="w-full">
        <CardContent className="pt-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors min-h-[200px] flex flex-col items-center justify-center ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary hover:bg-primary/5'
            }`}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <div className="space-y-2">
                <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin" />
                <p className="text-lg font-medium">Uploading...</p>
                <p className="text-sm text-muted-foreground">Please wait while we upload your file</p>
              </div>
            ) : isDragActive ? (
              <div className="space-y-2">
                <Upload className="h-12 w-12 mx-auto text-primary" />
                <p className="text-lg font-medium">Drop the PDF here</p>
                <p className="text-sm text-muted-foreground">Release to upload</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="text-lg font-medium">Upload IUL Illustration</p>
                <p className="text-sm text-muted-foreground">
                  Drag & drop a PDF file here, or click to select
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF files only, max 50MB
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files */}
      {uploads.length > 0 && (
        <div className="space-y-4 w-full">
          <h3 className="text-lg font-semibold">Uploaded Illustrations</h3>
          <div className="space-y-3 w-full">
            {uploads.map((upload) => (
              <Card key={upload.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <File className="h-8 w-8 text-primary" />
                      <div>
                        <p className="font-medium">{upload.fileName}</p>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          {upload.carrierName && (
                            <span>Carrier: {upload.carrierName}</span>
                          )}
                          {upload.policyType && (
                            <span>Type: {upload.policyType}</span>
                          )}
                          <span>•</span>
                          <span>{new Date(upload.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getStatusColor(upload.processingStatus)} className="flex items-center gap-1">
                        {getStatusIcon(upload.processingStatus)}
                        {upload.processingStatus.charAt(0).toUpperCase() + upload.processingStatus.slice(1)}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteIllustration(upload.id, upload.filePath)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};