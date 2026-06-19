"use client";

import { useEffect, useState } from "react";
import { LandingPage } from "@/components/LandingPage";
import { UploadForm } from "@/components/UploadForm";
import { EventReview } from "@/components/EventReview";
import { ExportButton, type ExportResult } from "@/components/ExportButton";
import { CalendarSuccess } from "@/components/CalendarSuccess";
import { clearDraft, loadDraft, saveDraft } from "@/lib/draft-storage";
import type { ExtractSource, SyllabusEvent } from "@/types";

type Step = 1 | 2 | 3;
type View = "landing" | "app";

export default function Home() {
  const [view, setView] = useState<View>("landing");
  const [events, setEvents] = useState<SyllabusEvent[]>([]);
  const [courses, setCourses] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [extractSource, setExtractSource] = useState<ExtractSource | undefined>();
  const [aiNote, setAiNote] = useState<string | undefined>();
  const [autoExport, setAutoExport] = useState(false);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const step: Step = exportResult ? 3 : events.length > 0 || manualMode ? 2 : 1;
  const showReview = (events.length > 0 || manualMode) && !exportResult;

  const calendarLabel =
    courses.length > 1 ? `${courses.length} Courses` : courses[0];

  useEffect(() => {
    const draft = loadDraft();
    if (draft && draft.events.length > 0) {
      setEvents(draft.events);
      setCourses(draft.courses);
      setExtractSource(draft.extractSource);
      setAiNote(draft.aiNote);
      setManualMode(draft.manualMode);
      setView("app");
      if (draft.pendingExport) setAutoExport(true);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !showReview) return;

    saveDraft({
      events,
      courses,
      extractSource,
      aiNote,
      manualMode,
      calendarLabel,
      pendingExport: autoExport,
    });
  }, [
    hydrated,
    showReview,
    events,
    courses,
    extractSource,
    aiNote,
    manualMode,
    calendarLabel,
    autoExport,
  ]);

  function handleExtracted(
    extracted: SyllabusEvent[],
    _courseName?: string,
    source?: ExtractSource,
    note?: string,
    courseList?: string[]
  ) {
    setEvents(extracted);
    setCourses(courseList ?? []);
    setExtractSource(source);
    setAiNote(note);
    setManualMode(false);
    setView("app");
  }

  function handleManualEntry() {
    setEvents([
      {
        id: `manual-${Date.now()}`,
        title: "",
        date: "",
        type: "assignment",
        selected: true,
      },
    ]);
    setCourses([]);
    setExtractSource(undefined);
    setAiNote(undefined);
    setManualMode(true);
    setView("app");
  }

  function handleReset() {
    setEvents([]);
    setCourses([]);
    setExtractSource(undefined);
    setAiNote(undefined);
    setManualMode(false);
    setAutoExport(false);
    setExportResult(null);
    clearDraft();
  }

  function handleExportSuccess(result: ExportResult) {
    setExportResult(result);
    setAutoExport(false);
  }

  function handleBeforeSignIn() {
    saveDraft({
      events,
      courses,
      extractSource,
      aiNote,
      manualMode,
      calendarLabel,
      pendingExport: true,
    });
  }

  if (!hydrated) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-indigo-50/30 flex items-center justify-center">
        <div className="text-sm text-slate-500">Loading...</div>
      </main>
    );
  }

  if (view === "landing" && !showReview) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-indigo-50/40">
        <LandingPage onGetStarted={() => setView("app")} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-indigo-50/30">
      <div className="max-w-2xl mx-auto px-4 py-10 sm:py-16">
        <header className="text-center mb-8">
          <button
            onClick={() => setView("landing")}
            className="text-sm text-slate-500 hover:text-indigo-600 mb-4"
          >
            ← SyllabSync
          </button>
          <h1 className="text-2xl font-bold text-slate-900">
            {exportResult
              ? "Your calendar is ready"
              : showReview
                ? "Review & export"
                : "Add your syllabi"}
          </h1>
        </header>

        <StepIndicator step={step} />

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-8">
          {exportResult ? (
            <CalendarSuccess
              created={exportResult.created}
              calendarUrl={exportResult.calendarUrl}
              calendarLabel={calendarLabel}
              onAddAnother={handleReset}
            />
          ) : !showReview ? (
            <UploadForm
              onExtracted={handleExtracted}
              onManualEntry={handleManualEntry}
              loading={loading}
              setLoading={setLoading}
            />
          ) : (
            <>
              {extractSource === "ai" && (
                <p className="text-sm text-blue-700 bg-blue-50 rounded-lg px-4 py-2">
                  Extracted with AI — review and edit anything before exporting.
                </p>
              )}

              {extractSource === "scrape" && aiNote && (
                <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-4 py-2">
                  {aiNote}
                </p>
              )}

              {extractSource === "scrape" && !aiNote && (
                <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-4 py-2">
                  Dates pulled locally — add GEMINI_API_KEY for better extraction.
                </p>
              )}

              <EventReview events={events} courses={courses} onChange={setEvents} />

              <div className="pt-2 border-t border-slate-100">
                <p className="text-sm font-medium text-slate-900 mb-3">
                  Add to Google Calendar
                </p>
                <ExportButton
                  events={events}
                  courseName={calendarLabel}
                  onBeforeSignIn={handleBeforeSignIn}
                  autoExport={autoExport}
                  onAutoExportDone={() => setAutoExport(false)}
                  onExportSuccess={handleExportSuccess}
                />
              </div>

              <button
                onClick={handleReset}
                className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 font-medium"
              >
                ← Start over
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const steps = [
    { num: 1, label: "Syllabus" },
    { num: 2, label: "Review" },
    { num: 3, label: "Calendar" },
  ] as const;

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((s, i) => (
        <div key={s.num} className="flex items-center gap-2">
          <div
            className={`flex items-center gap-2 text-sm font-medium ${
              step >= s.num ? "text-indigo-700" : "text-slate-400"
            }`}
          >
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                step >= s.num
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-200 text-slate-500"
              }`}
            >
              {s.num}
            </span>
            <span className="hidden sm:inline">{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`w-8 h-0.5 ${step > s.num ? "bg-indigo-400" : "bg-slate-200"}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
