export const ALLOCATION_OPTIONS = [
  { crediting_method: "Annual Point-to-Point w/ Participation Rate",     index_option: "Blended Futures Index" },
  { crediting_method: "Annual Point-to-Point w/ Participation Rate",     index_option: "Bloomberg US Dynamic Balance III ER Index" },
  { crediting_method: "Annual Point-to-Point w/ Participation Rate",     index_option: "Morgan Stanley Strategic Trends 10 ER Index" },
  { crediting_method: "Annual Point-to-Point w/ Participation Rate",     index_option: "PIMCO Tactical Balanced ER Index" },
  { crediting_method: "Annual Point-to-Point w/ Participation Rate",     index_option: "S&P 500 Futures Index ER" },
  { crediting_method: "Annual Point-to-Point w/ a Cap",                  index_option: "S&P 500 Index" },
  { crediting_method: "Multi-Year Point-to-Point (2 Yr) w/ Participation Rate", index_option: "Bloomberg US Dynamic Balance III ER Index" },
  { crediting_method: "Multi-Year Point-to-Point (2 Yr) w/ Participation Rate", index_option: "Morgan Stanley Strategic Trends 10 ER Index" },
  { crediting_method: "Multi-Year Point-to-Point (2 Yr) w/ Participation Rate", index_option: "PIMCO Tactical Balanced ER Index" },
  { crediting_method: "Multi-Year Point-to-Point (2 Yr) w/ Participation Rate", index_option: "S&P 500 Futures Index ER" },
  { crediting_method: "Multi-Year Point-to-Point (5 Yr) w/ Participation Rate", index_option: "Bloomberg US Dynamic Balance III ER Index" },
  { crediting_method: "Multi-Year Point-to-Point (5 Yr) w/ Participation Rate", index_option: "Morgan Stanley Strategic Trends 10 ER Index" },
  { crediting_method: "Multi-Year Point-to-Point (5 Yr) w/ Participation Rate", index_option: "PIMCO Tactical Balanced ER Index" },
  { crediting_method: "Multi-Year Point-to-Point (5 Yr) w/ Participation Rate", index_option: "S&P 500 Futures Index ER" },
  { crediting_method: "Monthly Sum w/ a Cap",                            index_option: "S&P 500 Index" },
  { crediting_method: "1-Year Performance Trigger",                      index_option: "S&P 500 Index" },
  { crediting_method: "Highest Daily Value w/ Participation Rate",       index_option: "Bloomberg US Dynamic Balance III ER Index" },
  { crediting_method: "Fixed Allocation",                                index_option: "Fixed Allocation" },
] as const;

export const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

export const FINANCIAL_OBJECTIVES = [
  { value: "income_now",               label: "Income Now" },
  { value: "guarantees_provided",      label: "Guarantees Provided" },
  { value: "growth_potential",         label: "Growth Potential" },
  { value: "growth_then_income",       label: "Growth Then Income" },
  { value: "tax_deferred_growth",      label: "Tax Deferred Growth" },
  { value: "pass_on_to_beneficiaries", label: "Pass On to Beneficiaries" },
  { value: "other",                    label: "Other" },
];

export const OTHER_PRODUCTS_OWNED = [
  { value: "none",                    label: "None" },
  { value: "cds",                     label: "CDs" },
  { value: "annuities",               label: "Annuities" },
  { value: "life_insurance",          label: "Life Insurance" },
  { value: "stocks_bonds_mutual_funds", label: "Stocks / Bonds / Mutual Funds" },
];

export const DISTRIBUTION_METHODS = [
  { value: "free_systematic",        label: "Free / Systematic Withdrawals" },
  { value: "lump_sum",               label: "Lump Sum" },
  { value: "annuitize",              label: "Annuitize" },
  { value: "lifetime_withdrawals",   label: "Lifetime Withdrawals" },
  { value: "immediate_income",       label: "Immediate Income" },
  { value: "leave_to_beneficiary",   label: "Leave to Beneficiary" },
];

export const PREMIUM_SOURCES = [
  { value: "annuity",                       label: "Annuity" },
  { value: "life_insurance",                label: "Life Insurance" },
  { value: "death_benefit_proceeds",        label: "Death Benefit Proceeds" },
  { value: "cds",                           label: "CDs" },
  { value: "savings_checking",              label: "Savings / Checking" },
  { value: "reverse_mortgage",              label: "Reverse Mortgage" },
  { value: "stocks_bonds_mutual_funds",     label: "Stocks / Bonds / Mutual Funds" },
  { value: "other",                         label: "Other" },
];
