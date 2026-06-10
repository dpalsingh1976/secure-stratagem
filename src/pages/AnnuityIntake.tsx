import { useState, useEffect, useCallback } from "react";
import { useForm, useFieldArray, FormProvider, useFormContext, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AnnuityFormSchema, AnnuityDraftSchema, type AnnuityFormValues } from "@/components/annuity/form-schema";
import {
  ALLOCATION_OPTIONS, US_STATES,
  FINANCIAL_OBJECTIVES, OTHER_PRODUCTS_OWNED,
  DISTRIBUTION_METHODS, PREMIUM_SOURCES,
} from "@/components/annuity/constants";
import { PlusCircle, Trash2, CheckCircle, Loader2 } from "lucide-react";

// ── Helpers ─────────────────────────────────────────────────────────────────

function maskSsn(v: string) {
  const digits = v.replace(/\D/g, "");
  if (digits.length <= 4) return v;
  return "***-**-" + digits.slice(-4);
}

function FieldError({ name }: { name: string }) {
  const { formState: { errors } } = useFormContext();
  const parts = name.split(".");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let err: any = errors;
  for (const p of parts) err = err?.[p];
  if (!err?.message) return null;
  return <p className="text-red-500 text-xs mt-1">{err.message as string}</p>;
}

function FormInput({
  label, name, type = "text", placeholder, required, className, autoComplete,
}: {
  label: string; name: string; type?: string; placeholder?: string;
  required?: boolean; className?: string; autoComplete?: string;
}) {
  const { register } = useFormContext();
  return (
    <div className={className}>
      <Label className="text-sm font-medium">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input type={type} placeholder={placeholder} autoComplete={autoComplete} className="mt-1" {...register(name)} />
      <FieldError name={name} />
    </div>
  );
}

function YesNo({ label, name, required }: { label: string; name: string; required?: boolean }) {
  const { control } = useFormContext();
  return (
    <div>
      <Label className="text-sm font-medium">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <RadioGroup
            value={field.value === true ? "yes" : field.value === false ? "no" : ""}
            onValueChange={(v) => field.onChange(v === "yes")}
            className="flex gap-4 mt-1"
          >
            <div className="flex items-center gap-1.5">
              <RadioGroupItem value="yes" id={`${name}-yes`} />
              <Label htmlFor={`${name}-yes`} className="font-normal cursor-pointer">Yes</Label>
            </div>
            <div className="flex items-center gap-1.5">
              <RadioGroupItem value="no" id={`${name}-no`} />
              <Label htmlFor={`${name}-no`} className="font-normal cursor-pointer">No</Label>
            </div>
          </RadioGroup>
        )}
      />
      <FieldError name={name} />
    </div>
  );
}

