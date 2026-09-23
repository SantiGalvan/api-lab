# CLAUDE.md — Working rules for api-lab

These rules govern how Claude Code must work in this repository. They are not suggestions: they must be followed in every session, for every task, with no exceptions except an explicit, specific instruction from the user overriding them for that single case.

## 1. Branches

- **`main`**: permanently protected and frozen. It never receives merges, not even manually by the user, not ever. Never work here, never open a PR toward it.
- **`release/1`**: the de facto default branch, and the standing working branch. All work happens directly here — no per-task `feature/`/`epic/` branches, no PRs toward `main`. Atomic commits go straight onto `release/1`.

## 2. Process for every new task

Before writing code, for **every** new implementation — including small fixes — follow this flow, step by step. No step is skipped silently: if not applicable, state so explicitly and move to the next.

**Step 1 — `/grill-with-docs`**
Thorough interview on the idea (calls `grilling` + `domain-modeling`), updating `CONTEXT.md` and the ADRs in `docs/adr/` as domain decisions/terms emerge. Don't proceed to step 2 until the frontier is empty and the user has confirmed shared understanding.

**Step 2 — Can everything be resolved in conversation?**
- **Yes** → step 3.
- **No** (need to verify a state/behavior idea in practice before it can be discussed) → `/prototype` (throwaway session) → `/handoff` (report the result back) → return to step 1 with that result as new input.

**Step 3 — Is this a multi-session task?** (more than one issue, more than one component involved, estimate over 2 hours):
- **Yes** → `/to-spec` (keeps the spec in memory, not published as a GitHub issue) → `/to-tickets` (splits it into independent, vertically-sliced sub-tasks, also kept in memory, not as GitHub issues). Then: **a new session for each sub-task**, with `/implement` given the main spec + the single sub-task — all still committed directly onto `release/1`.
- **No** → `/implement` in the same context window, directly onto `release/1`.

**Step 4 — Git flow** (see point 1): work directly on `release/1` → atomic commits → push to `release/1`. No PR toward `main` is ever opened — `main` is permanently frozen and out of scope for this workflow.

**Step 4.5 — Changelog** (see point 6) — **mandatory before every push**:
1. Create `docs/it/changelog/AAAA-MM-GG-X.Y.Z-nome-branch.md` and `docs/en/changelog/YYYY-MM-DD-X.Y.Z-branch-name.md` using the template in point 6.
2. Update the indexes `docs/it/changelog/CHANGELOG.md` and `docs/en/changelog/CHANGELOG.md` with a link + one-line summary under the current version's heading.

Don't push before completing this step.

**Step 5 — `/tdd`**
Every implementation follows red-green-refactor (see also point 3). Don't consider a sub-task done without a corresponding passing test.

**Step 3.5 (browser verification)**: not applicable for now — no browser-verification skill/MCP is connected to this repo/session. If one gets connected in the future, add it here as a conditional step between 3 and 4.

## 3. Tests

- Every file with logic (functions, modules, utilities) has its own test file alongside it, same name with a `.test.ts` suffix.
- Framework: **Vitest**.
- Commands: `npm run test` (single run, also used in CI) and `npm run test:watch` (local development).
- Implementation order (red-green-refactor) enforced by the process in point 2, step 5 (`/tdd`): no sub-task is closed without a corresponding passing test.

## 4. File organization

- **One folder per element**: every module with a single responsibility has its own folder, containing the file, its test, and an `index.ts` re-export.

  ```
  Parser/
    Parser.ts
    Parser.test.ts
    index.ts
  ```

- **One file = one responsibility**: a file contains a single "large" function or module. Files with multiple independent functions/modules must be split into separate files, each in its own folder.
- **Custom styling/config**, if ever needed, is centralized under `src/styles/` (or the equivalent config folder), not scattered per-file.

## 5. Documentation (`docs/`)

Structure at the root:

```
docs/
  it/
    changelog/
  en/
    changelog/
```

