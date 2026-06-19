"use client";

import { useState } from "react";
import type { ExtractSource, SyllabusEvent } from "@/types";

type InputMode = "pdf" | "link" | "paste";

interface UploadFormProps {
  onExtracted: (
    events: SyllabusEvent[],
    courseName?: string,
    source?: ExtractSource,
    aiNote?: string,
    courses?: string[]
  ) => void;
  onManualEntry: () => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const MODES: { id: InputMode; label: string; hint: string }[] = [
  { id: "pdf", label: "PDF", hint: "Upload one or more syllabus PDFs — add every class" },
  { id: "link", label: "Link", hint: "Paste a public syllabus URL" },
  { id: "paste", label: "Paste", hint: "Copy text from your syllabus" },
];

export function UploadForm({
  onExtracted,
  onManualEntry,
  loading,
  setLoading,
}: UploadFormProps) {
  const [mode, setMode] = useState<InputMode>("pdf");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const hasInput =
    mode === "pdf" ? files.length > 0 : mode === "link" ? !!url.trim() : !!text.trim();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name));
      return [...prev, ...selected.filter((f) => !names.has(f.name))];
    });
    e.target.value = "";
  }

  function removeFile(name: string) {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      if (mode === "pdf") {
        for (const file of files) formData.append("files", file);
      }
      if (mode === "link" && url.trim()) formData.append("url", url.trim());
      if (mode === "paste" && text.trim()) formData.append("text", text.trim());

      const res = await fetch("/api/extract", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Extraction failed");

      onExtracted(
        data.events,
        data.courseName,
        data.source,
        data.aiNote,
        data.courses
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              setMode(m.id);
              setError(null);
            }}
            className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              mode === m.id
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <p className="text-sm text-slate-500">{MODES.find((m) => m.id === mode)?.hint}</p>

      {mode === "pdf" && (
        <div className="space-y-3">
          <label className="flex flex-col items-center justify-center w-full py-8 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors">
            <span className="text-sm font-medium text-indigo-600">
              + Add syllabus PDFs
            </span>
            <span className="mt-1 text-xs text-slate-500">
              Select multiple files for all your classes
            </span>
            <input
              type="file"
              accept=".pdf,.txt"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {files.length > 0 && (
            <ul className="space-y-2">
              {files.map((file) => (
                <li
                  key={file.name}
                  className="flex items-center justify-between px-4 py-2.5 bg-slate-50 rounded-lg text-sm"
                >
                  <span className="text-slate-700 truncate mr-3">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(file.name)}
                    className="text-slate-400 hover:text-red-500 shrink-0"
                    aria-label={`Remove ${file.name}`}
                  >
                    ✕
                  </button>
                </li>
              ))}
              <p className="text-xs text-slate-500 pt-1">
                {files.length} file{files.length !== 1 ? "s" : ""} selected
              </p>
            </ul>
          )}
        </div>
      )}

      {mode === "link" && (
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://yourschool.edu/course/syllabus"
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      )}

      {mode === "paste" && (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"Homework 1 — March 15, 2025\nQuiz 2 — April 3\nMidterm — October 10, 2025"}
          rows={8}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
        />
      )}

      {error && (
        <div className="space-y-2">
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{error}</p>
          <button
            type="button"
            onClick={onManualEntry}
            className="w-full py-2 px-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Enter dates manually instead
          </button>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !hasInput}
        className="w-full py-3 px-4 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading
          ? files.length > 1
            ? `Analyzing ${files.length} syllabi...`
            : "Analyzing syllabus..."
          : files.length > 1
            ? `Find deadlines from ${files.length} classes →`
            : "Find deadlines →"}
      </button>

      <button
        type="button"
        onClick={onManualEntry}
        className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 font-medium"
      >
        Or add events manually
      </button>
    </form>
  );
}
