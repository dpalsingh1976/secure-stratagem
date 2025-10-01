import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Shield, Mail, Phone, MapPin, Award, Users, Target } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { toast } from '@/hooks/use-toast';

export default function About() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Message sent",
      description: "We'll get back to you within 24 hours.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container-financial">
          <div className="max-w-3xl mx-auto text-center">
            <Shield className="w-16 h-16 text-primary mx-auto mb-4" />
            <h1 className="text-4xl lg:text-5xl font-bold mb-6 font-heading">
              About Secure Future Planner
            </h1>
            <p className="text-xl text-muted-foreground">
              Empowering individuals and families to make informed financial decisions through 
              professional-grade tools and personalized retirement planning strategies.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="section-padding">
        <div className="container-financial">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="card-financial text-center">
              <CardHeader>
                <div className="mx-auto mb-4 p-4 bg-gradient-primary rounded-full w-fit">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl">Our Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  To provide accessible, comprehensive financial planning tools that help individuals 
                  understand their retirement risks and opportunities.
                </p>
              </CardContent>
            </Card>

            <Card className="card-financial text-center">
              <CardHeader>
                <div className="mx-auto mb-4 p-4 bg-gradient-secondary rounded-full w-fit">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl">Our Expertise</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Professional-grade calculators and AI-powered insights backed by decades of 
                  financial planning experience and industry best practices.
                </p>
              </CardContent>
            </Card>

            <Card className="card-financial text-center">
              <CardHeader>
                <div className="mx-auto mb-4 p-4 bg-gradient-accent rounded-full w-fit">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl">Our Commitment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Transparent, unbiased analysis that puts your financial security first, with 
                  clear recommendations and actionable next steps.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* What We Offer */}
      <section className="section-padding bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container-financial">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 font-heading">
              What We Offer
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools and resources for retirement planning
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            <Card className="card-financial">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-2">Risk Assessment Tools</h3>
                <p className="text-muted-foreground">
                  Comprehensive DIME analysis to calculate your exact life insurance needs based on 
                  debts, income, mortgage, and education expenses.
                </p>
              </CardContent>
            </Card>

            <Card className="card-financial">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-2">Retirement Calculators</h3>
                <p className="text-muted-foreground">
                  Advanced calculators for tax-free retirement planning, IUL vs 401(k) comparisons, 
                  annuity income projections, longevity risk, and inflation stress testing.
                </p>
              </CardContent>
            </Card>

            <Card className="card-financial">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-2">AI-Powered Policy Analysis</h3>
                <p className="text-muted-foreground">
                  Upload your insurance policies for intelligent analysis that identifies coverage 
                  gaps and optimization opportunities.
                </p>
              </CardContent>
            </Card>

            <Card className="card-financial">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-2">Professional Reports</h3>
                <p className="text-muted-foreground">
                  Detailed PDF reports with clear visualizations, personalized recommendations, 
                  and actionable next steps for your financial journey.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="section-padding">
        <div className="container-financial">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4 font-heading">
                Get in Touch
              </h2>
              <p className="text-xl text-muted-foreground">
                Have questions? We're here to help you plan your secure future.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="card-financial">
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                  <CardDescription>Reach out to us directly</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <div className="font-semibold">Email</div>
                      <div className="text-muted-foreground">contact@securefutureplanner.com</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <div className="font-semibold">Phone</div>
                      <div className="text-muted-foreground">1-800-SECURE-1 (1-800-732-8731)</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <div className="font-semibold">Office</div>
                      <div className="text-muted-foreground">
                        123 Financial Plaza<br />
                        Suite 500<br />
                        New York, NY 10001
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="font-semibold mb-2">Business Hours</div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>Monday - Friday: 9:00 AM - 6:00 PM EST</div>
                      <div>Saturday: 10:00 AM - 2:00 PM EST</div>
                      <div>Sunday: Closed</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-financial">
                <CardHeader>
                  <CardTitle>Send Us a Message</CardTitle>
                  <CardDescription>We'll respond within 24 hours</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" placeholder="John Doe" required className="mt-2" />
                    </div>

                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="john@example.com" required className="mt-2" />
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone (Optional)</Label>
                      <Input id="phone" type="tel" placeholder="(555) 123-4567" className="mt-2" />
                    </div>

                    <div>
                      <Label htmlFor="message">Message</Label>
                      <Textarea 
                        id="message" 
                        placeholder="Tell us how we can help..." 
                        required 
                        className="mt-2 min-h-[120px]"
                      />
                    </div>

                    <Button type="submit" className="w-full">
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
