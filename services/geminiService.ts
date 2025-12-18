import { api } from "./api";
import { Claim } from "../types";

/**
 * IMPORTANT:
 * - Do NOT call @google/genai from the browser.
 * - All AI calls must go through the backend API.
 */

export const analyzeClaim = async (
  claim: Claim,
  memberHistory: string
): Promise<string> => {
  try {
    const response = await api.post("/ai/analyze-claim", { claim, memberHistory });
    return response?.result ?? "No analysis could be generated.";
  } catch (error) {
    console.error("AI Claim Analysis Error:", error);
    return "Error generating analysis. Please try again later.";
  }
};

export const chatWithPolicyAdvisor = async (
  query: string,
  policyDetails: string
): Promise<string> => {
  try {
    const response = await api.post("/ai/policy-advisor", { query, policyDetails });
    return response?.result ?? "I couldn't generate an answer.";
  } catch (error) {
    console.error("AI Policy Advisor Error:", error);
    return "Service unavailable.";
  }
};
