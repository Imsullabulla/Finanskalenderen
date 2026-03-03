// Calendar export utilities for Google, Outlook, and Apple Calendar

function formatDateForICS(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function formatAllDayDateForICS(date: Date): string {
  return date.toISOString().split('T')[0].replace(/-/g, '');
}

function nextDay(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + 1);
  return d;
}

export function generateICS(params: {
  name: string;
  description: string;
  deadlineDate: Date;
  url?: string;
}): string {
  const { name, description, deadlineDate, url } = params;
  const uid = `${name.replace(/\s+/g, '-').toLowerCase()}-${deadlineDate.toISOString().split('T')[0]}@finanskalenderen`;
  const dtStart = formatAllDayDateForICS(deadlineDate);
  const dtEnd = formatAllDayDateForICS(nextDay(deadlineDate));
  const now = formatDateForICS(new Date());

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Finanskalenderen//Compliance Calendar//DA',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART;VALUE=DATE:${dtStart}`,
    `DTEND;VALUE=DATE:${dtEnd}`,
    `SUMMARY:${name}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    url ? `URL:${url}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);

  return lines.join('\r\n');
}

export function getGoogleCalendarUrl(params: {
  name: string;
  description: string;
  deadlineDate: Date;
}): string {
  const { name, description, deadlineDate } = params;
  const dateStr = deadlineDate.toISOString().split('T')[0].replace(/-/g, '');
  const nextDateStr = nextDay(deadlineDate).toISOString().split('T')[0].replace(/-/g, '');

  const query = new URLSearchParams({
    action: 'TEMPLATE',
    text: name,
    details: description,
    dates: `${dateStr}/${nextDateStr}`,
  });

  return `https://calendar.google.com/calendar/render?${query.toString()}`;
}

export function getOutlookCalendarUrl(params: {
  name: string;
  description: string;
  deadlineDate: Date;
}): string {
  const { name, description, deadlineDate } = params;
  const start = deadlineDate.toISOString().split('T')[0];
  const end = nextDay(deadlineDate).toISOString().split('T')[0];

  const query = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: name,
    body: description,
    startdt: start,
    enddt: end,
    allday: 'true',
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${query.toString()}`;
}

// ─── Bulk ICS generation (multi-obligation / multi-event) ────────────────────

export type ExportDuration = '1year' | '2years' | '3years' | 'ongoing';

export interface BulkExportObligation {
  id: string;
  name: string;
  description: string;
  frequency: string; // Frequency from obligations.ts
  nextDeadline: Date | null;
  allDeadlines: Date[]; // pre-calculated for the chosen horizon
}

function getFrequencyRRule(frequency: string): string | null {
  switch (frequency) {
    case 'monthly':    return 'RRULE:FREQ=MONTHLY';
    case 'quarterly':  return 'RRULE:FREQ=MONTHLY;INTERVAL=3';
    case 'semi-annual': return 'RRULE:FREQ=MONTHLY;INTERVAL=6';
    case 'annual':     return 'RRULE:FREQ=YEARLY';
    default:           return null;
  }
}

export function generateBulkICS(
  obligations: BulkExportObligation[],
  duration: ExportDuration,
): string {
  const now = new Date();
  const dtstamp = formatDateForICS(now);
  const events: string[] = [];

  if (duration === 'ongoing') {
    for (const ob of obligations) {
      if (!ob.nextDeadline) continue;
      const rrule = getFrequencyRRule(ob.frequency);
      const uid = `${ob.id}-recurring@finanskalenderen`;
      const dtStart = formatAllDayDateForICS(ob.nextDeadline);
      const dtEnd = formatAllDayDateForICS(nextDay(ob.nextDeadline));
      const vevent = [
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART;VALUE=DATE:${dtStart}`,
        `DTEND;VALUE=DATE:${dtEnd}`,
        `SUMMARY:${ob.name}`,
        `DESCRIPTION:${ob.description.replace(/\n/g, '\\n')}`,
        ...(rrule ? [rrule] : []),
        'END:VEVENT',
      ];
      events.push(vevent.join('\r\n'));
    }
  } else {
    for (const ob of obligations) {
      for (const deadline of ob.allDeadlines) {
        const uid = `${ob.id}-${deadline.toISOString().split('T')[0]}@finanskalenderen`;
        const dtStart = formatAllDayDateForICS(deadline);
        const dtEnd = formatAllDayDateForICS(nextDay(deadline));
        const vevent = [
          'BEGIN:VEVENT',
          `UID:${uid}`,
          `DTSTAMP:${dtstamp}`,
          `DTSTART;VALUE=DATE:${dtStart}`,
          `DTEND;VALUE=DATE:${dtEnd}`,
          `SUMMARY:${ob.name}`,
          `DESCRIPTION:${ob.description.replace(/\n/g, '\\n')}`,
          'END:VEVENT',
        ];
        events.push(vevent.join('\r\n'));
      }
    }
  }

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Finanskalenderen//Compliance Calendar//DA',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadICS(ics: string, filename: string): void {
  if (typeof window === 'undefined') return;
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.ics') ? filename : `${filename}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
