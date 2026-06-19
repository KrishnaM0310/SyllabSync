import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import type { SyllabusEvent } from "@/types";

export type AiProvider = "gemini" | "groq" | "openai";

export interface AiExtractResult {
  events: SyllabusEvent[];
  courseName?: string;
  provider: AiProvider;
}

const EXTRACTION_PROMPT = `You extract every gradable deadline from a course syllabus.

Return JSON with this exact shape:
{
  "courseName": "string",
  "events": [
    {
      "title": "string",
      "date": "YYYY-MM-DD",
      "type": "assignment" | "quiz" | "exam" | "other",
      "description": "optional string"
    }
  ]
}

Include ALL of: homework, problem sets, labs, projects, papers, presentations, quizzes, tests, midterms, finals, participation checkpoints — anything with a due date or exam date.

Rules:
- Resolve relative dates ("Week 5", "Module 3") using the semester start date in the syllabus
- If only month/day is given, infer year from Fall/Spring/Summer and academic year in the syllabus
- Parse tables, bullet lists, and weekly schedules
- Skip readings or topics with no due date
- Use type "exam" for midterms/finals, "quiz" for quizzes/tests, "assignment" for homework/projects/labs
- Return ONLY valid JSON, no markdown`;

export function getConfiguredProviders(): AiProvider[] {
  const preferred = process.env.AI_PROVIDER as AiProvider | undefined;
  const available: AiProvider[] = [];

  if (process.env.GEMINI_API_KEY) available.push("gemini");
  if (process.env.GROQ_API_KEY) available.push("groq");
  if (process.env.OPENAI_API_KEY) available.push("openai");

  if (preferred && available.includes(preferred)) {
    return [preferred, ...available.filter((p) => p !== preferred)];
  }
  return available;
}

export async function extractWithAi(text: string): Promise<AiExtractResult | null> {
  const providers = getConfiguredProviders();
  if (providers.length === 0) return null;

  const prepared = prepareSyllabusText(text);
  let lastError: unknown;

  for (const provider of providers) {
    try {
      const raw =
        provider === "gemini"
          ? await extractWithGemini(prepared)
          : await extractWithOpenAiCompatible(provider, prepared);

      const parsed = parseAiResponse(raw);
      if (parsed.events.length > 0) {
        return { ...parsed, provider };
      }
    } catch (error) {
      lastError = error;
      console.error(`AI extraction failed (${provider}):`, error);
    }
  }

  if (lastError) throw lastError;
  return null;
}

async function extractWithGemini(text: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  if (!apiKey.startsWith("AIza")) {
    console.warn(
      "GEMINI_API_KEY may be invalid — keys from aistudio.google.com/apikey usually start with AIza"
    );
  }

  const models = [
    process.env.GEMINI_MODEL,
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash",
    "gemini-2.0-flash",
  ].filter(Boolean) as string[];

  const uniqueModels = [...new Set(models)];
  let lastError: unknown;

  const genAI = new GoogleGenerativeAI(apiKey);

  for (const modelName of uniqueModels) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      });

      const result = await model.generateContent(
        `${EXTRACTION_PROMPT}\n\nSyllabus:\n${text}`
      );

      return result.response.text();
    } catch (error) {
      lastError = error;
      if (isRateLimitError(error)) {
        console.warn(`Gemini model ${modelName} rate limited, trying next...`);
        continue;
      }
      throw error;
    }
  }

  throw lastError ?? new Error("All Gemini models failed");
}

function isRateLimitError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { status?: number; message?: string };
  return (
    e.status === 429 ||
    (typeof e.message === "string" &&
      (e.message.includes("429") ||
        e.message.toLowerCase().includes("quota") ||
        e.message.toLowerCase().includes("rate")))
  );
}

async function extractWithOpenAiCompatible(
  provider: "groq" | "openai",
  text: string
): Promise<string> {
  const config =
    provider === "groq"
      ? {
          apiKey: process.env.GROQ_API_KEY!,
          baseURL: "https://api.groq.com/openai/v1",
          model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
        }
      : {
          apiKey: process.env.OPENAI_API_KEY!,
          baseURL: undefined,
          model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        };

  const client = new OpenAI({ apiKey: config.apiKey, baseURL: config.baseURL });

  const response = await client.chat.completions.create({
    model: config.model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: EXTRACTION_PROMPT },
      { role: "user", content: `Syllabus:\n${text}` },
    ],
    temperature: 0.1,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error(`No response from ${provider}`);
  return content;
}

function parseAiResponse(raw: string): {
  events: SyllabusEvent[];
  courseName?: string;
} {
  const parsed = JSON.parse(raw) as {
    courseName?: string;
    events?: Array<{
      title: string;
      date: string;
      type: string;
      description?: string;
    }>;
  };

  const events: SyllabusEvent[] = (parsed.events ?? [])
    .filter((e) => e.title?.trim() && e.date?.trim())
    .map((e, i) => ({
      id: `ai-${i}-${Date.now()}`,
      title: e.title.trim(),
      date: normalizeDate(e.date),
      type: isValidType(e.type) ? e.type : "other",
      description: e.description?.trim(),
      selected: true,
    }))
    .filter((e) => e.date);

  return {
    events,
    courseName: parsed.courseName?.trim() || undefined,
  };
}

function normalizeDate(input: string): string {
  const iso = input.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const d = new Date(input);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  return "";
}

function isValidType(type: string): type is SyllabusEvent["type"] {
  return ["assignment", "quiz", "exam", "other"].includes(type);
}

function prepareSyllabusText(text: string, maxLen = 80000): string {
  const cleaned = text.replace(/\r/g, "\n").trim();
  if (cleaned.length <= maxLen) return cleaned;

  const headSize = Math.floor(maxLen * 0.25);
  const tailSize = maxLen - headSize - 40;
  return (
    cleaned.slice(0, headSize) +
    "\n\n[... content truncated ...]\n\n" +
    cleaned.slice(-tailSize)
  );
}

export function hasAiProvider(): boolean {
  return getConfiguredProviders().length > 0;
}
