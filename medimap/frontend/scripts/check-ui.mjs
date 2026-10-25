// scripts/check-ui.mjs — fast static check for every frontend source file.
// Parses JSX, resolves relative imports, and verifies lucide icon names.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve, dirname, extname } from 'node:path';
import { parse } from '@babel/parser';
import * as lucide from 'lucide-react';

const ROOT = resolve(process.cwd(), 'src');
const EXTENSIONS = ['.jsx', '.js', '.tsx', '.ts', '.css', '.json'];

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const files = walk(ROOT).filter((file) => ['.jsx', '.js'].includes(extname(file)));
const errors = [];
const warnings = [];

function resolveImport(spec, fromFile) {
  if (!spec.startsWith('.')) return true;
  const base = resolve(dirname(fromFile), spec);
  if (existsSync(base) && statSync(base).isFile()) return true;
  for (const ext of EXTENSIONS) {
    if (existsSync(base + ext)) return true;
  }
  for (const ext of EXTENSIONS) {
    if (existsSync(join(base, 'index' + ext))) return true;
  }
  return false;
}

for (const file of files) {
  const source = readFileSync(file, 'utf8');
  let ast;
  try {
    ast = parse(source, {
      sourceType: 'module',
      plugins: ['jsx', 'importMeta', 'classProperties', 'optionalChaining', 'nullishCoalescingOperator'],
    });
  } catch (error) {
    errors.push(`${file}: ${error.message}`);
    continue;
  }

  for (const node of ast.program.body) {
    if (node.type !== 'ImportDeclaration') continue;
    const spec = node.source.value;
    if (!resolveImport(spec, file)) {
      errors.push(`${file}: cannot resolve import "${spec}"`);
    }
    if (spec === 'lucide-react') {
      for (const item of node.specifiers) {
        if (item.type !== 'ImportSpecifier') continue;
        const name = item.imported.name || item.imported.value;
        if (!(name in lucide)) {
          errors.push(`${file}: lucide-react has no export "${name}"`);
        }
      }
    }
  }

  // Catch common slop markers in JSX text or class names.
  if (/[\uFFFD]/.test(source)) {
    errors.push(`${file}: contains U+FFFD replacement characters (broken encoding)`);
  }
  if (/à¤|â€|Ã[\u0080-\u00BF]/.test(source)) {
    errors.push(`${file}: contains double-encoded UTF-8 (run scripts/fix-encoding.mjs)`);
  }
  if (/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/u.test(source)) {
    warnings.push(`${file}: emoji found`);
  }
  if (/\balert\s*\(/.test(source)) {
    warnings.push(`${file}: alert() found (use inline feedback)`);
  }
  if (/#[0-9a-fA-F]{6}\b/.test(source)) {
    warnings.push(`${file}: hardcoded hex colour found`);
  }
  if (/\b(rounded-3xl|rounded-\[2rem\])\b/.test(source)) {
    warnings.push(`${file}: legacy oversized radius (use rounded-card/rounded-panel)`);
  }
  if (source.includes('animate-pulse') && source.includes('rounded-full') && file.includes('pages')) {
    // Not a failure; decorative pulses are easy to overuse.
  }
}

console.log(`Checked ${files.length} files.`);
if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`);
  for (const warning of warnings) console.log('  ~ ' + warning);
}
if (errors.length) {
  console.error(`\n${errors.length} error(s):`);
  for (const error of errors) console.error('  x ' + error);
  process.exit(1);
}
console.log('No syntax or import errors.');
