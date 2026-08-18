/**
 * Calendar Links Utility
 * 
 * Generates calendar URLs and ICS file content for adding events
 * to various calendar applications (Google Calendar, Apple Calendar, Outlook, etc.)
 */

export interface CalendarEventDetails {
  title: string;
  description: string;
  location: string;
  startTime: Date;
  endTime: Date;
  organizerEmail?: string;
}

/**
 * Generate Google Calendar URL for adding an event
 * Opens Google Calendar with pre-filled event details
 */
export function generateGoogleCalendarUrl(event: CalendarEventDetails): string {
  // Format dates for Google Calendar (YYYYMMDDTHHMMSSZ)
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  };

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    details: event.description,
    location: event.location,
    dates: `${formatDate(event.startTime)}/${formatDate(event.endTime)}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate Outlook Web calendar URL
 */
export function generateOutlookCalendarUrl(event: CalendarEventDetails): string {
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: event.title,
    body: event.description,
    location: event.location,
    startdt: event.startTime.toISOString(),
    enddt: event.endTime.toISOString(),
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Generate ICS file content for download
 * Compatible with Apple Calendar, Outlook, Google Calendar, etc.
 */
export function generateIcsContent(event: CalendarEventDetails): string {
  // Format date for ICS (YYYYMMDDTHHMMSSZ)
  const formatIcsDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  };

  // Escape special characters in ICS format
  const escapeIcs = (text: string) => {
    return text
      .replace(/\\/g, "\\\\")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;")
      .replace(/\n/g, "\\n");
  };

  // Fold long lines (ICS spec requires lines < 75 chars)
  const foldLine = (line: string): string => {
    if (line.length <= 75) return line;
    const chunks: string[] = [];
    let remaining = line;
    chunks.push(remaining.slice(0, 75));
    remaining = remaining.slice(75);
    while (remaining.length > 0) {
      chunks.push(" " + remaining.slice(0, 74));
      remaining = remaining.slice(74);
    }
    return chunks.join("\r\n");
  };

  const uid = `booking-${Date.now()}-${Math.random().toString(36).slice(2)}@festly.app`;
  const dtstamp = formatIcsDate(new Date());
  const dtstart = formatIcsDate(event.startTime);
  const dtend = formatIcsDate(event.endTime);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Festly//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    foldLine(`SUMMARY:${escapeIcs(event.title)}`),
    foldLine(`DESCRIPTION:${escapeIcs(event.description)}`),
    foldLine(`LOCATION:${escapeIcs(event.location)}`),
    event.organizerEmail ? `ORGANIZER:mailto:${event.organizerEmail}` : null,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  return lines;
}

/**
 * Create a downloadable ICS file blob URL
 */
export function createIcsDownloadUrl(event: CalendarEventDetails): string {
  const icsContent = generateIcsContent(event);
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  return URL.createObjectURL(blob);
}

/**
 * Trigger download of ICS file
 */
export function downloadIcsFile(event: CalendarEventDetails, filename?: string): void {
  const icsContent = generateIcsContent(event);
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || `${event.title.replace(/[^a-z0-9]/gi, "_")}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

