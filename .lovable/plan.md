# Cursor position on numeric fields defaulting to 0

## Problem
Number fields across the app are pre-filled with `0`. When a user clicks or tabs into one, the caret lands after the zero, so typing produces values like `05000`. The caret should start at the left of the value.

## Approach
Handle it once in the shared `Input` component (`src/components/ui/input.tsx`) so every form inherits the behavior — intake forms, calculators, admin tools, annuity intake.

On focus:
- If the current value is `0` (or `0.00`), select the whole value so the first keystroke replaces it cleanly.
- Otherwise, place the caret at position 0 (left of the text) as requested.

This applies on both mouse click and keyboard tab. A click handler is also needed because browsers move the caret to the click point after focus.

## Technical details
- Add `onFocus`/`onMouseUp` handling inside `Input`, preserving any `onFocus` passed by callers.
- Use `setSelectionRange(0, 0)` for the caret-at-start case and `select()` for the zero case; guard with a `try/catch` since `setSelectionRange` throws on unsupported input types (`number`, `email`). For `type="number"` inputs, temporarily switching selection is not supported, so those are handled with `select()` only.
- No changes to validation, formatting, or calculation logic.

## Files
- `src/components/ui/input.tsx` — focus/caret behavior.

## Verification
Open the risk intake and annuity intake forms, tab and click through numeric fields, and confirm typing over a default `0` yields the typed number rather than a leading zero.
