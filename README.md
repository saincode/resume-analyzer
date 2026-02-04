# AI-Powered Resume & Job Description Analytics Web Application

## Overview
Upload a resume PDF and a job description PDF to receive a match score, missing skills, and improvement suggestions.

## Tech Stack
- Frontend: React (Vite)
- Backend: Node.js + Express
- Storage: Local filesystem + SQLite metadata

## Setup

### Backend
1. Install dependencies:
   - Run `npm install` inside the server folder.
2. Start the server:
   - Run `npm run dev` inside the server folder.

The backend runs on port 5000 by default.

### Frontend
1. Install dependencies:
   - Run `npm install` inside the client folder.
2. Start the dev server:
   - Run `npm run dev` inside the client folder.

The frontend runs on port 5173 by default.

## Usage
1. Open the frontend in your browser.
2. Upload a resume PDF and a job description PDF.
3. Review the match score, matched skills, missing skills, and suggestions.

## Notes
- Only PDF files are accepted. All other file types are rejected with a clear error message.
- Uploaded files are stored under server/uploads/resumes and server/uploads/jds.
- Metadata is stored in server/data/app.db.
