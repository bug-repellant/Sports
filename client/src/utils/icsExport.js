/**
 * Calendar Export Utilities for Gameopedia Sports Sessions
 */

export function downloadICS(session, user) {
  if (!session) return;

  // Extract start and end time
  const dateStr = session.date; // "YYYY-MM-DD"
  const timing = session.timing || '18:00 – 20:00';
  
  // Parse timing like "18:30 – 20:30" or "18:00 - 20:00"
  const times = timing.split(/[–-]/).map(t => t.trim());
  const startTimeStr = times[0] || '18:00';
  const endTimeStr = times[1] || '20:00';

  const [startH, startM] = startTimeStr.split(':').map(Number);
  const [endH, endM] = endTimeStr.split(':').map(Number);

  const [year, month, day] = dateStr.split('-').map(Number);

  const formatICSDate = (y, m, d, h, min) => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${y}${pad(m)}${pad(d)}T${pad(h || 0)}${pad(min || 0)}00`;
  };

  const startICS = formatICSDate(year, month, day, startH, startM);
  const endICS = formatICSDate(year, month, day, endH, endM);
  const nowICS = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Gameopedia//Sports Signup//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:gameopedia_${session.id}_${Date.now()}@gameopedia.com`,
    `DTSTAMP:${nowICS}`,
    `DTSTART:${startICS}`,
    `DTEND:${endICS}`,
    `SUMMARY:Gameopedia ${session.sportName} (${session.dayName})`,
    `DESCRIPTION:Gameopedia Office Sports Session\\nSport: ${session.sportName}\\nVenue: ${session.venue}\\nTiming: ${session.timing}\\nGear: ${session.gearRequired || 'Standard sports gear'}\\nNotes: ${session.notes || ''}`,
    `LOCATION:${session.venue || 'Gameopedia Sports Arena'}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `gameopedia_${session.sportId}_${session.date}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function getGoogleCalendarUrl(session) {
  if (!session) return '#';

  const dateStr = session.date.replace(/-/g, '');
  const timing = session.timing || '18:00 – 20:00';
  const times = timing.split(/[–-]/).map(t => t.trim().replace(':', ''));
  const startT = times[0] ? times[0].padStart(4, '0') + '00' : '180000';
  const endT = times[1] ? times[1].padStart(4, '0') + '00' : '200000';

  const datesParam = `${dateStr}T${startT}/${dateStr}T${endT}`;
  const title = encodeURIComponent(`Gameopedia ${session.sportName} (${session.dayName})`);
  const details = encodeURIComponent(`Gameopedia Office Sports Session\nSport: ${session.sportName}\nVenue: ${session.venue}\nTiming: ${session.timing}\nGear: ${session.gearRequired || 'Sports gear'}`);
  const location = encodeURIComponent(session.venue || 'Gameopedia Sports Arena');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${datesParam}&details=${details}&location=${location}`;
}
