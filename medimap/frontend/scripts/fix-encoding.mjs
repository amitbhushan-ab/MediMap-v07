// scripts/fix-encoding.mjs — repair UTF-8 that was read as Windows-1252 and re-saved.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const CP1252 = {
  '€': 0x80, '‚': 0x82, 'ƒ': 0x83, '„': 0x84, '…': 0x85, '†': 0x86, '‡': 0x87,
  'ˆ': 0x88, '‰': 0x89, 'Š': 0x8a, '‹': 0x8b, 'Œ': 0x8c, 'Ž': 0x8e, '‘': 0x91,
  '’': 0x92, '“': 0x93, '”': 0x94, '•': 0x95, '–': 0x96, '—': 0x97, '˜': 0x98,
  '™': 0x99, 'š': 0x9a, '›': 0x9b, 'œ': 0x9c, 'ž': 0x9e, 'Ÿ': 0x9f,
};

function walk(path) {
  if (statSync(path).isFile()) return [path];
  return readdirSync(path).flatMap((entry) => {
    const full = join(path, entry);
    if (statSync(full).isDirectory()) return walk(full);
    return ['.js', '.jsx', '.ts', '.tsx', '.css', '.md'].includes(extname(full)) ? [full] : [];
  });
}

const targets = process.argv.slice(2);
if (!targets.length) {
  console.error('Usage: node scripts/fix-encoding.mjs <file-or-directory...>');
  process.exit(1);
}

let repaired = 0;
for (const target of targets) {
  for (const file of walk(target)) {
    const source = readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
    const markers = (source.match(/à¤|â€|Ã[\u0080-\u00BF]/g) || []).length;
    if (!markers) {
      console.log(`${file}: clean (${(source.match(/[\u0900-\u097F]/g) || []).length} Devanagari chars)`);
      continue;
    }

    const bytes = [];
    for (const char of source) {
      const mapped = CP1252[char];
      const code = mapped !== undefined ? mapped : char.charCodeAt(0);
      if (code > 255) {
        throw new Error(`${file}: unexpected character ${JSON.stringify(char)} (U+${code.toString(16)})`);
      }
      bytes.push(code);
    }

    const fixed = Buffer.from(bytes).toString('utf8');
    if ((fixed.match(/à¤|â€/g) || []).length > 0) {
      throw new Error(`${file}: still contains mojibake after conversion`);
    }
    writeFileSync(file, fixed, 'utf8');
    repaired += 1;
    console.log(`${file}: repaired (${(fixed.match(/[\u0900-\u097F]/g) || []).length} Devanagari chars)`);
  }
}
console.log(`\n${repaired} file(s) repaired.`);
