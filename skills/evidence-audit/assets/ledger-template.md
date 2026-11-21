# Evidence ledger

Scope: {{SCOPE}}

## Setup evidence
- Repository instructions: <paths read>
- Baseline: <git status --short and saved pre-existing diff/content evidence>
- Evidence directory: <.temp_files/ ignored by Git: yes | no (user told) | not a Git repository>
- Invariants: <ownership, suspension points, observable state, trust boundaries>

## Round 1 — {{SCOPE}}
### Summary
<findings confirmed / dropped / promoted; residual risk in one sentence>

### Toolchain
<language/version, test runner cmd, build cmd, lint cmd, race/sanitizer if any — with the file each was read from; platform the proofs ran on>

### Findings
#### F<ID> — <type> — <severity> — <title>
- Location: <file:line, symbol>
- Contract: <doc/type/spec/test/caller that defines EXPECTED, with file:line or URL>
- Reachability: <public entry point or caller path that delivers the trigger>
- Root cause:
- Proof (before, 2 runs): .temp_files/prove_F<ID>_<slug>.<ext> → <cmd>; exit <n>; CONTROL OK; EXPECTED/ACTUAL <key lines>; PROBLEM CONFIRMED
- Red regression run: <test path + cmd → failing result before patch> | not required (<severity/type>)
- Patch: <files:lines changed>
- Proof (after): .temp_files/verify_F<ID>_<slug>.<ext> → FIX VERIFIED ×3; original proof → PROBLEM NOT REPRODUCED
- Regression test: <path → passing result> | not promoted (<reason>)
- Temporary in-scope proof files: <paths> | none

### Not reproduced (dropped)
<one line each, including invalid proofs and why, or "none">

### Validation
- Focused tests: <cmd> → <result>
- Scope tests: <cmd> → <result>
- Build/typecheck: <cmd> → <result>
- Format/lint (scoped): <cmd> → <result>
- git diff --check: <result>
- NOT RUN: <full suite / live / security / other> — <reason>

### Boundaries
<environment contamination observed, security lines stopped, shared-branch notes>

### Working tree
<git status --short; confirmation that pre-existing changes are untouched>

### Next scope (if rounds continue)
<one line + reason>
