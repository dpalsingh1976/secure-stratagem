import React from 'react';
import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface FieldHelpProps {
  /** Short, plain-language explanation of what the field means and why it is asked. */
  children: React.ReactNode;
}

/**
 * The "?" icon shown next to a form label. Every "?" must carry an explanation —
 * never render a bare help icon without content.
 */
export function FieldHelp({ children }: FieldHelpProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="More information about this field"
          className="inline-flex items-center text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
        >
          <HelpCircle className="h-4 w-4 cursor-help" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs leading-relaxed">
        {children}
      </TooltipContent>
    </Tooltip>
  );
}

/** Label + "?" helper row, so labels and explanations stay visually consistent. */
export function LabelWithHelp({
  htmlFor,
  label,
  help,
  className,
}: {
  htmlFor?: string;
  label: React.ReactNode;
  help: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ''}`}>
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
      </label>
      <FieldHelp>{help}</FieldHelp>
    </div>
  );
}
