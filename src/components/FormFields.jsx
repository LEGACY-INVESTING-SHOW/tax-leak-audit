export function InputField({ label, value, onChange, prefix, suffix, type = "number", placeholder, helpText }) {
  return (
    <div className="mb-5">
      <label className="mb-1.5 block text-sm font-medium text-slate-300">{label}</label>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">{prefix}</span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) =>
            onChange(type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)
          }
          placeholder={placeholder}
          className={`w-full rounded-lg border border-slate-700 bg-slate-800/60 py-3 text-white placeholder-slate-500 transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${
            prefix ? "pl-8" : "pl-4"
          } ${suffix ? "pr-12" : "pr-4"}`}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">{suffix}</span>
        )}
      </div>
      {helpText && <p className="mt-1 text-xs text-slate-500">{helpText}</p>}
    </div>
  );
}

export function ToggleField({ label, value, onChange, helpText }) {
  return (
    <div className="mb-5 flex items-center justify-between py-2">
      <div>
        <span className="text-sm font-medium text-slate-300">{label}</span>
        {helpText && <p className="mt-0.5 text-xs text-slate-500">{helpText}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 ${
          value ? "bg-cyan-500" : "bg-slate-700"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 ${
            value ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

export function SelectField({ label, value, onChange, options }) {
  return (
    <div className="mb-5">
      <label className="mb-1.5 block text-sm font-medium text-slate-300">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-3 text-white transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
