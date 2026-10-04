# Evidence ledger

Scope: {{SCOPE}}

## Setup evidence
- Repository instructions: <paths read>
- Baseline: <git status --short and saved pre-existing diff/content evidence>
- Invariants: <ownership, suspension points, observable state, trust boundaries>

## Round 1 — {{SCOPE}}
### Summary
<findings confirmed / dropped / promoted; residual risk in one sentence>

### Toolchain
<language/version, test runner cmd, build cmd, lint cmd, race/sanitizer if any — with the file each was read from>

### Findings
#### F<ID> — <type> — <severity> — <title>
- Location:
- Root cause:
- Proof (before): .temp_files/prove_F<ID>_<slug>.<ext> → <key lines>
- Patch: <files:lines changed>
- Proof (after): .temp_files/verify_F<ID>_<slug>.<ext> → <key lines>; original proof → PROBLEM NOT REPRODUCED
- Regression test: <path> | not promoted (<reason>)

### Not reproduced (dropped)
<one line each, or "none">

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
