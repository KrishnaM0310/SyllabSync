import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { exportToGoogleCalendar } from "@/lib/google-calendar";
import type { SyllabusEvent } from "@/types";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json(
        { error: "Please sign in with Google first." },
        { status: 401 }
      );
    }

    const body = (await request.json()) as {
      events: SyllabusEvent[];
      courseName?: string;
    };

    const selectedEvents = (body.events ?? []).filter(
      (e) => e.selected && e.title.trim() && e.date
    );

    if (selectedEvents.length === 0) {
      return NextResponse.json(
        { error: "Add a title and date for at least one selected event." },
        { status: 400 }
      );
    }

    const result = await exportToGoogleCalendar(
      session.accessToken,
      selectedEvents,
      body.courseName
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Calendar export error:", error);
    return NextResponse.json(
      { error: "Failed to export events to Google Calendar." },
      { status: 500 }
    );
  }
}
