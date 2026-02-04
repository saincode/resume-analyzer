const STOPWORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has", "he", "in",
  "is", "it", "its", "of", "on", "that", "the", "to", "was", "were", "will", "with",
  "you", "your", "we", "our", "they", "their", "or", "not", "this", "these", "those",
  "i", "me", "my", "mine", "us", "them", "but", "if", "then", "than", "so", "such"
]);

function normalizeText(text) {
  return text.replace(/\s+/g, " ").trim();
}

function tokenize(text) {
  return normalizeText(text)
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/g)
    .filter((token) => token && token.length >= 2 && !STOPWORDS.has(token));
}

function uniqueTokens(tokens) {
  return Array.from(new Set(tokens));
}

function extractKeywords(text) {
  return uniqueTokens(tokenize(text));
}

function scoreMatch(resumeText, jdText) {
  const resumeTokens = new Set(extractKeywords(resumeText));
  const jdTokens = extractKeywords(jdText);

  const matched = jdTokens.filter((token) => resumeTokens.has(token));
  const missing = jdTokens.filter((token) => !resumeTokens.has(token));

  const denominator = Math.max(jdTokens.length, 1);
  const score = Math.min(100, Math.round((matched.length / denominator) * 100));

  return {
    score,
    matchedSkills: matched,
    missingSkills: missing
  };
}

function categorizeSkills(skills) {
  const categories = {
    languages: [],
    tools: [],
    frameworks: [],
    cloud: [],
    databases: [],
    soft: [],
    other: []
  };

  const languageKeywords = ["python", "java", "javascript", "typescript", "r", "sql", "scala", "cpp", "csharp", "go", "rust", "php", "ruby", "kotlin"];
  const toolKeywords = ["git", "docker", "kubernetes", "jenkins", "tableau", "power", "bi", "excel", "jira", "confluence", "postman"];
  const frameworkKeywords = ["react", "angular", "vue", "spring", "django", "fastapi", "flask", "node", "express", "tensorflow", "pytorch"];
  const cloudKeywords = ["aws", "azure", "gcp", "google", "cloud", "ec2", "s3", "lambda", "rds"];
  const databaseKeywords = ["sql", "mysql", "postgres", "mongodb", "cassandra", "redis", "elasticsearch"];
  const softKeywords = ["communication", "leadership", "teamwork", "problem", "solving", "analytical", "critical"];

  skills.forEach((skill) => {
    const lower = skill.toLowerCase();
    if (languageKeywords.some((kw) => lower.includes(kw))) {
      categories.languages.push(skill);
    } else if (toolKeywords.some((kw) => lower.includes(kw))) {
      categories.tools.push(skill);
    } else if (frameworkKeywords.some((kw) => lower.includes(kw))) {
      categories.frameworks.push(skill);
    } else if (cloudKeywords.some((kw) => lower.includes(kw))) {
      categories.cloud.push(skill);
    } else if (databaseKeywords.some((kw) => lower.includes(kw))) {
      categories.databases.push(skill);
    } else if (softKeywords.some((kw) => lower.includes(kw))) {
      categories.soft.push(skill);
    } else {
      categories.other.push(skill);
    }
  });

  return categories;
}

function buildSuggestions(missingSkills, jdText) {
  const suggestions = [];

  if (missingSkills.length === 0) {
    suggestions.push("Excellent match! Your resume aligns well with the job description. Focus on quantifying achievements and impact.");
    return suggestions;
  }

  const categories = categorizeSkills(missingSkills);
  const jdLower = jdText.toLowerCase();

  if (categories.languages.length > 0) {
    const langs = categories.languages.slice(0, 3).join(", ");
    suggestions.push(
      `Add programming language experience: ${langs}. Highlight any projects or work experience using these languages, especially in relevant domains like data processing or backend development.`
    );
  }

  if (categories.frameworks.length > 0) {
    const frameworks = categories.frameworks.slice(0, 3).join(", ");
    suggestions.push(
      `Include framework expertise: ${frameworks}. Add specific projects where you used these frameworks with measurable outcomes.`
    );
  }

  if (categories.tools.length > 0) {
    const tools = categories.tools.slice(0, 3).join(", ");
    if (jdLower.includes("tableau") || jdLower.includes("power bi")) {
      suggestions.push(
        `Include data visualization projects using ${tools}. Provide examples of dashboards or reports you created and their business impact.`
      );
    } else {
      suggestions.push(`Add proficiency with tools: ${tools}. Mention how you used these in past projects or workflows.`);
    }
  }

  if (categories.cloud.length > 0) {
    const cloud = categories.cloud.slice(0, 2).join(" and ");
    suggestions.push(
      `Highlight cloud platform experience with ${cloud}. Document any infrastructure, deployment, or scaling work you have completed.`
    );
  }

  if (categories.databases.length > 0) {
    const dbs = categories.databases.slice(0, 2).join(" and ");
    suggestions.push(
      `Mention database expertise: ${dbs}. Include experience with data modeling, optimization, or large-scale data handling.`
    );
  }

  if (jdLower.includes("statistical") || jdLower.includes("analysis") || jdLower.includes("analytics")) {
    suggestions.push("Highlight statistical analysis, A/B testing, or data-driven decision-making experience from past projects.");
  }

  if (categories.other.length > 0) {
    const sample = categories.other.slice(0, 5).join(", ");
    suggestions.push(
      `Address other required keywords: ${sample}. Ensure your resume directly mentions these terms in relevant sections (Skills, Experience, Projects).`
    );
  }

  suggestions.push(
    "Review the job description carefully and adjust your resume to use the same language and terminology for better keyword matching."
  );

  return suggestions;
}

function analyze(resumeText, jdText) {
  const { score, matchedSkills, missingSkills } = scoreMatch(resumeText, jdText);
  const suggestions = buildSuggestions(missingSkills, jdText);

  return {
    score,
    matchedSkills,
    missingSkills,
    suggestions
  };
}

module.exports = {
  normalizeText,
  analyze
};
