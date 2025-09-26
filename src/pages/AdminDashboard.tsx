import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { Upload, MessageSquare, TrendingUp, LogOut, Shield, Database } from 'lucide-react';
import { IllustrationUploader } from '@/components/admin/IllustrationUploader';
import { DigitalTwinChat } from '@/components/admin/DigitalTwinChat';
import { StressTesting } from '@/components/admin/StressTesting';
import { MarketComparison } from '@/components/admin/MarketComparison';
import { ComplianceReports } from '@/components/admin/ComplianceReports';

export default function AdminDashboard() {
  const { user, userRole, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('upload');

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                IUL Digital Twin
              </h1>
              <p className="text-sm text-muted-foreground">
                Advanced Policy Analysis & Stress Testing
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium">{user?.email}</p>
              <Badge variant={userRole === 'admin' ? 'default' : 'secondary'}>
                {userRole?.toUpperCase()}
              </Badge>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Welcome to the IUL Analysis Platform
          </h2>
          <p className="text-muted-foreground">
            Upload illustrations, run stress tests, and generate comprehensive client reports.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Upload Illustration</span>
            </TabsTrigger>
            <TabsTrigger value="digital-twin" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Digital Twin</span>
            </TabsTrigger>
            <TabsTrigger value="stress-test" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Stress Testing</span>
            </TabsTrigger>
            <TabsTrigger value="market-comparison" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Market Analysis</span>
            </TabsTrigger>
            <TabsTrigger value="compliance" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Compliance</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload & Parse IUL Illustrations
                </CardTitle>
                <CardDescription>
                  Upload PDF illustrations from any carrier. Our system will extract and normalize policy data for analysis.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <IllustrationUploader />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="digital-twin" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Digital Twin Simulator
                </CardTitle>
                <CardDescription>
                  Ask "What if" questions about your IUL policies and get instant projections and analysis.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DigitalTwinChat />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stress-test" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Stress Testing & Scenario Analysis
                </CardTitle>
                <CardDescription>
                  Run comprehensive stress tests including market crashes, rate changes, and premium reductions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StressTesting />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="market-comparison" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  IUL vs. Market Comparison
                </CardTitle>
                <CardDescription>
                  Compare IUL performance against market-only investments with detailed analysis.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MarketComparison />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Compliance & Reporting
                </CardTitle>
                <CardDescription>
                  Generate compliant client reports with basis for recommendation and NAIC Best Interest documentation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ComplianceReports />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}