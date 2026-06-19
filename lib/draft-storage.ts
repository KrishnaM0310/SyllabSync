import type { ExtractSource, SyllabusEvent } from "@/types";

const STORAGE_KEY = "syllabsync-draft";

export interface DraftState {
  events: SyllabusEvent[];
  courses: string[];
  extractSource?: ExtractSource;
  aiNote?: string;
  manualMode: boolean;
  calendarLabel?: string;
  pendingExport: boolean;
}

export function saveDraft(state: DraftState): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // sessionStorage full or unavailable
  }
}

export function loadDraft(): DraftState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DraftState;
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function clearPendingExport(): void {
  const draft = loadDraft();
  if (draft) {
    saveDraft({ ...draft, pendingExport: false });
  }
}
