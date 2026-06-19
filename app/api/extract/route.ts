import { NextResponse } from "next/server";
import {
  extractEventsFromText,
  extractTextFromPdf,
  type ExtractResult,
} from "@/lib/extract";
import { isTextExtractable } from "@/lib/scrape-syllabus";
import { scrapeTextFromUrl } from "@/lib/scrape-url";
import type { SyllabusEvent } from "@/types";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const textInput = formData.get("text") as string | null;
    const urlInput = formData.get("url") as string | null;

    const validFiles = files.filter((f) => f.size > 0);

    if (validFiles.length > 0) {
      const result = await extractFromFiles(validFiles);
      return NextResponse.json(result);
    }

    let text = "";

    if (urlInput?.trim()) {
      text = await scrapeTextFromUrl(urlInput.trim());
    } else {
      text = textInput?.trim() ?? "";
    }

    if (!text) {
      return NextResponse.json(
        { error: "Upload PDFs, paste syllabus text, or enter a syllabus URL." },
        { status: 400 }
      );
    }

    if (!isTextExtractable(text)) {
      return NextResponse.json(
        {
          error:
            "Could not read enough text. If this is a scanned PDF, paste the schedule as text or use a syllabus web page URL.",
        },
        { status: 422 }
      );
    }

    const result = await extractEventsFromText(text);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Extract error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to extract events from syllabus.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function extractFromFiles(files: File[]): Promise<ExtractResult> {
  const allEvents: SyllabusEvent[] = [];
  const courseNames: string[] = [];
  let source: ExtractResult["source"] = "scrape";
  let provider: string | undefined;
  let aiNote: string | undefined;
  const errors: string[] = [];

  for (const file of files) {
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      let text: string;

      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        text = await extractTextFromPdf(buffer);
      } else {
        text = buffer.toString("utf-8");
      }

      if (!isTextExtractable(text)) {
        errors.push(`${file.name}: could not read text (scanned PDF?)`);
        continue;
      }

      const result = await extractEventsFromText(text);
      const course =
        result.courseName || file.name.replace(/\.(pdf|txt)$/i, "");

      if (result.source === "ai") source = "ai";
      if (result.provider) provider = result.provider;
      if (result.aiNote) aiNote = result.aiNote;

      courseNames.push(course);

      for (const event of result.events) {
        allEvents.push({
          ...event,
          id: `${event.id}-${file.name}`,
          courseName: event.courseName || course,
        });
      }
    } catch (error) {
      errors.push(
        `${file.name}: ${error instanceof Error ? error.message : "failed"}`
      );
    }
  }

  if (allEvents.length === 0) {
    throw new Error(
      errors.length > 0
        ? errors.join(" · ")
        : "No dates found in any of the uploaded files."
    );
  }

  const uniqueCourses = [...new Set(courseNames)];

  return {
    events: allEvents,
    courseName:
      uniqueCourses.length === 1
        ? uniqueCourses[0]
        : `${uniqueCourses.length} courses`,
    courses: uniqueCourses,
    source,
    provider,
    aiNote:
      errors.length > 0
        ? `Some files had issues: ${errors.join("; ")}`
        : aiNote,
  };
}
