
const fs = require('fs');
const https = require('https');
const path = require('path');

const envPath = path.join(__dirname, '../.env');
let apiKey = '';

try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/GEMINI_API_KEY=(.*)/);
  if (match && match[1]) {
    apiKey = match[1].trim();
  }
} catch (e) {
  process.exit(1);
}

if (!apiKey) {
  process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (json.models) {
        json.models.forEach(m => {
          if (m.supportedGenerationMethods.includes('generateContent')) {
            console.log(`${m.name.replace('models/', '')}`);
          }
        });
      }
    } catch (e) {
      // ignore
    }
  });
});
