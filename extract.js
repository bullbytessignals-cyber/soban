const fs = require('fs');
const content = fs.readFileSync('assets/index-BY6GlE7n.js', 'utf8');

const components = ['$4', 'Z4', 'eF', 'p3', 'vU', 'xU', 'KO'];

components.forEach(name => {
  console.log(`\n=================== COMPONENT ${name} ===================`);
  
  // Let's search for function definitions or arrow function assignments
  // Examples: "function $4(", "const $4=", "let $4="
  const regexes = [
    new RegExp(`function\\s+${name.replace('$', '\\$')}\\s*\\(`, 'g'),
    new RegExp(`const\\s+${name.replace('$', '\\$')}\\s*=`, 'g'),
    new RegExp(`let\\s+${name.replace('$', '\\$')}\\s*=`, 'g'),
    new RegExp(`var\\s+${name.replace('$', '\\$')}\\s*=`, 'g'),
    new RegExp(`${name.replace('$', '\\$')}\\s*=\\s*\\(`, 'g'),
    new RegExp(`${name.replace('$', '\\$')}\\s*=\\s*function`, 'g')
  ];

  let found = false;
  for (const regex of regexes) {
    let match = regex.exec(content);
    if (match) {
      found = true;
      const index = match.index;
      // Print around 2000 characters from match.index to see the component logic
      const chunk = content.slice(index, index + 3000);
      console.log(`Found definition at index ${index} using regex ${regex.source}:`);
      console.log(chunk);
      break;
    }
  }
  if (!found) {
    console.log(`Could not find direct definition for ${name}`);
    // Search where it is referenced
    let refIndex = content.indexOf(name);
    if (refIndex !== -1) {
      console.log(`First reference at index ${refIndex}:`);
      console.log(content.slice(Math.max(0, refIndex - 100), Math.min(content.length, refIndex + 200)));
    }
  }
});
