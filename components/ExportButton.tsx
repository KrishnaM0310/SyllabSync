"use client";

import { signIn, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { clearDraft, clearPendingExport } from "@/lib/draft-storage";
import type { SyllabusEvent } from "@/types";

export interface ExportResult {
  created: number;
  calendarUrl: string;
}

interface ExportButtonProps {
  events: SyllabusEvent[];
  courseName?: string;
  onBeforeSignIn: () => void;
  autoExport?: boolean;
  onAutoExportDone?: () => void;
  onExportSuccess?: (result: ExportResult) => void;
}

export function ExportButton({
  events,
  courseName,
  onBeforeSignIn,
  autoExport,
  onAutoExportDone,
  onExportSuccess,
}: ExportButtonProps) {
  const { data: session, status } = useSession();
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoExportStarted = useRef(false);

  const validSelected = events.filter(
    (e) => e.selected && e.title.trim() && e.date
  );
  const selectedCount = validSelected.length;

  async function runExport() {
    setExporting(true);
    setError(null);

    try {
      const res = await fetch("/api/calendar/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events, courseName }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Export failed");

      clearDraft();
      onExportSuccess?.(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
      clearPendingExport();
      onAutoExportDone?.();
    }
  }

  async function handleExport() {
    if (!session) {
      onBeforeSignIn();
      await signIn("google", { callbackUrl: window.location.href });
      return;
    }

    await runExport();
  }

  useEffect(() => {
    if (
      autoExport &&
      session &&
      status === "authenticated" &&
      !autoExportStarted.current &&
      selectedCount > 0
    ) {
      autoExportStarted.current = true;
      runExport();
    }
  }, [autoExport, session, status, selectedCount]);

  if (status === "loading") {
    return <div className="h-12 rounded-xl bg-slate-100 animate-pulse" />;
  }

  return (
    <div className="space-y-3">
      {!session && (
        <p className="text-sm text-slate-500">
          Sign in with Google to add events directly to your calendar.
        </p>
      )}

      {session && (
        <p className="text-sm text-slate-500">
          Signed in as {session.user?.email}
        </p>
      )}

      <button
        onClick={handleExport}
        disabled={exporting || selectedCount === 0}
        className="w-full py-3 px-4 rounded-xl bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        <GoogleCalendarIcon />
        {exporting
          ? "Adding to Google Calendar..."
          : session
            ? `Add ${selectedCount} event${selectedCount !== 1 ? "s" : ""} to Google Calendar`
            : "Sign in with Google & export"}
      </button>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{error}</p>
      )}
    </div>
  );
}

function GoogleCalendarIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM5 8V6h14v2H5z" />
    </svg>
  );
}
