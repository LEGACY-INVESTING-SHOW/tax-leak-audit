export default function ProgressBar({ step, totalSteps }) {
  const pct = (step / totalSteps) * 100;

  return (
    <div className="w-full mb-8">
      <div className="mb-2 flex justify-between text-xs text-slate-400">
        <span>
          Step {step} of {totalSteps}
        </span>
        <span>{Math.round(pct)}% complete</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
