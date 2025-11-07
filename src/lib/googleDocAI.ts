
/**
 * Google Document AI extraction helper.
 * For MVP, we return very simple text + a naive guess of structured fields if possible.
 */
import { promises as fs } from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';

export type ExtractedItem = {
  id: string;
  rawText: string;
  pages: { page: number; text: string }[];
  // naive fields for normalization demo
  carrier?: string;
  product_name?: string;
  premium_load_pct?: number | string;
  monthly_admin_fee?: number | string;
  expense_charge_pct?: number | string;
  sources?: { field: string; file: string; page?: number; note?: string }[];
};

/**
 * In production, call Google DocAI. For this MVP we parse PDF text locally with pdf-parse to keep it runnable.
 * Swap this with real DocAI if env is set.
 */
export async function extractWithGoogleLike(file: File): Promise<ExtractedItem> {
  const arrBuff = Buffer.from(await file.arrayBuffer());
  const data = await pdfParse(arrBuff);

  const lines = data.text.split('\n');
  // naive heuristics
  const carrier = lines.find(l => /life|insurance|financial/i.test(l)) || undefined;
  const product = lines.find(l => /IUL|Indexed Universal/i.test(l)) || undefined;
  const premiumLoad = lines.find(l => /premium\s+load/i.test(l)) || undefined;
  const monthlyAdmin = lines.find(l => /monthly\s+admin/i.test(l)) || undefined;
  const expensePct = lines.find(l => /expense\s+charge/i.test(l)) || undefined;

  function num(s?: string): number | string | undefined {
    if (!s) return undefined;
    const m = s.match(/(\d+(?:\.\d+)?)%?/);
    return m ? parseFloat(m[1]) : s;
  }

  return {
    id: file.name,
    rawText: data.text,
    pages: [{ page: 1, text: data.text.slice(0, 1500) + (data.text.length > 1500 ? '…' : '') }],
    carrier,
    product_name: product,
    premium_load_pct: num(premiumLoad),
    monthly_admin_fee: num(monthlyAdmin),
    expense_charge_pct: num(expensePct),
    sources: [
      carrier ? { field: 'carrier', file: file.name, page: 1 } : undefined,
      product ? { field: 'product_name', file: file.name, page: 1 } : undefined
    ].filter(Boolean) as any
  };
}
