import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { unzipSync, zipSync } from 'fflate';

export const slash = value => value.replaceAll('\\', '/');
export const hash = buffer => createHash('sha256').update(buffer).digest('hex');
export function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
}
export function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '')); }
export function walk(root) {
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (['.git', 'node_modules', 'work'].includes(entry.name) || entry.isSymbolicLink()) continue;
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}
export function safePath(name) {
  const normalized = slash(name);
  return !normalized.startsWith('/') && !/^[a-z]:/i.test(normalized) && !normalized.split('/').some(x => x === '..') && !normalized.includes('\0');
}
export function readAssets(input, limits = { files: 50000, bytes: 512 * 1024 * 1024, entry: 64 * 1024 * 1024 }) {
  const absolute = path.resolve(input), result = new Map();
  let total = 0;
  function add(name, bytes) {
    if (!safePath(name)) throw new Error(`Unsafe asset path: ${name}`);
    total += bytes.length;
    if (bytes.length > limits.entry || total > limits.bytes || result.size >= limits.files) throw new Error('Asset limits exceeded');
    if (result.has(slash(name))) throw new Error(`Duplicate archive path: ${name}`);
    result.set(slash(name), Buffer.from(bytes));
  }
  if (fs.statSync(absolute).isDirectory()) {
    for (const full of walk(absolute)) add(path.relative(absolute, full), fs.readFileSync(full));
  } else {
    // Check declared size before allocation. Never extract untrusted paths to disk.
    const seen=new Set();
    const entries = unzipSync(fs.readFileSync(absolute), { filter: entry => {
      if (!safePath(entry.name)) throw new Error(`Unsafe archive path: ${entry.name}`);
      const normalized=slash(entry.name);
      if(seen.has(normalized))throw new Error(`Duplicate archive path: ${entry.name}`);
      seen.add(normalized);
      if (entry.originalSize > limits.entry) throw new Error('Archive entry too large');
      total += entry.originalSize;
      if (total > limits.bytes) throw new Error('Archive too large');
      return !entry.name.endsWith('/');
    } });
    total = 0;
    for (const [name, bytes] of Object.entries(entries)) add(name, bytes);
  }
  return result;
}
export function packageDirectory(root, output) {
  const files = readAssets(root);
  if (!files.has('manifest.json')) throw new Error('Pack root must contain manifest.json');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, zipSync(Object.fromEntries(files), { level: 6 }));
  const reopened = readAssets(output);
  if (reopened.size !== files.size) throw new Error('Archive verification failed');
  return { output, files: reopened.size, sha256: hash(fs.readFileSync(output)) };
}
