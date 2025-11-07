
import { NextRequest, NextResponse } from "next/server";
import { indexToFileSearch } from "@/lib/openaiFileSearch";

export async function POST(req: NextRequest) {
  const STORE = (globalThis as any).__IUL_STORE__;
  if (!STORE || !STORE.rawTexts?.length) {
    return NextResponse.json({ error: "Nothing uploaded yet" }, { status: 400 });
  }
  const vectorStoreId = await indexToFileSearch(STORE.rawTexts);
  (globalThis as any).__VECTOR_STORE_ID__ = vectorStoreId;
  return NextResponse.json({ ok: true, vectorStoreId });
}
