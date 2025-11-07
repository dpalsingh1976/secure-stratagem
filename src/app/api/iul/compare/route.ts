
import { NextRequest, NextResponse } from "next/server";
import type { IulCase } from "@/lib/types";
import { feeDragYear, irr, stressReturn } from "@/lib/math";
import { askWithFileSearch } from "@/lib/openaiFileSearch";

export async function POST(req: NextRequest) {
  const CASE: IulCase | undefined = (globalThis as any).__IUL_CASE__;
  const vectorStoreId: string | undefined = (globalThis as any).__VECTOR_STORE_ID__;
  if (!CASE || CASE.policies.length === 0) return NextResponse.json({ error: "No normalized data" }, { status: 400 });

  // Minimal table for MVP
  const headers = ["Policy", "Carrier", "Product", "Premium Load %", "Monthly Admin ($)", "Expense %", "Notes"];
  const rows = CASE.policies.map(p => [
    p.id, p.carrier ?? "-", p.product_name ?? "-",
    p.charges?.premium_load_pct ?? "-", p.charges?.monthly_admin_fee ?? "-", p.charges?.expense_charge_pct ?? "-",
    (p.sources && p.sources.length ? `See sources (${p.sources.length})` : "-")
  ]);

  // Deterministic math demo: fee drag at $12k premium and simple IRR sample
  const annualPremium = 12000;
  const feeRows = CASE.policies.map(p => ({
    id: p.id,
    feeDrag: feeDragYear(p.charges ?? {}, annualPremium)
  }));

  const charts = {
    feeDrag: feeRows.map(r => ({ policy: r.id, annualFeeDrag: r.feeDrag }))
  };

  // Ask File Search to produce cited narrative if available
  let narrative = "Citations unavailable (not indexed).";
  if (vectorStoreId) {
    const q = `Summarize premium loads and admin fees for each policy from the uploaded illustrations.
Return bullet points and include page citations if possible.
Example: "Policy_A — Premium load 6% (p.14, Table 3); Monthly admin $8 (p.9)"`;
    const ans = await askWithFileSearch({ question: q, vectorStoreId });
    narrative = ans.text;
  }

  return NextResponse.json({
    table: { headers, rows },
    charts,
    narrative
  });
}
