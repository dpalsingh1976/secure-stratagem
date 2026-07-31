import type { IncomeExpensesData, FilingStatus } from '@/types/financial';

/** Income fields are ANNUAL. */

export const isMarried = (filingStatus?: FilingStatus | string): boolean =>
  filingStatus === 'married_joint' || filingStatus === 'married_separate';

/** Client's own earned income (W-2 + business) — annual. */
export const clientEarnedIncome = (income: Partial<IncomeExpensesData>): number =>
  (income.w2_income || 0) + (income.business_income || 0);

/** Spouse's earned income (W-2 + business) — annual. */
export const spouseEarnedIncome = (income: Partial<IncomeExpensesData>): number =>
  (income.spouse_w2_income || 0) + (income.spouse_business_income || 0);

/** Household earned income (client + spouse) — annual. */
export const householdEarnedIncome = (income: Partial<IncomeExpensesData>): number =>
  clientEarnedIncome(income) + spouseEarnedIncome(income);

/** All household income incl. rental + Social Security (client + spouse) — annual. */
export const householdTotalIncome = (income: Partial<IncomeExpensesData>): number =>
  householdEarnedIncome(income) +
  (income.rental_income || 0) +
  (income.social_security || 0) +
  (income.spouse_social_security || 0);

/** Household Social Security — annual. */
export const householdSocialSecurity = (income: Partial<IncomeExpensesData>): number =>
  (income.social_security || 0) + (income.spouse_social_security || 0);

/**
 * Surviving spouse income that continues if the client passes away — annual.
 * Returns 0 when there is no spouse or the spouse income would not continue.
 */
export const survivingSpouseIncome = (income: Partial<IncomeExpensesData>): number => {
  if (income.spouse_income_continues === false) return 0;
  return spouseEarnedIncome(income);
};
