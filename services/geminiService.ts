import { GoogleGenAI } from "@google/genai";
import { Claim, Member } from "../types";

// NOTE: In a real app, this key would come from a secure backend or environment variable.
// The prompt instructs to use process.env.API_KEY.
const apiKey = process.env.API_KEY || ''; 

let client: GoogleGenAI | null = null;

if (apiKey) {
  client = new GoogleGenAI({ apiKey });
}

export const analyzeClaim = async (claim: Claim, memberHistory: string): Promise<string> => {
  if (!client) return "Configuration Error: API Key missing.";

  try {
    const prompt = `
      You are an expert AI medical claims adjudicator. Analyze the following insurance claim.
      
      Claim Details:
      - Diagnosis: ${claim.diagnosisCode}
      - Procedure: ${claim.procedureCode}
      - Description: ${claim.description}
      - Amount: $${claim.amountBilled}
      
      Member Context: ${memberHistory}

      Please provide a brief assessment including:
      1. Consistency between diagnosis and procedure.
      2. Potential fraud flags (if any).
      3. Recommendation (Approve, Reject, or Request Info).
      4. A suggested explanation for the decision.
      
      Keep the response concise and professional.
    `;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "No analysis could be generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating analysis. Please try again later.";
  }
};

export const chatWithPolicyAdvisor = async (query: string, policyDetails: string): Promise<string> => {
  if (!client) return "Configuration Error: API Key missing.";

  try {
     const prompt = `
      You are a helpful Health Insurance Policy Advisor. 
      Policy Details: ${policyDetails}

      User Question: "${query}"

      Answer the user's question based strictly on the policy details provided. 
      If the answer isn't clear from the policy, advise them to contact support.
      Keep it friendly and concise.
    `;

    const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text || "I couldn't generate an answer.";
  } catch (e) {
    console.error(e);
    return "Service unavailable.";
  }
}
