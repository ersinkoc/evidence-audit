# Evidence Audit

An evidence-led bug hunting and fixing skill for concrete codebase scopes in any language. A defect counts only when a runnable proof reproduces it on current code against a cited contract (with a passing control case), and is called fixed only when a narrow patch makes a second proof pass three runs in a row. High-risk findings get a permanent regression test that was seen failing before the patch.

The package follows the [Agent Skills standard](https://agentskills.io/specification): one `skills/evidence-audit/` directory (`SKILL.md` plus bundled template and optional helper) that any skills-capable coding agent can load. Command execution is required to confirm anything; a chat-only environment can only list unconfirmed candidates.

## What a round does

1. **Setup** — reads repo instructions, saves the `git status` baseline, checks `.temp_files/` is Git-ignored, detects the toolchain from the repo (installs nothing), confirms a concrete scope or asks for one.
2. **Prove** — for each candidate: cite the contract that defines the expected behavior and the caller path that reaches it, then write `.temp_files/prove_F<ID>_*` in the project's own language. It must print `CONTROL OK` then `PROBLEM CONFIRMED` and exit non-zero, twice. Compile errors, failed controls, and unexplained exits are invalid proofs, never findings.
3. **Red regression test** — for High/Critical, race, and ownership findings, the permanent test is written and seen failing *before* the patch.
4. **Patch** — smallest in-scope change traceable line-for-line to a finding ID; no API/format changes, refactors, or new dependencies.
5. **Verify** — `.temp_files/verify_F<ID>_*` with edge cases prints `FIX VERIFIED` three runs in a row; the original proof now prints `PROBLEM NOT REPRODUCED`; race fixes use gated ordering, not sleeps.
6. **Validate and report** — focused tests, scope tests, build/typecheck, scoped lint, `git diff --check`, each with exact command and result or an explicit `NOT RUN`. No commit, reset, or cleanup without permission.

A round with no confirmed defects is a valid result.

## Installation

Install with the [Skills CLI](https://github.com/vercel-labs/skills) (`npx skills add`). From your code project's root:

```sh
npx skills add ersinkoc/evidence-audit --skill evidence-audit --agent claude-code codex cursor github-copilot
```

Add `--global` (`-g`) for all projects, `--agent '*'` for every supported agent, `--copy` to copy instead of symlinking, and `--yes` to skip prompts. List what the repository provides with `npx skills add ersinkoc/evidence-audit --list`. On Windows, use `npx.cmd` if PowerShell blocks `npx.ps1`. To install from a local checkout, pass its path as the source (`npx skills add ./evidence-audit ...`).

The CLI installs into a shared `.agents/skills/` directory and symlinks agent-specific directories to it by default; the bundled helper works through those links.

## Tool support

Checked against each tool's documentation on 2026-11-21. Paths and invocation syntax change between releases; your tool's docs are authoritative.

| Tool | Skills CLI `--agent` | Explicit invocation |
| --- | --- | --- |
| Claude Code | `claude-code` | `/evidence-audit src/auth` |
| OpenAI Codex | `codex` | `$evidence-audit src/auth` |
| Cursor | `cursor` | `/evidence-audit src/auth` |
| GitHub Copilot (VS Code, CLI, cloud agent) | `github-copilot` | `/evidence-audit src/auth` |
| Gemini CLI | `gemini-cli` | ask for it by name; the model activates the skill after confirmation |
| Antigravity / Antigravity CLI | `antigravity`, `antigravity-cli` | ask for it by name (invocation syntax not verified) |
| Windsurf / Devin Local | `windsurf` | `/evidence-audit src/auth` |
| Cline | `cline` | `/evidence-audit src/auth` |
| Roo Code | `roo` | ask for it by name (matched by description) |
| Kilo Code | `kilo` | `/` menu → Skills |
| OpenCode | `opencode` | `@evidence-audit` |
| Amp | `amp` | ask for it by name (model-selected) |
| Goose | `goose` | `/skills evidence-audit` |
| Kiro | `kiro-cli` | `/evidence-audit src/auth` |
| Zed agent | `zed` | `/evidence-audit` or `@evidence-audit` |
| JetBrains Junie | `junie` | `/evidence-audit` or `$evidence-audit` |
| Augment (Auggie) | `augment` | `/skill:evidence-audit src/auth` |
| Trae | `trae` | ask for it by name |
| Qwen Code | `qwen-code` | `/evidence-audit src/auth` |

Most tools also activate the skill from an ordinary request that matches its description (some ask for confirmation first, and some only select skills on their own):

```text
Use evidence-audit to find and prove real bugs in src/auth. Preserve existing edits.
```

Not verified from primary sources: whether Codex, Gemini CLI, Roo, OpenCode, Amp, Goose, Kiro, Zed, Augment, Trae, Qwen Code, and VS Code run bundled scripts without extra prompts (the helper is optional either way), and explicit invocation syntax for Amp and Roo.

### Tools without native skill support

- **Aider** — load the instructions as read-only context: `aider --read <skill-dir>/SKILL.md --read <skill-dir>/assets/ledger-template.md`, or list both under `read:` in `.aider.conf.yml`. Then ask for an audit of a path. Aider runs commands only with your approval.
- **Continue** — its CLI source loads `.continue/skills/` but its user docs do not document skills. Copy the directory there, or create `.continue/prompts/evidence-audit.md` with `name`, `description`, and `invokable: true` frontmatter followed by the `SKILL.md` body.
- **Anything else** — copy `skills/evidence-audit/` into the tool's skill or rules directory, or ask the agent to read `SKILL.md`. When the bundled template is unavailable, `SKILL.md` contains an inline report layout, and the helper is optional.

## Ledger helper (optional)

Requires an existing Node.js 18+; the audited project needs no Node, npm packages, or test framework. Use the full path to the installed skill directory:

```sh
node "<skill-dir>/scripts/init-ledger.mjs" --repo "<repo-root>" --slug src-auth --scope src/auth --scope tests/auth
```

It prints JSON with the ledger path, whether it was `created`, an advisory `nextFindingId` (computed from all ledgers and from `prove_`/`verify_` files and directories), and `gitIgnored` (`true`/`false`, `null` without Git). It never overwrites a ledger, rejects scopes that escape the repository or links in the evidence path, and leaves source files and Git state unchanged. IDs are not reserved; concurrent audits must coordinate.

## Package contents

```text
skills/evidence-audit/
  SKILL.md                       Shared, host-neutral audit instructions
  agents/openai.yaml             Codex display metadata and implicit invocation policy
  assets/ledger-template.md      Ledger and report template
  scripts/init-ledger.mjs        Optional ledger initializer, no dependencies
```

`SKILL.md` contains no host-specific variables, tool allowlists, or command-injection syntax; `npm run validate` enforces this. `agents/openai.yaml` is read only by Codex. Application and user permissions always apply.

## Development checks

There are no npm dependencies.

```sh
npm run check
npx skills add . --list
```

`npm run check` validates the package (frontmatter, bundled links, host neutrality, inline report layout matching the template, Codex metadata, helper entrypoint) and runs the helper tests: ledger preservation, ID continuation across files, directories, and scopes, concurrent creation, scope and link boundaries, running through a symlinked install, verbatim scope paths, and Git-ignore detection. These checks do not certify model decisions or prove that an audited project is free of defects.

## References

- [Agent Skills specification](https://agentskills.io/specification)
- [Skills CLI source and supported agents](https://github.com/vercel-labs/skills)
- [Claude Code skills](https://code.claude.com/docs/en/skills)
- [OpenAI Codex skills](https://learn.chatgpt.com/docs/build-skills)
- [Cursor skills](https://cursor.com/docs/context/skills)
- [Gemini CLI skills](https://geminicli.com/docs/cli/skills)
- [Aider conventions / read-only files](https://aider.chat/docs/usage/conventions.html)
