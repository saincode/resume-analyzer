const STOPWORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has", "he", "in",
  "is", "it", "its", "of", "on", "that", "the", "to", "was", "were", "will", "with",
  "you", "your", "we", "our", "they", "their", "or", "not", "this", "these", "those",
  "i", "me", "my", "mine", "us", "them", "but", "if", "then", "than", "so", "such"
]);

const TECHNICAL_SKILLS = {
  languages: [
    "python", "java", "javascript", "typescript", "r", "sql", "scala", "c++", "c#", "go", "rust", "php", "ruby", "kotlin"
  ],
  frameworks: [
    "react", "angular", "vue", "svelte", "next.js", "node.js", "express", "spring", "django", "fastapi", "flask", "nestjs",
    "laravel", "rails", "asp.net"
  ],
  tools: [
    "git", "docker", "kubernetes", "jenkins", "tableau", "power bi", "excel", "jira", "confluence", "postman", "figma"
  ],
  cloud: [
    "aws", "azure", "gcp", "google cloud", "ec2", "s3", "lambda", "rds", "cloudwatch"
  ],
  databases: [
    "mysql", "postgres", "postgresql", "mongodb", "cassandra", "redis", "elasticsearch", "sqlite"
  ],
  data: [
    "pandas", "numpy", "scikit-learn", "tensorflow", "pytorch", "spark", "hadoop", "airflow", "kafka"
  ]
};

function normalizeText(text) {
  return text.replace(/\s+/g, " ").trim();
}

function tokenize(text) {
  return normalizeText(text)
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/g)
    .filter((token) => token && token.length >= 2 && !STOPWORDS.has(token));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchesSkill(textLower, tokens, skill) {
  if (skill.includes(" ")) {
    return textLower.includes(skill);
  }

  if (/[.+#]/.test(skill)) {
    const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(skill)}([^a-z0-9]|$)`);
    return pattern.test(textLower);
  }

  return tokens.has(skill);
}

function extractTechnicalSkills(text) {
  const textLower = normalizeText(text).toLowerCase();
  const tokens = new Set(tokenize(textLower));
  const found = [];

  Object.values(TECHNICAL_SKILLS).forEach((skills) => {
    skills.forEach((skill) => {
      if (matchesSkill(textLower, tokens, skill) && !found.includes(skill)) {
        found.push(skill);
      }
    });
  });

  return found;
}

function uniqueTokens(tokens) {
  return Array.from(new Set(tokens));
}

function extractKeywords(text) {
  return uniqueTokens(tokenize(text));
}

function scoreMatch(resumeText, jdText) {
  const resumeSkills = new Set(extractTechnicalSkills(resumeText));
  const jdSkills = extractTechnicalSkills(jdText);

  const matched = jdSkills.filter((skill) => resumeSkills.has(skill));
  const missing = jdSkills.filter((skill) => !resumeSkills.has(skill));

  const denominator = Math.max(jdSkills.length, 1);
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
    data: []
  };

  const addCategory = (category, skill) => {
    if (!categories[category].includes(skill)) {
      categories[category].push(skill);
    }
  };

  skills.forEach((skill) => {
    const lower = skill.toLowerCase();
    if (TECHNICAL_SKILLS.languages.some((kw) => lower === kw)) {
      addCategory("languages", skill);
    } else if (TECHNICAL_SKILLS.tools.some((kw) => lower === kw)) {
      addCategory("tools", skill);
    } else if (TECHNICAL_SKILLS.frameworks.some((kw) => lower === kw)) {
      addCategory("frameworks", skill);
    } else if (TECHNICAL_SKILLS.cloud.some((kw) => lower === kw)) {
      addCategory("cloud", skill);
    } else if (TECHNICAL_SKILLS.databases.some((kw) => lower === kw)) {
      addCategory("databases", skill);
    } else if (TECHNICAL_SKILLS.data.some((kw) => lower === kw)) {
      addCategory("data", skill);
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

  if (categories.data.length > 0) {
    const dataTools = categories.data.slice(0, 3).join(", ");
    suggestions.push(
      `Highlight data stack experience: ${dataTools}. Add concrete examples where you used these tools to deliver measurable results.`
    );
  }

  if (jdLower.includes("statistical") || jdLower.includes("analysis") || jdLower.includes("analytics")) {
    suggestions.push("Highlight statistical analysis, A/B testing, or data-driven decision-making experience from past projects.");
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
