import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Scale,
  FileText,
  Shield,
  Users,
  Clock,
  Heart,
  CheckCircle,
  XCircle,
  HelpCircle,
  Award,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";

const EstatePlanning = () => {
  const benefitCards = [
    {
      icon: Users,
      title: "You Decide Who Gets Your Assets",
      description:
        "Without a Will, state law dictates who gets your assets. Make sure your wishes are known and legally documented.",
    },
    {
      icon: Shield,
      title: "Takes Care of Your Children",
      description:
        "Name a Guardian in your Will to avoid courts deciding who has care, custody, and control of your children.",
    },
    {
      icon: Clock,
      title: "Avoid Probate",
      description: "Creating a Revocable Living Trust saves your family the time and expense of the probate process.",
    },
    {
      icon: Heart,
      title: "Control Medical Decisions",
      description:
        "Medical Power of Attorney and Living Will let you decide who makes healthcare decisions if you're unable.",
    },
  ];

  const documents = [
    {
      title: "Last Will and Testament",
      description:
        "A legal document that directs how your assets should be distributed after death. It also names guardians for minor children and an executor to manage your estate through probate.",
    },
    {
      title: "Revocable Living Trust",
      description:
        "A legal arrangement that holds your assets during your lifetime and transfers them to beneficiaries after death without probate. You maintain full control and can modify it anytime.",
    },
    {
      title: "Medical Power of Attorney",
      description:
        "Designates a trusted person to make healthcare decisions on your behalf if you become incapacitated and cannot communicate your wishes.",
    },
    {
      title: "Living Will / Advanced Directive",
      description:
        "Documents your end-of-life care wishes, including preferences about life support, resuscitation, and other medical interventions.",
    },
    {
      title: "Financial Power of Attorney",
      description:
        "Designates someone to manage your financial affairs, pay bills, and handle business matters if you become unable to do so yourself.",
    },
    {
      title: "HIPAA Authorization",
      description:
        "Allows designated persons to access your medical information and communicate with healthcare providers on your behalf.",
    },
  ];

  const faqItems = [
    {
      question: "What happens if I die without a Will?",
      answer:
        "If you die without a Will (called 'intestate'), state laws determine how your assets are distributed. This typically means assets go to your closest relatives in a predetermined order, which may not match your wishes. Courts will also decide who becomes guardian of any minor children.",
    },
    {
      question: "Can I change my estate plan later?",
      answer:
        "Yes, you can and should update your estate plan as life circumstances change. Revocable trusts and wills can be amended or completely rewritten. Major life events like marriage, divorce, birth of children, or significant asset changes are good times to review your plan.",
    },
    {
      question: "What's the difference between an executor and a trustee?",
      answer:
        "An executor is named in your Will to manage your estate through probate court after death. A trustee manages assets held in a trust, which can begin during your lifetime. A trustee can serve both while you're alive (if incapacitated) and after death, avoiding probate entirely.",
    },
    {
      question: "Do I need both a Will and a Trust?",
      answer:
        "Many estate plans include both. A Trust handles assets placed into it and avoids probate. A 'pour-over' Will acts as a safety net, directing any assets not in the trust to be transferred to it after death. The Will also names guardians for minor children.",
    },
    {
      question: "How often should I update my estate plan?",
      answer:
        "Review your estate plan every 3-5 years or whenever major life events occur: marriage, divorce, birth or adoption of children, death of a beneficiary, significant changes in assets, moving to a new state, or changes in tax laws.",
    },
    {
      question: "What is a 'pour-over' Will?",
      answer:
        "A pour-over Will works alongside a living trust. It directs that any assets not already in your trust at death should 'pour over' into the trust. This ensures all assets eventually benefit from your trust's distribution plan, though poured-over assets still go through probate.",
    },
  ];

  const needsEstatePlanning = [
    "You have minor children (guardianship matters)",
    "You own real estate or significant assets",
    "You want to avoid probate costs and delays",
    "You have specific wishes for asset distribution",
    "You want to protect your family during incapacity",
    "You have a blended family situation",
  ];

  const misconceptions = [
    {
      myth: "I'm too young for estate planning",
      reality: "Incapacity can happen at any age due to accidents or illness",
    },
    {
      myth: "Estate planning is only for the wealthy",
      reality: "It's about control and protecting your family, not just taxes",
    },
    { myth: "My spouse will automatically get everything", reality: "State laws vary and may not match your wishes" },
    { myth: "I told my family my wishes, that's enough", reality: "Verbal wishes are not legally binding" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <Scale className="h-5 w-5" />
              <span className="text-sm font-medium">Estate Planning Education</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Protect Your Wealth and Health</h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              A comprehensive guide to understanding wills, trusts, and estate planning. Learn how to protect your
              family and ensure your wishes are honored.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-full border">
                <Award className="h-4 w-4 text-primary" />
                <span>Attorney-Led Planning</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-full border">
                <Shield className="h-4 w-4 text-primary" />
                <span>Nationwide Service</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-full border">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>Award-Winning</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Estate Planning Matters */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Why Is Estate Planning Important?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A comprehensive and up-to-date Estate Plan is critical to protect you and your family. Here are the key
              reasons everyone needs an estate plan.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {benefitCards.map((card, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <card.icon className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{card.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{card.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Will vs Trust Comparison */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Will vs Trust: Understanding the Difference</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Both wills and trusts are essential estate planning tools, but they serve different purposes and offer
              different benefits.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
            {/* Will Card */}
            <Card className="border-2">
              <CardHeader className="bg-secondary/30">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <CardTitle className="text-2xl">What is a Will?</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>A legal document that takes effect after death</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Goes through probate (court process)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Eye className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span>Becomes public record</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Names guardians for minor children</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Names an executor to manage your estate</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Trust Card */}
            <Card className="border-2 border-primary/20">
              <CardHeader className="bg-primary/10">
                <div className="flex items-center gap-3">
                  <Lock className="h-8 w-8 text-primary" />
                  <CardTitle className="text-2xl">What is a Trust?</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Takes effect during your lifetime</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Avoids probate entirely</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <EyeOff className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Remains private</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Provides continuous management if incapacitated</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Detailed distribution instructions</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Higher upfront cost, lower long-term cost</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Comparison Table */}
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-center">Quick Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Feature</th>
                      <th className="text-center py-3 px-4 font-semibold">Will</th>
                      <th className="text-center py-3 px-4 font-semibold">Trust</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-3 px-4">Probate Required</td>
                      <td className="text-center py-3 px-4 text-destructive">Yes</td>
                      <td className="text-center py-3 px-4 text-primary">No</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Privacy</td>
                      <td className="text-center py-3 px-4 text-destructive">Public</td>
                      <td className="text-center py-3 px-4 text-primary">Private</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">When Effective</td>
                      <td className="text-center py-3 px-4">After death</td>
                      <td className="text-center py-3 px-4">During life & after</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Initial Cost</td>
                      <td className="text-center py-3 px-4 text-primary">Lower</td>
                      <td className="text-center py-3 px-4 text-destructive">Higher</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Incapacity Protection</td>
                      <td className="text-center py-3 px-4 text-destructive">No</td>
                      <td className="text-center py-3 px-4 text-primary">Yes</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">Best For</td>
                      <td className="text-center py-3 px-4">Simple estates</td>
                      <td className="text-center py-3 px-4">Complex estates, privacy</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Types of Documents */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Types of Estate Planning Documents</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A complete estate plan typically includes several important documents. Understanding each one helps you
              make informed decisions.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {documents.map((doc, index) => (
                <AccordionItem key={index} value={`doc-${index}`} className="bg-background rounded-lg border px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <span className="font-semibold text-left">{doc.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4">{doc.description}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Who Needs Estate Planning */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Who Needs Estate Planning?</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* You Need Estate Planning */}
            <Card className="border-primary/20">
              <CardHeader className="bg-primary/5">
                <CardTitle className="flex items-center gap-2 text-primary">
                  <CheckCircle className="h-6 w-6" />
                  You Need Estate Planning If...
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-3">
                  {needsEstatePlanning.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Common Misconceptions */}
            <Card className="border-destructive/20">
              <CardHeader className="bg-destructive/5">
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <XCircle className="h-6 w-6" />
                  Common Misconceptions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-4">
                  {misconceptions.map((item, index) => (
                    <li key={index} className="space-y-1">
                      <div className="flex items-start gap-3">
                        <XCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                        <span className="font-medium">"{item.myth}"</span>
                      </div>
                      <p className="text-sm text-muted-foreground ml-8">Reality: {item.reality}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* The Probate Problem */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">The Probate Problem</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Understanding why many families choose to avoid probate through proper estate planning.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* What is Probate */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-destructive" />
                    What is Probate?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Probate is the court-supervised legal process that validates a will, identifies assets, pays debts,
                    and distributes property to heirs.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-destructive" />
                      <span>
                        <strong>Time:</strong> 6-18 months (sometimes years)
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Scale className="h-4 w-4 text-destructive" />
                      <span>
                        <strong>Cost:</strong> 3-8% of estate value
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-destructive" />
                      <span>
                        <strong>Privacy:</strong> Public record
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* How Trust Avoids Probate */}
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    How a Trust Avoids Probate
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Assets held in a living trust pass directly to beneficiaries without court involvement, saving time
                    and money.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span>
                        <strong>Time:</strong> Days to weeks
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span>
                        <strong>Cost:</strong> Minimal administrative fees
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <EyeOff className="h-4 w-4 text-primary" />
                      <span>
                        <strong>Privacy:</strong> Completely private
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Questions to Consider</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Common questions about estate planning to help you understand your options.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqItems.map((item, index) => (
                <AccordionItem key={index} value={`faq-${index}`} className="bg-card rounded-lg border px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <HelpCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="font-semibold text-left">{item.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4">{item.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* About NetLaw Section */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <Award className="h-5 w-5" />
              <span className="text-sm font-medium">Our Estate Planning Partner</span>
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">Easy. Online. Estate Planning.</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              We partner with NetLaw, an award-winning estate planning service recognized by the American Bar
              Association with the James I. Keane Award for Innovative Excellence. Their approach is personal,
              conversational, digital, and done right.
            </p>

            <div className="grid sm:grid-cols-3 gap-6 mb-8">
              <div className="flex flex-col items-center gap-2 p-4 bg-background rounded-lg">
                <Award className="h-8 w-8 text-primary" />
                <span className="font-semibold">Award-Winning</span>
                <span className="text-sm text-muted-foreground">ABA Recognition</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 bg-background rounded-lg">
                <Users className="h-8 w-8 text-primary" />
                <span className="font-semibold">Attorney-Led</span>
                <span className="text-sm text-muted-foreground">Licensed Professionals</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 bg-background rounded-lg">
                <Shield className="h-8 w-8 text-primary" />
                <span className="font-semibold">All 50 States</span>
                <span className="text-sm text-muted-foreground">Nationwide Coverage</span>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>
                For more information: <strong>1-888-604-4789</strong> | Support@netlawinc.com
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance Disclaimer */}
      <div className="sticky bottom-0 z-40 bg-amber-50 dark:bg-amber-950/50 border-t border-amber-200 dark:border-amber-800 py-3">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2 text-sm text-amber-800 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <p>Educational illustration only—not legal, tax, or investment advice. Consult a qualified professional.</p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default EstatePlanning;
