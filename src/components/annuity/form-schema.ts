import { z } from "zod";

export const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;

export const BeneficiaryRowSchema = z.object({
  full_name: z.string().min(1, "Name required"),
  relationship: z.string().optional(),
  date_of_birth: z.string().optional(),
  ssn_tin: z
    .string()
    .optional()
    .refine((v) => !v || ssnRegex.test(v), "Format: ###-##-####"),
  share_percentage: z.coerce.number({ invalid_type_error: "Required" }).min(0).max(100),
});

export const AnnuityFormSchema = z.object({
  // Draft ID for upserts
  id: z.string().optional(),

  // 1 — Owner
  ownership_type: z.enum(["individual_joint", "custodian", "trust"], {
    required_error: "Ownership type is required",
  }),

  // 2 — Annuitant
  annuitant_is: z.enum(["owner", "other"], { required_error: "Required" }),
  prefix: z.string().optional(),
  first_name: z.string().min(1, "Required"),
  middle_initial: z.string().max(1).optional(),
  last_name: z.string().min(1, "Required"),
  suffix: z.string().optional(),
  ssn_tin: z
    .string()
    .optional()
    .refine((v) => !v || ssnRegex.test(v), "Format: ###-##-####"),
  date_of_birth: z.string().min(1, "Required"),
  gender: z.string().min(1, "Required"),
  is_us_citizen: z.boolean({ required_error: "Required" }),
  street_address: z.string().min(1, "Required"),
  zip_code: z.string().min(5, "5-digit ZIP required"),
  city: z.string().min(1, "Required"),
  state: z.string().min(2, "Required"),
  email: z.string().email("Valid email required"),
  mobile_phone: z.string().optional(),
  other_phone: z.string().optional(),
  decline_mobile: z.boolean().default(false),

  // 3–4 — Beneficiaries
  primary_beneficiaries: z.array(BeneficiaryRowSchema).default([]),
  contingent_beneficiaries: z.array(BeneficiaryRowSchema).default([]),

  // 5 — Allocations (parallel array of percentages, index = ALLOCATION_OPTIONS index)
  allocation_percentages: z
    .array(z.coerce.number().min(0).max(100))
    .length(18)
    .default(Array(18).fill(0)),

  // 6 — Funding
  contract_issue_type: z.enum(["non_qualified", "qualified"], {
    required_error: "Required",
  }),
  payment_method: z.string().min(1, "Required"),
  add_additional_payments: z.boolean({ required_error: "Required" }),

  // 7 — Payment summary
  total_expected_amount: z.coerce.number().min(0).optional(),
  checking_savings_electronic: z.coerce.number().min(0).optional(),
  transfer_rollover_exchange: z.coerce.number().min(0).optional(),
  fp_or_client_requested: z.coerce.number().min(0).optional(),
  client_brokerage_account_number: z.string().optional(),

  // 8 — Replacement
  has_existing_policies: z.boolean({ required_error: "Required" }),
  will_replace_existing: z.boolean({ required_error: "Required" }),

  // 9 — eDelivery
  edelivery_correspondence: z.boolean({ required_error: "Required" }),
  edelivery_contract: z.boolean({ required_error: "Required" }),

  // 10 — AML
  id_document_type: z.string().min(1, "Required"),
  id_document_number: z.string().min(1, "Required"),
  id_document_expiration: z.string().min(1, "Required"),

  // 11 — Financial
  gross_monthly_income: z.coerce.number({ invalid_type_error: "Required" }).min(0),
  monthly_living_expenses: z.coerce.number({ invalid_type_error: "Required" }).min(0),
  monthly_disposable_income: z.coerce.number().min(0).default(0),
  household_liquid_assets: z.coerce.number({ invalid_type_error: "Required" }).min(0),
  household_annuities_value: z.coerce.number({ invalid_type_error: "Required" }).min(0),
  household_net_worth: z.coerce.number({ invalid_type_error: "Required" }).min(0),

  // 12 — Anticipated changes
  anticipate_increase_living_expenses: z.boolean({ required_error: "Required" }),
  anticipate_decrease_income: z.boolean({ required_error: "Required" }),
  anticipate_decrease_liquid_assets: z.boolean({ required_error: "Required" }),

  // 13 — Tax bracket
  federal_tax_bracket: z.enum(["0_10", "11_20", "21_30", "31_40", "41_plus"], {
    required_error: "Required",
  }),

  // 14 — Additional questions
  resides_nursing_home: z.boolean({ required_error: "Required" }),
  has_ltc_insurance: z.boolean({ required_error: "Required" }),
  has_medicare_supplement: z.boolean({ required_error: "Required" }),
  actively_employed: z.boolean({ required_error: "Required" }),

  // 15–20 — Suitability
  financial_objectives: z.array(z.string()).min(1, "Select at least one"),
  other_products_owned: z.array(z.string()).default([]),
  risk_tolerance: z.enum(
    ["conservative", "moderately_conservative", "moderate", "moderately_aggressive", "aggressive"],
    { required_error: "Required" }
  ),
  distribution_methods: z.array(z.string()).min(1, "Select at least one"),
  first_distribution_timing: z.enum(["lt_1yr", "1_5yr", "6_9yr", "10_plus", "none"], {
    required_error: "Required",
  }),
  premium_sources: z.array(z.string()).min(1, "Select at least one"),

  // 21 — Acknowledgement
  client_signature_name: z.string().optional(),
  signature_date: z.string().optional(),
  joint_signature_name: z.string().optional(),
  joint_signature_date: z.string().optional(),
});

export type AnnuityFormValues = z.infer<typeof AnnuityFormSchema>;

// Draft schema — strip required constraints so partial saves work
export const AnnuityDraftSchema = AnnuityFormSchema.partial().extend({
  allocation_percentages: z
    .array(z.coerce.number().min(0).max(100))
    .default(Array(18).fill(0)),
  primary_beneficiaries: z.array(BeneficiaryRowSchema).default([]),
  contingent_beneficiaries: z.array(BeneficiaryRowSchema).default([]),
  financial_objectives: z.array(z.string()).default([]),
  other_products_owned: z.array(z.string()).default([]),
  distribution_methods: z.array(z.string()).default([]),
  premium_sources: z.array(z.string()).default([]),
});
