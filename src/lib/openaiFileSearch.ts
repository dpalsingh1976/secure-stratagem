
import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Create or reuse a vector store and upload text for File Search.
 * Returns the vector store id.
 */
export async function indexToFileSearch(texts: { id: string; text: string }[]) {
  // If a store exists in env, reuse it; otherwise create one
  const storeId = process.env.OPENAI_VECTOR_STORE_ID || (await client.beta.vectorStores.create({ name: "iul-store" })).id;

  // Upload as individual files (in-memory)
  for (const t of texts) {
    const file = await client.files.create({
      file: new Blob([t.text], { type: "text/plain" }),
      purpose: "assistants"
    });
    await client.beta.vectorStores.fileBatches.create(storeId, { file_ids: [file.id] });
  }
  return storeId;
}

/**
 * Query with File Search to get cited answer.
 */
export async function askWithFileSearch({ question, vectorStoreId }:{ question: string; vectorStoreId: string }) {
  const res = await client.responses.create({
    model: "gpt-4.1-mini",
    input: question,
    // Enable file_search tool and attach vector store
    tools: [{ type: "file_search" }],
    // @ts-ignore - unofficial param to bind store (SDK evolves)
    tool_choice: "auto",
    // HINT: Some SDK versions require 'metadata' or 'attachments' to bind vector stores.
    // We include both common shapes for forward-compat.
    metadata: { vector_store_ids: [vectorStoreId] },
    attachments: [{ vector_store_id: vectorStoreId }]
  });

  // Flatten text output (simple)
  const textOut = res.output_text || JSON.stringify(res, null, 2);
  return { text: textOut };
}
