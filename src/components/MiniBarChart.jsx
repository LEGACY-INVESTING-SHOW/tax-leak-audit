export default function MiniBarChart({ data, maxVal }) {
  return (
    <div className="flex h-32 items-end gap-1.5">
      {data.map((d, i) => {
        const height = maxVal > 0 ? (d.cumulative / maxVal) * 100 : 0;

        return (
          <div key={d.year} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t-sm bg-gradient-to-t from-cyan-600 to-cyan-400 transition-all duration-1000 ease-out"
              style={{ height: `${Math.max(height, 2)}%`, transitionDelay: `${i * 100}ms` }}
            />
            <span className="text-[10px] text-slate-500">{d.year}</span>
          </div>
        );
      })}
    </div>
  );
}
