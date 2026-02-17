const WEBHOOK_URL = import.meta.env.VITE_LEAD_WEBHOOK_URL;

export function buildLeadPayload({ firstName, email, results }) {
  return {
    firstName,
    email,
    tags: ["tax-leak-audit"],
    customFields: {
      annual_leak: results.totalAnnualLeak,
      grade: results.grade,
      total_income: results.totalIncome,
      marginal_rate: results.marginalRate,
    },
  };
}

export async function submitLead(payload) {
  // IMPORTANT: Add your webhook URL in .env as VITE_LEAD_WEBHOOK_URL.
  // Example: VITE_LEAD_WEBHOOK_URL="https://services.leadconnectorhq.com/hooks/YOUR_HOOK_ID"
  if (!WEBHOOK_URL) {
    throw new Error("Missing VITE_LEAD_WEBHOOK_URL. Configure .env before using live capture.");
  }

  const response = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Lead capture failed (${response.status})`);
  }

  return response;
}
