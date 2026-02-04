import { useMemo, useState } from "react";

const API_URL = "http://localhost:5000/api/analyze";

const initialState = {
  score: null,
  matchedSkills: [],
  missingSkills: [],
  suggestions: []
};

function summarizeSkills(skills, max = 12) {
  if (!skills.length) return "None detected yet.";
  const list = skills.slice(0, max).join(", ");
  const more = skills.length > max ? ` (+${skills.length - max} more)` : "";
  return `${list}${more}`;
}

function isPdfFile(file) {
  if (!file) return false;
  const ext = file.name.toLowerCase().endsWith(".pdf");
  const mime = file.type === "application/pdf";
  return ext && mime;
}

function LandingPage({ onStart }) {
  return (
    <div className="landing">
      <div className="landing-hero">
        <h1>AI-Powered Resume Analyzer</h1>
        <p className="landing-subtitle">
          Optimize your resume to match job descriptions and increase your chances of getting hired
        </p>
      </div>

      <div className="landing-features">
        <div className="feature">
          <div className="feature-icon">📊</div>
          <h3>Intelligent Matching</h3>
          <p>AI-powered analysis of your resume against job descriptions</p>
        </div>
        <div className="feature">
          <div className="feature-icon">✨</div>
          <h3>Smart Suggestions</h3>
          <p>Get personalized improvement recommendations based on missing skills</p>
        </div>
        <div className="feature">
          <div className="feature-icon">🎯</div>
          <h3>Match Score</h3>
          <p>See exactly how well your resume aligns with the job requirement</p>
        </div>
        <div className="feature">
          <div className="feature-icon">⚡</div>
          <h3>Instant Results</h3>
          <p>Get detailed analysis in seconds, not hours</p>
        </div>
      </div>

      <div className="landing-cta">
        <button className="cta-button" onClick={onStart}>
          Get Started
        </button>
      </div>

      <div className="landing-footer">
        <p>
          Simply upload your resume and the job description PDF to see how well they match and get actionable
          improvement suggestions.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("landing");
  const [resumeFile, setResumeFile] = useState(null);
  const [jdFile, setJdFile] = useState(null);
  const [jdText, setJdText] = useState("");
  const [useTextJD, setUseTextJD] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(initialState);

  const canSubmit = useMemo(() => resumeFile && (useTextJD ? jdText.trim() : jdFile), [resumeFile, jdFile, jdText, useTextJD]);

  if (page === "landing") {
    return <LandingPage onStart={() => setPage("analyzer")} />;
  }

  const handleFileChange = (event, type) => {
    setError("");
    const file = event.target.files?.[0] || null;

    if (file && !isPdfFile(file)) {
      event.target.value = "";
      setError("Only PDF files are allowed.");
      if (type === "resume") setResumeFile(null);
      if (type === "jd") setJdFile(null);
      return;
    }

    if (type === "resume") setResumeFile(file);
    if (type === "jd") setJdFile(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setResults(initialState);

    if (!resumeFile) {
      setError("Please upload a resume PDF.");
      return;
    }

    if (!isPdfFile(resumeFile)) {
      setError("Resume must be a PDF file.");
      return;
    }

    if (useTextJD) {
      if (!jdText.trim()) {
        setError("Please enter a job description.");
        return;
      }
    } else {
      if (!jdFile) {
        setError("Please upload a job description PDF.");
        return;
      }
      if (!isPdfFile(jdFile)) {
        setError("Job description must be a PDF file.");
        return;
      }
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("resume", resumeFile);
      
      if (useTextJD) {
        formData.append("jdText", jdText);
      } else {
        formData.append("jd", jdFile);
      }

      const response = await fetch(API_URL, {
        method: "POST",
        body: formData
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Upload failed.");
        setLoading(false);
        return;
      }

      setResults({
        score: data.score,
        matchedSkills: data.matchedSkills || [],
        missingSkills: data.missingSkills || [],
        suggestions: data.suggestions || []
      });
    } catch (err) {
      setError("Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="hero">
        <button className="back-button" onClick={() => setPage("landing")}>
          ← Back
        </button>
        <h1>AI Resume Analyzer</h1>
        <p>Upload your resume and a job description to get a match score and improvements.</p>
      </header>

      <main className="content">
        <form className="card" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="resume">Resume PDF</label>
            <input
              id="resume"
              type="file"
              accept="application/pdf,.pdf"
              onChange={(event) => handleFileChange(event, "resume")}
            />
          </div>

          <div className="field">
            <label htmlFor="jd">Job Description PDF</label>
            <input
              id="jd"
              type="file"
              accept="application/pdf,.pdf"
              onChange={(event) => handleFileChange(event, "jd")}
            />
          </div>

          {error && <div className="error">{error}</div>}

          <button type="submit" disabled={!canSubmit || loading}>
            {loading ? "Analyzing..." : "Analyze Match"}
          </button>
        </form>

        {results.score !== null && (
          <section className="results">
            <div className="score-row">
              <div className="score-card">
                <p className="eyebrow">Overall Match Score</p>
                <div className="score">{results.score}%</div>
                <p className="score-detail">
                  Matched {results.matchedSkills.length} keywords, missing {results.missingSkills.length}.
                </p>
              </div>
              <div className="score-card insight">
                <h3>Summary</h3>
                <p>
                  Your resume aligns with {results.score}% of the job description requirements. Follow the suggestions below to
                  improve your match rate.
                </p>
              </div>
            </div>

            <div className="improvements-section">
              <h2>Personalized Improvement Suggestions</h2>
              <p className="section-desc">Based on your resume and the job description, here's what to focus on:</p>
              <div className="suggestions-list">
                {results.suggestions && results.suggestions.length > 0 ? (
                  results.suggestions.map((suggestion, index) => (
                    <div key={index} className="suggestion-item">
                      <div className="suggestion-number">{index + 1}</div>
                      <div className="suggestion-content">
                        <p>{suggestion}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-suggestions">No suggestions available.</p>
                )}
              </div>
            </div>

            <div className="result-grid">
              <div className="result-card">
                <h3>Matched Skills</h3>
                <p className="helper">Found in both your resume and the job description.</p>
                <p className="summary">{summarizeSkills(results.matchedSkills)}</p>
              </div>

              <div className="result-card">
                <h3>Missing Skills</h3>
                <p className="helper">Required in the job description but missing from your resume.</p>
                <p className="summary">{summarizeSkills(results.missingSkills)}</p>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}