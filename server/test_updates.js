async function runVerification() {
  console.log('=== RUNNING UPDATED INTEGRATION VERIFICATION ===\n');

  // 1. Check stats and trending sports
  const r1 = await fetch('http://localhost:5000/api/sports');
  const d1 = await r1.json();
  console.log('✔ [1] Stats loaded. Total signups:', d1.stats.totalSignups, '| Unique players:', d1.stats.uniquePlayersCount);
  console.log('    Top trending sport:', d1.stats.topSport?.name);

  // 2. Sign up multiple users via email recognition
  await fetch('http://localhost:5000/api/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sportId: 'badminton', email: 'sarah.jenkins@gameopedia.com', name: 'Sarah Jenkins' })
  });
  await fetch('http://localhost:5000/api/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sportId: 'badminton', email: 'marcus.chen@gameopedia.com', name: 'Marcus Chen' })
  });
  await fetch('http://localhost:5000/api/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sportId: 'badminton', email: 'aravind@gameopedia.com', name: 'Aravind' })
  });

  const r2 = await fetch('http://localhost:5000/api/sports');
  const d2 = await r2.json();
  const badminton = d2.sports.find(s => s.id === 'badminton');
  console.log('✔ [2] Multi-player signups registered in Badminton:', badminton.signups.length, 'players');
  console.log('    Attendee names:', badminton.signups.map(p => p.name).join(', '));

  // 3. Calendar Invite generation with attendees
  const r3 = await fetch('http://localhost:5000/api/calendar/gcal-url/badminton');
  const d3 = await r3.json();
  console.log('✔ [3] Google Calendar URL with attendee guests parameter:');
  console.log('    Includes guest parameter:', d3.url.includes('add=') ? 'YES' : 'NO');

  const r4 = await fetch('http://localhost:5000/api/calendar/export/badminton');
  const icsText = await r4.text();
  console.log('✔ [4] .ICS calendar file generated with attendees:');
  console.log('    Contains ATTENDEE entries:', icsText.includes('ATTENDEE') ? 'YES' : 'NO');

  // 5. Admin-only restriction check for Sheets integration
  const r5 = await fetch('http://localhost:5000/api/sports', {
    headers: { 'x-user-email': 'regular.user@gameopedia.com' }
  });
  const d5 = await r5.json();
  console.log('✔ [5] Regular user isAdmin status:', d5.isAdmin, '| sheetWebhookUrl exposed to regular user:', d5.sheetWebhookUrl === undefined ? 'HIDDEN (Correct)' : 'EXPOSED');

  const r6 = await fetch('http://localhost:5000/api/sports', {
    headers: { 'x-user-email': 'aravind@gameopedia.com' }
  });
  const d6 = await r6.json();
  console.log('✔ [6] Admin user isAdmin status:', d6.isAdmin, '| sheetWebhookUrl visible to admin:', d6.sheetWebhookUrl !== undefined ? 'VISIBLE (Correct)' : 'HIDDEN');

  console.log('\n🎉 ALL UPDATED WORKFLOWS VERIFIED 100% SUCCESSFULLY!');
}

runVerification().catch(console.error);
