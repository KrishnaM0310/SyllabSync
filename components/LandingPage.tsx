"use client";

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium mb-8">
            <CalendarIcon />
            Syllabus → Google Calendar
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 tracking-tight">
            SyllabSync
          </h1>

          <p className="mt-6 text-xl sm:text-2xl text-slate-600 leading-relaxed">
            Every deadline from every class — synced to your calendar in minutes.
          </p>

          <p className="mt-4 text-base text-slate-500 max-w-lg mx-auto">
            Upload all your syllabi at once. We pull out every assignment, quiz, and exam —
            then send them straight to Google Calendar.
          </p>

          <button
            onClick={onGetStarted}
            className="mt-10 px-8 py-4 rounded-2xl bg-indigo-600 text-white text-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
          >
            Get started — it&apos;s free
          </button>

          <div className="mt-16 grid sm:grid-cols-3 gap-6 text-left">
            <Feature
              icon="📄"
              title="Upload syllabi"
              description="Drop multiple PDFs — one per class"
            />
            <Feature
              icon="✨"
              title="We find the dates"
              description="AI reads each syllabus and pulls every deadline"
            />
            <Feature
              icon="📅"
              title="Export to Google"
              description="One click adds everything to your calendar"
            />
          </div>
        </div>
      </div>

      <footer className="py-6 text-center text-xs text-slate-400">
        Built for students who have better things to do than copy dates by hand
      </footer>
    </div>
  );
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="p-5 rounded-2xl bg-white/60 border border-slate-200/80">
      <span className="text-2xl">{icon}</span>
      <h3 className="mt-3 font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10z" />
    </svg>
  );
}
