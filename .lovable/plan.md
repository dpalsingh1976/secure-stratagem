

## Plan: Client Risk Assessment Dashboard

### Overview
Create a new admin dashboard page that displays all clients who have completed risk assessments. The dashboard will have a master list view with expandable/drill-down detail panels organized into four sections: Personal Details, Investment Details, Retirement Goals, and Risk Analysis.

---

### Architecture

The dashboard will be:
- A new component `src/components/admin/ClientAssessmentDashboard.tsx` added as a new tab in the existing `AdminDashboard.tsx`
- Data fetched from `clients`, `financial_profile`, `assets`, `liabilities`, `computed_metrics`, and `insurances` tables (all accessible via advisor/admin RLS)
- No database changes needed -- all data already exists

---

### UI Layout

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Client Risk Assessments                              [Search...] ▾ │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ 23 Total Clients │ 15 Assessed │ 8 Pending │ Avg Score: 72 │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Name         │ Email          │ State │ Score │ Date   │ ▶  │   │
│  │ John Doe     │ john@test.com  │ TX    │ 72    │ Jan 24 │ ▶  │   │
│  │ Jane Smith   │ jane@test.com  │ CA    │ 85    │ Jan 23 │ ▶  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ── When a row is clicked, detail panel opens ──                    │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ [Personal] [Investments] [Retirement] [Risk Analysis]        │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │                                                              │   │
│  │  Personal Details Tab:                                       │   │
│  │  Name, DOB, Age, State, Filing Status, Dependents, Email     │   │
│  │                                                              │   │
│  │  Investments Tab:                                            │   │
│  │  Assets table (type, value, tax wrapper)                     │   │
│  │  Liabilities table (type, balance, rate, payment)            │   │
│  │  Net Worth summary, Tax Bucket breakdown                     │   │
│  │                                                              │   │
│  │  Retirement Tab:                                             │   │
│  │  Target age, desired income, lifestyle, income sources       │   │
│  │  Contribution status, retirement gap                         │   │
│  │                                                              │   │
│  │  Risk Analysis Tab:                                          │   │
│  │  Overall score ring, sub-scores (protection, liquidity,      │   │
│  │  concentration, volatility, longevity, inflation, tax)       │   │
│  │  DIME breakdown, protection gap, recommendations             │   │
│  │                                                              │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Technical Details

#### New File: `src/components/admin/ClientAssessmentDashboard.tsx`

**Data Fetching:**
- Query `clients` table joined with `computed_metrics` and `financial_profile` (via `client_id`)
- Lazy-load `assets`, `liabilities`, and `insurances` when a client row is expanded
- All queries use existing RLS policies (advisor/admin access)

**State Management:**
- `selectedClient` for the currently viewed client
- `clientList` with search/filter support
- `detailTab` for switching between Personal / Investments / Retirement / Risk Analysis

**Key Features:**
1. **Summary Stats Bar** -- Total clients, assessed count, average risk score
2. **Searchable Client List** -- Filter by name or email
3. **Detail Panel with 4 Tabs:**
   - **Personal Details**: Name, DOB, calculated age, state, filing status, dependents, email
   - **Investment Details**: Assets grouped by category with totals, liabilities list, net worth calculation, tax bucket pie breakdown (Now/Later/Never percentages)
   - **Retirement Goals**: Target retirement age, desired monthly income, lifestyle preference, income sources (W2, pension, SS), contribution rates, retirement gap
   - **Risk Analysis**: Overall risk score with color-coded ring, 7 sub-scores as progress bars, DIME breakdown (Debts, Income, Mortgage, Education), protection gap, key recommendations

#### Modified File: `src/pages/AdminDashboard.tsx`

- Add a new "Clients" tab to the existing TabsList (making it 7 tabs)
- Import and render `ClientAssessmentDashboard` in the new tab
- Add `Users` icon for the tab

---

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/components/admin/ClientAssessmentDashboard.tsx` | Create | Main dashboard component with client list + detail views |
| `src/pages/AdminDashboard.tsx` | Modify | Add new "Clients" tab |

---

### No Database Changes Required

All necessary data already exists in the `clients`, `financial_profile`, `assets`, `liabilities`, `computed_metrics`, and `insurances` tables with appropriate RLS policies for advisor/admin access.

