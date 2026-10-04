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
