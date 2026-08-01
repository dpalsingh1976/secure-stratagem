import * as React from "react"

import { cn } from "@/lib/utils"

const isZeroValue = (v: string) => /^0+(\.0+)?$/.test(v.trim());

const placeCaret = (el: HTMLInputElement) => {
  if (isZeroValue(el.value)) {
    el.select();
    return;
  }
  try {
    el.setSelectionRange(0, 0);
  } catch {
    /* unsupported input type */
  }
};

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, onFocus, onMouseUp, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        onFocus={(e) => {
          placeCaret(e.currentTarget);
          onFocus?.(e);
        }}
        onMouseUp={(e) => {
          // Keep the caret/selection at the start for default "0" values;
          // real values stay click-positionable.
          if (isZeroValue(e.currentTarget.value)) e.currentTarget.select();
          onMouseUp?.(e);
        }}

        {...props}
      />
    )
  }
)

Input.displayName = "Input"

export { Input }
