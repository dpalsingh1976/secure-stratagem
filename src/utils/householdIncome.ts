import type { IncomeExpensesData, FilingStatus } from '@/types/financial';

/**
 * Income fields are MONTHLY and belong to ONE individual (no spouse aggregation).
 * W-2 amounts are AFTER TAX (net take-home).
 * Use the *Annual* helpers below when a yearly figure is required.
 */

export const isMarried = (filingStatus?: FilingStatus | string): boolean =>
  filingStatus === 'married_joint' || filingStatus === 'married_separate';

/** Earned income (W-2 + business) — monthly. */
export const clientEarnedIncome = (income: Partial<IncomeExpensesData>): number =>
  (income.w2_income || 0) + (income.business_income || 0);

/** Earned income — monthly. Alias kept for engine call sites. */
export const householdEarnedIncome = (income: Partial<IncomeExpensesData>): number =>
  clientEarnedIncome(income);

/** All income incl. rental + Social Security — monthly. */
export const householdTotalIncome = (income: Partial<IncomeExpensesData>): number =>
  clientEarnedIncome(income) +
  (income.rental_income || 0) +
  (income.social_security || 0);

/** Social Security — monthly. */
export const householdSocialSecurity = (income: Partial<IncomeExpensesData>): number =>
  income.social_security || 0;

/* ---------- Annualized wrappers (monthly x 12) ---------- */

export const clientAnnualEarnedIncome = (income: Partial<IncomeExpensesData>): number =>
  clientEarnedIncome(income) * 12;

export const householdAnnualEarnedIncome = (income: Partial<IncomeExpensesData>): number =>
  householdEarnedIncome(income) * 12;

export const householdAnnualTotalIncome = (income: Partial<IncomeExpensesData>): number =>
  householdTotalIncome(income) * 12;
