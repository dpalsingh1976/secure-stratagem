
export function irr(cashflows: number[], guess = 0.1): number | null {
  const maxIter = 100, tol = 1e-7;
  let r = guess;
  for (let i = 0; i < maxIter; i++) {
    let f = 0, df = 0;
    for (let t = 0; t < cashflows.length; t++) {
      const denom = Math.pow(1 + r, t);
      f += cashflows[t] / denom;
      if (denom !== 0) df += -t * cashflows[t] / (denom * (1 + r));
    }
    const delta = f / df;
    r -= delta;
    if (Math.abs(delta) < tol) return r;
  }
  return null;
}

export function feeDragYear(charges: { premium_load_pct?: number; monthly_admin_fee?: number; expense_charge_pct?: number }, annualPremium: number): number {
  const load = (charges.premium_load_pct ?? 0) / 100 * annualPremium;
  const admin = (charges.monthly_admin_fee ?? 0) * 12;
  const expense = (charges.expense_charge_pct ?? 0) / 100 * annualPremium;
  return load + admin + expense;
}

export function stressReturn(base: number, deltaBps: number): number {
  return Math.max(0, base + deltaBps / 100);
}
