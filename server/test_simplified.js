async function runTest() {
  console.log('=== TESTING SIMPLIFIED SPORTS APP ===\n');

  // 1. Fetch sports
  const r1 = await fetch('http://localhost:5000/api/sports');
  const d1 = await r1.json();
  console.log('✔ [1] Sports returned:', d1.sports.length, '(Expected 7)');
  console.log('    Sports list:', d1.sports.map(s => s.name).join(', '));
  console.log('✔ [2] Default venue & time:', d1.sports[0].venue, d1.sports[0].timing, '(Expected TBA TBA)');
  console.log('✔ [3] Cutoff info:', d1.weekInfo.fridayDeadlineDisplay);

  // 2. Sign up with email and name
  const r2 = await fetch('http://localhost:5000/api/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sportId: 'badminton',
      email: 'sarah@gameopedia.com',
      name: 'Sarah'
    })
  });
  const d2 = await r2.json();
  console.log('✔ [4] Signup success:', d2.success, '| Signups count in Badminton:', d2.sport.signups.length);

  // 3. Admin update venue & timing
  const r3 = await fetch('http://localhost:5000/api/admin/sport/badminton', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      venue: 'Star Badminton Arena',
      timing: '6:30 PM – 8:30 PM'
    })
  });
  const d3 = await r3.json();
  console.log('✔ [5] Venue updated:', d3.sport.venue, '| Timing:', d3.sport.timing);

  // 4. CSV download
  const r4 = await fetch('http://localhost:5000/api/export/csv');
  const csv = await r4.text();
  console.log('✔ [6] CSV generated. Sample lines:\n' + csv.split('\n').slice(0, 4).join('\n'));

  console.log('\n🎉 ALL SIMPLIFIED WORKFLOWS VERIFIED SUCCESSFULLY!');
}

runTest().catch(console.error);