function MultiCheckbox({
  label, name, options, required,
}: {
  label: string; name: string;
  options: { value: string; label: string }[];
  required?: boolean;
}) {
  const { control } = useFormContext();
  return (
    <div>
      <Label className="text-sm font-medium block mb-2">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Controller
        control={control}
        name={name}
        render={({ field }) => {
          const selected: string[] = Array.isArray(field.value) ? field.value : [];
          return (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {options.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={selected.includes(opt.value)}
                    onCheckedChange={(checked) => {
                      if (checked) field.onChange([...selected, opt.value]);
                      else field.onChange(selected.filter((v) => v !== opt.value));
                    }}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          );
        }}
      />
      <FieldError name={name} />
    </div>
  );
}

function SectionCard({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">
            {n}
          </span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

// ── Section 1: Owner ─────────────────────────────────────────────────────────
function OwnerSection() {
  const { control } = useFormContext();
  return (
    <SectionCard n={1} title="Owner Information">
      <div>
        <Label className="text-sm font-medium">Ownership Type <span className="text-red-500">*</span></Label>
        <Controller
          control={control}
          name="ownership_type"
          render={({ field }) => (
            <RadioGroup value={field.value ?? ""} onValueChange={field.onChange} className="mt-2 space-y-1">
              {[
                { value: "individual_joint", label: "Individual / Joint" },
                { value: "custodian", label: "Custodian" },
                { value: "trust", label: "Trust" },
              ].map((opt) => (
                <div key={opt.value} className="flex items-center gap-2">
                  <RadioGroupItem value={opt.value} id={`ot-${opt.value}`} />
                  <Label htmlFor={`ot-${opt.value}`} className="font-normal cursor-pointer">{opt.label}</Label>
                </div>
              ))}
            </RadioGroup>
          )}
        />
        <FieldError name="ownership_type" />
      </div>
    </SectionCard>
  );
}

// ── Section 2: Annuitant ──────────────────────────────────────────────────────
function AnnuitantSection() {
  const { control, watch, setValue } = useFormContext();
  const ssn = watch("ssn_tin") as string;
  const [showSsn, setShowSsn] = useState(false);

  return (
    <SectionCard n={2} title="Annuitant Information">
      <div>
        <Label className="text-sm font-medium">Annuitant is… <span className="text-red-500">*</span></Label>
        <Controller
          control={control}
          name="annuitant_is"
          render={({ field }) => (
            <RadioGroup value={field.value ?? ""} onValueChange={field.onChange} className="flex gap-4 mt-1">
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="owner" id="ai-owner" />
                <Label htmlFor="ai-owner" className="font-normal cursor-pointer">Owner</Label>
              </div>
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="other" id="ai-other" />
                <Label htmlFor="ai-other" className="font-normal cursor-pointer">Other</Label>
              </div>
            </RadioGroup>
          )}
        />
        <FieldError name="annuitant_is" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <FormInput label="Prefix" name="prefix" placeholder="Mr./Ms." autoComplete="off" />
        <FormInput label="First Name" name="first_name" required className="col-span-1 sm:col-span-1" autoComplete="off" />
        <FormInput label="M.I." name="middle_initial" placeholder="A" autoComplete="off" />
        <FormInput label="Last Name" name="last_name" required autoComplete="off" />
        <FormInput label="Suffix" name="suffix" placeholder="Jr./Sr." autoComplete="off" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* SSN with mask toggle */}
        <div>
          <Label className="text-sm font-medium">SSN / TIN <span className="text-gray-400 text-xs">(optional)</span></Label>
          <div className="relative mt-1">
            <Controller
              control={control}
              name="ssn_tin"
              render={({ field }) => (
                <Input
                  type={showSsn ? "text" : "password"}
                  placeholder="###-##-####"
                  maxLength={11}
                  autoComplete="off"
                  value={field.value ?? ""}
                  onChange={(e) => {
                    let v = e.target.value.replace(/\D/g, "");
                    if (v.length > 3) v = v.slice(0, 3) + "-" + v.slice(3);
                    if (v.length > 6) v = v.slice(0, 6) + "-" + v.slice(6);
                    field.onChange(v.slice(0, 11));
                  }}
                />
              )}
            />
            <button
              type="button"
              className="absolute right-2 top-2 text-xs text-blue-600 hover:underline"
              onClick={() => setShowSsn((s) => !s)}
            >
              {showSsn ? "Hide" : "Show"}
            </button>
          </div>
          {ssn && !showSsn && ssn.length === 11 && (
            <p className="text-xs text-gray-500 mt-1">Showing: {maskSsn(ssn)}</p>
          )}
          <FieldError name="ssn_tin" />
        </div>

        <div>
          <Label className="text-sm font-medium">Date of Birth <span className="text-red-500">*</span></Label>
          <Controller
            control={control}
            name="date_of_birth"
            render={({ field }) => (
              <Input type="date" className="mt-1" {...field} value={field.value ?? ""} />
            )}
          />
          <FieldError name="date_of_birth" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <Label className="text-sm font-medium">Gender <span className="text-red-500">*</span></Label>
          <Controller
            control={control}
            name="gender"
            render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          <FieldError name="gender" />
        </div>
        <div className="flex flex-col justify-center pt-4">
          <YesNo label="U.S. Citizen?" name="is_us_citizen" required />
        </div>
      </div>

      <Separator />

      <FormInput label="Street Address" name="street_address" required />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <FormInput label="City" name="city" required className="col-span-2 sm:col-span-1" />
        <div>
          <Label className="text-sm font-medium">State <span className="text-red-500">*</span></Label>
          <Controller
            control={control}
            name="state"
            render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="ST" /></SelectTrigger>
                <SelectContent>
                  {US_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError name="state" />
        </div>
        <FormInput label="ZIP Code" name="zip_code" required placeholder="12345" />
      </div>

      <Separator />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormInput label="Email" name="email" type="email" required placeholder="client@email.com" />
        <FormInput label="Mobile Phone" name="mobile_phone" type="tel" placeholder="(555) 555-5555" />
        <FormInput label="Other Phone" name="other_phone" type="tel" placeholder="(555) 555-5555" />
        <div className="flex items-center gap-2 pt-5">
          <Controller
            control={control}
            name="decline_mobile"
            render={({ field }) => (
              <Checkbox
                checked={!!field.value}
                onCheckedChange={field.onChange}
                id="decline_mobile"
              />
            )}
          />
          <Label htmlFor="decline_mobile" className="font-normal cursor-pointer text-sm">
            Decline to provide mobile number
          </Label>
        </div>
      </div>
    </SectionCard>
  );
}

// ── Sections 3–4: Beneficiaries ───────────────────────────────────────────────
function BeneficiaryFields({
  fieldName, label,
}: {
  fieldName: "primary_beneficiaries" | "contingent_beneficiaries";
  label: string;
}) {
  const { control, watch } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: fieldName });
  const rows = watch(fieldName) as Array<{ share_percentage: number }>;
  const total = rows.reduce((a, b) => a + (Number(b.share_percentage) || 0), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <div className="flex items-center gap-3">
          <Badge variant={Math.abs(total - 100) < 0.01 && fields.length > 0 ? "default" : "secondary"}>
            Total: {total.toFixed(0)}%
          </Badge>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({ full_name: "", relationship: "", date_of_birth: "", ssn_tin: "", share_percentage: 0 })
            }
          >
            <PlusCircle className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>
      </div>

      {fields.length === 0 && (
        <p className="text-sm text-gray-400 italic">No beneficiaries added.</p>
      )}

      {fields.map((field, idx) => (
        <div key={field.id} className="border rounded-lg p-3 space-y-3 bg-gray-50">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-500">Beneficiary #{idx + 1}</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => remove(idx)}>
              <Trash2 className="w-4 h-4 text-red-400" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <FormInput label="Full Name" name={`${fieldName}.${idx}.full_name`} required className="col-span-2 sm:col-span-1" />
            <FormInput label="Relationship" name={`${fieldName}.${idx}.relationship`} />
            <div>
              <Label className="text-xs font-medium">Date of Birth</Label>
              <Controller
                control={control}
                name={`${fieldName}.${idx}.date_of_birth`}
                render={({ field }) => (
                  <Input type="date" className="mt-1" {...field} value={field.value ?? ""} />
                )}
              />
            </div>
            <div>
              <Label className="text-xs font-medium">SSN / TIN</Label>
              <Controller
                control={control}
                name={`${fieldName}.${idx}.ssn_tin`}
                render={({ field }) => (
                  <Input
                    type="password"
                    placeholder="###-##-####"
                    maxLength={11}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      let v = e.target.value.replace(/\D/g, "");
                      if (v.length > 3) v = v.slice(0, 3) + "-" + v.slice(3);
                      if (v.length > 6) v = v.slice(0, 6) + "-" + v.slice(6);
                      field.onChange(v.slice(0, 11));
                    }}
                    className="mt-1"
                  />
                )}
              />
              <FieldError name={`${fieldName}.${idx}.ssn_tin`} />
            </div>
            <div>
              <Label className="text-xs font-medium">Share % <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.01}
                className="mt-1"
                {...control.register(`${fieldName}.${idx}.share_percentage`, { valueAsNumber: true })}
              />
              <FieldError name={`${fieldName}.${idx}.share_percentage`} />
            </div>
          </div>
        </div>
      ))}

      {fields.length > 0 && Math.abs(total - 100) > 0.01 && (
        <p className="text-orange-600 text-xs">Shares must sum to exactly 100% (currently {total.toFixed(2)}%)</p>
      )}
    </div>
  );
}

