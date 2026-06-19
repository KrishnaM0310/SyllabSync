import { google } from "googleapis";
import type { SyllabusEvent } from "@/types";

const TYPE_COLORS: Record<SyllabusEvent["type"], string> = {
  assignment: "9", // blue
  quiz: "5", // yellow
  exam: "11", // red
  other: "8", // gray
};

export async function exportToGoogleCalendar(
  accessToken: string,
  events: SyllabusEvent[],
  courseName?: string
): Promise<{ created: number; calendarUrl: string }> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: "v3", auth });

  const calendarName = courseName
    ? `SyllabSync – ${courseName}`
    : "SyllabSync";

  const createdCalendar = await calendar.calendars.insert({
    requestBody: {
      summary: calendarName,
      description: "Course deadlines imported from SyllabSync",
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });

  const calendarId = createdCalendar.data.id!;
  let created = 0;

  for (const event of events) {
    await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: formatTitle(event),
        description: event.description
          ? `${event.description}\n\nImported via SyllabSync`
          : "Imported via SyllabSync",
        start: { date: event.date },
        end: { date: event.date },
        colorId: TYPE_COLORS[event.type],
      },
    });
    created++;
  }

  const calendarUrl = `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(calendarId)}`;

  return { created, calendarUrl };
}

function formatTitle(event: SyllabusEvent): string {
  const prefix =
    event.type === "exam"
      ? "📝"
      : event.type === "quiz"
        ? "❓"
        : event.type === "assignment"
          ? "📋"
          : "📅";
  const course = event.courseName ? `[${event.courseName}] ` : "";
  return `${course}${prefix} ${event.title}`;
}
