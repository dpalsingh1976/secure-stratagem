
import { NextRequest, NextResponse } from "next/server";
import { extractWithGoogleLike } from "@/lib/googleDocAI";
import { normalizeExtracted } from "@/lib/normalization";
import type { IulCase } from "@/lib/types";

// simple in-memory store for MVP
const STORE: { items: any[], rawTexts: { id: string; text: string }[] } = { items: [], rawTexts: [] };

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const files = form.getAll('files') as File[];
  if (!files || files.length === 0) return NextResponse.json({ error: "No files" }, { status: 400 });

  const extracted = [];
  for (const f of files) {
    const item = await extractWithGoogleLike(f);
    STORE.items.push(item);
    STORE.rawTexts.push({ id: item.id, text: item.rawText });
    extracted.push({ id: item.id, carrier: item.carrier, product_name: item.product_name });
  }

  // normalized snapshot for later comparison
  const normalized: IulCase = normalizeExtracted(STORE.items as any);
  (globalThis as any).__IUL_CASE__ = normalized;
  (globalThis as any).__IUL_STORE__ = STORE;

  return NextResponse.json({ ok: true, items: extracted, normalized });
}
