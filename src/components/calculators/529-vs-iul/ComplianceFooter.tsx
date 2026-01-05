import { AlertTriangle, ShieldCheck } from "lucide-react";

export function ComplianceFooter() {
  return (
    <div className="bg-muted/50 border border-border rounded-lg p-6 space-y-4">
      <div className="flex items-center gap-2 text-foreground">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <h4 className="font-semibold">Important Disclosures</h4>
      </div>

      <div className="grid gap-3 md:grid-cols-2 text-xs text-muted-foreground">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-500" />
          <p>
            <strong className="text-foreground">Educational Only:</strong> This comparison is for 
            educational purposes and uses simplified assumptions. It is not financial, tax, or legal advice.
          </p>
        </div>

        <div className="flex items-start gap-2">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-500" />
          <p>
            <strong className="text-foreground">529 Rules Vary:</strong> 529 plan rules vary by state. 
            State tax benefits, contribution limits, and qualified expenses differ. Consult a tax professional.
          </p>
        </div>

        <div className="flex items-start gap-2">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-500" />
          <p>
            <strong className="text-foreground">IUL Requires Underwriting:</strong> Life insurance 
            requires medical underwriting. Costs and performance vary by carrier, design, and individual health.
          </p>
        </div>

        <div className="flex items-start gap-2">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-500" />
          <p>
            <strong className="text-foreground">Policy Loan Risks:</strong> Policy loans and withdrawals 
            can affect the policy's cash value and death benefit, and may cause the policy to lapse.
          </p>
        </div>

        <div className="flex items-start gap-2 md:col-span-2">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-500" />
          <p>
            <strong className="text-foreground">No Guarantees:</strong> Projected values are hypothetical 
            and based on assumed rates of return. Actual returns will vary. Past performance does not 
            guarantee future results. No returns are guaranteed.
          </p>
        </div>
      </div>

      <p className="text-xs text-center text-muted-foreground pt-2 border-t border-border">
        For personalized advice, please consult with a qualified financial advisor, tax professional, 
        or insurance specialist.
      </p>
    </div>
  );
}
