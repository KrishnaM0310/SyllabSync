export type EventType = "assignment" | "quiz" | "exam" | "other";
export type ExtractSource = "scrape" | "ai";

export interface SyllabusEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  type: EventType;
  description?: string;
  courseName?: string;
  selected: boolean;
}

export interface ExtractResponse {
  events: SyllabusEvent[];
  courseName?: string;
}

export interface ExportResponse {
  created: number;
  calendarUrl: string;
}