- **Product documentation** (how the app works, guides): goes inside `docs/it/` and `docs/en/`. Every documentation file has its own dedicated folder (same principle as modules in point 4), always in both languages.
- **Changelog per implementation**: inside `docs/it/changelog/` and `docs/en/changelog/`, **flat structure** (no subfolders per file). One file per push (not just at the end of a task, see point 2 step 4.5), in both languages, named:

  ```
  YYYY-MM-DD-X.Y.Z-branch-name.md
  ```

  (version right after the date, then the branch name — not the reverse order used in the past)

  Example: pushed on September 7, 2026 with version `0.3.0`, on `release/1` →
  `docs/it/changelog/2026-09-07-0.3.0-release-1.md`
  `docs/en/changelog/2026-09-07-0.3.0-release-1.md`

  **Template for each entry** (in English for `docs/en/changelog/`, translated to Italian for `docs/it/changelog/`):

  ```markdown
  # <Descriptive title of the change>

  ## Context
  Why this work was done — bug report, user request, or a decision made in a grilling session.

  ## Tracking
  Reference to the in-memory spec/sub-task this work implements (see point 7 — issues are tracked in memory, not on GitHub).

  ## Branch & Version
  - **Branch:** `release/1`
  - **Version:** `X.Y.Z`

  ## Files changed
  | File | Change |
  |------|--------|
  | `path/to/file.ext` | One-line description of what changed in this file |

  ## Technical changes
  Key snippet of the final code with a comment explaining why, not what.

  ## Rationale
  The reasoning behind the chosen solution — why this approach and not another.
  ```

  **Index**: after creating the entry, add a line to `docs/it/changelog/CHANGELOG.md` and `docs/en/changelog/CHANGELOG.md`, under the current version's heading:

  ```markdown
  - [release-1](2026-09-07-0.3.0-release-1.md) — one-line description
  ```

## 6. README

- Only `README.md` stays at the repo **root**, in English (the repo's "native" default, GitHub standard).
- The Italian README lives at `docs/it/readme/README.md`.
- The two files are **always linked to each other**: each points to the other-language version.

## 7. GitHub

- The `gh` CLI is authenticated (account `SantiGalvan`) and used for this repo, `SantiGalvan/api-lab`.
- **Issues are not created on GitHub.** Specs and sub-tasks produced by `/to-spec` and `/to-tickets` are kept in memory (this session's memory system) instead of `gh issue create` — nothing gets published as a GitHub issue.
- **Commit authorship**: this environment has no local or global git identity configured, so commits silently fall back to the OS user/hostname (e.g. `root@<hostname>`) instead of the user. Claude Code must never fix this by running `git config` (never allowed, no exception) — instead, every commit it creates must explicitly set both author and committer for that single invocation, e.g.:

  ```
  GIT_AUTHOR_NAME="Santi Galvan" GIT_AUTHOR_EMAIL="santiagogalvancolorado@gmail.com" \
  GIT_COMMITTER_NAME="Santi Galvan" GIT_COMMITTER_EMAIL="santiagogalvancolorado@gmail.com" \
  git commit -m "..."
  ```

  This keeps commits correctly attributed without ever touching `.git/config` or `~/.gitconfig`.

## 8. Language & agent instruction files

- `CLAUDE.md` (this file, repo root) is the canonical source, in English — read directly by Claude Code and any other agent that honors this convention.
- `AGENTS.md` (repo root) is a **symlink** to `CLAUDE.md`: same content, no separate maintenance, exists so tools that specifically look for `AGENTS.md` pick up the same rules automatically.
- `docs/it/agents/AGENTS.md` is a manually-maintained **Italian translation** of this file, for human readers. **Every time `CLAUDE.md` is edited, `docs/it/agents/AGENTS.md` must be updated to match** — there is no symlink or automation for this one, since the content differs by language.

## Agent skills

### Issue tracking

Specs and sub-tasks from `/to-spec`/`/to-tickets` are tracked **in memory**, not as GitHub Issues (see point 7). See `docs/agents/issue-tracker.md`.

### Triage labels

Conceptual status tags used on in-memory tracked items (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`. These are the functional path — English, fixed location, read directly by `domain-modeling`/`grill-with-docs` — and must not move. `docs/it/domain/` (`CONTEXT.md` + `adr/`) mirrors them in Italian for human readers only; update it manually every time `CONTEXT.md` or `docs/adr/` change, including for every new ADR.

### Note on language

The files under `docs/agents/` are the **functional** path: the skills (`to-spec`, `to-tickets`, `triage`, `domain-modeling`, etc.) read and write exactly there, in English, and this path must not be moved or renamed. `docs/it/agents/` is an Italian mirror of the same content, for human reading only — keep it aligned manually when `docs/agents/` changes, but it is not consulted by the skills.
