const TAX_BRACKETS_MFJ_2025 = [
  { min: 0, max: 23850, rate: 0.1 },
  { min: 23850, max: 96950, rate: 0.12 },
  { min: 96950, max: 206700, rate: 0.22 },
  { min: 206700, max: 394600, rate: 0.24 },
  { min: 394600, max: 501050, rate: 0.32 },
  { min: 501050, max: 751600, rate: 0.35 },
  { min: 751600, max: Infinity, rate: 0.37 },
];

const TAX_BRACKETS_SINGLE_2025 = [
  { min: 0, max: 11925, rate: 0.1 },
  { min: 11925, max: 48475, rate: 0.12 },
  { min: 48475, max: 103350, rate: 0.22 },
  { min: 103350, max: 197300, rate: 0.24 },
  { min: 197300, max: 250525, rate: 0.32 },
  { min: 250525, max: 626350, rate: 0.35 },
  { min: 626350, max: Infinity, rate: 0.37 },
];

const TAX_BRACKETS_HOH_2025 = [
  { min: 0, max: 17000, rate: 0.1 },
  { min: 17000, max: 64850, rate: 0.12 },
  { min: 64850, max: 103350, rate: 0.22 },
  { min: 103350, max: 197300, rate: 0.24 },
  { min: 197300, max: 250500, rate: 0.32 },
  { min: 250500, max: 626350, rate: 0.35 },
  { min: 626350, max: Infinity, rate: 0.37 },
];

const SS_WAGE_BASE = 176100;
const HOME_OFFICE_SIMPLIFIED = 1500;
const AUGUSTA_RULE_DAYS = 14;
const AVG_DAILY_RENTAL_RATE = 1500;
const SOLO_401K_EMPLOYEE_LIMIT = 23500;
const SOLO_401K_CATCHUP_50 = 7500;
const SOLO_401K_MAX = 69000;
const TRAD_401K_LIMIT = 23500;
const IRA_LIMIT = 7000;
const HSA_FAMILY = 8550;
const HSA_INDIVIDUAL = 4300;

export const DEFAULT_FORM_DATA = {
  filingStatus: "married",
  age: 35,
  w2Income: 0,
  hasBusinessIncome: false,
  businessIncome: 0,
  hasSCorp: false,
  hasHomeOffice: false,
  ownsRealEstate: false,
  hasCostSeg: false,
  propertyValue: 0,
  currentRetirement: "employer401k",
  retirementContribution: 0,
  monthlyInvestable: 0,
  lumpSum: 0,
  hasHSA: false,
  hsaContribution: 0,
};

export function getMarginalRate(income, filingStatus) {
  const brackets =
    filingStatus === "married"
      ? TAX_BRACKETS_MFJ_2025
      : filingStatus === "hoh"
        ? TAX_BRACKETS_HOH_2025
        : TAX_BRACKETS_SINGLE_2025;

  for (let i = brackets.length - 1; i >= 0; i -= 1) {
    if (income > brackets[i].min) return brackets[i].rate;
  }

  return 0.1;
}

export function formatCurrency(num) {
  if (num === undefined || num === null || Number.isNaN(num)) return "$0";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.round(num));
}

