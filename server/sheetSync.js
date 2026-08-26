/**
 * Integrations Service: Google Sheets, Google Chat Webhooks, and Calendar Invites
 */

export class IntegrationService {
  constructor() {
    this.sheetWebhookUrl = '';
    this.chatWebhookUrl = '';
    this.syncLogs = [];
  }

  setSheetWebhookUrl(url) {
    this.sheetWebhookUrl = (url || '').trim();
  }

  getSheetWebhookUrl() {
    return this.sheetWebhookUrl;
  }

  setChatWebhookUrl(url) {
    this.chatWebhookUrl = (url || '').trim();
  }

  getChatWebhookUrl() {
    return this.chatWebhookUrl;
  }

  getRecentLogs() {
    return this.syncLogs.slice(-15).reverse();
  }

  // 1. Dispatch Signup / Cancel to Google Sheets
  // Google Apps Script web apps can return an HTTP redirect before the actual
  // googleusercontent endpoint. We explicitly follow that redirect with POST
  // so the event payload is not lost or converted into a GET request.
  async dispatchSheetSync(event, data) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      id: 'sync_' + Date.now(),
      event,
      sport: data.sportName || 'N/A',
      name: data.userName || 'N/A',
      email: data.userEmail || 'N/A',
      venue: data.venue || 'TBA',
      timing: data.timing || 'TBA',
      timestamp,
      status: 'PENDING',
      message: ''
    };

    if (!this.sheetWebhookUrl) {
      logEntry.status = 'RECORDED_LOCALLY';
      logEntry.message = 'Logged locally (Webhook URL not set by admin).';
      this.syncLogs.push(logEntry);
      return logEntry;
    }

    const payload = JSON.stringify({
      event,
      timestamp,
      sport: data.sportName,
      name: data.userName,
      email: data.userEmail,
      venue: data.venue,
      timing: data.timing,
      totalSignups: data.totalSignups
    });

    const postPayload = async (url) => {
      return fetch(url, {
        method: 'POST',
        redirect: 'manual',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: payload,
        signal: AbortSignal.timeout(10000)
      });
    };

    try {
      let response = await postPayload(this.sheetWebhookUrl);

      // Apps Script commonly responds with 301/302/303 before reaching the
      // final googleusercontent URL. Re-send the original POST payload there.
      if (response.status >= 300 && response.status < 400) {
        const redirectUrl = response.headers.get('location');
        if (!redirectUrl) {
          throw new Error(`Webhook redirected with HTTP ${response.status}, but no Location header was returned.`);
        }
        response = await postPayload(redirectUrl);
      }

      const responseText = await response.text();
      logEntry.status = response.ok ? 'SUCCESS' : 'ERROR';
      logEntry.message = response.ok
        ? `Synced to Google Sheet${responseText ? ` (${responseText.slice(0, 120)})` : ''}`
        : `HTTP ${response.status}: ${responseText.slice(0, 200)}`;
    } catch (err) {
      logEntry.status = 'FAILED';
      logEntry.message = err?.name === 'TimeoutError'
        ? 'Google Sheets webhook timed out after 10 seconds.'
        : (err?.message || String(err));
    }

    this.syncLogs.push(logEntry);
    console.log(`[Google Sheets] ${event} ${data.userEmail} -> ${logEntry.status}: ${logEntry.message}`);
    return logEntry;
  }

  // 2. Broadcast Sport Venue/Timing & Attendees to Google Chat Webhook
  async broadcastToGoogleChat(sport, weekLabel) {
    if (!this.chatWebhookUrl) {
      throw new Error('Google Chat Webhook URL is not configured in Admin settings.');
    }

    const attendeeNames = sport.signups && sport.signups.length > 0
      ? sport.signups.map((s, idx) => `${idx + 1}. ${s.name} (${s.email})`).join('\n')
      : 'None yet';

    const attendeeCount = sport.signups?.length || 0;

    const messagePayload = {
      text: `🏆 *Gameopedia Sports Announcement: ${sport.name}*\n` +
            `📅 *Schedule:* ${sport.defaultDay} (${weekLabel || 'Next Week'})\n` +
            `📍 *Venue:* ${sport.venue || 'TBA'}\n` +
            `⏰ *Timing:* ${sport.timing || 'TBA'}\n` +
            `👥 *Registered Attendees (${attendeeCount}):*\n${attendeeNames}\n\n` +
            `_Automated notification from Gameopedia Sports Portal_`
    };

    const response = await fetch(this.chatWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify(messagePayload)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google Chat webhook returned HTTP ${response.status}: ${errText}`);
    }

    return { success: true, count: attendeeCount };
  }

  // 3. Generate .ICS Calendar Invite with ALL Attendees included
  generateICSForSport(sport, weekInfo) {
    const dayMatch = weekInfo?.days?.find(d => d.dayName === sport.defaultDay) || weekInfo?.days?.[0];
    const dateStr = dayMatch ? dayMatch.dateKey : new Date().toISOString().split('T')[0];

    const timing = sport.timing || '18:00 – 20:00';
    const times = timing.split(/[–-]/).map(t => t.trim());
    const startTimeStr = times[0] && times[0] !== 'TBA' ? times[0] : '18:00';
    const endTimeStr = times[1] && times[1] !== 'TBA' ? times[1] : '20:00';

    const [startH, startM] = startTimeStr.split(':').map(Number);
    const [endH, endM] = endTimeStr.split(':').map(Number);
    const [year, month, day] = dateStr.split('-').map(Number);

    const pad = (n) => String(n || 0).padStart(2, '0');
    const startICS = `${year}${pad(month)}${pad(day)}T${pad(startH)}${pad(startM)}00`;
    const endICS = `${year}${pad(month)}${pad(day)}T${pad(endH)}${pad(endM)}00`;
    const nowICS = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const attendeeLines = (sport.signups || []).map(p =>
      `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;CN=${p.name}:mailto:${p.email}`
    ).join('\r\n');

    const icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Gameopedia//Sports Signup//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:gameopedia_${sport.id}_${dateStr}_${Date.now()}@gameopedia.com`,
      `DTSTAMP:${nowICS}`,
      `DTSTART:${startICS}`,
      `DTEND:${endICS}`,
      `SUMMARY:Gameopedia ${sport.name} Match (${sport.defaultDay})`,
      `DESCRIPTION:Gameopedia Office Sports Session\\nSport: ${sport.name}\\nVenue: ${sport.venue || 'TBA'}\\nTiming: ${sport.timing || 'TBA'}\\nAttendees: ${(sport.signups || []).map(p => p.name).join(', ')}`,
      `LOCATION:${sport.venue || 'Gameopedia Sports Arena'}`,
      'ORGANIZER;CN=Gameopedia Sports Admin:mailto:sports-admin@gameopedia.com',
      attendeeLines,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(Boolean).join('\r\n');

    return icsLines;
  }

  // 4. Generate Google Calendar Invite URL with all attendees added as guests
  getGoogleCalendarInviteUrl(sport, weekInfo) {
    const dayMatch = weekInfo?.days?.find(d => d.dayName === sport.defaultDay) || weekInfo?.days?.[0];
    const dateStr = dayMatch ? dayMatch.dateKey.replace(/-/g, '') : new Date().toISOString().split('T')[0].replace(/-/g, '');

    const timing = sport.timing || '18:00 – 20:00';
    const times = timing.split(/[–-]/).map(t => t.trim().replace(':', ''));
    const startT = times[0] && times[0] !== 'TBA' ? times[0].padStart(4, '0') + '00' : '180000';
    const endT = times[1] && times[1] !== 'TBA' ? times[1].padStart(4, '0') + '00' : '200000';

    const datesParam = `${dateStr}T${startT}/${dateStr}T${endT}`;
    const title = encodeURIComponent(`Gameopedia ${sport.name} (${sport.defaultDay})`);
    const details = encodeURIComponent(`Gameopedia Office Sports Session\nSport: ${sport.name}\nVenue: ${sport.venue || 'TBA'}\nTiming: ${sport.timing || 'TBA'}\n\nConfirmed Attendees:\n` + (sport.signups || []).map(p => `- ${p.name} (${p.email})`).join('\n'));
    const location = encodeURIComponent(sport.venue || 'TBA');

    const attendeeEmails = (sport.signups || []).map(p => p.email).join(',');
    const addParam = attendeeEmails ? `&add=${encodeURIComponent(attendeeEmails)}` : '';

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${datesParam}&details=${details}&location=${location}${addParam}`;
  }

  // 5. CSV Generator
  generateCSV(sports = []) {
    const headers = ['Sport', 'Day', 'Venue', 'Timing', 'Player Name', 'Player Email', 'Signed Up At'];
    const rows = [headers];

    for (const sport of sports) {
      if (!sport.signups || sport.signups.length === 0) {
        rows.push([sport.name, sport.defaultDay || '', sport.venue || 'TBA', sport.timing || 'TBA', '(None)', '', '']);
        continue;
      }
      for (const p of sport.signups) {
        rows.push([
          sport.name,
          sport.defaultDay || '',
          sport.venue || 'TBA',
          sport.timing || 'TBA',
          p.name,
          p.email,
          p.signedUpAt || ''
        ]);
      }
    }

    return rows.map(r => r.join(',')).join('\n');
  }

  getAppsScriptCode() {
    return `function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var payload = JSON.parse(e.postData.contents);
    
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Timestamp", "Event", "Sport", "Player Name", "Player Email", "Venue", "Timing", "Total Signups"]);
      sheet.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#10b981").setFontColor("#ffffff");
    }

    sheet.appendRow([
      new Date(),
      payload.event,
      payload.sport,
      payload.name,
      payload.email,
      payload.venue || "TBA",
      payload.timing || "TBA",
      payload.totalSignups || 1
    ]);

    return ContentService.createTextOutput(JSON.stringify({ status: "SUCCESS" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "ERROR", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;
  }
}

export const integrations = new IntegrationService();
