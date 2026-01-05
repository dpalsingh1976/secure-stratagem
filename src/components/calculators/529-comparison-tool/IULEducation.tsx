import { BookOpen, Shield, AlertTriangle, Banknote, HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function IULEducation() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Understanding IUL</h3>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Why IUL Can Be Powerful (If Designed Correctly)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Indexed Universal Life (IUL) is a type of permanent life insurance that can serve as a flexible 
            savings vehicle. When properly designed for cash accumulation, it offers unique advantages—but 
            also requires careful management.
          </p>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="how-it-works">
              <AccordionTrigger className="text-sm font-medium">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  How Policy Loans Work
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-2">
                <p>
                  Unlike withdrawals, policy loans let you access cash value without triggering taxes—as long 
                  as the policy remains in force. The loan is technically borrowing against your death benefit.
                </p>
                <p>
                  <strong className="text-foreground">Key points:</strong>
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Loans accrue interest (typically 5-6%)</li>
                  <li>Unpaid loans reduce the death benefit</li>
                  <li>Cash value continues to grow even while you have loans</li>
                  <li>No required repayment schedule</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="family-bank">
              <AccordionTrigger className="text-sm font-medium">
                <div className="flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-primary" />
                  The "Family Bank" Concept
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-2">
                <p>
                  When designed with cash value as the primary goal, IUL can function as a personal "family 
                  bank"—a source of flexible, tax-advantaged capital you can access for various needs:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Education expenses (qualified or not)</li>
                  <li>Home down payments</li>
                  <li>Business opportunities</li>
                  <li>Emergency reserves</li>
                  <li>Retirement supplement</li>
                </ul>
                <p className="italic">
                  The key advantage: you control when and how to use the funds, without restrictions or 
                  penalties tied to specific uses.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="design">
              <AccordionTrigger className="text-sm font-medium">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-primary" />
                  Critical Design Requirements
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-2">
                <p>
                  <strong className="text-foreground">Not all IUL policies are equal.</strong> For cash 
                  accumulation, the policy must be specifically designed:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Max-funded:</strong> Premium paid at or near MEC limits</li>
                  <li><strong>Minimal death benefit:</strong> Just enough to stay within IRS guidelines</li>
                  <li><strong>Low cost structure:</strong> Carrier and design matter significantly</li>
                  <li><strong>Proper indexing strategy:</strong> Match your risk tolerance</li>
                </ul>
                <p className="italic">
                  An improperly designed IUL—such as one sold primarily for death benefit—may have poor 
                  cash value performance.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="risks">
              <AccordionTrigger className="text-sm font-medium">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Key Risks & Warnings
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-3">
                <div className="space-y-2">
                  <p className="font-medium text-foreground">MEC Risk</p>
                  <p>
                    If you contribute too much, the policy becomes a Modified Endowment Contract (MEC), 
                    losing tax-free loan advantages. Proper design avoids this.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <p className="font-medium text-foreground">Policy Lapse Risk</p>
                  <p>
                    If loans plus interest exceed cash value, the policy can lapse—potentially triggering 
                    a large tax bill. Monitor loan-to-value ratios carefully.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <p className="font-medium text-foreground">Underwriting Required</p>
                  <p>
                    IUL requires medical underwriting. Health issues can affect costs or eligibility. 
                    Consider applying when young and healthy.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="font-medium text-foreground">Illustrated Values Are Not Guaranteed</p>
                  <p>
                    Index returns, caps, and participation rates can change. Always review the guaranteed 
                    minimum scenario, not just illustrated projections.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mt-4">
            <p className="text-sm text-amber-800 dark:text-amber-200 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                <strong>Important:</strong> This comparison uses illustrative assumptions. Actual IUL 
                performance depends on carrier, design, market conditions, and policy management. 
                Consult a licensed professional for personalized advice.
              </span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
