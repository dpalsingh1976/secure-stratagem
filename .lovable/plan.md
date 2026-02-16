

# Show Client Details in a Dialog (Popup) Instead of Inline Panel

## Overview
Move the client detail panel (Personal, Investments, Retirement, Risk tabs) from the bottom of the page into a centered popup dialog. When the user clicks a risk label button (High Risk / Medium Risk / Low Risk), the details will appear in a modal overlay instead of expanding below the table.

## Changes

**File: `src/components/admin/ClientAssessmentDashboard.tsx`**

1. Import `Dialog, DialogContent, DialogHeader, DialogTitle` from `@/components/ui/dialog`
2. Replace the inline `<Card>` detail panel (lines 563-603) with a `<Dialog>` component
3. Change `selectedId` state to control the dialog's `open` prop -- when a client is selected the dialog opens; setting `selectedId` to `null` closes it
4. The score button `onClick` will set `selectedId` to the client's ID (opening the dialog) instead of toggling
5. The dialog content will contain the same 4-tab layout (Personal, Investments, Retirement, Risk) with the client name as the dialog title
6. Dialog max-width will be set to `max-w-3xl` for comfortable viewing of tables and data

## Technical Details

- Replace the bottom Card block (lines 563-603) with:
```tsx
<Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelectedId(null); }}>
  <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <User className="h-5 w-5 text-primary" />
        {selected?.name_first} {selected?.name_last}
      </DialogTitle>
    </DialogHeader>
    {selected && (
      <Tabs value={detailTab} onValueChange={setDetailTab}>
        {/* same TabsList and TabsContent as before */}
      </Tabs>
    )}
  </DialogContent>
</Dialog>
```

- Update the score button onClick to simply set the client ID (no toggle):
```tsx
onClick={() => {
  setSelectedId(c.id);
  setDetailTab('personal');
}}
```

No other files need changes. The existing tab sub-components (PersonalTab, InvestmentsTab, RetirementTab, RiskAnalysisTab) remain unchanged.
