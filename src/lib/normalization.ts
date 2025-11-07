
import type { IulCase, IulPolicy } from './types';

/** Minimal normalization: map raw extracted fields to canonical keys. */
export function normalizeExtracted(rawItems: any[]): IulCase {
  const policies: IulPolicy[] = rawItems.map((r, i) => ({
    id: r.id || `policy_${i+1}`,
    carrier: r.carrier ?? r.Carrier ?? r.company ?? null,
    product_name: r.product_name ?? r.Product ?? r['Product Name'] ?? null,
    charges: {
      premium_load_pct: numOrNull(r.premium_load_pct ?? r['premium load %'] ?? r['Premium Load %']),
      monthly_admin_fee: numOrNull(r.monthly_admin_fee ?? r['Monthly Admin Fee']),
      expense_charge_pct: numOrNull(r.expense_charge_pct ?? r['Expense Charge %'])
    },
    indices: r.indices ?? r.Indexes ?? [],
    projected_values: r.projected_values ?? [],
    ratings: r.ratings ?? {},
    sources: r.sources ?? []
  }));
  return { policies };
}

function numOrNull(v:any): number | undefined {
  if (v === null || v === undefined) return undefined;
  if (typeof v === 'number') return v;
  const s = String(v).replace(/[^0-9.\-]/g, '');
  const n = parseFloat(s);
  return isNaN(n) ? undefined : n;
}
