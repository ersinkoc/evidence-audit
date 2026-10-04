import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { dirname, resolve, join, relative, isAbsolute, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

// Repository-specific checks, not a general YAML parser or audit certificate.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const skill = join(root, 'skills', 'evidence-audit');
const body = await readFile(join(skill, 'SKILL.md'), 'utf8');
assert.ok(!body.startsWith('\uFEFF'), 'SKILL.md must not have a BOM');
const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(body)?.[1];
assert.ok(frontmatter, 'Missing YAML frontmatter');
const name = /^name: (.+)$/m.exec(frontmatter)?.[1];
const description = /^description: (.+)$/m.exec(frontmatter)?.[1];
assert.equal(name, 'evidence-audit');
assert.ok(description && description.length <= 1024, 'Description must be 1-1024 characters');
assert.ok(body.split('\n').length < 500, 'Keep entrypoint under 500 lines');
assert.ok(!/[A-Z]:[\\/]|\/Users\//.test(body), 'Skill must not contain machine-specific paths');
for (const link of body.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
  if (/^https?:/.test(link[1])) continue;
  const target = resolve(skill, link[1].split('#')[0]);
  const rel = relative(skill, target);
  assert.ok(rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel), 'Bundled references must resolve in skill');
  await access(target);
}
const metadata = await readFile(join(skill, 'agents', 'openai.yaml'), 'utf8');
const short = /^  short_description: "([^"]+)"$/m.exec(metadata)?.[1];
assert.ok(short && short.length >= 25 && short.length <= 64, 'UI description must be 25-64 characters');
assert.match(metadata, /^  default_prompt: ".*\$evidence-audit.*"$/m);
assert.match(metadata, /^  allow_implicit_invocation: true$/m);
const helper = spawnSync(process.execPath, [join(skill, 'scripts', 'init-ledger.mjs'), '--help'], { encoding: 'utf8' });
assert.equal(helper.status, 0, helper.stderr);
assert.match(helper.stdout, /Usage:/);
console.log('PASS: portable frontmatter, bundled references, Codex metadata, and ledger helper entrypoint.');
console.log('Boundary: package validation does not certify agent decisions or an audited codebase.');
