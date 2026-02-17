import { describe, expect, it } from "vitest";
import { calculateLeaks, DEFAULT_FORM_DATA, getMarginalRate } from "./taxLeakCalculations";

describe("taxLeakCalculations", () => {
  it("returns expected marginal rate for high MFJ income", () => {
    expect(getMarginalRate(250000, "married")).toBe(0.24);
  });

  it("produces non-zero total leak for typical high-earner profile", () => {
    const results = calculateLeaks({
      ...DEFAULT_FORM_DATA,
      filingStatus: "married",
      age: 42,
      w2Income: 180000,
      hasBusinessIncome: true,
      businessIncome: 120000,
      hasSCorp: false,
      hasHomeOffice: false,
      ownsRealEstate: true,
      hasCostSeg: false,
      propertyValue: 500000,
      retirementContribution: 1000,
      monthlyInvestable: 4000,
      lumpSum: 60000,
      hasHSA: true,
      hsaContribution: 2000,
    });

    expect(results.totalAnnualLeak).toBeGreaterThan(0);
    expect(results.leaks).toHaveLength(5);
    expect(results.cumulative10).toBeGreaterThan(results.totalAnnualLeak);
  });

  it("returns grade A for minimal leak profile", () => {
    const results = calculateLeaks({
      ...DEFAULT_FORM_DATA,
      filingStatus: "single",
      w2Income: 70000,
      hasBusinessIncome: false,
      ownsRealEstate: false,
      retirementContribution: 3000,
      monthlyInvestable: 0,
      lumpSum: 0,
    });

    expect(["A", "B+"]).toContain(results.grade);
  });
});
