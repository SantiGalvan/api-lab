# api-lab

`api-lab` is a working lab repository for building and experimenting with API projects, developed together with Claude Code under a strict, documented workflow.

🇮🇹 Italian version: [docs/it/readme/README.md](docs/it/readme/README.md)

## Working rules

All the rules governing how Claude Code operates in this repository — branch model, task process, testing, file organization, documentation, GitHub usage — are defined in [CLAUDE.md](CLAUDE.md) (also available as [AGENTS.md](AGENTS.md), a symlink to the same file). Read it before starting any task.

A summary:

- **Branches**: `main` is permanently protected and frozen — no direct work, no merges ever, not even manually. `release/1` is the de facto default branch and the standing working branch; no PRs are opened toward `main`.
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

Copy `.env.example` to `.env` and fill in the app(s) you plan to use, then `npm install`.

### Adding a new app

An app lives under `apps/<name>/` and needs exactly three files:

- `config.js` — default-exports `getEnvironment(name)`, resolving `baseUrl`/token/credentials from `process.env` (see `apps/mytask/config.js`).
- `api.js` — default-exports `makeApi(env, options)`, returning the app's domain functions built on `core/client` + `core/auth` (see `apps/mytask/api.js`). Domain functions are the only thing scenarios/the REPL call — never `core/client`'s HTTP verbs directly.
- `scenarios/<name>.js` (optional) — default-exports an async `run(options)` that chains domain functions and saves a report via `core/report`.

An app never imports from another app; a scenario that needs more than one app goes in the root `scenarios/` folder instead.

### Running the REPL

```
node repl.js <app> <env> [authMode]
```

e.g. `node repl.js mytask production` (or `node repl.js mytask production login` to start in login auth mode). Loads `.env`, then exposes `api` and `env` in a Node REPL with top-level `await`.

### Running a scenario

```
node scenario.js <app> <scenarioName>
```

Resolves and runs `apps/<app>/scenarios/<scenarioName>.js` (or `scenarios/<scenarioName>.js` for a cross-app scenario), loading `.env` first. A scenario can also get a dedicated npm script — e.g. `npm run seed` runs `apps/mytask/scenarios/seedAndVerifyTask.js`, which seeds 20 Tasks concurrently under a fixture Project, reads them back, runs a stateful update/reread check on one of them, cleans everything up, and saves a report under `runs/`.
