import { DEFAULT_FORM_DATA } from "./taxLeakCalculations";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function sanitizeNumber(value, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return clamp(numeric, min, max);
}

export function sanitizeFormData(formData) {
  return {
    ...DEFAULT_FORM_DATA,
    ...formData,
    age: sanitizeNumber(formData.age, { min: 18, max: 100 }),
    w2Income: sanitizeNumber(formData.w2Income),
    businessIncome: sanitizeNumber(formData.businessIncome),
    propertyValue: sanitizeNumber(formData.propertyValue),
    retirementContribution: sanitizeNumber(formData.retirementContribution),
    monthlyInvestable: sanitizeNumber(formData.monthlyInvestable),
    lumpSum: sanitizeNumber(formData.lumpSum),
    hsaContribution: sanitizeNumber(formData.hsaContribution),
  };
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
