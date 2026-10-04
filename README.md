# Evidence Audit

An evidence-led bug hunting and fixing skill for concrete codebase scopes in any language. Each finding requires a runnable proof against the current code, a narrow fix, three consecutive deterministic verification runs, and a permanent regression test when required.

The package follows the [Agent Skills standard](https://agentskills.io/specification). Claude Code, Codex, and other agents supported by the `skills` CLI can install the same `skills/evidence-audit/` directory. Skill discovery and command execution vary by application; an environment with only chat access cannot run an audit.

## Installation

Install with [skills.sh / Vercel Skills CLI](https://github.com/vercel-labs/skills): `npx skills add`.

List the skill available in this repository:

```sh
npx skills add ersinkoc/evidence-audit --list
```

Install from your code project's root directory:

```sh
npx skills add ersinkoc/evidence-audit --skill evidence-audit --agent claude-code codex --copy
```

Install globally to use it across projects:

```sh
npx skills add ersinkoc/evidence-audit --skill evidence-audit --agent claude-code codex --global --copy
```

To select all supported agents:

```sh
npx skills add ersinkoc/evidence-audit --skill evidence-audit --agent '*'
```

Add `--global` to the same command for a global installation across all agents. Review the installation targets; an existing skill with the same name may be updated. On Windows, use `npx.cmd` if PowerShell blocks `npx.ps1`. The `--copy` option avoids the need for symbolic links.

To install from a local development copy, pass its directory as the source:

```sh
npx skills add ./evidence-audit --skill evidence-audit --agent claude-code codex --copy
```

No separate npm package publication is required. `npx` runs the installer, which retrieves skill files from a local directory or Git repository.

## Usage

Codex:

```text
$evidence-audit src/auth
```

Claude Code:

```text
/evidence-audit src/auth
```

For other agents, use the application's skill invocation mechanism or a natural-language request:

```text
Use evidence-audit to find and prove real bugs in src/auth. Preserve existing edits.
```

If the scope is unclear, the skill first lists candidate scopes. Each round retains `.temp_files/ledger_<scope-slug>.md`, `prove_F<ID>_*`, and `verify_F<ID>_*` evidence files. A round with no confirmed defects is valid. Static suspicions, compilation errors, and failed control cases do not count as confirmed findings.

## Package contents

```text
skills/evidence-audit/
  SKILL.md                       Shared audit instructions
  agents/openai.yaml             Codex interface and implicit invocation policy
  assets/ledger-template.md      Ledger and report template
  scripts/init-ledger.mjs        Optional ledger initializer with no dependencies
```

`agents/openai.yaml` is specific to Codex. The shared audit instructions contain no Claude-specific tool names, variables, or injections that automatically execute shell commands. Implicit invocation is enabled for Codex; Claude Code uses its default skill discovery behavior. Application and user permissions always apply.

The optional ledger helper requires an existing Node.js 18+ installation. There is no need to install Node or a test framework in the audited project. Use the full path to the script in the installed skill directory:

```sh
node "<installed-skill-dir>/scripts/init-ledger.mjs" --repo "<repo-root>" --slug src-auth --scope src/auth --scope tests/auth
```

The helper preserves existing ledgers and leaves source files and Git state unchanged. It checks scope paths, creates a template, and suggests the next available ID from all ledger contents and proof filenames. IDs are advisory and are not reserved; concurrent audits must coordinate before writing new evidence. The agent fills in the toolchain, Git baseline, and command outputs from actual runs.

For manual installation, copy the entire `skills/evidence-audit/` directory into the application's skill directory, including its bundled resources. Applications that accept archives can use a ZIP of this directory through their own import workflow. As a fallback, ask the agent to read `SKILL.md` directly; this does not add automatic discovery or test execution capabilities.

## Development checks

There are no external npm dependencies; `npm install` is unnecessary.

```sh
npm run check
npx skills add . --list
```

`npm run check` validates the package structure and tests the helper's file behavior: preserving existing ledgers, continuing finding IDs, concurrent creation of the same file, and scope and link boundaries. These checks do not certify model decisions or prove that an audited project is free of defects.

## References

- [Agent Skills specification](https://agentskills.io/specification)
- [Skills CLI source and installation options](https://github.com/vercel-labs/skills)
- [Claude Code skills](https://code.claude.com/docs/en/skills)
- [OpenAI skill creation documentation](https://learn.chatgpt.com/docs/build-skills)
