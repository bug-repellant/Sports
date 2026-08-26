export class IntegrationService {
  constructor() { this.sheetWebhookUrl = ''; this.chatWebhookUrl = ''; this.syncLogs = []; }
  setSheetWebhookUrl(url) { this.sheetWebhookUrl = (url || '').trim(); }
  getSheetWebhookUrl() { return this.sheetWebhookUrl; }
  setChatWebhookUrl(url) { this.chatWebhookUrl = (url || '').trim(); }
  getChatWebhookUrl() { return this.chatWebhookUrl; }
  getRecentLogs() { return this.syncLogs.slice(-15).reverse(); }

  async dispatchSheetSync(event, data) {
    const timestamp = new Date().toISOString();
    const logEntry = { id: 'sync_' + Date.now(), event, sport: data.sportName || 'N/A', name: data.userName || 'N/A', email: data.userEmail || 'N/A', venue: data.venue || 'TBA', timing: data.timing || 'TBA', timestamp, status: 'PENDING', message: '' };
    if (!this.sheetWebhookUrl) { logEntry.status = 'NOT_CONFIGURED'; logEntry.message = 'Google Sheets webhook URL is not configured.'; this.syncLogs.push(logEntry); console.warn('[Google Sheets]', logEntry.message); return logEntry; }

    const payload = JSON.stringify({ event, timestamp, sport: data.sportName, name: data.userName, email: data.userEmail, venue: data.venue, timing: data.timing, totalSignups: data.totalSignups });
    try {
      const response = await fetch(this.sheetWebhookUrl, { method: 'POST', redirect: 'follow', headers: { 'Content-Type': 'application/json' }, body: payload, signal: AbortSignal.timeout(15000) });
      const responseText = await response.text();
      let parsed = null; try { parsed = JSON.parse(responseText); } catch {}
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${responseText.slice(0, 300)}`);
      if (parsed?.status === 'ERROR') throw new Error(parsed.message || 'Apps Script returned an error.');
      logEntry.status = 'SUCCESS'; logEntry.message = parsed?.status || 'Synced to Google Sheet';
    } catch (err) { logEntry.status = 'FAILED'; logEntry.message = err?.message || String(err); }
    this.syncLogs.push(logEntry);
    console.log(`[Google Sheets] ${event} ${data.userEmail} -> ${logEntry.status}: ${logEntry.message}`);
    return logEntry;
  }

  async broadcastToGoogleChat(sport, weekLabel) {
    if (!this.chatWebhookUrl) throw new Error('Google Chat Webhook URL is not configured in Admin settings.');
    const attendeeNames = sport.signups?.length ? sport.signups.map((s, i) => `${i + 1}. ${s.name} (${s.email})`).join('\n') : 'None yet';
    const attendeeCount = sport.signups?.length || 0;
    const response = await fetch(this.chatWebhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json; charset=UTF-8' }, body: JSON.stringify({ text: `🏆 *Gameopedia Sports Announcement: ${sport.name}*\n📅 *Schedule:* ${sport.defaultDay} (${weekLabel || 'Next Week'})\n📍 *Venue:* ${sport.venue || 'TBA'}\n⏰ *Timing:* ${sport.timing || 'TBA'}\n👥 *Registered Attendees (${attendeeCount}):*\n${attendeeNames}\n\n_Automated notification from Gameopedia Sports Portal_` }) });
    if (!response.ok) throw new Error(`Google Chat webhook returned HTTP ${response.status}: ${await response.text()}`);
    return { success: true, count: attendeeCount };
  }

  generateICSForSport(sport, weekInfo) {
    const dayMatch = weekInfo?.days?.find(d => d.dayName === sport.defaultDay) || weekInfo?.days?.[0];
    const dateStr = dayMatch ? dayMatch.dateKey : new Date().toISOString().split('T')[0];
    const timing = sport.timing || '18:00 – 20:00'; const times = timing.split(/[–-]/).map(t => t.trim());
    const [startH, startM] = (times[0] !== 'TBA' ? times[0] : '18:00').split(':').map(Number); const [endH, endM] = (times[1] !== 'TBA' ? times[1] : '20:00').split(':').map(Number);
    const [year, month, day] = dateStr.split('-').map(Number); const pad = n => String(n || 0).padStart(2, '0');
    const startICS = `${year}${pad(month)}${pad(day)}T${pad(startH)}${pad(startM)}00`; const endICS = `${year}${pad(month)}${pad(day)}T${pad(endH)}${pad(endM)}00`; const nowICS = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const attendeeLines = (sport.signups || []).map(p => `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;CN=${p.name}:mailto:${p.email}`).join('\r\n');
    return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Gameopedia//Sports Signup//EN','CALSCALE:GREGORIAN','METHOD:REQUEST','BEGIN:VEVENT',`UID:gameopedia_${sport.id}_${dateStr}_${Date.now()}@gameopedia.com`,`DTSTAMP:${nowICS}`,`DTSTART:${startICS}`,`DTEND:${endICS}`,`SUMMARY:Gameopedia ${sport.name} Match (${sport.defaultDay})`,`DESCRIPTION:Gameopedia Office Sports Session\\nSport: ${sport.name}\\nVenue: ${sport.venue || 'TBA'}\\nTiming: ${sport.timing || 'TBA'}`,`LOCATION:${sport.venue || 'Gameopedia Sports Arena'}`,'ORGANIZER;CN=Gameopedia Sports Admin:mailto:sports-admin@gameopedia.com',attendeeLines,'STATUS:CONFIRMED','END:VEVENT','END:VCALENDAR'].filter(Boolean).join('\r\n');
  }

  getGoogleCalendarInviteUrl(sport, weekInfo) {
    const dayMatch = weekInfo?.days?.find(d => d.dayName === sport.defaultDay) || weekInfo?.days?.[0]; const dateStr = (dayMatch ? dayMatch.dateKey : new Date().toISOString().split('T')[0]).replace(/-/g, '');
    const times = (sport.timing || '18:00 – 20:00').split(/[–-]/).map(t => t.trim().replace(':', '')); const startT = times[0] && times[0] !== 'TBA' ? times[0].padStart(4, '0') + '00' : '180000'; const endT = times[1] && times[1] !== 'TBA' ? times[1].padStart(4, '0') + '00' : '200000';
    const title = encodeURIComponent(`Gameopedia ${sport.name} (${sport.defaultDay})`); const details = encodeURIComponent(`Gameopedia Office Sports Session\nSport: ${sport.name}\nVenue: ${sport.venue || 'TBA'}\nTiming: ${sport.timing || 'TBA'}`); const location = encodeURIComponent(sport.venue || 'TBA'); const add = sport.signups?.length ? `&add=${encodeURIComponent(sport.signups.map(p => p.email).join(','))}` : '';
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateStr}T${startT}/${dateStr}T${endT}&details=${details}&location=${location}${add}`;
  }

  generateCSV(sports = []) {
    const rows = [['Sport','Day','Venue','Timing','Player Name','Player Email','Signed Up At']];
    for (const sport of sports) { if (!sport.signups?.length) rows.push([sport.name,sport.defaultDay || '',sport.venue || 'TBA',sport.timing || 'TBA','(None)','','']); else for (const p of sport.signups) rows.push([sport.name,sport.defaultDay || '',sport.venue || 'TBA',sport.timing || 'TBA',p.name,p.email,p.signedUpAt || '']); }
    return rows.map(r => r.join(',')).join('\n');
  }

  getAppsScriptCode() { return `function doPost(e) {\n  try {\n    var ss = SpreadsheetApp.getActiveSpreadsheet();\n    var sheet = ss.getSheetByName('Signups') || ss.insertSheet('Signups');\n    var p = JSON.parse(e.postData.contents);\n    if (sheet.getLastRow() === 0) sheet.appendRow(['Timestamp','Event','Sport','Player Name','Player Email','Venue','Timing','Total Signups']);\n    sheet.appendRow([new Date(), p.event || '', p.sport || '', p.name || '', p.email || '', p.venue || 'TBA', p.timing || 'TBA', p.totalSignups || 0]);\n    return ContentService.createTextOutput(JSON.stringify({status:'SUCCESS'})).setMimeType(ContentService.MimeType.JSON);\n  } catch (err) {\n    return ContentService.createTextOutput(JSON.stringify({status:'ERROR',message:String(err)})).setMimeType(ContentService.MimeType.JSON);\n  }\n}`; }
}
export const integrations = new IntegrationService();
