# Remove spouse income from the risk assessment

## What changes for the user

- The "Spouse / Partner Monthly Income" card disappears from the financial intake. No spouse W-2, business, Social Security, or "spouse income continues" checkbox.
- Every risk number is calculated for the individual only: cash flow, retirement projection, allocation capacity, IUL/annuity suitability, and the DIME life insurance need.
- Life insurance need is now `10 x (monthly after-tax income x 12)` with no surviving-spouse deduction. With $10,000/mo entered, Income Replacement reads $1,200,000.
- Income stays monthly and after-tax (net take-home) — no change to those labels or semantics.
- A spouse who wants their own numbers runs the assessment separately under their own entry.

## Technical detail

The spouse fields are frontend-only state; they are not stored as database columns, so no migration or edge function change is needed.

1. `src/types/financial.ts` — drop `spouse_w2_income`, `spouse_business_income`, `spouse_social_security`, `spouse_income_continues` from `IncomeExpensesData`.
2. `src/utils/householdIncome.ts` — remove `spouseEarnedIncome`, `spouseAnnualEarnedIncome`, `survivingSpouseIncome`, `survivingSpouseAnnualIncome`. Redefine the remaining helpers as individual-only: `householdEarnedIncome` = `clientEarnedIncome`, `householdTotalIncome` = earned + rental + Social Security, `householdSocialSecurity` = `social_security`. Keep the annualized wrappers (monthly x 12). Update the doc comment to state income is monthly, after-tax, individual.
3. `src/components/financial/IncomeExpensesForm.tsx` — delete the spouse card, the `married` conditional that gates it, and the spouse terms from the cash flow summary memo.
4. `src/pages/RiskIntake.tsx` — remove the four spouse fields from the initial income state.
5. `src/components/financial/ReportModal.tsx` — DIME uses `clientAnnualEarnedIncome` only; delete `spouseIncome`, `spouseOffset`, `incomeToReplace` netting and `householdIncome`. Income Replacement subtext becomes `$X/mo x 12 = $Y/yr x 10 years x 100%`. Remove the spouse-offset notes in the three DIME display blocks.
6. `src/utils/riskComputation.ts` — drop `survivingSpouseAnnualIncome`; income replacement = `clientAnnualEarnedIncome x 10`. Tax score base uses `clientAnnualEarnedIncome`. Pension/SS projection uses the individual's `social_security`.
7. Engines keep calling the same helper names (now individual-only), so `allocationEngine.ts`, `projection.ts`, `recommendations.ts`, `scenarioSimulator.ts`, `iulSuitability.ts`, `annuitySuitability.ts`, `bestInterestGuardrails.ts` need no logic change beyond compiling against the trimmed helpers.
8. Replace `mem://features/spouse-household-income` with a memory recording that income is per-individual (no spouse aggregation) and monthly after-tax; update `mem://features/dime-income-calculation-logic` to drop the surviving-spouse offset.

Verification: typecheck, then run the report with a $10,000/mo entry and confirm Income Replacement is $1,200,000 and no spouse fields render for married filers.
