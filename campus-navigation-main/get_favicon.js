const https = require('https');
https.get('https://mgmits.ac.in/', (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    const match = data.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i);
    if (match) console.log("FAVICON=" + match[1]);
    else console.log("No favicon found");
  });
});
