# Switch income inputs to monthly, after-tax

## What changes for the user

- All income fields in the financial intake become **monthly**, not annual: client W-2, business, rental, Social Security, and the same fields for the spouse.
- W-2 fields are labeled **"Monthly W-2 Income (after tax / take-home)"** with helper text: "Enter your net take-home pay after taxes and payroll deductions." for both client and spouse.
- Placeholders updated to monthly-scale examples (e.g. 7,500 instead of 120,000).
- The Cash Flow Summary compares monthly income directly to monthly expenses (no more divide-by-12), so "Available for Savings" stays correct.
- Anywhere a report needs a yearly figure (DIME income replacement, Roth eligibility, tax drag), it is derived as monthly x 12 so numbers stay consistent.

## Technical detail

Income semantics flip from ANNUAL to MONTHLY (after-tax for W-2). This reverses the prior annual refactor, so every call site must be revisited.

1. `src/utils/householdIncome.ts` — restate helpers as monthly: `clientEarnedIncome`, `spouseEarnedIncome`, `householdEarnedIncome`, `householdTotalIncome`, `householdSocialSecurity`, `survivingSpouseIncome` all return monthly values. Add explicit annualized wrappers (`householdAnnualEarnedIncome`, `clientAnnualEarnedIncome`, `survivingSpouseAnnualIncome`) = monthly x 12 for consumers that need yearly numbers. Update the file's doc comment.
2. `src/components/financial/IncomeExpensesForm.tsx` — relabel card to "Monthly Income Sources", W-2 labels to after-tax/take-home with helper text, spouse card to "Spouse / Partner Monthly Income", monthly placeholders; cash flow summary uses monthly income directly.
3. `src/utils/riskComputation.ts` — use the annualized wrappers for DIME income replacement (10 x annual), tax score income base, and keep the disability calc on monthly (drop the `/12`).
4. `src/components/financial/ReportModal.tsx` — DIME breakdown uses annualized income; monthly displays (disability, LTC, cash flow) use monthly income directly instead of dividing by 12.
5. Engines — replace `/ 12` conversions with direct monthly use, and add `* 12` where an annual figure is required:
   - `src/engine/retirement/allocationEngine.ts` (`calculateMonthlyIncome` / `calculateAnnualIncome`, Roth limits, employer match, high-income threshold)
   - `src/engine/retirement/annuitySuitability.ts`, `iulSuitability.ts`, `bestInterestGuardrails.ts`, `recommendations.ts`, `scenarioSimulator.ts`, `projection.ts`
6. `src/utils/assessmentDataMapper.ts` — keep its own annual bracket input, but convert to monthly when populating `IncomeExpensesData` so the mapper matches the new semantics.
7. Update `mem://features/dime-income-calculation-logic` and `mem://features/spouse-household-income` to record that income fields are MONTHLY and W-2 is after-tax.

No database or edge function changes: these fields are stored as-is and only interpretation/labels change. Previously saved records were entered as annual; existing rows are not migrated.
