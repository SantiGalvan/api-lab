# Issue tracker: In-memory (session only)

Issues, specs, and sub-tasks for this repo are **not** persisted anywhere outside the conversation: not as GitHub issues, not as files under `.scratch/`, not in any external tracker (see `CLAUDE.md`, point 7). They exist only within the session's own memory for as long as that conversation is open.

## Conventions

- No `gh issue create`, no `.scratch/` files, no external tracker calls of any kind for specs or tickets.
- A spec produced by `/to-spec` and the tickets produced by `/to-tickets` are plain conversational output: read them back from the transcript, don't look for a file or an issue number.

## When a skill says "publish to the issue tracker"

Do nothing outside the conversation. Present the spec/ticket directly in the response; there is no external write.

## When a skill says "fetch the relevant ticket"

There is no fetch: the ticket only exists in the conversation that created it. For a new session to act on it (CLAUDE.md, point 2, step 3: "a new session for each sub-task"), the user — or a `/handoff` from the originating session — must hand over the main spec and the single sub-task explicitly. A new session cannot look either up on its own.

## Wayfinding operations

`/wayfinder` assumes a persistent, cross-session map of tickets (a map issue/file plus child tickets that stay resolvable across sessions). That model doesn't fit an in-memory-only tracker: nothing survives past the session that created it.

Don't use `/wayfinder` in this repo unless the user explicitly accepts carrying the map by hand between sessions (e.g. via repeated `/handoff`s). Prefer the direct `/to-spec` → `/to-tickets` → per-sub-task session flow already described in `CLAUDE.md` instead.
