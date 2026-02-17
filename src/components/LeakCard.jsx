import { formatCurrency } from "../lib/taxLeakCalculations";

const STATUS_COLORS = {
  red: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    text: "text-red-400",
    badge: "bg-red-500/20 text-red-300",
  },
  yellow: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-400",
    badge: "bg-amber-500/20 text-amber-300",
  },
  green: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    badge: "bg-emerald-500/20 text-emerald-300",
  },
  neutral: {
    bg: "bg-slate-500/10",
    border: "border-slate-500/30",
    text: "text-slate-400",
    badge: "bg-slate-500/20 text-slate-300",
  },
};

const STATUS_LABEL = {
  red: "Significant Leak",
  yellow: "Optimization Available",
  green: "Optimized",
  neutral: "N/A",
};

export default function LeakCard({ leak, index, revealed }) {
  const colors = STATUS_COLORS[leak.status] || STATUS_COLORS.neutral;

  return (
    <div
      className={`${colors.bg} ${colors.border} rounded-xl border p-5 transition-all duration-700 ${
        revealed ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
      style={{ transitionDelay: `${index * 150}ms` }}
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{leak.icon}</span>
          <div>
            <h3 className="text-base font-semibold text-white">{leak.name}</h3>
            <span className={`rounded-full px-2 py-0.5 text-xs ${colors.badge}`}>{STATUS_LABEL[leak.status]}</span>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold ${colors.text}`}>{leak.amount > 0 ? formatCurrency(leak.amount) : "-"}</p>
          <p className="text-xs text-slate-500">/year</p>
        </div>
      </div>

      {leak.details.length > 0 && (
        <div className="mt-3 space-y-2">
          {leak.details.map((detail) => (
            <p key={detail} className="text-sm leading-relaxed text-slate-400">
              {detail}
            </p>
          ))}
        </div>
      )}

      {leak.strategies.length > 0 && (
        <div className="mt-4 border-t border-slate-700/50 pt-3">
          <p className="mb-2 text-xs uppercase tracking-wider text-slate-500">Strategies to explore:</p>
          <div className="flex flex-wrap gap-2">
            {leak.strategies.map((strategy) => (
              <span
                key={strategy}
                className="rounded-md border border-slate-700/50 bg-slate-800/80 px-2.5 py-1 text-xs text-slate-300"
              >
                {strategy}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