function BeneficiariesSection() {
  return (
    <SectionCard n={3} title="Beneficiary Designation">
      <BeneficiaryFields fieldName="primary_beneficiaries" label="Primary Beneficiaries" />
      <Separator />
      <BeneficiaryFields fieldName="contingent_beneficiaries" label="Contingent Beneficiaries (optional)" />
    </SectionCard>
  );
}

// ── Section 5: Allocations ────────────────────────────────────────────────────
function AllocationSection() {
  const { control, watch } = useFormContext();
  const percentages = watch("allocation_percentages") as number[];
  const total = percentages.reduce((a, b) => a + (Number(b) || 0), 0);

  return (
    <SectionCard n={5} title="Allocation Options">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">
          Enter percentage for each desired crediting strategy. Total must equal 100%.
        </span>
        <Badge variant={Math.abs(total - 100) < 0.01 ? "default" : "secondary"} className="shrink-0 ml-2">
          Total: {total.toFixed(0)}%
        </Badge>
      </div>

      <div className="space-y-2">
        {ALLOCATION_OPTIONS.map((opt, idx) => (
          <div key={idx} className="flex items-center gap-3 p-2 rounded border bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-700 truncate">{opt.crediting_method}</p>
              <p className="text-xs text-gray-500 truncate">{opt.index_option}</p>
            </div>
            <div className="w-24 shrink-0 flex items-center gap-1">
              <Controller
                control={control}
                name={`allocation_percentages.${idx}`}
                render={({ field }) => (
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    placeholder="0"
                    className="h-8 text-right"
                    value={field.value === 0 ? "" : field.value}
                    onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                  />
                )}
              />
              <span className="text-xs text-gray-400">%</span>
            </div>
          </div>
        ))}
      </div>

      {Math.abs(total - 100) > 0.01 && total > 0 && (
        <p className="text-orange-600 text-xs mt-1">
          Allocations must sum to 100% (currently {total.toFixed(2)}%)
        </p>
      )}
    </SectionCard>
  );
}

