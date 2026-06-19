import type { SyllabusEvent } from "@/types";

const MONTHS: Record<string, number> = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
  jan: 0, feb: 1, mar: 2, apr: 3, jun: 5, jul: 6, aug: 7,
  sep: 8, sept: 8, oct: 9, nov: 10, dec: 11,
};

const MONTH_PATTERN =
  "Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?";

const KEYWORD_TYPES: Array<{ pattern: RegExp; type: SyllabusEvent["type"] }> = [
  { pattern: /\b(final\s*exam|midterm|final|exam)\b/i, type: "exam" },
  { pattern: /\b(quiz|test)\b/i, type: "quiz" },
  { pattern: /\b(homework|hw\b|assignment|project|lab|paper|essay|report|presentation|problem\s*set|ps\s*\d|due)\b/i, type: "assignment" },
];

const DATE_REGEXES: RegExp[] = [
  new RegExp(`\\b(${MONTH_PATTERN})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})\\b`, "gi"),
  new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${MONTH_PATTERN})\\.?,?\\s+(\\d{4})\\b`, "gi"),
  new RegExp(`\\b(${MONTH_PATTERN})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`, "gi"),
  new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${MONTH_PATTERN})\\.?\\b`, "gi"),
  /\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/g,
  /\b(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})\b/g,
  /\b(\d{1,2})[./-](\d{1,2})\b/g,
];

export function scrapeSyllabusFromText(text: string): {
  events: SyllabusEvent[];
  courseName?: string;
} {
  const normalized = normalizeText(text);
  if (!normalized) return { events: [] };

  const lines = normalized.split("\n").map((l) => l.trim()).filter(Boolean);
  const yearHint = extractYearHint(normalized);
  const events: SyllabusEvent[] = [];
  const seen = new Set<string>();

  function addEvent(context: string, dateRaw: string, iso: string) {
    const title = cleanTitle(context, dateRaw);
    if (!title || title.length < 2) return;

    const key = `${iso}|${titleKey(title)}`;
    if (seen.has(key)) return;
    seen.add(key);

    events.push({
      id: `scrape-${events.length}-${Date.now()}`,
      title,
      date: iso,
      type: inferType(context),
      selected: true,
    });
  }

  for (const line of lines) {
    findDatesInText(line, yearHint, (raw, iso) => addEvent(line, raw, iso));
  }

  for (let i = 0; i < lines.length - 1; i++) {
    const combined = `${lines[i]} ${lines[i + 1]}`;
    findDatesInText(combined, yearHint, (raw, iso) => addEvent(combined, raw, iso));
  }

  if (events.length === 0) {
    const flat = normalized.replace(/\n+/g, " ");
    findDatesInText(flat, yearHint, (raw, iso) => {
      const idx = flat.indexOf(raw);
      const start = Math.max(0, idx - 50);
      const end = Math.min(flat.length, idx + raw.length + 50);
      addEvent(flat.slice(start, end), raw, iso);
    });
  }

  return {
    events: events.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    ),
    courseName: extractCourseName(normalized),
  };
}

export function isTextExtractable(text: string): boolean {
  return text.replace(/\s/g, "").length >= 20;
}

function normalizeText(text: string): string {
  return text
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[^\S\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractCourseName(text: string): string | undefined {
  const patterns = [
    /course\s*(?:title|name)?\s*[:\-]\s*(.+)/i,
    /syllabus\s*[:\-]\s*(.+)/i,
    /^([A-Z]{2,4}\s*\d{3}[A-Z]?\s*[:\-]\s*.+)/m,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m?.[1]) return m[1].trim().slice(0, 80);
  }
  return undefined;
}

function extractYearHint(text: string): number {
  const patterns = [
    /\b(?:fall|spring|summer|winter)\s+(20\d{2})\b/i,
    /\b(20\d{2})\s*[-–]\s*(20\d{2})\b/,
    /\b(20\d{2})\b/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m?.[1]) return parseInt(m[1], 10);
  }
  return new Date().getFullYear();
}

function findDatesInText(
  text: string,
  yearHint: number,
  onMatch: (raw: string, iso: string) => void
) {
  for (const regex of DATE_REGEXES) {
    regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      const iso = parseMatchToIso(match, yearHint);
      if (iso) onMatch(match[0], iso);
    }
  }
}

function parseMatchToIso(match: RegExpExecArray, yearHint: number): string | null {
  const full = match[0].trim();

  if (/^20\d{2}-\d{1,2}-\d{1,2}$/.test(full)) {
    const [y, m, d] = full.split("-").map(Number);
    return validIso(y, m, d);
  }

  const slash = full.match(/^(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?$/);
  if (slash) {
    let m = parseInt(slash[1], 10);
    let d = parseInt(slash[2], 10);
    let y = slash[3] ? parseInt(slash[3], 10) : yearHint;
    if (y < 100) y += 2000;
    if (m > 12 && d <= 12) [m, d] = [d, m];
    return validIso(y, m, d);
  }

  const groups = match.slice(1).filter(Boolean);
  if (groups.length >= 2) {
    const g0 = groups[0].toLowerCase().replace(".", "");
    const g1 = groups[1]?.toLowerCase().replace(".", "");

    if (MONTHS[g0] !== undefined) {
      const month = MONTHS[g0] + 1;
      const day = parseInt(groups[1], 10);
      const year = groups[2] ? parseInt(groups[2], 10) : yearHint;
      return validIso(year, month, day);
    }

    if (MONTHS[g1] !== undefined) {
      const day = parseInt(groups[0], 10);
      const month = MONTHS[g1] + 1;
      const year = groups[2] ? parseInt(groups[2], 10) : yearHint;
      return validIso(year, month, day);
    }
  }

  return null;
}

function validIso(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(year, month - 1, day);
  if (isNaN(date.getTime())) return null;
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function inferType(line: string): SyllabusEvent["type"] {
  for (const { pattern, type } of KEYWORD_TYPES) {
    if (pattern.test(line)) return type;
  }
  return "other";
}

function cleanTitle(line: string, dateRaw: string): string {
  let title = line
    .replace(dateRaw, "")
    .replace(/\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*\b/gi, "")
    .replace(/\s*[-–—|•·]\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(?:due|date|on|by|deadline)\s*:?\s*/i, "")
    .replace(/^(?:week\s*\d+\s*[:.]?\s*)/i, "")
    .replace(/,?\s*20\d{2}\s*$/i, "")
    .replace(/^[^\w(]+|[^\w)]+$/g, "")
    .trim();

  return title.slice(0, 120);
}

function titleKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5)
    .join(" ");
}
