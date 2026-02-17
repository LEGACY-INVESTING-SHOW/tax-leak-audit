import { useRef, useState } from "react";
import LeakCard from "./components/LeakCard";
import { InputField, SelectField, ToggleField } from "./components/FormFields";
import MiniBarChart from "./components/MiniBarChart";
import ProgressBar from "./components/ProgressBar";
import { trackEvent } from "./lib/analytics";
import { buildLeadPayload, submitLead } from "./lib/leadCapture";
import { calculateLeaks, DEFAULT_FORM_DATA, formatCurrency } from "./lib/taxLeakCalculations";
import { isValidEmail, sanitizeFormData } from "./lib/validation";

const BOOKING_LINK = import.meta.env.VITE_BOOKING_URL || "#book";

function TopGlow() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-cyan-500/5 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-red-500/5 blur-3xl" />
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [results, setResults] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const topRef = useRef(null);

  const update = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  const goToStep = (nextStep) => {
    if (nextStep > step && nextStep <= 4) {
      trackEvent("step_completed", { step, next_step: nextStep });
    }
    setStep(nextStep);
    topRef.current?.scrollIntoView({ behavior: "smooth" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startAudit = () => {
    trackEvent("audit_started");
    goToStep(1);
  };

  const handleCalculate = () => {
    const cleanData = sanitizeFormData(formData);
    const computed = calculateLeaks(cleanData);
    setResults(computed);
    trackEvent("audit_calculated", {
      annual_leak: computed.totalAnnualLeak,
      grade: computed.grade,
      total_income: computed.totalIncome,
    });
    goToStep(5);
  };

  const handleEmailSubmit = async (event) => {
    event.preventDefault();
    setSubmitError("");

    if (!firstName.trim()) {
      setSubmitError("First name is required.");
      return;
    }

    if (!isValidEmail(email)) {
      setSubmitError("Please enter a valid email address.");
      return;
    }

    if (!results) {
      setSubmitError("Run your audit first.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = buildLeadPayload({ firstName: firstName.trim(), email: email.trim(), results });
      await submitLead(payload);
      trackEvent("email_captured", {
        annual_leak: results.totalAnnualLeak,
        grade: results.grade,
      });
      goToStep(6);
      setTimeout(() => setRevealed(true), 300);
    } catch (error) {
      console.error(error);
      setSubmitError(
        "We could not submit your report right now. Please retry in a moment or contact us directly."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const onCtaClick = () => {
    trackEvent("cta_clicked", {
      annual_leak: results?.totalAnnualLeak || 0,
      grade: results?.grade || "unknown",
    });
  };

  return (
    <div ref={topRef} className="min-h-screen bg-slate-950 text-white">
      <TopGlow />

      {step === 0 && (
        <div className="relative mx-auto max-w-3xl px-5 py-16 sm:py-24">
          <div className="mb-8 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-1.5 text-sm text-red-400">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-400" />
              Free 60-Second Tax Audit
            </span>
          </div>

          <h1 className="mb-6 text-center text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            How Much Money Are You{" "}
            <span className="bg-gradient-to-r from-red-400 to-amber-400 bg-clip-text text-transparent">Leaking</span>{" "}
            in Taxes Every Year?
          </h1>

          <p className="mx-auto mb-4 max-w-2xl text-center text-lg leading-relaxed text-slate-400 sm:text-xl">
            Most high-income earners overpay by $8,000-$25,000 per year without realizing it.
          </p>

          <p className="mb-10 text-center text-sm text-slate-500">No account required. Takes less than 60 seconds.</p>

          <div className="mb-16 flex justify-center">
            <button
              type="button"
              onClick={startAudit}
              className="group rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 px-10 py-4 text-lg font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition-all duration-300 hover:scale-105 hover:shadow-cyan-500/40"
            >
              Find My Tax Leaks
              <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">→</span>
            </button>
          </div>

          <div className="mx-auto grid max-w-lg grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-white">2,400+</p>
              <p className="text-xs text-slate-500">Audits completed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">$14,200</p>
              <p className="text-xs text-slate-500">Avg. annual leak found</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">60 sec</p>
              <p className="text-xs text-slate-500">To complete</p>
            </div>
          </div>

          <p className="mt-16 text-center text-xs text-slate-600">
            Educational estimates only. Not tax, legal, or investment advice.
          </p>
        </div>
      )}

      {step >= 1 && step <= 4 && (
        <div className="relative mx-auto max-w-xl px-5 py-12">
          <ProgressBar step={step} totalSteps={4} />

          {step === 1 && (
            <div>
              <h2 className="mb-1 text-2xl font-bold">Let&apos;s start with the basics</h2>
              <p className="mb-8 text-sm text-slate-400">This helps estimate your current tax position.</p>

              <SelectField
                label="Filing Status"
                value={formData.filingStatus}
                onChange={(value) => update("filingStatus", value)}
                options={[
                  { value: "married", label: "Married Filing Jointly" },
                  { value: "single", label: "Single" },
                  { value: "hoh", label: "Head of Household" },
                ]}
              />

              <InputField
                label="Age"
                value={formData.age}
                onChange={(value) => update("age", value)}
                placeholder="35"
                helpText="Affects contribution limits for retirement accounts"
              />

              <InputField
                label="W-2 Income (Annual)"
                value={formData.w2Income}
                onChange={(value) => update("w2Income", value)}
                prefix="$"
                placeholder="150000"
              />
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="mb-1 text-2xl font-bold">Business & Self-Employment</h2>
              <p className="mb-8 text-sm text-slate-400">Business income can unlock major optimization levers.</p>

              <ToggleField
                label="Do you have business or self-employment income?"
                value={formData.hasBusinessIncome}
                onChange={(value) => update("hasBusinessIncome", value)}
              />

              {formData.hasBusinessIncome && (
                <>
                  <InputField
                    label="Annual Business Net Profit"
                    value={formData.businessIncome}
                    onChange={(value) => update("businessIncome", value)}
                    prefix="$"
                    placeholder="50000"
                  />

                  <ToggleField
                    label="Do you have an S-Corp election?"
                    value={formData.hasSCorp}
                    onChange={(value) => update("hasSCorp", value)}
                  />

                  <ToggleField
                    label="Do you claim a home office deduction?"
                    value={formData.hasHomeOffice}
                    onChange={(value) => update("hasHomeOffice", value)}
                  />
                </>
              )}
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="mb-1 text-2xl font-bold">Real Estate & Retirement</h2>
              <p className="mb-8 text-sm text-slate-400">Two of the biggest tax levers for high earners.</p>

              <ToggleField
                label="Do you own investment real estate?"
                value={formData.ownsRealEstate}
                onChange={(value) => update("ownsRealEstate", value)}
              />

              {formData.ownsRealEstate && (
                <>
                  <InputField
                    label="Total Property Value"
                    value={formData.propertyValue}
                    onChange={(value) => update("propertyValue", value)}
                    prefix="$"
                    placeholder="300000"
                  />

                  <ToggleField
                    label="Have you done a cost segregation study?"
                    value={formData.hasCostSeg}
                    onChange={(value) => update("hasCostSeg", value)}
                  />
                </>
              )}

              <div className="my-6 border-t border-slate-800" />

              <SelectField
                label="Current Retirement Account Type"
                value={formData.currentRetirement}
                onChange={(value) => update("currentRetirement", value)}
                options={[
                  { value: "employer401k", label: "Employer 401(k)" },
                  { value: "solo401k", label: "Solo 401(k)" },
                  { value: "ira", label: "IRA Only" },
                  { value: "none", label: "No Retirement Accounts" },
                ]}
              />

              <InputField
                label="Monthly Retirement Contribution"
                value={formData.retirementContribution}
                onChange={(value) => update("retirementContribution", value)}
                prefix="$"
                placeholder="500"
              />

              <ToggleField
                label="Do you have an HSA?"
                value={formData.hasHSA}
                onChange={(value) => update("hasHSA", value)}
              />

              {formData.hasHSA && (
                <InputField
                  label="Annual HSA Contribution"
                  value={formData.hsaContribution}
                  onChange={(value) => update("hsaContribution", value)}
                  prefix="$"
                  placeholder="3000"
                />
              )}
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="mb-1 text-2xl font-bold">Investment & Surplus Cash</h2>
              <p className="mb-8 text-sm text-slate-400">Used to estimate long-term tax drag and compounding cost.</p>

              <InputField
                label="Monthly Investable Surplus"
                value={formData.monthlyInvestable}
                onChange={(value) => update("monthlyInvestable", value)}
                prefix="$"
                placeholder="1000"
              />

              <InputField
                label="Lump Sum Available to Invest"
                value={formData.lumpSum}
                onChange={(value) => update("lumpSum", value)}
                prefix="$"
                placeholder="25000"
              />
            </div>
          )}

          <div className="mt-10 flex justify-between">
            <button
              type="button"
              onClick={() => goToStep(step - 1)}
              className="text-sm text-slate-400 transition-colors hover:text-white"
            >
              ← Back
            </button>

            {step < 4 ? (
              <button
                type="button"
                onClick={() => goToStep(step + 1)}
                className="rounded-lg bg-cyan-500 px-8 py-3 font-semibold text-slate-950 transition-all hover:bg-cyan-400"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCalculate}
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 px-8 py-3 font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition-all hover:scale-105 hover:shadow-cyan-500/40"
              >
                Analyze My Tax Leaks
              </button>
            )}
          </div>
        </div>
      )}

      {step === 5 && results && (
        <div className="relative mx-auto max-w-xl px-5 py-12 text-center">
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full border-2 border-red-500/30 bg-red-500/10">
            <span className="text-3xl font-bold text-red-400">{results.grade}</span>
          </div>

          <h2 className="mb-3 text-3xl font-bold sm:text-4xl">
            Your Tax Efficiency Score: <span className="text-red-400">{results.grade}</span>
          </h2>

          <p className="mb-2 text-slate-400">We found potential tax leaks totaling:</p>

          <div className="my-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-8">
            <p className="mb-2 text-5xl font-bold text-red-400 sm:text-6xl">{formatCurrency(results.totalAnnualLeak)}</p>
            <p className="text-slate-400">estimated annual tax leak</p>
          </div>

          <div className="mb-8 rounded-xl border border-slate-800 bg-slate-900/50 p-5 text-left">
            <p className="mb-3 text-sm text-slate-400">
              Your audit found leaks across {results.leaks.filter((l) => l.amount > 0).length} categories:
            </p>
            {results.leaks.map((leak) => (
              <div key={leak.id} className="flex items-center justify-between border-b border-slate-800/50 py-2 last:border-0">
                <span className="flex items-center gap-2 text-sm text-slate-300">
                  {leak.icon} {leak.name}
                </span>
                <span className="text-sm text-slate-600">{leak.amount > 0 ? "••••••" : "Optimized ✓"}</span>
              </div>
            ))}
            <p className="mt-3 text-center text-xs text-slate-500">Enter your email to unlock the full breakdown</p>
          </div>

          <p className="mb-8 text-sm text-slate-400">
            If left unaddressed, this leak could cost you{" "}
            <span className="font-semibold text-red-400">{formatCurrency(results.cumulative10)}</span> over 10 years.
          </p>

          <form onSubmit={handleEmailSubmit} className="mx-auto max-w-sm">
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
              required
              className="mb-3 w-full rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              className="mb-4 w-full rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 py-4 text-lg font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition-all hover:scale-105 hover:shadow-cyan-500/40 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? "Submitting..." : "Unlock My Full Audit Report"}
            </button>
            {submitError && <p className="mt-3 text-sm text-red-300">{submitError}</p>}
            <p className="mt-3 text-xs text-slate-600">No spam. Just your report and practical strategy notes.</p>
          </form>
        </div>
      )}

      {step === 6 && results && (
        <div className="relative mx-auto max-w-2xl px-5 py-12">
          <div className="mb-10 text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/50 px-4 py-1.5 text-sm text-slate-300">
              <span className="inline-block h-2 w-2 rounded-full bg-cyan-400" />
              {firstName}&apos;s Tax Leak Audit
            </div>
            <h1 className="mb-2 text-3xl font-bold sm:text-4xl">Your Full Tax Leak Report</h1>
            <p className="text-slate-400">Here is your category-by-category estimate.</p>
          </div>

          <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-center">
              <p className="mb-1 text-xs text-red-300">Annual Leak</p>
              <p className="text-xl font-bold text-red-400">{formatCurrency(results.totalAnnualLeak)}</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 text-center">
              <p className="mb-1 text-xs text-slate-400">3-Year Cost</p>
              <p className="text-xl font-bold text-white">{formatCurrency(results.cumulative3)}</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 text-center">
              <p className="mb-1 text-xs text-slate-400">5-Year Cost</p>
              <p className="text-xl font-bold text-white">{formatCurrency(results.cumulative5)}</p>
            </div>
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-center">
              <p className="mb-1 text-xs text-red-300">10-Year Cost</p>
              <p className="text-xl font-bold text-red-400">{formatCurrency(results.cumulative10)}</p>
            </div>
          </div>

          <div className="mb-10 rounded-xl border border-slate-800 bg-slate-900/50 p-5">
            <p className="mb-4 text-sm text-slate-400">Cumulative cost of inaction over 10 years</p>
            <MiniBarChart data={results.yearlyData} maxVal={results.cumulative10} />
          </div>

          <div className="mb-10 flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-5">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full border-2 border-red-500/30 bg-red-500/10">
              <span className="text-2xl font-bold text-red-400">{results.grade}</span>
            </div>
            <div>
              <p className="font-semibold text-white">Tax Efficiency Grade: {results.grade}</p>
              <p className="text-sm text-slate-400">
                {results.grade === "D" &&
                  "Several significant leak areas are likely present. These are typically actionable with planning."}
                {results.grade === "C" &&
                  "You have a solid start, with meaningful optimization opportunities remaining."}
                {results.grade === "B" &&
                  "Strong foundation with still-meaningful improvements available."}
                {(results.grade === "B+" || results.grade === "A") &&
                  "You appear relatively optimized, with smaller tactical improvements potentially available."}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Marginal tax rate: {Math.round(results.marginalRate * 100)}% | Income analyzed: {formatCurrency(results.totalIncome)}
              </p>
            </div>
          </div>

          <h2 className="mb-6 text-xl font-bold">Category Breakdown</h2>
          <div className="mb-12 space-y-4">
            {results.leaks.map((leak, i) => (
              <LeakCard key={leak.id} leak={leak} index={i} revealed={revealed} />
            ))}
          </div>

          <div className="mb-10 rounded-xl border border-slate-800 bg-slate-900/50 p-6 text-center">
            <p className="mb-2 text-3xl font-bold text-cyan-400">
              {results.leaks.reduce((sum, leak) => sum + leak.strategies.length, 0)}
            </p>
            <p className="text-slate-400">strategies identified for your scenario</p>
          </div>

          <div className="mb-10 rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 p-8 text-center">
            <h2 className="mb-3 text-2xl font-bold">Ready to Plug the Leaks?</h2>
            <p className="mx-auto mb-2 max-w-md text-slate-400">
              This audit estimates where leakage may exist. A custom implementation plan maps exact steps for your case.
            </p>
            <p className="mb-6 text-sm text-slate-500">
              Typical first-year improvement target: {formatCurrency(results.totalAnnualLeak * 0.7)}+
            </p>
            {/* IMPORTANT: Replace VITE_BOOKING_URL in .env with your real booking or webinar URL. */}
            <a
              href={BOOKING_LINK}
              onClick={onCtaClick}
              className="inline-block rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 px-10 py-4 text-lg font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition-all hover:scale-105 hover:shadow-cyan-500/40"
            >
              Get My Custom Wealth Plan
            </a>
            <p className="mt-4 text-xs text-slate-600">Free strategy session. No obligation.</p>
          </div>

          <div className="border-t border-slate-800 pt-6">
            <p className="text-xs leading-relaxed text-slate-600">
              <strong className="text-slate-500">Important:</strong> This Tax Leak Audit provides educational estimates only and is not tax,
              legal, or investment advice. Actual savings depend on your full financial profile, applicable law, and implementation quality.
              Rules can change. Assumptions are based on general U.S. federal 2025 tax thresholds and an illustrative 8% growth model.
              Consult a qualified tax professional before acting.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
