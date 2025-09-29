import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TestTube } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const StressTesting = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation />
      <div className="container-financial py-16">
        <div className="text-center mb-12">
          <TestTube className="w-16 h-16 text-accent mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-4">Stress Testing Tool</h1>
          <p className="text-xl text-muted-foreground">
            Compare permanent policies (IUL) vs. traditional investments under various scenarios
          </p>
        </div>

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Coming Soon - Phase 2</CardTitle>
            <CardDescription>
              This tool will allow you to stress test different investment scenarios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-muted-foreground">
              <p><strong>Planned Features:</strong></p>
              <p>• Compare IUL vs. 401(k) vs. Brokerage accounts</p>
              <p>• Model different market conditions (bear markets, crashes, recoveries)</p>
              <p>• Analyze sequence of returns risk</p>
              <p>• Project tax-free vs. taxable income streams</p>
              <p>• Visualize downside protection scenarios</p>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default StressTesting;