export function calculateLeaks(data) {
  const totalIncome = data.w2Income + (data.hasBusinessIncome ? data.businessIncome : 0);
  const marginalRate = getMarginalRate(totalIncome, data.filingStatus);
  const isOver50 = data.age >= 50;

  const leaks = [];
  let totalAnnualLeak = 0;

  let entityLeak = 0;
  let entityStatus = "green";
  const entityDetails = [];

  if (data.hasBusinessIncome && data.businessIncome > 0) {
    if (!data.hasSCorp && data.businessIncome >= 40000) {
      const reasonableSalary = Math.min(data.businessIncome * 0.45, data.businessIncome);
      const distributions = data.businessIncome - reasonableSalary;
      const seTaxCapRoom = SS_WAGE_BASE - data.w2Income > 0 ? SS_WAGE_BASE - data.w2Income : 0;
      const seTaxSaved = Math.min(distributions, seTaxCapRoom) * 0.153;

      entityLeak = Math.max(Math.round(seTaxSaved * 0.6), 0);
      if (data.businessIncome > 80000) {
        entityLeak = Math.round(data.businessIncome * 0.06);
      }

      entityStatus = "red";
      entityDetails.push(
        `Without an S-Corp election, you may be paying self-employment tax on your full ${formatCurrency(data.businessIncome)} in business profit.`
      );
      entityDetails.push(
        "An S-Corp can split profit between salary and distributions, which may reduce payroll tax exposure on distributions."
      );
    } else if (data.hasSCorp) {
      entityStatus = "green";
      entityDetails.push("You currently report an S-Corp election.");
    } else {
      entityStatus = "yellow";
      entityLeak = Math.round(data.businessIncome * 0.02);
      entityDetails.push("Business profit may not yet justify S-Corp complexity, but monitor as income grows.");
    }
  } else {
    entityStatus = "neutral";
    entityDetails.push("No business income reported.");
  }

  leaks.push({
    id: "entity",
    name: "Entity Structure",
    icon: "🏢",
    amount: entityLeak,
    status: entityStatus,
    details: entityDetails,
    strategies:
      !data.hasSCorp && data.hasBusinessIncome && data.businessIncome >= 40000
        ? ["S-Corp Election", "Reasonable Salary Optimization", "Payroll Tax Reduction"]
        : [],
  });
  totalAnnualLeak += entityLeak;

  let retirementLeak = 0;
  let retirementStatus = "green";
  const retirementDetails = [];
  const retirementStrategies = [];

  let maxPossibleContribution = 0;

  if (data.hasBusinessIncome && data.businessIncome > 0) {
    const employeeMax = SOLO_401K_EMPLOYEE_LIMIT + (isOver50 ? SOLO_401K_CATCHUP_50 : 0);
    const employerMax = Math.round(data.businessIncome * 0.25);
    maxPossibleContribution = Math.min(
      employeeMax + employerMax,
      SOLO_401K_MAX + (isOver50 ? SOLO_401K_CATCHUP_50 : 0)
    );
    retirementStrategies.push("Solo 401(k)");
  } else {
    maxPossibleContribution = TRAD_401K_LIMIT + (isOver50 ? SOLO_401K_CATCHUP_50 : 0);
  }

  maxPossibleContribution += IRA_LIMIT;
  retirementStrategies.push("Traditional/Roth IRA");

  if (!data.hasHSA || data.hsaContribution < (data.filingStatus === "married" ? HSA_FAMILY : HSA_INDIVIDUAL)) {
    const hsaMax = data.filingStatus === "married" ? HSA_FAMILY : HSA_INDIVIDUAL;
    const hsaGap = hsaMax - (data.hasHSA ? data.hsaContribution : 0);
    if (hsaGap > 0) {
      maxPossibleContribution += hsaGap;
      retirementStrategies.push("HSA (Triple Tax Advantage)");
    }
  }

  const currentAnnualContribution = data.retirementContribution * 12;
  const contributionGap = Math.max(maxPossibleContribution - currentAnnualContribution, 0);

  if (contributionGap > 0) {
    retirementLeak = Math.round(contributionGap * marginalRate);
    retirementStatus = contributionGap > 10000 ? "red" : "yellow";
    retirementDetails.push(`You currently contribute about ${formatCurrency(currentAnnualContribution)} per year.`);
    retirementDetails.push(`Estimated potential annual sheltering: ${formatCurrency(maxPossibleContribution)}.`);
    retirementDetails.push(
      `Contribution gap ${formatCurrency(contributionGap)} taxed around ${Math.round(marginalRate * 100)}% marginal rate.`
    );
  } else {
    retirementDetails.push("You appear to be close to maximum available retirement contributions.");
  }

  leaks.push({
    id: "retirement",
    name: "Retirement Strategy",
    icon: "🏦",
    amount: retirementLeak,
    status: retirementStatus,
    details: retirementDetails,
    strategies: retirementStrategies,
  });
  totalAnnualLeak += retirementLeak;

  let realEstateLeak = 0;
  let realEstateStatus = "green";
  const realEstateDetails = [];
  const realEstateStrategies = [];

  if (data.ownsRealEstate && data.propertyValue > 0) {
    if (!data.hasCostSeg) {
      const buildingValue = data.propertyValue * 0.8;
      const acceleratedDepreciation = buildingValue * 0.25;
      const firstYearBenefit = Math.round(acceleratedDepreciation * marginalRate);

      realEstateLeak = Math.round(firstYearBenefit * 0.35);
      realEstateStatus = "red";
      realEstateDetails.push(
        `A ${formatCurrency(data.propertyValue)} property without cost segregation can miss accelerated depreciation opportunity.`
      );
      realEstateDetails.push(
        `Potentially accelerate around ${formatCurrency(acceleratedDepreciation)} depreciation into earlier years.`
      );
      realEstateStrategies.push("Cost Segregation Study", "Bonus Depreciation");
    }

    if (totalIncome > 100000) {
      const strBenefit = Math.round(Math.min(totalIncome * 0.04, 25000) * marginalRate * 0.5);
      realEstateLeak += strBenefit;
      realEstateDetails.push(
        "Short-term rental material participation may allow losses to offset ordinary income with fewer passive limitations."
      );
      realEstateStrategies.push("STR Material Participation", "Real Estate Professional Status");
    }
  } else if (totalIncome > 100000) {
    realEstateLeak = Math.round(Math.min(totalIncome * 0.03, 15000));
    realEstateStatus = "yellow";
    realEstateDetails.push(
      "No investment real estate reported; this may represent a missed tax strategy category for some high earners."
    );
    realEstateStrategies.push("Short-Term Rental Investment", "Cost Segregation Study", "Bonus Depreciation");
  }

  leaks.push({
    id: "realestate",
    name: "Real Estate Tax Benefits",
    icon: "🏠",
    amount: realEstateLeak,
    status: realEstateStatus,
    details: realEstateDetails,
    strategies: realEstateStrategies,
  });
  totalAnnualLeak += realEstateLeak;

  let deductionLeak = 0;
  const deductionDetails = [];
  const deductionStrategies = [];

  if (data.hasBusinessIncome && !data.hasHomeOffice) {
    const homeOfficeSavings = Math.round(HOME_OFFICE_SIMPLIFIED * marginalRate);
    deductionLeak += homeOfficeSavings;
    deductionDetails.push(`Home office simplified method can provide ${formatCurrency(HOME_OFFICE_SIMPLIFIED)} deduction.`);
    deductionStrategies.push("Home Office Deduction");
  }

  if (data.hasBusinessIncome && data.businessIncome > 30000) {
    const augustaBenefit = Math.round(AUGUSTA_RULE_DAYS * AVG_DAILY_RENTAL_RATE * marginalRate * 0.5);
    deductionLeak += augustaBenefit;
    deductionDetails.push("Augusta Rule can allow business rent expense with tax-free personal rental income under limits.");
    deductionStrategies.push("Augusta Rule (Section 280A)");
  }

  if (data.hasBusinessIncome && data.businessIncome > 0) {
    const qbiLimit = data.filingStatus === "married" ? 394600 : 197300;
    if (totalIncome < qbiLimit) {
      const qbiDeduction = Math.round(data.businessIncome * 0.2);
      const qbiSavings = Math.round(qbiDeduction * marginalRate);
      deductionLeak += Math.round(qbiSavings * 0.15);
      deductionDetails.push("QBI optimization opportunities may exist depending on entity setup and taxable income.");
      deductionStrategies.push("QBI Optimization");
    }
  }

  if (data.hasBusinessIncome && data.businessIncome > 20000) {
    deductionLeak += Math.round(3500 * marginalRate);
    deductionDetails.push("Vehicle deduction strategy may be available for business use vehicles.");
    deductionStrategies.push("Business Vehicle Deduction (Section 179)");
  }

  if (totalIncome > 150000) {
    deductionLeak += Math.round(2000 * marginalRate);
    deductionDetails.push("Charitable strategy tuning (DAF, bunching, appreciated assets) can improve outcomes.");
    deductionStrategies.push("Donor-Advised Fund Strategy");
  }

  const deductionStatus = deductionLeak > 3000 ? "red" : deductionLeak > 0 ? "yellow" : "green";

  leaks.push({
    id: "deductions",
    name: "Deduction Gap",
    icon: "📋",
    amount: deductionLeak,
    status: deductionStatus,
    details: deductionDetails,
    strategies: deductionStrategies,
  });
  totalAnnualLeak += deductionLeak;

  const annualInvestable = data.monthlyInvestable * 12 + data.lumpSum * 0.1;
  let investmentLeak = 0;
  let investmentStatus = "green";
  const investmentDetails = [];
  const investmentStrategies = [];

  if (annualInvestable > 0) {
    const annualDrag = Math.round((annualInvestable * 0.015 * marginalRate * 10) / 10);
    investmentLeak = annualDrag;

    if (annualInvestable > 5000) {
      investmentStatus = "yellow";
      investmentDetails.push(
        `With ${formatCurrency(annualInvestable)} yearly surplus, account location and tax drag management matter.`
      );
      investmentStrategies.push("Tax-Efficient Asset Location", "Tax-Loss Harvesting");
    }

    if (totalIncome > 200000) {
      investmentLeak += Math.round(annualInvestable * 0.038 * 0.3);
      investmentDetails.push("At higher incomes NIIT may apply on net investment income.");
      investmentStrategies.push("NIIT Reduction Strategies");
    }
  }

  leaks.push({
    id: "investment",
    name: "Investment Efficiency",
    icon: "📈",
    amount: investmentLeak,
    status: investmentStatus,
    details: investmentDetails,
    strategies: investmentStrategies,
  });
  totalAnnualLeak += investmentLeak;

  const growthRate = 0.08;
  let cumulative3 = 0;
  let cumulative5 = 0;
  let cumulative10 = 0;
  const yearlyData = [];

  for (let y = 1; y <= 10; y += 1) {
    const yearValue = totalAnnualLeak * Math.pow(1 + growthRate, y - 1);
    const cumulativeValue = totalAnnualLeak * ((Math.pow(1 + growthRate, y) - 1) / growthRate);
    yearlyData.push({ year: y, annual: Math.round(yearValue), cumulative: Math.round(cumulativeValue) });
    if (y === 3) cumulative3 = Math.round(cumulativeValue);
    if (y === 5) cumulative5 = Math.round(cumulativeValue);
    if (y === 10) cumulative10 = Math.round(cumulativeValue);
  }

  let grade = "A";
  if (totalAnnualLeak > 20000) grade = "D";
  else if (totalAnnualLeak > 12000) grade = "C";
  else if (totalAnnualLeak > 6000) grade = "B";
  else if (totalAnnualLeak > 2000) grade = "B+";

  return {
    leaks,
    totalAnnualLeak,
    cumulative3,
    cumulative5,
    cumulative10,
    yearlyData,
    marginalRate,
    grade,
    totalIncome,
  };
}
