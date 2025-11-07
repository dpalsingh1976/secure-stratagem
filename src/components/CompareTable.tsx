
export default function CompareTable({ data }: { data: any }) {
  if (!data || !data.rows) return null;
  return (
    <div className="overflow-x-auto border rounded">
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            {data.headers.map((h: string, i: number) => (
              <th key={i} className="px-3 py-2 text-left border-b bg-gray-50">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((r: any, i: number) => (
            <tr key={i} className="border-b">
              {r.map((c: any, j: number) => (
                <td key={j} className="px-3 py-2 align-top">
                  {typeof c === 'string' ? c : JSON.stringify(c)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
