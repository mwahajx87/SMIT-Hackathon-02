async function check() {
  const code = await fetch('https://smit-hackathon-02-seven.vercel.app/assets/index--oJhKlnk.js').then(r => r.text());
  const idx = code.indexOf('smit-hackathon-02-kl52');
  console.log('Snippet around API base:');
  console.log(code.slice(idx - 50, idx + 120));
}
check();
