import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";
import { z } from "npm:zod@3.22.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Encryption ───────────────────────────────────────────────────────────────
// Key must be a base64-encoded 32-byte value stored in ANNUITY_ENCRYPTION_KEY secret.
async function encrypt(plaintext: string): Promise<string> {
  const keyB64 = Deno.env.get("ANNUITY_ENCRYPTION_KEY");
  if (!keyB64) throw new Error("ANNUITY_ENCRYPTION_KEY not set");
  const keyBytes = Uint8Array.from(atob(keyB64), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "raw", keyBytes, { name: "AES-GCM", length: 256 }, false, ["encrypt"]
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  const combined = new Uint8Array(12 + cipher.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(cipher), 12);
  return btoa(String.fromCharCode(...combined));
}

// ── Zod schemas ──────────────────────────────────────────────────────────────
const ssnRegex = /^\d{3}-?\d{2}-?\d{4}$/;

const BeneficiarySchema = z.object({
  full_name: z.string().min(1),
  relationship: z.string().optional(),
  date_of_birth: z.string().optional(),
  ssn_tin: z.string().optional().refine((v) => !v || ssnRegex.test(v), "Invalid SSN"),
  share_percentage: z.number().min(0).max(100),
  beneficiary_type: z.enum(["primary", "contingent"]),
});

const AllocationSchema = z.object({
  crediting_method: z.string().min(1),
  index_option: z.string().min(1),
  allocation_percentage: z.number().min(0).max(100),
});

const DraftSchema = z.object({
  isDraft: z.literal(true),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  // All other fields optional for draft saves
}).passthrough();

const SubmitSchema = z.object({
  isDraft: z.literal(false).optional(),
  ownership_type: z.enum(["individual_joint", "custodian", "trust"]),
  annuitant_is: z.enum(["owner", "other"]),
  prefix: z.string().optional(),
  first_name: z.string().min(1),
  middle_initial: z.string().max(1).optional(),
  last_name: z.string().min(1),
  suffix: z.string().optional(),
  ssn_tin: z.string().optional().refine((v) => !v || ssnRegex.test(v), "SSN must be ###-##-####"),
  date_of_birth: z.string().min(1),
  gender: z.string().min(1),
  is_us_citizen: z.boolean(),
  street_address: z.string().min(1),
  zip_code: z.string().min(5),
  city: z.string().min(1),
  state: z.string().min(2),
  email: z.string().email(),
  mobile_phone: z.string().optional(),
  other_phone: z.string().optional(),
  decline_mobile: z.boolean().default(false),

  primary_beneficiaries: z.array(BeneficiarySchema).default([]),
  contingent_beneficiaries: z.array(BeneficiarySchema).default([]),
  allocations: z.array(AllocationSchema).default([]),

  contract_issue_type: z.enum(["non_qualified", "qualified"]),
  payment_method: z.string().min(1),
  add_additional_payments: z.boolean(),
  total_expected_amount: z.number().min(0).optional(),
  checking_savings_electronic: z.number().min(0).optional(),
  transfer_rollover_exchange: z.number().min(0).optional(),
  fp_or_client_requested: z.number().min(0).optional(),
  client_brokerage_account_number: z.string().optional(),

  has_existing_policies: z.boolean(),
  will_replace_existing: z.boolean(),
  edelivery_correspondence: z.boolean(),
  edelivery_contract: z.boolean(),

  id_document_type: z.string().min(1),
  id_document_number: z.string().min(1),
  id_document_expiration: z.string().min(1),

  gross_monthly_income: z.number().min(0),
  monthly_living_expenses: z.number().min(0),
  household_liquid_assets: z.number().min(0),
  household_annuities_value: z.number().min(0),
  household_net_worth: z.number().min(0),

  anticipate_increase_living_expenses: z.boolean(),
  anticipate_decrease_income: z.boolean(),
  anticipate_decrease_liquid_assets: z.boolean(),

  federal_tax_bracket: z.enum(["0_10", "11_20", "21_30", "31_40", "41_plus"]),
  resides_nursing_home: z.boolean(),
  has_ltc_insurance: z.boolean(),
  has_medicare_supplement: z.boolean(),
  actively_employed: z.boolean(),

  financial_objectives: z.array(z.string()).min(1, "Select at least one"),
  other_products_owned: z.array(z.string()).default([]),
  risk_tolerance: z.enum(["conservative", "moderately_conservative", "moderate", "moderately_aggressive", "aggressive"]),
  distribution_methods: z.array(z.string()).min(1, "Select at least one"),
  first_distribution_timing: z.enum(["lt_1yr", "1_5yr", "6_9yr", "10_plus", "none"]),
  premium_sources: z.array(z.string()).min(1, "Select at least one"),

  client_signature_name: z.string().optional(),
  signature_date: z.string().optional(),
  joint_signature_name: z.string().optional(),
  joint_signature_date: z.string().optional(),
});

// ── Business-rule checks ─────────────────────────────────────────────────────
function checkTotals(data: z.infer<typeof SubmitSchema>): string[] {
  const errs: string[] = [];

  const primary = data.primary_beneficiaries ?? [];
  const contingent = data.contingent_beneficiaries ?? [];
  const allocations = data.allocations ?? [];

  if (primary.length > 0) {
    const sum = primary.reduce((a, b) => a + b.share_percentage, 0);
    if (Math.abs(sum - 100) > 0.01) errs.push(`Primary beneficiary shares sum to ${sum.toFixed(2)}%, must equal 100%`);
  }
  if (contingent.length > 0) {
    const sum = contingent.reduce((a, b) => a + b.share_percentage, 0);
    if (Math.abs(sum - 100) > 0.01) errs.push(`Contingent beneficiary shares sum to ${sum.toFixed(2)}%, must equal 100%`);
  }
  if (allocations.length === 0) {
    errs.push("Allocation Options are required — at least one strategy must be selected");
  } else {
    const sum = allocations.reduce((a, b) => a + b.allocation_percentage, 0);
    if (Math.abs(sum - 100) > 0.01) errs.push(`Allocation percentages sum to ${sum.toFixed(2)}%, must equal exactly 100%`);
  }

  return errs;
}

// ── Handler ───────────────────────────────────────────────────────────────────
const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

  try {
    const rawBody = await req.json();
    const isDraft = rawBody?.isDraft === true;

    // Parse with appropriate schema
    let data: Record<string, unknown>;
    if (isDraft) {
      const parsed = DraftSchema.safeParse(rawBody);
      if (!parsed.success) {
        return new Response(JSON.stringify({ errors: parsed.error.flatten() }), {
          status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      data = parsed.data as Record<string, unknown>;
    } else {
      const parsed = SubmitSchema.safeParse(rawBody);
      if (!parsed.success) {
        return new Response(JSON.stringify({ errors: parsed.error.flatten() }), {
          status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const submitData = parsed.data;
      const businessErrors = checkTotals(submitData);
      if (businessErrors.length) {
        return new Response(JSON.stringify({ errors: { businessRules: businessErrors } }), {
          status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      data = submitData as Record<string, unknown>;
    }

    // Encrypt sensitive fields
    const encryptedSsn = data.ssn_tin
      ? await encrypt((data.ssn_tin as string).replace(/-/g, ""))
      : null;
    const encryptedIdNum = data.id_document_number
      ? await encrypt(data.id_document_number as string)
      : null;

    // Coerce empty strings / NaN to null for numeric & date columns (Postgres rejects "")
    const num = (v: unknown): number | null => {
      if (v === "" || v === null || v === undefined) return null;
      const n = typeof v === "number" ? v : Number(v);
      return Number.isFinite(n) ? n : null;
    };
    const dateOrNull = (v: unknown): string | null => {
      if (v === "" || v === null || v === undefined) return null;
      return String(v);
    };
    const strOrNull = (v: unknown): string | null => {
      if (v === "" || v === null || v === undefined) return null;
      return String(v);
    };

    // Compute disposable income server-side (never trust client)
    const grossIncome = num(data.gross_monthly_income);
    const expenses = num(data.monthly_living_expenses);
    const disposable = grossIncome !== null && expenses !== null ? grossIncome - expenses : null;

    // Build DB row
    const appRow: Record<string, unknown> = {
      status: isDraft ? "draft" : "submitted",
      client_name: data.first_name && data.last_name ? `${data.first_name} ${data.last_name}` : null,
      application_date: new Date().toISOString().split("T")[0],
      ownership_type: strOrNull(data.ownership_type),
      annuitant_is: strOrNull(data.annuitant_is),
      prefix: strOrNull(data.prefix),
      first_name: strOrNull(data.first_name),
      middle_initial: strOrNull(data.middle_initial),
      last_name: strOrNull(data.last_name),
      suffix: strOrNull(data.suffix),
      ssn_tin: encryptedSsn,
      date_of_birth: dateOrNull(data.date_of_birth),
      gender: strOrNull(data.gender),
      is_us_citizen: data.is_us_citizen ?? null,
      street_address: strOrNull(data.street_address),
      zip_code: strOrNull(data.zip_code),
      city: strOrNull(data.city),
      state: strOrNull(data.state),
      email: strOrNull(data.email),
      mobile_phone: strOrNull(data.mobile_phone),
      other_phone: strOrNull(data.other_phone),
      decline_mobile: data.decline_mobile ?? false,
      contract_issue_type: strOrNull(data.contract_issue_type),
      payment_method: strOrNull(data.payment_method),
      add_additional_payments: data.add_additional_payments ?? null,
      total_expected_amount: num(data.total_expected_amount),
      checking_savings_electronic: num(data.checking_savings_electronic),
      transfer_rollover_exchange: num(data.transfer_rollover_exchange),
      fp_or_client_requested: num(data.fp_or_client_requested),
      client_brokerage_account_number: strOrNull(data.client_brokerage_account_number),
      has_existing_policies: data.has_existing_policies ?? null,
      will_replace_existing: data.will_replace_existing ?? null,
      edelivery_correspondence: data.edelivery_correspondence ?? null,
      edelivery_contract: data.edelivery_contract ?? null,
      id_document_type: strOrNull(data.id_document_type),
      id_document_number: encryptedIdNum,
      id_document_expiration: dateOrNull(data.id_document_expiration),
      gross_monthly_income: grossIncome,
      monthly_living_expenses: expenses,
      monthly_disposable_income: disposable,
      household_liquid_assets: num(data.household_liquid_assets),
      household_annuities_value: num(data.household_annuities_value),
      household_net_worth: num(data.household_net_worth),
      anticipate_increase_living_expenses: data.anticipate_increase_living_expenses ?? null,
      anticipate_decrease_income: data.anticipate_decrease_income ?? null,
      anticipate_decrease_liquid_assets: data.anticipate_decrease_liquid_assets ?? null,
      federal_tax_bracket: strOrNull(data.federal_tax_bracket),
      resides_nursing_home: data.resides_nursing_home ?? null,
      has_ltc_insurance: data.has_ltc_insurance ?? null,
      has_medicare_supplement: data.has_medicare_supplement ?? null,
      actively_employed: data.actively_employed ?? null,
      financial_objectives: data.financial_objectives ?? [],
      other_products_owned: data.other_products_owned ?? [],
      risk_tolerance: strOrNull(data.risk_tolerance),
      distribution_methods: data.distribution_methods ?? [],
      first_distribution_timing: strOrNull(data.first_distribution_timing),
      premium_sources: data.premium_sources ?? [],
      client_signature_name: strOrNull(data.client_signature_name),
      signature_date: dateOrNull(data.signature_date),
      joint_signature_name: strOrNull(data.joint_signature_name),
      joint_signature_date: dateOrNull(data.joint_signature_date),
    };

    // Upsert application
    const existingId = data.id as string | undefined;
    let appId: string;

    if (existingId) {
      const { data: updated, error } = await supabase
        .from("annuity_applications")
        .update(appRow)
        .eq("id", existingId)
        .select("id")
        .single();
      if (error) throw error;
      appId = updated.id;
    } else {
      const { data: inserted, error } = await supabase
        .from("annuity_applications")
        .insert(appRow)
        .select("id")
        .single();
      if (error) throw error;
      appId = inserted.id;
    }

    // Replace beneficiaries and allocations on every save
    await supabase.from("application_beneficiaries").delete().eq("application_id", appId);
    await supabase.from("application_allocations").delete().eq("application_id", appId);

    const beneficiaries = [
      ...((data.primary_beneficiaries as Array<Record<string,unknown>>) ?? []).map((b) => ({
        ...b, beneficiary_type: "primary", application_id: appId,
      })),
      ...((data.contingent_beneficiaries as Array<Record<string,unknown>>) ?? []).map((b) => ({
        ...b, beneficiary_type: "contingent", application_id: appId,
      })),
    ].filter((b) => b.full_name && String(b.full_name).trim() !== "");

    if (beneficiaries.length) {
      const rows = await Promise.all(beneficiaries.map(async (b) => ({
        application_id: appId,
        beneficiary_type: b.beneficiary_type,
        full_name: b.full_name,
        relationship: strOrNull(b.relationship),
        date_of_birth: dateOrNull(b.date_of_birth),
        ssn_tin: b.ssn_tin ? await encrypt((b.ssn_tin as string).replace(/-/g, "")) : null,
        share_percentage: num(b.share_percentage) ?? 0,
      })));
      const { error } = await supabase.from("application_beneficiaries").insert(rows);
      if (error) throw error;
    }

    const allocations = (data.allocations as Array<Record<string,unknown>>) ?? [];
    if (allocations.length) {
      const rows = allocations.map((a) => ({
        application_id: appId,
        crediting_method: a.crediting_method,
        index_option: a.index_option,
        allocation_percentage: num(a.allocation_percentage) ?? 0,
      }));
      const { error } = await supabase.from("application_allocations").insert(rows);
      if (error) throw error;
    }

    // Notification email (no PII — submission ID and client name only)
    if (!isDraft) {
      const clientName = appRow.client_name ?? "Unknown";
      await resend.emails.send({
        from: "Annuity Intake <appointments@theprosperityfinancial.com>",
        to: ["davindes@theprosperityfinancial.com"],
        subject: `New Annuity Application Submitted`,
        html: `<p>A new Allianz 222+ intake form has been submitted.</p>
               <p><strong>Submission ID:</strong> ${appId}</p>
               <p><strong>Client Name:</strong> ${clientName}</p>
               <p>Log in to the admin dashboard to review.</p>`,
      });
    }

    return new Response(JSON.stringify({ id: appId, status: isDraft ? "draft" : "submitted" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    // Never log PII from request body
    console.error("submit-annuity-intake error:", (err as Error).message);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
