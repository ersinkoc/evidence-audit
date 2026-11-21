# Package validation — 2026-10-04

Validated on Windows with Node.js v24.13.0, npm 11.11.0, and Skills CLI 1.7.0.

| Check | Result |
| --- | --- |
| `npm run check` | Package structure passed; 5 helper tests passed, 0 failed, 0 skipped |
| Codex `skill-creator/scripts/quick_validate.py skills/evidence-audit` | `Skill is valid!` |
| `npx skills@1.7.0 add . --list` | Discovered one skill: `evidence-audit` |
| In an isolated project: `npx skills@1.7.0 add D:/Codebox/Skill-Evidence-Audit --skill evidence-audit --agent claude-code codex --copy --yes` | Installation exited with code 0 |
| Installed Claude Code and Codex files | All four bundled files matched the source byte for byte |
| Installed helper with a new and existing ledger | First call: `created: true`; second call: `created: false`; both suggested `F1` |
| Contents of `dist/evidence-audit.zip` | Exactly four skill files, matching the source byte for byte |

The helper tests cover preservation of existing source files and ledgers, ID continuation across scopes, concurrent exclusive creation, invalid paths, and links that escape the repository. The package requires no npm dependency installation.

During initial validation, the local Codex validator rejected the Agent Skills standard's `compatibility` frontmatter field. Environment requirements were moved into the body; final validation passed.

The initial test installation used only `.temp_files/install-check/`. No installation was made into the user's global skill directories. Audit behavior was not evaluated in actual Claude/Codex model sessions, and other operating systems were not tested. Successful package installation does not certify model decisions or prove that an audited codebase is free of defects.

During initial package preparation, this directory was not a Git repository, so `git diff --check` was not run. This section records the initial local validation; publication checks are recorded below.

## GitHub publication validation — 2026-10-04

- Repository: [ersinkoc/evidence-audit](https://github.com/ersinkoc/evidence-audit); the GitHub API confirmed `PUBLIC` visibility and `main` as the default branch.
- Before publication, `npm run check` passed package validation and all 5 tests.
- `git diff --cached --check` and `git diff --check` exited with code 0.
- In `.temp_files/github-install-check/`, `npx skills@1.7.0 add ersinkoc/evidence-audit --skill evidence-audit --agent claude-code codex --copy --yes` cloned the GitHub repository, discovered one skill, and completed installation for both agents; exit code 0.
- All four skill files in both GitHub installation copies matched the source byte for byte.
- README installation commands were updated to the actual repository name. No global user installation was performed.

## Audit and portability update — 2026-11-21

Validated on Windows 11 with Node.js v26.13.0 and Git Bash. The skill's own procedure was applied to the bundled helper. Evidence is in `.temp_files/` (not committed).

- **F1 (Medium):** `init-ledger.mjs` printed nothing and exited 0 when run through a symlinked or junctioned skill directory. This is the Skills CLI's default install mode.
  - Cause: the main-module guard compared the link path in `argv[1]` with the resolved `import.meta.url`.
  - Proof: a control passed and `PROBLEM CONFIRMED` appeared twice. The regression test failed on the old helper.
  - Fix: the guard now compares real paths.
  - Verification: `FIX VERIFIED` three times, covering link, link-to-link, relative link, error exit, and library import.
- **F2 (Low):** scope paths containing `$&`, `$'` or `$$` were treated as replacement patterns, which corrupted the ledger's `Scope:` line.
  - Proof: as for F1.
  - Fix: a replacer function.
  - Verification: `FIX VERIFIED` three times.
- **Contract extension:** the helper now counts `prove_`/`verify_` directories when suggesting the next ID and reports `gitIgnored`. Both were written test-first.
- `npm test`: 9 passed, 0 failed, 0 skipped, in three consecutive runs. `npm run validate`: PASS.
  - The new host-neutrality check and inline-layout drift check were exercised against a deliberately renamed template heading. The check caught it, and the file was restored byte for byte.
- Tool support in the README was checked against each tool's documentation and the Skills CLI agent list on 2026-11-21. Items that could not be verified from primary sources are marked there.
- **NOT RUN:**
  - `npx skills add . --list`: network download not approved in this session.
  - macOS/Linux.
  - Agent behavior in real sessions of the listed tools.
- **F3 (Medium, found by automated security review, then proven):** the `gitIgnored` probe ran a command set as `core.fsmonitor` in the audited repository's Git config.
  - Proof: `PROBLEM CONFIRMED` twice; the regression test was red first.
  - Fix: `git -c core.fsmonitor=false`. `npm run check`: 10 passed, 0 failed, three runs.
  - A second report (planted `git.exe` in the current directory on Windows) did not reproduce with a validated harness and was dropped.
