"use client";

interface CalendarSuccessProps {
  created: number;
  calendarUrl: string;
  calendarLabel?: string;
  onAddAnother: () => void;
}

export function CalendarSuccess({
  created,
  calendarUrl,
  calendarLabel,
  onAddAnother,
}: CalendarSuccessProps) {
  return (
    <div className="text-center space-y-6 py-4">
      <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-emerald-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-slate-900">Added to Google Calendar</h2>
        <p className="text-sm text-slate-500 mt-2">
          {created} event{created !== 1 ? "s" : ""} added
          {calendarLabel ? ` to ${calendarLabel}` : ""}.
        </p>
      </div>

      <div className="space-y-3 pt-2">
        <a
          href={calendarUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 px-4 rounded-xl bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
        >
          <GoogleCalendarIcon />
          Open in Google Calendar
        </a>

        <button
          type="button"
          onClick={onAddAnother}
          className="w-full py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors"
        >
          Add another syllabus
        </button>
      </div>
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
