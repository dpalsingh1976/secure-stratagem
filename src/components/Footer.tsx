import { Shield, Phone, Mail, Clock, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-white">
      {/* Main footer content */}
      <div className="py-16 bg-slate-900">
        <div className="container-financial">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Company info */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-1.5 bg-gradient-primary rounded-lg">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <span className="text-2xl font-bold font-heading">Secure Future Planner</span>
              </div>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Advanced financial risk assessment platform helping families identify 
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


            {/* Contact info */}
            <div>
              <h3 className="text-lg font-semibold mb-6 font-heading">Contact</h3>
              <div className="space-y-4 text-gray-300">
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">646-284-4268</div>
                    <div className="text-sm text-gray-400">Mon-Fri 8AM-8PM EST</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">davindes@theprosperityfinancial.com</div>
                    <div className="text-sm text-gray-400">Response within 2 hours</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">Nationwide Service</div>
                    <div className="text-sm text-gray-400">Licensed in 10 states</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom section */}
          <div className="border-t border-gray-700 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-gray-400 text-sm">
                © 2025 Secure Future Planner. All rights reserved.
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
    </footer>
  );
};

export default Footer;