import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Landmark, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const IULBanking = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation />
      <div className="container-financial py-16">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Landmark className="w-16 h-16 text-primary" />
            <Lock className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-4xl font-bold mb-4">IUL / Infinite Banking</h1>
          <p className="text-xl text-muted-foreground">
            Members-only educational content on Index Universal Life and the Infinite Banking Concept
          </p>
        </div>

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Members-Only Access Required</CardTitle>
            <CardDescription>
              This content is available to registered members only
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4 text-muted-foreground">
              <p><strong>What you'll learn (Members-only):</strong></p>
              <p>• How Infinite Banking works with IUL policies</p>
              <p>• Using policy loans for purchases and opportunities</p>
              <p>• Understanding caps, floors, and crediting methods</p>
              <p>• Common misconceptions about IUL</p>
              <p>• Risk considerations and suitability analysis</p>
              <p>• Interactive calculators and scenario modeling</p>
            </div>

            <div className="flex gap-4 justify-center pt-6">
              <Button onClick={() => navigate('/auth')} className="btn-primary">
                Sign In / Register
              </Button>
              <Button variant="outline" onClick={() => navigate('/')}>
                Learn More
              </Button>
            </div>

            <p className="text-sm text-center text-muted-foreground pt-4">
              Coming Soon - Phase 3: Full educational content and interactive tools
            </p>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default IULBanking;
