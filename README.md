# api-lab

`api-lab` is a working lab repository for building and experimenting with API projects, developed together with Claude Code under a strict, documented workflow.

🇮🇹 Italian version: [docs/it/readme/README.md](docs/it/readme/README.md)

## Working rules

All the rules governing how Claude Code operates in this repository — branch model, task process, testing, file organization, documentation, GitHub usage — are defined in [CLAUDE.md](CLAUDE.md) (also available as [AGENTS.md](AGENTS.md), a symlink to the same file). Read it before starting any task.

A summary:

- **Branches**: `main` is frozen and protected — no direct work, merges only done manually by the user. All work happens on the standing `release/1` branch; PRs go from `release/1` to `main` and are merged manually.
- **Task process**: every new task, including small fixes, follows a fixed flow — `/grill-with-docs` for requirement gathering, an optional `/prototype` → `/handoff` loop for anything that needs hands-on verification, `/to-spec`/`/to-tickets` for multi-session work (kept in memory, not published as GitHub issues), implementation with `/implement`, and `/tdd` for red-green-refactor. See [CLAUDE.md](CLAUDE.md) §2 for the full flow.
- **Tests**: [Vitest](https://vitest.dev), one `.test.ts` file per source file with logic, run via `npm run test` / `npm run test:watch`.
- **File organization**: one folder per module (`Module.ts`, `Module.test.ts`, `index.ts`), one responsibility per file.
- **Issue tracking**: specs and sub-tasks are tracked in memory (this session's memory system), not as GitHub issues.

## Documentation

```
docs/
  it/
    agents/     — Italian mirror of CLAUDE.md, for human readers
    changelog/  — Italian changelog entries, one file per push
    readme/     — Italian README
  en/
    changelog/  — English changelog entries, one file per push
```

- Product documentation (how the app works, guides) lives under `docs/it/` and `docs/en/`, one dedicated folder per topic, always in both languages.
- Every push adds a changelog entry in both languages before code is pushed — see [CLAUDE.md](CLAUDE.md) §5 for the naming scheme and template.

## Getting started

This repository currently holds its working rules and documentation scaffold; application code and its own setup instructions will be added here as the project grows.
