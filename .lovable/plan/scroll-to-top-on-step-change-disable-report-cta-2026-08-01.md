# Scroll-to-top on step change + disable report CTA

## 1. Page starts at the top when moving to the next step

The multi-step Risk Intake wizard changes step without resetting scroll position, so after clicking "Next Step" the browser stays scrolled where it was (near the bottom, at the navigation buttons).

Fix: scroll the window to the top whenever the wizard step changes in `src/pages/RiskIntake.tsx` (same pattern already used in the Annuity Intake and 529 tools). Route-level navigation already scrolls to top via the existing `ScrollToTop` component, so no change there.

Also apply the same step-change scroll reset to the other multi-step flows that lack it (Assessment/Enhanced Assessment modals scroll their own container to top on step change).

## 2. Turn off the "Ready to Implement These Recommendations?" section

That bottom CTA bar lives in `src/components/financial/ReportModal.tsx` (a sticky bar with "Get Term Quote Now" and "Book Strategy Session").

Fix: add a single feature flag constant at the top of the file:

```ts
// Set to true to show the bottom "Ready to Implement These Recommendations?" CTA bar
const ENABLE_REPORT_CTA = false;
```

The CTA renders only when the flag is true. Nothing is deleted, so re-enabling later is a one-word change: set `ENABLE_REPORT_CTA = true` in `src/components/financial/ReportModal.tsx`.

The same CTA block also exists in `src/components/ResultsModal.tsx` and `src/pages/Results.tsx`; those get the same flag so the section is hidden consistently everywhere.

## Technical notes

- `RiskIntake.tsx`: `useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [currentStep])`.
- `ReportModal.tsx`: gate `{showCTA && (...)}` behind `{ENABLE_REPORT_CTA && showCTA && (...)}`; the 10-second timer that sets `showCTA` stays as-is.
- No calculation, data, or database changes.
