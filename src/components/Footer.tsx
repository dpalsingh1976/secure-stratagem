import { useState } from "react";
import { Shield, Phone, Mail, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import AssessmentModal from "@/components/AssessmentModal";

const Footer = () => {
  const [isAssessmentOpen, setIsAssessmentOpen] = useState(false);
  
  return (
    <footer className="bg-foreground text-white">
      {/* Call to action section */}
      <div className="bg-gradient-primary py-16">
        <div className="container-financial text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4 font-heading">
            Ready to Secure Your Family's Future?
          </h2>
          <p className="text-xl opacity-95 mb-8 max-w-2xl mx-auto">
            Take the first step towards comprehensive financial protection. 
            Your 5-minute assessment could save your family decades of financial stress.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              className="text-lg px-8 py-4 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
              onClick={() => setIsAssessmentOpen(true)}
            >
              Start Free Assessment Now
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="text-white border-white/30 hover:bg-white/10 text-lg px-8 py-4"
            >
              <Phone className="w-5 h-5 mr-2" />
              Call for Consultation
            </Button>
          </div>
        </div>
      </div>

      {/* Main footer content */}
      <div className="py-16 bg-slate-900">
        <div className="container-financial">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Company info */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <Shield className="w-8 h-8 text-accent" />
                <span className="text-2xl font-bold font-heading">Smart Risk Analyzer</span>
              </div>
              <p className="text-gray-300 mb-6 leading-relaxed">
                AI-powered financial risk assessment platform helping families identify 
                and address critical protection gaps across Life Insurance, Longevity, 
                Market, and Tax risks.
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  <span>Licensed & Insured</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>24/7 Support</span>
                </div>
              </div>
            </div>

            {/* Quick links */}
            <div>
              <h3 className="text-lg font-semibold mb-6 font-heading">Assessment</h3>
              <ul className="space-y-3 text-gray-300">
                <li><a href="#" className="hover:text-accent transition-colors">Start Assessment</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Risk Categories</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">How It Works</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Sample Report</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">FAQ</a></li>
              </ul>
            </div>

            {/* Contact info */}
            <div>
              <h3 className="text-lg font-semibold mb-6 font-heading">Contact</h3>
              <div className="space-y-4 text-gray-300">
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">1-800-RISK-PRO</div>
                    <div className="text-sm text-gray-400">Mon-Fri 8AM-8PM EST</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">support@smartriskanalyzer.com</div>
                    <div className="text-sm text-gray-400">Response within 2 hours</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">Nationwide Service</div>
                    <div className="text-sm text-gray-400">Licensed in all 50 states</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom section */}
          <div className="border-t border-gray-700 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-gray-400 text-sm">
                © 2024 Smart Risk Analyzer. All rights reserved.
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-400">
                <a href="#" className="hover:text-accent transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-accent transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-accent transition-colors">Disclosures</a>
                <a href="#" className="hover:text-accent transition-colors">Licenses</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency notice */}
      <div className="bg-accent py-2">
        <div className="container-financial text-center">
          <p className="text-sm font-medium text-white">
            🚨 Important: Life insurance rates increase with age. Every year you wait costs more. Get your assessment today.
          </p>
        </div>
      </div>
      
      <AssessmentModal 
        open={isAssessmentOpen} 
        onOpenChange={setIsAssessmentOpen} 
      />
    </footer>
  );
};

export default Footer;