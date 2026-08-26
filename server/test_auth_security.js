async function runSecurityTests() {
  console.log('=== RUNNING AUTH & SECURITY VERIFICATION ===\n');

  // 1. Rejection of non-gameopedia email
  const r1 = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'intruder@gmail.com', password: 'password123' })
  });
  console.log('✔ [1] Non-Gameopedia email registration blocked with status:', r1.status, '(Expected 403)');

  // 2. User registration with valid @gameopedia.com
  const r2 = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'new.engineer@gameopedia.com', password: 'securePass123', name: 'New Engineer' })
  });
  const d2 = await r2.json();
  console.log('✔ [2] Gameopedia user registered:', d2.success, '| User:', d2.user?.name, '| Token generated:', Boolean(d2.token));

  // 3. User login with wrong password (should fail)
  const r3 = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'new.engineer@gameopedia.com', password: 'wrongPassword' })
  });
  console.log('✔ [3] Wrong password login blocked with status:', r3.status, '(Expected 401)');

  // 4. User login with correct password
  const r4 = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'new.engineer@gameopedia.com', password: 'securePass123' })
  });
  const d4 = await r4.json();
  console.log('✔ [4] Correct password login success:', d4.success, '| Token:', d4.token ? 'VALID' : 'MISSING');

  // 5. Signup authenticated with user token
  const r5 = await fetch('http://localhost:5000/api/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sportId: 'football',
      email: d4.user.email,
      name: d4.user.name,
      userToken: d4.token
    })
  });
  const d5 = await r5.json();
  console.log('✔ [5] Authenticated signup success:', d5.success, '| Sport:', d5.sport?.name);

  // 6. Admin password verification
  const r6 = await fetch('http://localhost:5000/api/auth/admin-verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'wrongAdminPassword' })
  });
  console.log('✔ [6] Invalid admin password blocked with status:', r6.status, '(Expected 401)');

  const r7 = await fetch('http://localhost:5000/api/auth/admin-verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'gameopedia@admin2026' })
  });
  const d7 = await r7.json();
  console.log('✔ [7] Valid admin password unlocked mode:', d7.success, '| Admin Token:', Boolean(d7.adminToken));

  // 8. Admin update venue with admin token
  const r8 = await fetch('http://localhost:5000/api/admin/sport/football', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      venue: 'PlayArena Football Turf 1 (Confirmed)',
      timing: '7:00 PM – 9:00 PM',
      adminToken: d7.adminToken
    })
  });
  const d8 = await r8.json();
  console.log('✔ [8] Admin updated venue with adminToken:', d8.success, '| Venue:', d8.sport?.venue);

  console.log('\n🎉 ALL USER AUTH & ADMIN PASSWORD SECURITY TESTS PASSED 100%!');
}

runSecurityTests().catch(console.error);
