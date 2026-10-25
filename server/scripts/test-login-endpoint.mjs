async function testLogin() {
  const res = await fetch('https://smit-hackathon-02-kl52.vercel.app/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@company.com', password: 'Password123!' })
  });
  console.log('Status:', res.status);
  const data = await res.json();
  console.log('Response:', data);
}

testLogin();
