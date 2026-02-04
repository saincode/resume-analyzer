const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "..", "data", "app.db");

async function initDb() {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS uploads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      original_name TEXT NOT NULL,
      stored_name TEXT NOT NULL,
      path TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      uploaded_at TEXT NOT NULL
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS analyses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      resume_upload_id INTEGER NOT NULL,
      jd_upload_id INTEGER NOT NULL,
      score INTEGER NOT NULL,
      matched_skills TEXT NOT NULL,
      missing_skills TEXT NOT NULL,
      suggestions TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(resume_upload_id) REFERENCES uploads(id),
      FOREIGN KEY(jd_upload_id) REFERENCES uploads(id)
    );
  `);

  return db;
}

async function insertUpload(db, upload) {
  const result = await db.run(
    `INSERT INTO uploads (type, original_name, stored_name, path, mime_type, size, uploaded_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  , [
    upload.type,
    upload.originalName,
    upload.storedName,
    upload.path,
    upload.mimeType,
    upload.size,
    upload.uploadedAt
  ]);

  return result.lastID;
}

async function insertAnalysis(db, analysis) {
  const result = await db.run(
    `INSERT INTO analyses (resume_upload_id, jd_upload_id, score, matched_skills, missing_skills, suggestions, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  , [
    analysis.resumeUploadId,
    analysis.jdUploadId,
    analysis.score,
    JSON.stringify(analysis.matchedSkills),
    JSON.stringify(analysis.missingSkills),
    JSON.stringify(analysis.suggestions),
    analysis.createdAt
  ]);

  return result.lastID;
}

module.exports = {
  initDb,
  insertUpload,
  insertAnalysis
};
