import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, readdir, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { initializeLedger } from '../skills/evidence-audit/scripts/init-ledger.mjs';

async function fixture(t) {
  const base = await mkdtemp(join(tmpdir(), 'evidence-skill-test-'));
  t.after(() => rm(base, { recursive: true, force: true }));
  const repo = join(base, 'repository with spaces');
  await mkdir(join(repo, 'src'), { recursive: true });
  return { base, repo, args: ['--repo', repo, '--slug', 'src-auth', '--scope', 'src'] };
}

test('creates a ledger with concrete scope and does not alter source', async t => {
  const { repo, args } = await fixture(t);
  const source = join(repo, 'src', 'sentinel.txt');
  await writeFile(source, 'original\n');
  const result = await initializeLedger(args);
  assert.equal(result.created, true);
  assert.equal(result.nextFindingId, 'F1');
  assert.match(await readFile(result.ledger, 'utf8'), /`src`/);
  assert.equal(await readFile(source, 'utf8'), 'original\n');
  assert.deepEqual(await readdir(join(repo, '.temp_files')), ['ledger_src-auth.md']);
});

test('continuation leaves prior evidence intact and considers every scope', async t => {
  const { repo, args } = await fixture(t);
  const first = await initializeLedger(args);
  await writeFile(first.ledger, '## Round 2\n#### F7 — known defect\n');
  await writeFile(join(repo, '.temp_files', 'ledger_other.md'), '#### F12 — other scope\n');
  await writeFile(join(repo, '.temp_files', 'verify_F19_other.go'), 'retained proof');
  const result = await initializeLedger(args);
  assert.equal(result.created, false);
  assert.equal(result.nextFindingId, 'F20');
  assert.equal(await readFile(first.ledger, 'utf8'), '## Round 2\n#### F7 — known defect\n');
});

test('exclusive creation preserves the winner when two initializers contend', async t => {
  const { args } = await fixture(t);
  const results = await Promise.all([initializeLedger(args), initializeLedger(args)]);
  assert.equal(results.filter(result => result.created).length, 1);
  assert.match(await readFile(results[0].ledger, 'utf8'), /## Round 1/);
});

test('rejects traversal, nonexistent scopes, malformed slugs, and unknown options', async t => {
  const { repo } = await fixture(t);
  for (const args of [
    ['--repo', repo, '--slug', '../escape', '--scope', 'src'],
    ['--repo', repo, '--slug', 'safe', '--scope', '..'],
    ['--repo', repo, '--slug', 'safe', '--scope', 'missing'],
    ['--repo', repo, '--slug', 'safe', '--scope', 'src', '--force'],
  ]) await assert.rejects(initializeLedger(args));
  assert.deepEqual(await readdir(repo), ['src']);
});

test('rejects linked evidence directories, linked ledgers, and scope escape links', async t => {
  const { base, repo, args } = await fixture(t);
  const outside = join(base, 'outside');
  await mkdir(outside);
  const linkedScope = join(repo, 'linked-scope');
  await symlink(outside, linkedScope, process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(initializeLedger(['--repo', repo, '--slug', 'link', '--scope', 'linked-scope']), /escapes/);
  await symlink(outside, join(repo, '.temp_files'), process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(initializeLedger(args), /real directory/);
  await rm(join(repo, '.temp_files'));
  await mkdir(join(repo, '.temp_files'));
  // File symlinks may require a privilege unavailable on Windows. Directory links
  // still exercise rejection of a non-regular ledger without that privilege.
  await symlink(outside, join(repo, '.temp_files', 'ledger_src-auth.md'), process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(initializeLedger(args), /regular file/);
  assert.deepEqual(await readdir(outside), []);
});
