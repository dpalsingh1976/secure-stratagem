import { Shield, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-white border-t">
      {/* Main Footer */}
      <div className="py-16">
        <div className="container-financial">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Brand Column */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-gradient-primary rounded-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold font-heading text-primary">Prosperity Financial</span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Professional financial risk assessment and retirement planning solutions.
              </p>
            </div>

            {/* Solutions Column */}
            <div>
              <h3 className="text-sm font-semibold mb-4 text-foreground uppercase tracking-wide">Solutions</h3>
              <div className="space-y-3">
                <Link
                  to="/iul-banking"
                  className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  IUL Banking
                </Link>
                <Link
                  to="/admin/risk-intake"
                  className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Risk Assessment
                </Link>
                <Link
                  to="/admin/risk-intake"
                  className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Term Insurance
                </Link>
                <Link
                  to="/annuity-calculator"
                  className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Annuities
                </Link>
              </div>
            </div>

            {/* Resources Column */}
            <div>
              <h3 className="text-sm font-semibold mb-4 text-foreground uppercase tracking-wide">Resources</h3>
              <div className="space-y-3">
                <a
                  href="/#calculators"
                  className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Calculators
                </a>
                <Link
                  to="/resources"
                  className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Case Studies
                </Link>
                <Link
                  to="/resources"
                  className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  FAQ
                </Link>
                <Link
                  to="/contact"
                  className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Contact
                </Link>
              </div>
            </div>

            {/* Contact Column */}
            <div>
              <h3 className="text-sm font-semibold mb-4 text-foreground uppercase tracking-wide">Contact</h3>
              <div className="space-y-3">
                <a
                  href="mailto:davindes@theprosperityfinancial.com"
                  className="flex items-start gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>davindes@theprosperityfinancial.com</span>
                </a>
                <a
                  href="tel:646-284-4268"
                  className="flex items-start gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>646-284-4268</span>
                </a>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Licensed Professional</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-slate-50 py-6">
        <div className="container-financial">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
            <p>© 2025 Prosperity Financial. All rights reserved. This site is for educational purposes only.</p>
            <div className="flex items-center gap-4">
              <Link to="/privacy" className="hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <span>•</span>
              <a href="#" className="hover:text-primary transition-colors">
                Terms of Service
              </a>
              <span>•</span>
              <a href="#" className="hover:text-primary transition-colors">
                Disclosures
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
