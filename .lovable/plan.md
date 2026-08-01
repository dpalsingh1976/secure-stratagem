# Detailed Monthly Expense Breakdown

Add an optional itemized breakdown under Monthly Expenses so clients can enter what they spend on mortgage, loans, insurance, and other categories instead of two lump sums.

## What the user sees

In the Monthly Expenses card, a new "Add detailed breakdown" toggle reveals two grouped sections:

Essential (fixed):
- Mortgage / Rent
- Property taxes & home insurance
- Utilities (electric, gas, water, trash)
- Auto loan payments
- Student loan payments
- Credit card / other loan payments
- Health, auto & life insurance premiums
- Childcare / tuition
- Phone, internet & subscriptions
- Other essential

Discretionary (variable):
- Groceries & household
- Dining out & entertainment
- Shopping & clothing
- Travel & vacations
- Gifts, giving & personal care
- Other discretionary

Behavior:
- When the breakdown is open, the itemized totals auto-fill and lock the two summary fields (Essential Fixed Expenses = sum of fixed items, Discretionary = sum of variable items), each showing a live subtotal.
- When it is closed, the existing two lump-sum inputs work exactly as today, so nothing breaks for people who want the quick version.
- Every new field gets a "?" tooltip matching the existing help pattern.
- The Monthly Cash Flow Summary keeps working off the two totals, so surplus/idle-cash math is unchanged.

## Technical notes

- `src/types/financial.ts`: add an optional `expense_detail` object on `IncomeExpensesData` with the itemized numeric keys plus `use_detailed_expenses: boolean`. All fields optional so existing saved records stay valid.
- `src/components/financial/IncomeExpensesForm.tsx`: add the collapsible breakdown UI, subtotal memo, and the effect that writes subtotals into `fixed_expenses` / `variable_expenses` when detail mode is on.
- `src/pages/RiskIntake.tsx`: initialize `expense_detail` defaults and persist it alongside the existing income fields.
- No changes to the risk engines — they continue reading `fixed_expenses` and `variable_expenses`, which stay authoritative.

## Persistence

Store the breakdown as a single JSONB column on the existing intake/assessment record so no new table is needed. If you would rather not persist the detail at all (display/derivation only), say so and I will drop the DB step.
