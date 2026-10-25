const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      results.push(file);
    }
  });
  return results;
}

const files = walk('src').filter(f => f.endsWith('.jsx') || f.endsWith('.js'));
files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const importRegex = /from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    if (importPath.startsWith('.')) {
      const fullPath = path.resolve(path.dirname(f), importPath);
      const dir = path.dirname(fullPath);
      const base = path.basename(fullPath);
      try {
        const exactMatch = fs.readdirSync(dir).find(file => {
          if (file === base || file === base + '.js' || file === base + '.jsx' || file === base + '.css') return true;
          return false;
        });
        if (!exactMatch) {
          console.log(`Mismatch in ${f}: import '${importPath}' -> expected to find ${base} in ${dir}`);
        }
      } catch (e) {
        console.log(`Dir not found in ${f}: import '${importPath}'`);
      }
    }
  }
});
