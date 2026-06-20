# SyllabSync

**SyllabSync** turns any course syllabus into Google Calendar events. Upload a PDF, paste a syllabus link, or copy in course schedule text, then review the extracted deadlines and export them directly to Google Calendar.

**Live app:** https://syllab-sync.vercel.app

---

## Overview

SyllabSync helps students avoid manually copying every assignment, quiz, lab, midterm, and exam date from their syllabi into Google Calendar.

Instead, students can add their syllabus, let AI extract the important dates, quickly review the results, and export everything into a dedicated course calendar.

---

## Features

- Upload a syllabus PDF
- Paste a syllabus URL
- Copy and paste syllabus text
- Extract assignments, quizzes, exams, labs, readings, and deadlines
- Review and edit events before exporting
- Sign in with Google
- Export events into Google Calendar
- AI-powered extraction with Groq, Gemini, or OpenAI support
- Basic local date parsing fallback when no AI key is configured

---

## How It Works

| Step | What happens |
|---|---|
| 1. Add syllabus | Upload a PDF, paste a link, or copy-paste schedule text |
| 2. Extract dates | AI identifies important course deadlines and events |
| 3. Review events | Edit, remove, or confirm extracted calendar events |
| 4. Export calendar | Sign in with Google and export events to Google Calendar |

---

## Tech Stack

- Next.js
- TypeScript
- React
- Google Calendar API
- NextAuth
- Groq API
- Gemini API
- OpenAI API
- Vercel
