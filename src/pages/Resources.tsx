import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const Resources = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation />
      <div className="container-financial py-16">
        <div className="text-center mb-12">
          <BookOpen className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-4">Resources</h1>
          <p className="text-xl text-muted-foreground">
            Educational content, FAQs, glossary, and important disclosures
          </p>
        </div>

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
            <CardDescription>
              This section will include comprehensive resources to help you make informed financial decisions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-muted-foreground">
              <p>• Frequently Asked Questions (FAQ)</p>
              <p>• Financial Glossary</p>
              <p>• Educational Articles</p>
              <p>• Legal Disclosures</p>
              <p>• Licensing Information</p>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default Resources;
