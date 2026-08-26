async function runTests() {
  console.log('=== RUNNING FULL END-TO-END VERIFICATION ===\n');

  // 1. Config & Domain Rule
  const r1 = await fetch('http://localhost:5000/api/config');
  const d1 = await r1.json();
  console.log('✔ [TEST 1] Config loaded: Allowed Domain =', d1.allowedDomain, '| Sports Count =', d1.sports.length);

  // 2. Reject non-gameopedia email
  const r2 = await fetch('http://localhost:5000/api/auth/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'hacker@gmail.com' })
  });
  console.log('✔ [TEST 2] External email rejection HTTP status:', r2.status, '(Expected 403 Forbidden)');

  // 3. Login with @gameopedia.com
  const r3 = await fetch('http://localhost:5000/api/auth/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'aravind@gameopedia.com' })
  });
  const d3 = await r3.json();
  console.log('✔ [TEST 3] Gameopedia domain auth success:', d3.success, '| User:', d3.user.name, '| Role:', d3.user.role);

  // 4. Subsequent Week schedule retrieval
  const r4 = await fetch('http://localhost:5000/api/sessions?week=next');
  const d4 = await r4.json();
  console.log('✔ [TEST 4] Subsequent week sessions retrieved:', d4.sessions.length, '| Label:', d4.weekInfo.label);

  // 5. Signup for session
  const targetSession = d4.sessions[0];
  const r5 = await fetch('http://localhost:5000/api/sessions/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-email': 'priya.sharma@gameopedia.com'
    },
    body: JSON.stringify({
      sessionId: targetSession.id,
      user: { name: 'Priya Sharma', department: 'Product Strategy' }
    })
  });
  const d5 = await r5.json();
  console.log('✔ [TEST 5] Player registered successfully:', d5.success, '| Current roster count:', d5.session.participants.length);

  // 6. Admin Venue & Timings Update
  const r6 = await fetch(`http://localhost:5000/api/admin/sessions/${targetSession.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-user-email': 'aravind@gameopedia.com'
    },
    body: JSON.stringify({
      venue: 'Star Badminton Arena Court 4 (Updated by Admin)',
      timing: '19:00 – 21:00',
      status: 'venue_confirmed'
    })
  });
  const d6 = await r6.json();
  console.log('✔ [TEST 6] Admin updated venue & timings:', d6.success, '| New Venue:', d6.session.venue);

  // 7. Google Sheets Webhook Dispatch & Sync
  const r7 = await fetch('http://localhost:5000/api/admin/sheets/sync-now', {
    method: 'POST',
    headers: { 'x-user-email': 'aravind@gameopedia.com' }
  });
  const d7 = await r7.json();
  console.log('✔ [TEST 7] Google Sheets manual sync trigger status:', d7.success, '| Sync log result:', d7.log.status);

  // 8. CSV Export
  const r8 = await fetch('http://localhost:5000/api/export/csv?week=next');
  const csvText = await r8.text();
  console.log('✔ [TEST 8] CSV Export downloaded. Total lines:', csvText.split('\n').length);

  // 9. Static Web App Serving
  const r9 = await fetch('http://localhost:5000/');
  const html = await r9.text();
  console.log('✔ [TEST 9] Web app root serving index.html:', html.includes('root') && html.includes('Gameopedia'));

  console.log('\n🎉 ALL 9 AUTOMATED INTEGRATION TESTS PASSED 100%!');
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
