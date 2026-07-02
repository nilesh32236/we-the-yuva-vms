import { describe, expect, it } from 'vitest';
import { generateIcs } from '../ical';

describe('generateIcs', () => {
  it('produces valid ICS content for a basic event', () => {
    const ics = generateIcs({
      uid: 'event-123',
      title: 'Tree Plantation Drive',
      description: 'Join us to plant trees at Powai Lake.',
      location: 'Powai Lake, Mumbai',
      startDate: new Date('2026-07-15T09:00:00Z'),
      endDate: new Date('2026-07-15T12:00:00Z'),
      organizerName: 'WeTheYuva',
    });

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('PRODID:-//WeTheYuva VMS//EN');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('UID:event-123@wetheyuva');
    expect(ics).toContain('SUMMARY:Tree Plantation Drive');
    expect(ics).toContain('DESCRIPTION:Join us to plant trees at Powai Lake.');
    expect(ics).toContain('LOCATION:Powai Lake\\, Mumbai');
    expect(ics).toContain('DTSTART:20260715T090000Z');
    expect(ics).toContain('DTEND:20260715T120000Z');
    expect(ics).toContain('ORGANIZER;CN=WeTheYuva');
    expect(ics).toContain('END:VEVENT');
    expect(ics).toContain('END:VCALENDAR');
  });

  it('escapes special characters in description', () => {
    const ics = generateIcs({
      uid: '1',
      title: 'Test',
      description: 'Line1\nLine2, with commas; and semicolons',
      location: '',
      startDate: new Date('2026-01-01T00:00:00Z'),
      endDate: new Date('2026-01-01T01:00:00Z'),
      organizerName: 'Test',
    });

    expect(ics).toContain('DESCRIPTION:Line1\\nLine2\\, with commas\\; and semicolons');
  });

  it('formats all dates as UTC', () => {
    const ics = generateIcs({
      uid: '2',
      title: 'T',
      description: '',
      location: '',
      startDate: new Date('2026-12-25T14:30:00+05:30'),  // 09:00 UTC
      endDate: new Date('2026-12-25T16:30:00+05:30'),     // 11:00 UTC
      organizerName: 'O',
    });

    expect(ics).toContain('DTSTART:20261225T090000Z');
    expect(ics).toContain('DTEND:20261225T110000Z');
  });

  it('includes DTSTAMP', () => {
    const now = new Date('2026-07-02T12:00:00Z');
    const ics = generateIcs({
      uid: '3',
      title: 'T',
      description: '',
      location: '',
      startDate: now,
      endDate: now,
      organizerName: 'O',
    });

    expect(ics).toContain('DTSTAMP:20260702T120000Z');
  });
});
