const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const pdfParse = require("pdf-parse");
require("dotenv").config();

const { initDb, insertUpload, insertAnalysis } = require("./db");
const { analyze, normalizeText } = require("./analysis");
const { initAI, generateSuggestionsWithAI } = require("./ai");

const PORT = process.env.PORT || 5000;
const app = express();

initAI();

app.use(cors());
app.use(express.json());

const resumeDir = path.join(__dirname, "..", "uploads", "resumes");
const jdDir = path.join(__dirname, "..", "uploads", "jds");

function isPdfFile(file) {
  const ext = path.extname(file.originalname).toLowerCase();
  const isPdfExt = ext === ".pdf";
  const isPdfMime = file.mimetype === "application/pdf";
  return isPdfExt && isPdfMime;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "resume") {
      return cb(null, resumeDir);
    }
    if (file.fieldname === "jd") {
      return cb(null, jdDir);
    }
    return cb(new Error("Invalid field name"));
  },
  filename: (req, file, cb) => {
    const unique = crypto.randomUUID();
    const safeOriginal = path.basename(file.originalname, path.extname(file.originalname));
    const filename = `${safeOriginal}-${unique}.pdf`;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!isPdfFile(file)) {
      return cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Only PDF files are allowed."));
    }
    return cb(null, true);
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post(
  "/api/analyze",
  upload.fields([
    { name: "resume", maxCount: 1 },
    { name: "jd", maxCount: 1 }
  ]),
  async (req, res, next) => {
    try {
      const resumeFile = req.files?.resume?.[0];
      const jdFile = req.files?.jd?.[0];

      if (!resumeFile || !jdFile) {
        return res.status(400).json({ error: "Both resume and job description PDFs are required." });
      }

      const resumeBuffer = fs.readFileSync(resumeFile.path);
      const jdBuffer = fs.readFileSync(jdFile.path);

      const resumePdf = await pdfParse(resumeBuffer);
      const jdPdf = await pdfParse(jdBuffer);

      const resumeText = normalizeText(resumePdf.text || "");
      const jdText = normalizeText(jdPdf.text || "");

      const results = analyze(resumeText, jdText);

      const aiSuggestions = await generateSuggestionsWithAI(
        resumeText,
        jdText,
        results.matchedSkills,
        results.missingSkills
      );

      const finalSuggestions = aiSuggestions || results.suggestions;

      const db = await initDb();

      const resumeUploadId = await insertUpload(db, {
        type: "resume",
        originalName: resumeFile.originalname,
        storedName: resumeFile.filename,
        path: resumeFile.path,
        mimeType: resumeFile.mimetype,
        size: resumeFile.size,
        uploadedAt: new Date().toISOString()
      });

      const jdUploadId = await insertUpload(db, {
        type: "jd",
        originalName: jdFile.originalname,
        storedName: jdFile.filename,
        path: jdFile.path,
        mimeType: jdFile.mimetype,
        size: jdFile.size,
        uploadedAt: new Date().toISOString()
      });

      await insertAnalysis(db, {
        resumeUploadId,
        jdUploadId,
        score: results.score,
        matchedSkills: results.matchedSkills,
        missingSkills: results.missingSkills,
        suggestions: finalSuggestions,
        createdAt: new Date().toISOString()
      });

      return res.json({
        score: results.score,
        matchedSkills: results.matchedSkills,
        missingSkills: results.missingSkills,
        suggestions: finalSuggestions
      });
    } catch (error) {
      return next(error);
    }
  }
);

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ error: "Only PDF files are allowed." });
  }

  if (error.message === "Only PDF files are allowed.") {
    return res.status(400).json({ error: "Only PDF files are allowed." });
  }

  return res.status(500).json({ error: "Unexpected server error." });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
