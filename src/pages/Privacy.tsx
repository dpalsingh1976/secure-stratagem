import { Link } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-lg text-muted-foreground">
              Effective Date: October 2, 2025
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <main className="container mx-auto px-4 py-12">
        <article className="max-w-4xl mx-auto prose prose-slate dark:prose-invert">
          <div className="bg-card rounded-lg border p-6 mb-8">
            <p className="text-foreground leading-relaxed mb-4">
              Welcome to <strong>The Prosperity Financial</strong> ("<strong>Company</strong>," "<strong>we</strong>," "<strong>our</strong>," or "<strong>us</strong>"). We respect your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit <strong>theprosperityfinancial.com</strong> (the "<strong>Site</strong>") and when you use our services, including financial planning, insurance advisory, and any software-as-a-service (SaaS) tools we may provide (collectively, the "<strong>Services</strong>").
            </p>
            <p className="text-foreground leading-relaxed mb-4">
              By using our Site or Services, you agree to this Privacy Policy. If you do not agree with the terms of this Privacy Policy, please do not access the Site or use the Services.
            </p>
            <div className="bg-muted/50 border-l-4 border-primary p-4 rounded">
              <p className="text-sm text-muted-foreground mb-0">
                <strong>Regulatory Note (U.S.):</strong> Because we operate in financial services, certain information may be protected by state and federal laws, including the Gramm-Leach-Bliley Act ("GLBA"). Where GLBA or other law applies, we handle your information consistent with those requirements. This Privacy Policy applies to information not otherwise subject to GLBA or other sector-specific privacy laws.
              </p>
            </div>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-foreground">1. Quick "Notice at Collection" (What we collect and why)</h2>
            <p className="text-foreground leading-relaxed mb-4">
              We collect the following categories of personal information for the purposes listed below:
            </p>
            <ul className="space-y-3 text-foreground">
              <li><strong>Identifiers</strong> (e.g., name, email, phone, address, IP, device ID) → account setup, communication, security, fraud prevention.</li>
              <li><strong>Financial information</strong> (e.g., income, assets, liabilities, account balances, policy numbers) → financial planning and insurance recommendations; generating analyses and reports you request.</li>
              <li><strong>Protected classifications</strong> (if voluntarily provided) → to tailor recommendations when appropriate and as permitted by law.</li>
              <li><strong>Commercial information</strong> (e.g., products or services considered or purchased) → servicing your account, customer support, and improving our offerings.</li>
              <li><strong>Internet or network activity</strong> (e.g., logs, analytics, cookies) → Site performance, personalization, marketing analytics.</li>
              <li><strong>Geolocation data</strong> (approximate) → security, fraud prevention, and regional content.</li>
              <li><strong>Professional information</strong> (e.g., occupation, employer) → suitability assessments and product recommendations.</li>
              <li><strong>Inferences</strong> drawn from the above → to improve Services and provide smarter recommendations.</li>
            </ul>
            <p className="text-foreground leading-relaxed mt-4">
              We retain personal information <strong>only as long as necessary</strong> for the purposes described or as required by law, contracts, or legitimate business needs.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-foreground">2. Information You Provide Directly</h2>
            <p className="text-foreground leading-relaxed mb-4">
              We collect information you submit when you:
            </p>
            <ul className="space-y-2 text-foreground">
              <li>Create an account or fill out forms (e.g., fact-finding, DIME inputs, risk assessment, 7702 estimator, quotes, consultation requests).</li>
              <li>Upload documents (e.g., policy statements, IDs needed for verification, financial statements).</li>
              <li>Communicate with us (email, phone, chat, meetings) or participate in webinars and events.</li>
              <li>Use our SaaS tools (e.g., calculators, dashboards, client portals).</li>
            </ul>
            <p className="text-foreground leading-relaxed mt-4">
              This may include <strong>personal identifiers</strong>, <strong>financial data</strong>, <strong>household and beneficiary details</strong>, <strong>goals and time horizons</strong>, and other information used to deliver the Services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-foreground">3. Information Collected Automatically</h2>
            <p className="text-foreground leading-relaxed mb-4">
              When you visit the Site, we automatically collect certain information via cookies, pixels, web beacons, and log files, such as:
            </p>
            <ul className="space-y-2 text-foreground">
              <li>Device and browser information, IP address, and general location.</li>
              <li>Pages viewed, links clicked, time spent, and referring URL.</li>
              <li>Error logs and performance metrics.</li>
            </ul>
            <p className="text-foreground leading-relaxed mt-4">
              You can manage cookies through your browser settings. Disabling cookies may affect Site functionality. If required, we will present a cookie banner and obtain consent in applicable jurisdictions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-foreground">4. Information From Third Parties</h2>
            <p className="text-foreground leading-relaxed mb-4">
              We may receive information from:
            </p>
            <ul className="space-y-2 text-foreground">
              <li><strong>Insurance carriers and financial institutions</strong> (e.g., application or policy status, confirmations needed to provide Services you request).</li>
              <li><strong>Public sources</strong> and verification services.</li>
              <li><strong>Marketing/analytics providers</strong> and advertising networks.</li>
              <li><strong>Referral partners, agencies, or your advisors</strong> (with your authorization).</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-foreground">5. How We Use Personal Information</h2>
            <p className="text-foreground leading-relaxed mb-4">
              We use personal information to:
            </p>
            <ul className="space-y-2 text-foreground">
              <li>Provide, operate, and improve the Site and Services.</li>
              <li>Deliver financial planning and insurance analyses, including IUL, annuity, and risk assessments; produce reports you request.</li>
              <li>Verify identity, prevent fraud, and ensure security.</li>
              <li>Respond to inquiries and provide customer support.</li>
              <li>Send administrative notices, updates, and—where permitted—marketing communications.</li>
              <li>Personalize your experience and develop new features.</li>
              <li>Comply with legal/regulatory obligations and enforce our terms.</li>
            </ul>
            <p className="text-foreground leading-relaxed mt-4">
              We may aggregate or de-identify data for analytics and product improvement. Aggregated or de-identified data is not used to identify you.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-foreground">6. How We Share Personal Information</h2>
            <p className="text-foreground leading-relaxed mb-4">
              We <strong>do not sell</strong> your personal information. We may share information with:
            </p>
            <ul className="space-y-2 text-foreground">
              <li><strong>Service providers / processors</strong> (e.g., cloud hosting, CRM, analytics, payment processors, form tools, e-signature, identity verification) who are bound by contractual confidentiality and data protection obligations.</li>
              <li><strong>Insurance carriers, brokerages, and financial institutions</strong> when you ask us to obtain quotes, place business, or service policies.</li>
              <li><strong>Professional advisors</strong> (legal, compliance, accounting) under confidentiality.</li>
              <li><strong>Affiliates</strong> and <strong>business partners</strong> to support the Services you request or with your consent.</li>
              <li><strong>Law enforcement or regulators</strong> where required by law, regulation, subpoena, or to protect rights and safety.</li>
              <li><strong>Successors/assignees</strong> in the event of a merger, acquisition, or reorganization.</li>
            </ul>
            <p className="text-foreground leading-relaxed mt-4">
              We do not allow third parties to use your information for their own independent marketing without your consent.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-foreground">7. Financial Privacy (GLBA) & Sensitive Data</h2>
            <p className="text-foreground leading-relaxed mb-4">
              Certain information related to your financial products and services may be subject to GLBA and similar laws. Where GLBA applies, we provide additional disclosures as required and limit sharing accordingly.
            </p>
            <p className="text-foreground leading-relaxed">
              <strong>Health-related information:</strong> We do not seek medical information except as necessary to help you request insurance quotes or services. If health information is collected for underwriting (e.g., from paramedical exams or records), we handle it consistent with applicable privacy rules and carrier requirements.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-foreground">8. Your Privacy Choices & Rights</h2>
            <p className="text-foreground leading-relaxed mb-4">
              Depending on your location, you may have rights to:
            </p>
            <ul className="space-y-2 text-foreground">
              <li><strong>Access</strong> the personal information we maintain about you.</li>
              <li><strong>Correct</strong> inaccurate personal information.</li>
              <li><strong>Delete</strong> personal information (subject to legal exceptions).</li>
              <li><strong>Opt out</strong> of marketing communications.</li>
              <li><strong>Limit</strong> the use and disclosure of sensitive personal information (where applicable).</li>
            </ul>
            <p className="text-foreground leading-relaxed mt-4">
              To exercise rights, contact us at the email below. We will verify your request and respond within the timeframe required by applicable law. You may designate an authorized agent, subject to verification.
            </p>
            <p className="text-foreground leading-relaxed mt-4">
              <strong>Do Not Sell or Share:</strong> We do not sell personal information. If we begin using targeted advertising that constitutes "sharing" under certain state laws, we will provide a clear opt-out mechanism.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-foreground">9. Cookies, Analytics & Advertising</h2>
            <p className="text-foreground leading-relaxed">
              We may use first- and third-party cookies and similar technologies for analytics, performance, and (where permitted) advertising. You can control cookies via browser settings or opt-out tools offered by analytics/ads providers. If legally required, we will request consent for non-essential cookies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-foreground">10. Data Retention</h2>
            <p className="text-foreground leading-relaxed">
              We retain personal information for as long as necessary to fulfill the purposes outlined in this Policy, including to comply with legal, regulatory, tax, accounting, or reporting obligations, resolve disputes, and enforce agreements.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-foreground">11. Security</h2>
            <p className="text-foreground leading-relaxed">
              We implement reasonable and appropriate technical and organizational measures to protect personal information (e.g., encryption in transit, role-based access controls, least-privilege principles, employee training). However, no method of transmission or storage is 100% secure.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-foreground">12. Children's Privacy</h2>
            <p className="text-foreground leading-relaxed">
              Our Site and Services are not directed to children under 13 (or under 16 in certain jurisdictions). We do not knowingly collect personal information from children. If we learn that a child's information has been collected, we will delete it.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-foreground">13. International Users</h2>
            <p className="text-foreground leading-relaxed">
              We primarily process data in the United States. If you access the Site from outside the U.S., your information may be transferred to, stored, and processed in the U.S. or other countries with different data protection laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-foreground">14. Third-Party Links & Integrations</h2>
            <p className="text-foreground leading-relaxed">
              Our Site may contain links to third-party websites, plug-ins, and integrations. We do not control third-party sites and are not responsible for their privacy practices. We encourage you to review the privacy policies of any third-party services you use.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-foreground">15. Changes to This Policy</h2>
            <p className="text-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. The "Effective Date" above indicates the latest revision. Material changes will be posted on this page, and we may notify you by email or in-product messaging where appropriate.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-foreground">16. Contact Us</h2>
            <p className="text-foreground leading-relaxed mb-4">
              If you have questions, requests, or complaints regarding this Privacy Policy or our privacy practices, please contact us:
            </p>
            <div className="bg-card border rounded-lg p-6">
              <p className="text-foreground font-semibold mb-2">The Prosperity Financial</p>
              <p className="text-foreground">Email: <a href="mailto:privacy@theprosperityfinancial.com" className="text-primary hover:underline">privacy@theprosperityfinancial.com</a></p>
              <p className="text-foreground">Mailing Address: [Your Business Address, City, State ZIP, USA]</p>
              <p className="text-foreground">Phone: [Your Business Phone]</p>
            </div>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-bold mb-4 text-foreground">Optional Disclosures (Add if applicable)</h3>
            <ul className="space-y-4 text-foreground">
              <li>
                <strong>SMS/Email Marketing:</strong> If you opt in to receive SMS or email messages, we will use the contact information you provide to send updates and offers. You can opt out at any time following the instructions in the message.
              </li>
              <li>
                <strong>Financial Incentives:</strong> If we offer referral credits, discounts, or similar incentives that relate to personal information, we will describe the program terms, the categories of personal information involved, how to opt in/out, and how to exercise your rights without losing the incentive.
              </li>
              <li>
                <strong>Do Not Track:</strong> Our Site may not respond to Do Not Track signals. We will update this section if our practices change.
              </li>
            </ul>
          </section>

          <div className="border-t pt-6 mt-12">
            <p className="text-sm text-muted-foreground italic">
              This Privacy Policy is provided for informational purposes and does not constitute legal advice. Consider consulting counsel to tailor this Policy to your specific products, data flows, and regulatory obligations.
            </p>
          </div>
        </article>
      </main>
    </div>
  );
};

export default Privacy;