// ── Section 6: Funding ────────────────────────────────────────────────────────
function FundingSection() {
  const { control } = useFormContext();
  return (
    <SectionCard n={6} title="Funding Information">
      <div>
        <Label className="text-sm font-medium">Contract Issue Type <span className="text-red-500">*</span></Label>
        <Controller
          control={control}
          name="contract_issue_type"
          render={({ field }) => (
            <RadioGroup value={field.value ?? ""} onValueChange={field.onChange} className="flex gap-4 mt-1">
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="non_qualified" id="cit-nq" />
                <Label htmlFor="cit-nq" className="font-normal cursor-pointer">Non-Qualified</Label>
              </div>
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="qualified" id="cit-q" />
                <Label htmlFor="cit-q" className="font-normal cursor-pointer">Qualified</Label>
              </div>
            </RadioGroup>
          )}
        />
        <FieldError name="contract_issue_type" />
      </div>

      <div>
        <Label className="text-sm font-medium">Payment Method <span className="text-red-500">*</span></Label>
        <Controller
          control={control}
          name="payment_method"
          render={({ field }) => (
            <Select value={field.value ?? ""} onValueChange={field.onChange}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                {[
                  "Personal Check", "Cashier's Check", "Wire Transfer",
                  "1035 Exchange", "Transfer / Rollover", "ACH / Electronic",
                ].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        />
        <FieldError name="payment_method" />
      </div>

      <YesNo label="Add additional payments?" name="add_additional_payments" required />
    </SectionCard>
  );
}

// ── Section 7: Payment Summary ────────────────────────────────────────────────
function PaymentSummarySection() {
  return (
    <SectionCard n={7} title="Payment Summary & Brokerage">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormInput label="Total Expected Amount ($)" name="total_expected_amount" type="number" placeholder="0.00" />
        <FormInput label="Checking / Savings / Electronic ($)" name="checking_savings_electronic" type="number" placeholder="0.00" />
        <FormInput label="Transfer / Rollover / Exchange ($)" name="transfer_rollover_exchange" type="number" placeholder="0.00" />
        <FormInput label="FP or Client Requested ($)" name="fp_or_client_requested" type="number" placeholder="0.00" />
        <FormInput label="Client Brokerage Account Number" name="client_brokerage_account_number" className="col-span-1 sm:col-span-2" />
      </div>
    </SectionCard>
  );
}

// ── Section 8: Replacement ────────────────────────────────────────────────────
function ReplacementSection() {
  return (
    <SectionCard n={8} title="Replacement Questions">
      <YesNo label="Does the applicant have existing life insurance or annuity contracts?" name="has_existing_policies" required />
      <YesNo label="Will this contract replace or change any existing life insurance or annuity?" name="will_replace_existing" required />
    </SectionCard>
  );
}

// ── Section 9: eDelivery ──────────────────────────────────────────────────────
function EDeliverySection() {
  return (
    <SectionCard n={9} title="eDelivery Preferences">
      <YesNo label="Consent to eDelivery of correspondence?" name="edelivery_correspondence" required />
      <YesNo label="Consent to eDelivery of contract?" name="edelivery_contract" required />
    </SectionCard>
  );
}

// ── Section 10: AML ───────────────────────────────────────────────────────────
function AMLSection() {
  const { control } = useFormContext();
  return (
    <SectionCard n={10} title="Customer Identification (AML)">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label className="text-sm font-medium">Document Type <span className="text-red-500">*</span></Label>
          <Controller
            control={control}
            name="id_document_type"
            render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  {["Driver's License", "State ID", "Passport", "Military ID", "Permanent Resident Card"].map(
                    (d) => <SelectItem key={d} value={d}>{d}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError name="id_document_type" />
        </div>

        <div>
          <Label className="text-sm font-medium">Document Number <span className="text-red-500">*</span></Label>
          <Controller
            control={control}
            name="id_document_number"
            render={({ field }) => (
              <Input type="password" placeholder="Document number" className="mt-1" {...field} value={field.value ?? ""} />
            )}
          />
          <FieldError name="id_document_number" />
          <p className="text-xs text-gray-500 mt-1">Stored encrypted — never displayed after submission.</p>
        </div>

        <div>
          <Label className="text-sm font-medium">Expiration Date <span className="text-red-500">*</span></Label>
          <Controller
            control={control}
            name="id_document_expiration"
            render={({ field }) => (
              <Input type="date" className="mt-1" {...field} value={field.value ?? ""} />
            )}
          />
          <FieldError name="id_document_expiration" />
        </div>
      </div>
    </SectionCard>
  );
}

// ── Section 11: Financial Information ─────────────────────────────────────────
function FinancialSection() {
  const { watch, setValue } = useFormContext();
  const income = watch("gross_monthly_income");
  const expenses = watch("monthly_living_expenses");

  useEffect(() => {
    const inc = Number(income) || 0;
    const exp = Number(expenses) || 0;
    setValue("monthly_disposable_income", Math.max(0, inc - exp), { shouldValidate: false });
  }, [income, expenses, setValue]);

  const disposable = watch("monthly_disposable_income") as number;

  return (
    <SectionCard n={11} title="Financial Information">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormInput label="Gross Monthly Income ($)" name="gross_monthly_income" type="number" placeholder="0.00" required />
        <FormInput label="Monthly Living Expenses ($)" name="monthly_living_expenses" type="number" placeholder="0.00" required />
        <div>
          <Label className="text-sm font-medium">Monthly Disposable Income ($)</Label>
          <Input
            type="number"
            value={disposable ?? 0}
            readOnly
            className="mt-1 bg-gray-100 cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 mt-1">Auto-calculated: income − expenses</p>
        </div>
        <FormInput label="Household Liquid Assets ($)" name="household_liquid_assets" type="number" placeholder="0.00" required />
        <FormInput label="Household Annuities Value ($)" name="household_annuities_value" type="number" placeholder="0.00" required />
        <FormInput label="Household Net Worth ($)" name="household_net_worth" type="number" placeholder="0.00" required />
      </div>
    </SectionCard>
  );
}

// ── Section 12: Anticipated Changes ──────────────────────────────────────────
function AnticipatedChangesSection() {
  return (
    <SectionCard n={12} title="Anticipated Changes (during deferral period)">
      <YesNo label="Do you anticipate increased living expenses?" name="anticipate_increase_living_expenses" required />
      <YesNo label="Do you anticipate decreased income?" name="anticipate_decrease_income" required />
      <YesNo label="Do you anticipate decreased liquid assets?" name="anticipate_decrease_liquid_assets" required />
    </SectionCard>
  );
}

// ── Section 13: Tax Bracket ───────────────────────────────────────────────────
function TaxBracketSection() {
  const { control } = useFormContext();
  return (
    <SectionCard n={13} title="Federal Income Tax Bracket">
      <Controller
        control={control}
        name="federal_tax_bracket"
        render={({ field }) => (
          <RadioGroup value={field.value ?? ""} onValueChange={field.onChange} className="space-y-1">
            {[
              { value: "0_10", label: "0% – 10%" },
              { value: "11_20", label: "11% – 20%" },
              { value: "21_30", label: "21% – 30%" },
              { value: "31_40", label: "31% – 40%" },
              { value: "41_plus", label: "41%+" },
            ].map((opt) => (
              <div key={opt.value} className="flex items-center gap-2">
                <RadioGroupItem value={opt.value} id={`tb-${opt.value}`} />
                <Label htmlFor={`tb-${opt.value}`} className="font-normal cursor-pointer">{opt.label}</Label>
              </div>
            ))}
          </RadioGroup>
        )}
      />
      <FieldError name="federal_tax_bracket" />
    </SectionCard>
  );
}

// ── Section 14: Additional Questions ─────────────────────────────────────────
function AdditionalQuestionsSection() {
  return (
    <SectionCard n={14} title="Additional Questions">
      <YesNo label="Does the client currently reside in a nursing home or assisted living facility?" name="resides_nursing_home" required />
      <YesNo label="Does the client have long-term care (LTC) insurance?" name="has_ltc_insurance" required />
      <YesNo label="Does the client have a Medicare supplement policy?" name="has_medicare_supplement" required />
      <YesNo label="Is the client actively employed?" name="actively_employed" required />
    </SectionCard>
  );
}

// ── Sections 15–20: Suitability ───────────────────────────────────────────────
function SuitabilitySection() {
  const { control } = useFormContext();
  return (
    <>
      <SectionCard n={15} title="Financial Objectives">
        <MultiCheckbox label="Select all that apply" name="financial_objectives" options={FINANCIAL_OBJECTIVES} required />
      </SectionCard>

      <SectionCard n={16} title="Other Financial Products Owned">
        <MultiCheckbox label="Select all that apply" name="other_products_owned" options={OTHER_PRODUCTS_OWNED} />
      </SectionCard>

      <SectionCard n={17} title="General Risk Tolerance">
        <Controller
          control={control}
          name="risk_tolerance"
          render={({ field }) => (
            <RadioGroup value={field.value ?? ""} onValueChange={field.onChange} className="space-y-1">
              {[
                { value: "conservative", label: "Conservative" },
                { value: "moderately_conservative", label: "Moderately Conservative" },
                { value: "moderate", label: "Moderate" },
                { value: "moderately_aggressive", label: "Moderately Aggressive" },
                { value: "aggressive", label: "Aggressive" },
              ].map((opt) => (
                <div key={opt.value} className="flex items-center gap-2">
                  <RadioGroupItem value={opt.value} id={`rt-${opt.value}`} />
                  <Label htmlFor={`rt-${opt.value}`} className="font-normal cursor-pointer">{opt.label}</Label>
                </div>
              ))}
            </RadioGroup>
          )}
        />
        <FieldError name="risk_tolerance" />
      </SectionCard>

      <SectionCard n={18} title="Distribution Method">
        <MultiCheckbox label="How do you intend to use this annuity? (select all that apply)" name="distribution_methods" options={DISTRIBUTION_METHODS} required />
      </SectionCard>

      <SectionCard n={19} title="First Distribution Timing">
        <Controller
          control={control}
          name="first_distribution_timing"
          render={({ field }) => (
            <RadioGroup value={field.value ?? ""} onValueChange={field.onChange} className="space-y-1">
              {[
                { value: "lt_1yr", label: "Less than 1 year" },
                { value: "1_5yr", label: "1–5 years" },
                { value: "6_9yr", label: "6–9 years" },
                { value: "10_plus", label: "10+ years" },
                { value: "none", label: "Not applicable" },
              ].map((opt) => (
                <div key={opt.value} className="flex items-center gap-2">
                  <RadioGroupItem value={opt.value} id={`dt-${opt.value}`} />
                  <Label htmlFor={`dt-${opt.value}`} className="font-normal cursor-pointer">{opt.label}</Label>
                </div>
              ))}
            </RadioGroup>
          )}
        />
        <FieldError name="first_distribution_timing" />
      </SectionCard>

      <SectionCard n={20} title="Source of Premium">
        <MultiCheckbox label="Where is the premium coming from? (select all that apply)" name="premium_sources" options={PREMIUM_SOURCES} required />
      </SectionCard>
    </>
  );
}

// ── Section 21: Acknowledgement ───────────────────────────────────────────────
function AcknowledgementSection() {
  const { control } = useFormContext();
  return (
    <SectionCard n={21} title="Acknowledgement">
      <p className="text-sm text-gray-600">
        By signing, the client acknowledges that all information provided is accurate and complete to the
        best of their knowledge.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormInput label="Client Signature Name" name="client_signature_name" placeholder="Full name as signature" />
        <div>
          <Label className="text-sm font-medium">Signature Date</Label>
          <Controller
            control={control}
            name="signature_date"
            render={({ field }) => (
              <Input type="date" className="mt-1" {...field} value={field.value ?? ""} />
            )}
          />
        </div>
        <FormInput label="Joint Owner Signature Name (if applicable)" name="joint_signature_name" />
        <div>
          <Label className="text-sm font-medium">Joint Signature Date</Label>
          <Controller
            control={control}
            name="joint_signature_date"
            render={({ field }) => (
              <Input type="date" className="mt-1" {...field} value={field.value ?? ""} />
            )}
          />
        </div>
      </div>
    </SectionCard>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AnnuityIntake() {
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<{ id: string; name: string } | null>(null);

  const form = useForm<AnnuityFormValues>({
    resolver: zodResolver(AnnuityFormSchema),
    defaultValues: {
      decline_mobile: false,
      primary_beneficiaries: [],
      contingent_beneficiaries: [],
      allocation_percentages: Array(18).fill(0),
      financial_objectives: [],
      other_products_owned: [],
      distribution_methods: [],
      premium_sources: [],
      monthly_disposable_income: 0,
    },
    mode: "onBlur",
  });

  const callEdgeFunction = useCallback(
    async (values: Partial<AnnuityFormValues>, isDraft: boolean) => {
      const { data: { session } } = await supabase.auth.getSession();

      // Build allocations array from parallel percentages
      const allocations = ALLOCATION_OPTIONS.map((opt, idx) => ({
        crediting_method: opt.crediting_method,
        index_option: opt.index_option,
        allocation_percentage: Number(values.allocation_percentages?.[idx]) || 0,
      })).filter((a) => a.allocation_percentage > 0);

      const body = {
        ...values,
        isDraft,
        allocations,
        primary_beneficiaries: (values.primary_beneficiaries ?? []).map((b) => ({
          ...b, beneficiary_type: "primary",
        })),
        contingent_beneficiaries: (values.contingent_beneficiaries ?? []).map((b) => ({
          ...b, beneficiary_type: "contingent",
        })),
      };

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL ?? "https://fiqmtirctaqxhqnwfuqq.supabase.co"}/functions/v1/submit-annuity-intake`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY ?? "",
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify(body),
        }
      );

      const json = await res.json();
      if (!res.ok) {
        const fieldErrors = json?.errors?.fieldErrors ?? {};
        const biz = json?.errors?.businessRules ?? [];
        const messages = [
          ...biz,
          ...Object.entries(fieldErrors).flatMap(([f, msgs]) =>
            (msgs as string[]).map((m) => `${f}: ${m}`)
          ),
        ];
        throw new Error(messages.join("\n") || json?.error || "Submission failed");
      }
      return json as { id: string; status: string };
    },
    []
  );

  const handleSaveDraft = async () => {
    const values = form.getValues();
    setSubmitting(true);
    try {
      const result = await callEdgeFunction(values, true);
      form.setValue("id", result.id);
      toast({ title: "Draft saved", description: `ID: ${result.id}` });
    } catch (err) {
      toast({ title: "Save failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmit = async (values: AnnuityFormValues) => {
    // Client-side total checks before sending
    const primTotal = values.primary_beneficiaries.reduce(
      (a, b) => a + (Number(b.share_percentage) || 0), 0
    );
    const contTotal = values.contingent_beneficiaries.reduce(
      (a, b) => a + (Number(b.share_percentage) || 0), 0
    );
    const allocTotal = values.allocation_percentages.reduce((a, b) => a + (Number(b) || 0), 0);

    const clientErrors: string[] = [];
    if (values.primary_beneficiaries.length > 0 && Math.abs(primTotal - 100) > 0.01)
      clientErrors.push("Primary beneficiary shares must sum to 100%");
    if (values.contingent_beneficiaries.length > 0 && Math.abs(contTotal - 100) > 0.01)
      clientErrors.push("Contingent beneficiary shares must sum to 100%");
    if (allocTotal > 0 && Math.abs(allocTotal - 100) > 0.01)
      clientErrors.push("Allocation percentages must sum to 100%");

    if (clientErrors.length) {
      toast({ title: "Fix before submitting", description: clientErrors.join("\n"), variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const result = await callEdgeFunction(values, false);
      setConfirmed({
        id: result.id,
        name: `${values.first_name ?? ""} ${values.last_name ?? ""}`.trim(),
      });
    } catch (err) {
      toast({
        title: "Submission failed",
        description: (err as Error).message,
        variant: "destructive",
      });
      // Scroll to top so user sees errors
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  };

  const onError = () => {
    toast({
      title: "Please fix the errors below",
      description: "Scroll through each section and correct the highlighted fields.",
      variant: "destructive",
    });
    setTimeout(() => {
      const firstError = document.querySelector("[data-error]");
      firstError?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  if (confirmed) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-md w-full text-center p-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Application Submitted</h1>
            <p className="text-gray-600 mb-4">
              Thank you, <strong>{confirmed.name}</strong>. Your Allianz 222+ annuity application has
              been received and will be reviewed shortly.
            </p>
            <p className="text-xs text-gray-400 font-mono">Reference ID: {confirmed.id}</p>
            <p className="text-xs text-gray-400 mt-2">
              Please save your reference ID. You will be contacted by your advisor to complete the
              FireLight application process.
            </p>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Allianz 222+ Annuity — Client Intake Form</h1>
          <p className="text-gray-500 text-sm mt-1">
            Complete all sections. Fields marked <span className="text-red-500">*</span> are required.
            Use "Save Draft" at any time to preserve your progress.
          </p>
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
            Your Social Security number and government ID are encrypted before being stored and are
            never logged or shared. This form uses a secure connection.
          </div>
        </div>

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onError)} noValidate>
            {/* Section 1 label */}
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 px-2">
                Section 1 — Application Data
              </span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <OwnerSection />
            <AnnuitantSection />
            <BeneficiariesSection />

            {/* Section 4 note — contingent is inside BeneficiariesSection */}
            <AllocationSection />
            <FundingSection />
            <PaymentSummarySection />
            <ReplacementSection />
            <EDeliverySection />
            <AMLSection />

            <div className="flex items-center gap-3 my-6">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 px-2">
                Section 2 — Consumer Profile &amp; Suitability
              </span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <FinancialSection />
            <AnticipatedChangesSection />
            <TaxBracketSection />
            <AdditionalQuestionsSection />
            <SuitabilitySection />
            <AcknowledgementSection />

            {/* Action bar */}
            <div className="sticky bottom-0 bg-white border-t shadow-lg -mx-4 px-4 py-4 flex flex-col sm:flex-row gap-3 justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveDraft}
                disabled={submitting}
              >
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Save Draft
              </Button>
              <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Submit Application
              </Button>
            </div>
          </form>
        </FormProvider>
      </main>
      <div className="pb-20" />
      <Footer />
    </div>
  );
}
