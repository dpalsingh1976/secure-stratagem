import { AlertTriangle } from "lucide-react";

export const ComplianceFooter = () => {
  return (
    <div className="bg-amber-50 dark:bg-amber-950/20 border-t border-amber-200 dark:border-amber-800 py-3">
      <div className="container-financial text-center">
        <p className="text-sm text-amber-800 dark:text-amber-200 flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>
            <strong>Educational illustration only</strong> — not tax, legal, or investment advice. 
            Consult a qualified professional for personalized guidance.
          </span>
        </p>
      </div>
    </div>
  );
};
