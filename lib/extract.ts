import { extractWithAi, hasAiProvider } from "@/lib/extract-ai";
import { scrapeSyllabusFromText } from "@/lib/scrape-syllabus";
import type { ExtractSource, SyllabusEvent } from "@/types";

export type { ExtractSource };

export interface ExtractResult {
  events: SyllabusEvent[];
  courseName?: string;
  courses?: string[];
  source: ExtractSource;
  provider?: string;
  aiNote?: string;
}

function describeAiFailure(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.toLowerCase().includes("quota") || message.includes("429")) {
    return "Gemini free tier limit reached. Try again in a minute, add a GROQ_API_KEY (free), or fix your GEMINI_API_KEY at aistudio.google.com/apikey.";
  }
  if (message.includes("API key")) {
    return "Invalid GEMINI_API_KEY — get a new key at aistudio.google.com/apikey (starts with AIza).";
  }
  return "AI extraction failed — using basic local parsing instead.";
}

export async function extractEventsFromText(text: string): Promise<ExtractResult> {
  let aiNote: string | undefined;

  if (hasAiProvider()) {
    try {
      const ai = await extractWithAi(text);
      if (ai && ai.events.length > 0) {
        return {
          events: ai.events,
          courseName: ai.courseName,
          source: "ai",
          provider: ai.provider,
        };
      }
    } catch (error) {
      aiNote = describeAiFailure(error);
      console.warn("AI extraction unavailable:", aiNote);
    }
  }

  const scraped = scrapeSyllabusFromText(text);
  if (scraped.events.length > 0) {
    return { ...scraped, source: "scrape", aiNote };
  }

  if (!hasAiProvider()) {
    throw new Error(
      "No dates found. Add a free GEMINI_API_KEY (see README) for AI extraction, or enter events manually."
    );
  }

  throw new Error(
    "AI could not find dated assignments in this syllabus. Try pasting the schedule section, or add events manually."
  );
}

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(buffer);
  return data.text;
}
