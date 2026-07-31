import type { IncomeExpensesData, FilingStatus } from '@/types/financial';

/**
 * Income fields are MONTHLY. W-2 amounts are AFTER TAX (net take-home).
 * Use the *Annual* helpers below when a yearly figure is required.
 */

export const isMarried = (filingStatus?: FilingStatus | string): boolean =>
  filingStatus === 'married_joint' || filingStatus === 'married_separate';

/** Client's own earned income (W-2 + business) — monthly. */
export const clientEarnedIncome = (income: Partial<IncomeExpensesData>): number =>
  (income.w2_income || 0) + (income.business_income || 0);

/** Spouse's earned income (W-2 + business) — monthly. */
export const spouseEarnedIncome = (income: Partial<IncomeExpensesData>): number =>
  (income.spouse_w2_income || 0) + (income.spouse_business_income || 0);

/** Household earned income (client + spouse) — monthly. */
export const householdEarnedIncome = (income: Partial<IncomeExpensesData>): number =>
  clientEarnedIncome(income) + spouseEarnedIncome(income);

/** All household income incl. rental + Social Security (client + spouse) — monthly. */
export const householdTotalIncome = (income: Partial<IncomeExpensesData>): number =>
  householdEarnedIncome(income) +
  (income.rental_income || 0) +
  (income.social_security || 0) +
  (income.spouse_social_security || 0);

/** Household Social Security — monthly. */
export const householdSocialSecurity = (income: Partial<IncomeExpensesData>): number =>
  (income.social_security || 0) + (income.spouse_social_security || 0);

/**
 * Surviving spouse income that continues if the client passes away — monthly.
 * Returns 0 when there is no spouse or the spouse income would not continue.
 */
export const survivingSpouseIncome = (income: Partial<IncomeExpensesData>): number => {
  if (income.spouse_income_continues === false) return 0;
  return spouseEarnedIncome(income);
};

/* ---------- Annualized wrappers (monthly x 12) ---------- */

export const clientAnnualEarnedIncome = (income: Partial<IncomeExpensesData>): number =>
  clientEarnedIncome(income) * 12;

export const spouseAnnualEarnedIncome = (income: Partial<IncomeExpensesData>): number =>
  spouseEarnedIncome(income) * 12;

export const householdAnnualEarnedIncome = (income: Partial<IncomeExpensesData>): number =>
  householdEarnedIncome(income) * 12;

export const householdAnnualTotalIncome = (income: Partial<IncomeExpensesData>): number =>
  householdTotalIncome(income) * 12;

export const survivingSpouseAnnualIncome = (income: Partial<IncomeExpensesData>): number =>
  survivingSpouseIncome(income) * 12;
