#!/usr/bin/env node
import { readFile, readdir, realpath, lstat, mkdir, writeFile } from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve, relative, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const help = `Create a new audit ledger or leave an existing ledger untouched.
Usage: node init-ledger.mjs --repo <root> --slug <scope-slug> --scope <path> [--scope <path> ...]
Scope paths are relative to the repository root. Node.js 18+; no dependencies.
Prints JSON: ledger path, created, nextFindingId (advisory; counts prove_/verify_
files and directories and IDs in ledgers), gitIgnored (true/false; null without Git).
Does not analyze source, run tests, patch code, or reserve finding IDs.`;

function parse(args) {
  const result = { scopes: [] };
  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    if (!['--repo', '--slug', '--scope'].includes(key)) throw new Error(`Unknown argument: ${key}`);
    const value = args[++i];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${key}`);
    if (key === '--scope') result.scopes.push(value);
    else {
      const name = key.slice(2);
      if (result[name] !== undefined) throw new Error(`Repeated argument: ${key}`);
      result[name] = value;
    }
  }
  if (!result.repo || !result.slug || !result.scopes.length) throw new Error(help);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(result.slug) || result.slug.length > 80) {
    throw new Error('Slug must be 1-80 lowercase letters, digits, and single hyphens.');
  }
  return result;
}

function isInside(root, target) {
  const rel = relative(root, target);
  return rel === '' || (rel !== '..' && !rel.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`) && !isAbsolute(rel));
}

async function inspect(path) {
  try { return await lstat(path); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

async function nextId(directory) {
  let highest = 0;
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    // Evidence may be a file or, for package-based languages, a directory.
    const proof = /^(?:prove|verify)_F(\d+)_/.exec(entry.name);
    if (proof) highest = Math.max(highest, Number(proof[1]));
    if (entry.isFile() && /^ledger_.+\.md$/.test(entry.name)) {
      const body = await readFile(join(directory, entry.name), 'utf8');
      for (const match of body.matchAll(/\bF(\d+)(?=\b|_)/g)) highest = Math.max(highest, Number(match[1]));
    }
  }
  if (!Number.isSafeInteger(highest) || highest >= Number.MAX_SAFE_INTEGER) throw new Error('Finding ID exceeds safe integer range.');
  return highest + 1;
}

// true/false from `git check-ignore`; null when Git is missing or root is not a work tree.
// The audited repository is untrusted: core.fsmonitor in its config would run a
// command when Git reads the index, so it is overridden for this call.
function gitIgnored(root) {
  const result = spawnSync('git', ['-c', 'core.fsmonitor=false', '-C', root, 'check-ignore', '-q', '.temp_files/'], { stdio: 'ignore' });
  if (result.error) return null;
  return result.status === 0 ? true : result.status === 1 ? false : null;
}

export async function initializeLedger(args) {
  const options = parse(args);
  const root = await realpath(resolve(options.repo));
  if (!(await lstat(root)).isDirectory()) throw new Error('Repository root must be a directory.');
  for (const scope of options.scopes) {
    if (isAbsolute(scope) || /[\r\n`]/.test(scope)) throw new Error('Scope must be a single relative path without Markdown delimiters.');
    const resolved = await realpath(resolve(root, scope));
    if (!isInside(root, resolved)) throw new Error(`Scope escapes repository: ${scope}`);
  }
  const directory = join(root, '.temp_files');
  const existing = await inspect(directory);
  if (existing && (!existing.isDirectory() || existing.isSymbolicLink())) throw new Error('.temp_files must be a real directory, not a link.');
  await mkdir(directory, { recursive: true });
  const ledger = join(directory, `ledger_${options.slug}.md`);
  const file = await inspect(ledger);
  if (file && (!file.isFile() || file.isSymbolicLink())) throw new Error('Ledger must be a regular file, not a link.');
  let created = false;
  if (!file) {
    const template = await readFile(new URL('../assets/ledger-template.md', import.meta.url), 'utf8');
    const scopeList = options.scopes.map(scope => `\`${scope}\``).join(', ');
    const content = template.replaceAll('{{SCOPE}}', () => scopeList);
    try {
      await writeFile(ledger, content, { encoding: 'utf8', flag: 'wx' });
      created = true;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      const raced = await lstat(ledger);
      if (!raced.isFile() || raced.isSymbolicLink()) throw new Error('Concurrent ledger creation produced a non-regular file.');
    }
  }
  return { ledger, created, nextFindingId: `F${await nextId(directory)}`, gitIgnored: gitIgnored(root), note:'ID is advisory, not reserved. Recheck before creating evidence. Fill setup and command outputs from actual runs.' };
}

// Node resolves links for the main module's import.meta.url but not for argv[1],
// so compare real paths; skill installers commonly link the skill directory.
function isMain() {
  if (!process.argv[1]) return false;
  try { return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)); }
  catch { return false; }
}

if (isMain()) {
  if (process.argv.slice(2).includes('--help')) console.log(help);
  else {
    try { console.log(JSON.stringify(await initializeLedger(process.argv.slice(2)), null, 2)); }
    catch (error) { console.error(`ERROR: ${error.message}`); process.exitCode = 1; }
  }
}
