const BLOCKED_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0"];

export async function scrapeTextFromUrl(input: string): Promise<string> {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw new Error("Please enter a valid URL (including https://).");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only http and https URLs are supported.");
  }

  if (BLOCKED_HOSTS.includes(url.hostname)) {
    throw new Error("That URL cannot be fetched.");
  }

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; SyllabSync/1.0; +https://github.com/syllabsync)",
      Accept: "text/html,application/xhtml+xml,text/plain,*/*",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    throw new Error(`Could not fetch syllabus page (${res.status}).`);
  }

  const contentType = res.headers.get("content-type") ?? "";
  const body = await res.text();

  if (contentType.includes("pdf") || url.pathname.toLowerCase().endsWith(".pdf")) {
    const { extractTextFromPdf } = await import("@/lib/extract");
    const buffer = Buffer.from(await res.arrayBuffer());
    return extractTextFromPdf(buffer);
  }

  return htmlToText(body);
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|li|tr|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[^\S\n]+/g, " ")
    .trim();
}
