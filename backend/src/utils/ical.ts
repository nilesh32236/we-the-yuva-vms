export interface IcalEventInput {
  uid: string;
  title: string;
  description: string;
  location: string;
  startDate: Date;
  endDate: Date;
  organizerName: string;
  dtstamp?: Date;
}

function formatIcalDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

function escapeIcalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

export function generateIcs(event: IcalEventInput): string {
  return `${[
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//WeTheYuva VMS//EN',
    'BEGIN:VEVENT',
    `UID:${event.uid}@wetheyuva`,
    `DTSTAMP:${formatIcalDate(event.dtstamp ?? new Date())}`,
    `DTSTART:${formatIcalDate(event.startDate)}`,
    `DTEND:${formatIcalDate(event.endDate)}`,
    `SUMMARY:${escapeIcalText(event.title)}`,
    `DESCRIPTION:${escapeIcalText(event.description)}`,
    `LOCATION:${escapeIcalText(event.location)}`,
    `ORGANIZER;CN=${escapeIcalText(event.organizerName)}:mailto:${escapeIcalText(event.organizerName)}@wetheyuva`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')}\r\n`;
}
