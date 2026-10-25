async function checkDeployed() {
  const res = await fetch('https://smit-hackathon-02-seven.vercel.app/assets/index--oJhKlnk.js');
  const text = await res.text();
  const matches = text.match(/https:\/\/[^"' ]*vercel\.app[^\'"]*/g) || [];
  console.log('URLs in deployed frontend bundle:', [...new Set(matches)]);
  
  const hasRelativeApi = text.includes('"/api"');
  console.log('Uses relative /api:', hasRelativeApi);
}

checkDeployed();
