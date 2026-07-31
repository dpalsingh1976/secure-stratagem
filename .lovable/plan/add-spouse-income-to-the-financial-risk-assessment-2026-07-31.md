# Add Spouse Income to the Financial Risk Assessment

## Current state (verified)

- The intake captures **marital status** only (`ProfileGoalsForm`, filing status: Single / Married / Separated / Widowed).
- The income step (`IncomeExpensesForm`) captures **one person's** income: W-2, business, rental, Social Security — no spouse fields.
- `ProtectionHealthData` has an optional `spouse_age`, but no spouse income anywhere.
- The only place spouse income exists is a hardcoded guess in the legacy quick assessment: `spouseIncomeOffsetPct: married ? 30 : 0`.

So today a married household's risk is scored off one income, which overstates income-replacement need (DIME) and understates household cash flow.

## What to build

**1. Spouse income inputs (intake)**
In the Income & Expenses step, add a "Spouse / Partner Income (Annual)" card that appears only when marital status is Married:
- Spouse W-2 income (annual)
- Spouse business income (annual)
- Spouse Social Security (annual)
- Checkbox: "Spouse income would continue if I pass away" (default on)

The monthly cash-flow summary adds spouse income to household income.

**2. Household vs. individual income in the math**
- **Cash flow / savings capacity / allocation:** use **household** income (client + spouse).
- **DIME income replacement:** replace **only the client's** income, then subtract the surviving spouse's continuing income over the replacement years (this is the spouse offset that is currently hardcoded at 30%). Result: married clients with a working spouse get a realistic, lower coverage need.
- **Retirement projection & Social Security:** include spouse Social Security and spouse retirement income in projected income sources.
- **Disability / LTC gap:** stays based on the client's own income (their earnings are what's at risk), but household surplus is used for affordability checks.

**3. Reporting**
- Report income sections show a household total with a client / spouse split.
- DIME breakdown gains a line: "Less: surviving spouse income (N years)" so the reduction is visible and defensible.

**4. Persistence**
Spouse fields save with the rest of the income data; no new database table needed.

## Technical notes

- Extend `IncomeExpensesData` in `src/types/financial.ts` with `spouse_w2_income`, `spouse_business_income`, `spouse_social_security`, `spouse_income_continues`.
- `src/components/financial/IncomeExpensesForm.tsx`: conditional spouse card (driven by `profileData.filing_status`, passed in as a prop), household totals in the summary.
- `src/pages/RiskIntake.tsx`: add fields to initial state, pass filing status into the income form; spouse values flow into the existing `income_jsonb` payload (jsonb column, no migration).
- Add a shared helper (e.g. `householdIncome()` / `clientIncome()`) so engines stop re-deriving income inline: update `src/utils/riskComputation.ts`, `src/components/financial/ReportModal.tsx`, and `src/engine/retirement/*` (`projection`, `recommendations`, `allocationEngine`, `annuitySuitability`, `iulSuitability`, `scenarioSimulator`, `bestInterestGuardrails`) to consume the right one.
- Retire the hardcoded `spouseIncomeOffsetPct: 30` in `src/utils/assessmentDataMapper.ts` in favour of actual spouse income when available.
- All income fields remain **annual** (consistent with the recent DIME fix).
