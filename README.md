# SyllabSync

Turn any course syllabus into **Google Calendar** events — upload a PDF, paste a link, or copy-paste text.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Google Calendar (required for export)

1. Create a project at [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the **Google Calendar API**
3. Create **OAuth 2.0 credentials** (Web application)
   - Redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Add yourself as a **Test user** on the OAuth consent screen

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret |
| `NEXTAUTH_URL` | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |

### AI extraction (recommended)

AI reads the full syllabus and finds assignments, quizzes, and exams — much better than regex parsing.

**Gemini (free, recommended):**

1. Get a free key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Add to `.env.local`:
   ```
   GEMINI_API_KEY=your-key-here
   ```
3. Restart the dev server

**Other options** (add one to `.env.local`):

| Provider | Key | Get it |
|----------|-----|--------|
| Groq | `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) — free tier |
| OpenAI | `OPENAI_API_KEY` | [platform.openai.com](https://platform.openai.com) — paid |

Set `AI_PROVIDER=gemini` to force a specific provider. Without any AI key, the app falls back to basic local date parsing.

## How it works

| Step | What you do |
|------|-------------|
| **1. Syllabus** | Upload a **PDF**, paste a **link**, or **copy-paste** the schedule |
| **2. Review** | AI extracts deadlines — edit anything before exporting |
| **3. Google Calendar** | Sign in with Google — events go into a new calendar |

## Troubleshooting

### "Access blocked" when signing in with Google

Add your Gmail under **OAuth consent screen → Test users** in Google Cloud Console.

### Poor extraction / missing dates

Add `GEMINI_API_KEY` (free) and restart. AI handles tables, week-based schedules, and messy PDFs far better than local parsing.
