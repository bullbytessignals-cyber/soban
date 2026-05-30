const fs = require('fs');
const content = fs.readFileSync('assets/index-BY6GlE7n.js', 'utf8');

function findOccurrences(regex, label) {
  let match;
  console.log(`=== Matches for ${label} ===`);
  const matches = [];
  while ((match = regex.exec(content)) !== null) {
    const start = Math.max(0, match.index - 50);
    const end = Math.min(content.length, match.index + match[0].length + 50);
    const context = content.slice(start, end).replace(/\n/g, ' ');
    matches.push(`At ${match.index}: ...${context}...`);
    if (matches.length >= 10) break; // limit to 10
  }
  console.log(matches.join('\n'));
}

findOccurrences(/\/api\/[a-zA-Z0-9\-\_\/]+/g, 'API URLs');
findOccurrences(/login[a-zA-Z0-9]*/gi, 'login keyword');
findOccurrences(/path\s*\:\s*\"[^\"]+\"/g, 'Router paths (double quotes)');
findOccurrences(/path\s*\:\s*\'[^\']+\'/g, 'Router paths (single quotes)');
findOccurrences(/\"\/[a-zA-Z0-9\-\_]+\"/g, 'Double quoted paths');
findOccurrences(/\'\/[a-zA-Z0-9\-\_]+\'/g, 'Single quoted paths');
