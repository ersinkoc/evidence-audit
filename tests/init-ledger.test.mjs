import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, readdir, symlink, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeLedger } from '../skills/evidence-audit/scripts/init-ledger.mjs';

const skillDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'skills', 'evidence-audit');
const dirLinkType = process.platform === 'win32' ? 'junction' : 'dir';

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

// F1: `npx skills add` installs through a symlink by default. The CLI entrypoint
// must still run when the script path contains a link, instead of exiting 0 silently.
test('CLI runs when the skill directory is reached through a link', async t => {
  const { base, repo } = await fixture(t);
  const installed = join(base, 'installed-skill');
  await symlink(skillDir, installed, dirLinkType);
  const script = join(installed, 'scripts', 'init-ledger.mjs');
  const help = spawnSync(process.execPath, [script, '--help'], { encoding: 'utf8' });
  assert.equal(help.status, 0, help.stderr);
  assert.match(help.stdout, /Usage:/);
  const run = spawnSync(process.execPath, [script, '--repo', repo, '--slug', 'src', '--scope', 'src'], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  assert.equal(JSON.parse(run.stdout).created, true);
});

// F2: scope paths are data; `$&`, `$'` and `$$` are legal in file names and must
// not be interpreted as String.prototype.replace patterns. (Backticks are rejected
// separately as Markdown delimiters.)
test('scope paths containing replacement patterns are written verbatim', async t => {
  const { repo } = await fixture(t);
  const scopes = ['a$&b', "c$'d", 'g$$h'];
  for (const scope of scopes) await mkdir(join(repo, scope));
  const args = ['--repo', repo, '--slug', 'dollar'];
  for (const scope of scopes) args.push('--scope', scope);
  const { ledger } = await initializeLedger(args);
  const expected = scopes.map(scope => `\`${scope}\``).join(', ');
  const body = await readFile(ledger, 'utf8');
  assert.equal(body.split('\n').find(line => line.startsWith('Scope:')), `Scope: ${expected}`);
  assert.equal(body.split('\n').filter(line => line.startsWith('# Evidence ledger')).length, 1);
});

// Contract: proofs may be directories (`prove_F<ID>_<slug>/`) for languages that
// need a package layout, so their IDs are taken too.
test('next ID accounts for proof and verifier directories', async t => {
  const { repo, args } = await fixture(t);
  await mkdir(join(repo, '.temp_files', 'prove_F31_go-package'), { recursive: true });
  await mkdir(join(repo, '.temp_files', 'verify_F8_x'));
  await mkdir(join(repo, '.temp_files', 'notes_F99_unrelated'));
  assert.equal((await initializeLedger(args)).nextFindingId, 'F32');
});

const git = (cwd, ...args) => spawnSync('git', ['-C', cwd, ...args], { encoding: 'utf8' });
const hasGit = git('.', '--version').status === 0;

test('reports whether .temp_files is ignored by Git', { skip: !hasGit && 'git unavailable' }, async t => {
  const { repo, args } = await fixture(t);
  if (git(repo, 'rev-parse', '--git-dir').status === 0) return t.skip('temp dir is inside a Git repository');
  assert.equal((await initializeLedger(args)).gitIgnored, null);
  assert.equal(git(repo, 'init', '-q').status, 0);
  // Isolate from the user's global excludes file, which may already ignore .temp_files/.
  assert.equal(git(repo, 'config', 'core.excludesFile', '').status, 0);
  assert.equal((await initializeLedger(args)).gitIgnored, false);
  await writeFile(join(repo, '.gitignore'), '.temp_files/\n');
  assert.equal((await initializeLedger(args)).gitIgnored, true);
});

// F3: the audited repository is untrusted; its Git config must not make the
// helper execute commands (core.fsmonitor runs when Git reads the index).
test('Git probe does not run repository-configured fsmonitor commands', { skip: !hasGit && 'git unavailable' }, async t => {
  const { base, repo, args } = await fixture(t);
  if (git(repo, 'rev-parse', '--git-dir').status === 0) return t.skip('temp dir is inside a Git repository');
  assert.equal(git(repo, 'init', '-q').status, 0);
  await writeFile(join(repo, 'src', 'tracked.txt'), 'x');
  assert.equal(git(repo, 'add', '.').status, 0);
  const marker = join(base, 'fsmonitor-ran');
  const hook = join(base, 'hook.cjs');
  await writeFile(hook, `require('fs').writeFileSync(${JSON.stringify(marker)}, 'ran')`);
  const slash = path => path.replaceAll('\\', '/');
  assert.equal(git(repo, 'config', 'core.fsmonitor', `"${slash(process.execPath)}" "${slash(hook)}"`).status, 0);
  await initializeLedger(args);
  await assert.rejects(readFile(marker), { code: 'ENOENT' });
});
