"use client";

import type { SyllabusEvent } from "@/types";

interface EventReviewProps {
  events: SyllabusEvent[];
  courses?: string[];
  onChange: (events: SyllabusEvent[]) => void;
}

export function EventReview({ events, courses, onChange }: EventReviewProps) {
  function toggleSelect(id: string) {
    onChange(
      events.map((e) => (e.id === id ? { ...e, selected: !e.selected } : e))
    );
  }

  function updateEvent(id: string, field: keyof SyllabusEvent, value: string) {
    onChange(events.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  }

  function addEvent() {
    onChange([
      ...events,
      {
        id: `manual-${Date.now()}`,
        title: "",
        date: "",
        type: "assignment",
        selected: true,
      },
    ]);
  }

  function removeEvent(id: string) {
    onChange(events.filter((e) => e.id !== id));
  }

  function toggleAll(selected: boolean) {
    onChange(events.map((e) => ({ ...e, selected })));
  }

  const sorted = [...events].sort(
    (a, b) => new Date(a.date || "9999").getTime() - new Date(b.date || "9999").getTime()
  );

  const selectedCount = events.filter((e) => e.selected).length;
  const courseList =
    courses ?? [...new Set(events.map((e) => e.courseName).filter(Boolean))] as string[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Review dates</h2>
          <p className="text-sm text-slate-500 mt-1">
            {selectedCount} of {events.length} selected
            {courseList.length > 1 && ` · ${courseList.length} courses`}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <button
            type="button"
            onClick={addEvent}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
          >
            + Add event
          </button>
          <span className="text-slate-300">|</span>
          <button
            type="button"
            onClick={() => toggleAll(true)}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Select all
          </button>
          <span className="text-slate-300">|</span>
          <button
            type="button"
            onClick={() => toggleAll(false)}
            className="text-xs text-slate-500 hover:text-slate-700 font-medium"
          >
            Clear
          </button>
        </div>
      </div>

      {courseList.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {courseList.map((course) => (
            <span
              key={course}
              className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-medium"
            >
              {course}
            </span>
          ))}
        </div>
      )}

      <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
        {sorted.length === 0 && (
          <div className="p-6 text-center text-sm text-slate-500">
            No events yet. Click &ldquo;Add event&rdquo; to get started.
          </div>
        )}
        {sorted.map((event) => (
          <div
            key={event.id}
            className={`flex items-start gap-3 p-4 transition-colors ${
              event.selected ? "bg-white" : "bg-slate-50 opacity-60"
            }`}
          >
            <input
              type="checkbox"
              checked={event.selected}
              onChange={() => toggleSelect(event.id)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                {event.courseName && courseList.length > 1 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                    {event.courseName}
                  </span>
                )}
                <input
                  type="text"
                  value={event.title}
                  onChange={(e) => updateEvent(event.id, "title", e.target.value)}
                  placeholder="Event title"
                  className="flex-1 min-w-0 text-sm font-medium text-slate-900 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-indigo-400 focus:outline-none"
                />
                <select
                  value={event.type}
                  onChange={(e) => updateEvent(event.id, "type", e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2 py-1 text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="assignment">Assignment</option>
                  <option value="quiz">Quiz</option>
                  <option value="exam">Exam</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {courseList.length > 1 && (
                  <input
                    type="text"
                    value={event.courseName ?? ""}
                    onChange={(e) =>
                      updateEvent(event.id, "courseName", e.target.value)
                    }
                    placeholder="Course"
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1 text-slate-600 w-28 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                )}
                <input
                  type="date"
                  value={event.date}
                  onChange={(e) => updateEvent(event.id, "date", e.target.value)}
                  className="text-sm text-slate-600 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => removeEvent(event.id)}
                  className="text-xs text-red-500 hover:text-red-700 font-medium"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
