export interface PropRow {
  name: string;
  type: string;
  defaultValue?: string;
  description: string;
}

export function PropsTable({ rows }: { rows: PropRow[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="hidden w-full text-left text-sm sm:table">
        <thead className="border-b border-border bg-muted/40">
          <tr>
            <th className="px-3 py-2 font-medium">Prop</th>
            <th className="px-3 py-2 font-medium">Type</th>
            <th className="px-3 py-2 font-medium">Default</th>
            <th className="px-3 py-2 font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="border-b border-border last:border-0">
              <td className="px-3 py-2 font-mono text-xs">{row.name}</td>
              <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{row.type}</td>
              <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{row.defaultValue ?? "-"}</td>
              <td className="px-3 py-2 text-muted-foreground">{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="divide-y divide-border sm:hidden">
        {rows.map((row) => (
          <div key={row.name} className="space-y-1.5 px-3 py-3">
            <dt className="flex flex-wrap items-baseline gap-x-2 gap-y-1 font-mono text-xs">
              <span>{row.name}</span>
              <span className="text-muted-foreground">{row.type}</span>
              <span className="text-muted-foreground">default: {row.defaultValue ?? "-"}</span>
            </dt>
            <dd className="text-sm text-muted-foreground">{row.description}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
