const fs = require('fs');
const https = require('https');
const path = require('path');

const baseUrl = 'https://carders-vault-pro.base44.app';
const files = [
  '/',
  '/assets/index-BY6GlE7n.js',
  '/assets/index-BaPnUR-l.css',
  '/manifest.json'
];

const destDir = __dirname;

function download(urlPath) {
  const url = baseUrl + (urlPath === '/' ? '' : urlPath);
  const localPath = path.join(destDir, urlPath === '/' ? 'index.html' : urlPath);
  
  // Ensure directory exists
  fs.mkdirSync(path.dirname(localPath), { recursive: true });
  
  https.get(url, (res) => {
    if (res.statusCode !== 200) {
      console.error(`Failed to download ${url}: ${res.statusCode}`);
      return;
    }
    const fileStream = fs.createWriteStream(localPath);
    res.pipe(fileStream);
    fileStream.on('finish', () => {
      fileStream.close();
      console.log(`Downloaded ${urlPath} to ${localPath}`);
    });
  }).on('error', (err) => {
    console.error(`Error downloading ${url}:`, err.message);
  });
}

files.forEach(download);
