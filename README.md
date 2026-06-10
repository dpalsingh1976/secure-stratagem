# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/cfedd4c4-3278-4356-a7e8-4925acccbf9b

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/cfedd4c4-3278-4356-a7e8-4925acccbf9b) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/cfedd4c4-3278-4356-a7e8-4925acccbf9b) and click on Share -> Publish.

---

## Annuity Intake — `/annuityintake`

### Route
Public page at `/annuityintake` (no login required).  
Matches the Allianz 222+ FIA FireLight two-section application flow.

### Environment variables / Supabase secrets

| Name | Where | Purpose |
|---|---|---|
| `ANNUITY_ENCRYPTION_KEY` | Supabase Edge Function secret | Base64-encoded 32-byte AES-256 key. Generate with: `openssl rand -base64 32` then add via Supabase dashboard → Settings → Edge Functions → Secrets |
| `RESEND_API_KEY` | Supabase Edge Function secret | Already set (shared with other email functions) |
| `SUPABASE_URL` | Auto-injected | Available automatically in Edge Functions |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-injected | Available automatically in Edge Functions |

### Applying the migration
In the Supabase Dashboard → SQL Editor, paste and run:
```
supabase/migrations/20260610000001_annuity_intake.sql
```
Or via CLI: `supabase db push`

### How to retrieve and decrypt a submission for FireLight transcription
1. Query the record as an authenticated advisor from the admin dashboard (RLS enforces role check).
2. To decrypt SSN/TIN or ID number, call the `decrypt-annuity-field` pattern below in a trusted environment (never in the browser):

```typescript
async function decrypt(encryptedBase64: string, keyBase64: string): Promise<string> {
  const keyBytes = Uint8Array.from(atob(keyBase64), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['decrypt']);
  const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return new TextDecoder().decode(plain);
}
```

Run this inside a Supabase Edge Function (where the key is available as `ANNUITY_ENCRYPTION_KEY`) — never expose the key to the browser.

### Tables created
- `public.annuity_applications` — main form data
- `public.application_beneficiaries` — primary + contingent beneficiary rows
- `public.application_allocations` — crediting-strategy allocation rows

RLS: anon cannot read or insert directly. Reads require `advisor` or `admin` role. All writes go through the `submit-annuity-intake` Edge Function (service role).

---

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
