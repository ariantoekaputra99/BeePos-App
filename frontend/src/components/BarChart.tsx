type Datum = { label: string; value: number; hint?: string };

/** Lightweight dependency-free bar chart with hover tooltips. */
export function BarChart({ data, format, height = 200 }: { data: Datum[]; format: (v: number) => string; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div>
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((d, i) => {
          const pct = (d.value / max) * 100;
          return (
            <div key={i} className="group relative flex h-full flex-1 flex-col justify-end">
              <div className="pointer-events-none absolute -top-2 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200 shadow group-hover:block">
                <b>{format(d.value)}</b>{d.hint && <span className="text-slate-400"> · {d.hint}</span>}
              </div>
              <div className={`w-full rounded-t-md transition ${d.value > 0 ? 'bg-amber-400/80 group-hover:bg-amber-300' : 'bg-slate-800'}`}
                style={{ height: `${Math.max(pct, 2)}%` }} />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2 border-t border-slate-800 pt-2">
        {data.map((d, i) => (
          <div key={i} className="flex-1 truncate text-center text-[11px] text-slate-500">
            {data.length > 14 && i % Math.ceil(data.length / 10) !== 0 ? '' : d.label}
          </div>
        ))}
      </div>
    </div>
  );
}
