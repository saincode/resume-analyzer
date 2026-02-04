const { GoogleGenerativeAI } = require("@google/generative-ai");

let genAI = null;

function initAI() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.warn("GOOGLE_API_KEY not set. AI suggestions will be disabled.");
    return null;
  }
  genAI = new GoogleGenerativeAI(apiKey);
  return genAI;
}

async function generateSuggestionsWithAI(resumeText, jdText, matchedSkills, missingSkills) {
  if (!genAI) {
    return null;
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a professional resume coach and recruiter. Analyze the resume and job description to provide specific, actionable improvement suggestions.

MATCHED SKILLS (found in both resume and JD):
${matchedSkills.slice(0, 20).join(", ")}

MISSING SKILLS (required in JD but not in resume):
${missingSkills.slice(0, 20).join(", ")}

JOB DESCRIPTION EXCERPT:
${jdText.substring(0, 1000)}

RESUME EXCERPT:
${resumeText.substring(0, 1000)}

Based on this analysis, provide 4-5 specific, actionable improvement suggestions for the resume. Each suggestion should:
1. Be concrete and easy to implement
2. Focus on closing the gap between the resume and job description
3. Highlight specific skills or experiences to add
4. Be professional and encouraging in tone

Format your response as a numbered list without any additional text or explanation.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const suggestions = response.text().split("\n").filter((line) => line.trim().length > 0);

    return suggestions;
  } catch (error) {
    console.error("AI suggestion error:", error.message);
    return null;
  }
}

module.exports = {
  initAI,
  generateSuggestionsWithAI
};
