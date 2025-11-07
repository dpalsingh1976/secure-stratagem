
'use client';
import { useState } from 'react';
import CompareTable from '@/components/CompareTable';

export default function Home() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [vectorStoreId, setVectorStoreId] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!files || files.length === 0) return;
    setLoading(true);
    const fd = new FormData();
    Array.from(files).forEach(f => fd.append('files', f));
    const res = await fetch('/api/iul/upload', { method: 'POST', body: fd });
    const json = await res.json();
    setLoading(false);
    alert('Upload done: ' + JSON.stringify({ parsed: json.items.length }));
  };

  const handleIndex = async () => {
    setLoading(true);
    const res = await fetch('/api/iul/index', { method: 'POST' });
    const json = await res.json();
    setVectorStoreId(json.vectorStoreId);
    setLoading(false);
    alert('Indexed to vector store: ' + json.vectorStoreId);
  };

  const handleCompare = async () => {
    setLoading(true);
    const res = await fetch('/api/iul/compare', { method: 'POST' });
    const json = await res.json();
    setResult(json);
    setLoading(false);
  };

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">IUL Policy Comparison (MVP)</h1>
      <div className="space-y-3 mb-6">
        <input type="file" multiple onChange={e => setFiles(e.target.files)} />
        <div className="flex gap-2">
          <button onClick={handleUpload} className="px-4 py-2 rounded bg-black text-white">1) Upload & Extract</button>
          <button onClick={handleIndex} className="px-4 py-2 rounded bg-black text-white">2) Index (File Search)</button>
          <button onClick={handleCompare} className="px-4 py-2 rounded bg-black text-white">3) Compare</button>
        </div>
      </div>

      {loading && <p>Working…</p>}
      {result && (
        <div className="space-y-6">
          <CompareTable data={result.table} />
          <section>
            <h2 className="text-xl font-semibold mb-2">Narrative</h2>
            <div className="whitespace-pre-wrap text-sm">{result.narrative}</div>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-2">Chart JSON</h2>
            <pre className="text-xs bg-gray-50 p-3 rounded">{JSON.stringify(result.charts, null, 2)}</pre>
          </section>
        </div>
      )}
    </main>
  );
}
