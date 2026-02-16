
# Admin Dashboard Improvements

## Task 1: Rename "IUL Digital Twin" to "Client Risk Analysis"

Remove all references to "IUL Digital Twin" from the admin dashboard and replace with appropriate risk-analysis-focused naming.

**Changes in `src/pages/AdminDashboard.tsx`:**
- Header title: "IUL Digital Twin" --> "Client Risk Analyzer"
- Header subtitle: "Advanced Policy Analysis & Stress Testing" --> "Risk Assessment & Client Analysis"
- Welcome heading: "Welcome to the IUL Analysis Platform" --> "Welcome to the Advisor Dashboard"
- Welcome subtitle updated to remove IUL references
- Upload tab card title: "Upload & Parse IUL Illustrations" --> "Upload & Parse Illustrations"
- Digital Twin tab card title/description: remove "IUL" references, rename to "Policy Simulator"
- All other IUL-specific wording cleaned up

---

## Task 2: Client List UX Improvements

Four sub-changes in `src/components/admin/ClientAssessmentDashboard.tsx`:

### 2a. Show only 5 most recent clients (with pagination)
- Add pagination state (`page`) to show 5 clients at a time
- Slice the filtered list to display only 5 per page
- Add Previous/Next buttons below the table

### 2b. Add Phone column
- Add a `phone` column to the `clients` database table (new migration)
- Update the `ClientRow` type to include `phone: string | null`
- Add the `phone` field to the Supabase select query
- Add a "Phone" column header in the table between Email and State
- Display the phone number (or dash if empty)

### 2c. Score button opens detail panel
- Change the Score column from a static badge to a clickable Button
- Clicking the score button opens the 4-tab detail panel (Personal, Investments, Retirement, Risk) for that client
- Clicking a row elsewhere no longer toggles the detail panel (only the score button does)

### 2d. Display risk level labels instead of numbers
- Replace numeric score display (e.g., "72") with text labels:
  - Score >= 80: "Low Risk" (green)
  - Score 60-79: "Medium Risk" (yellow)  
  - Score < 60: "High Risk" (red)
- Apply this in both the client list score button and inside the Risk Analysis detail tab

---

## Technical Details

**Files to modify:**
1. `src/pages/AdminDashboard.tsx` -- rename all IUL Digital Twin text
2. `src/components/admin/ClientAssessmentDashboard.tsx` -- pagination, phone column, score button behavior, risk labels
3. New migration file -- add `phone` column to `clients` table

**New helper function:**
```typescript
const riskLabel = (score: number) => {
  if (score >= 80) return 'Low Risk';
  if (score >= 60) return 'Medium Risk';
  return 'High Risk';
};
```

**Pagination approach:**
```typescript
const PAGE_SIZE = 5;
const [page, setPage] = useState(0);
const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
```

**Database migration:**
```sql
ALTER TABLE public.clients ADD COLUMN phone text;
```
