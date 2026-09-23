# MyTask authenticates via a static M2M token or an interactive login, not OAuth2 client credentials

The original plan assumed one OAuth2 client-credentials (M2M) flow for every app, with a Bearer header. The real MyTask Postman collection showed the API instead accepts two independent mechanisms: a non-expiring token attached as a `?token=` query parameter, and a session token from `POST /authenticate` (email/password) attached as an `Authorization: Bearer` header and refreshed lazily on 401. We support both as a per-run `authMode` (`m2m` default, `login` on demand) instead of picking one, because `m2m` is needed for fast unattended exploration and `login` is needed to simulate the real app as a specific user — collapsing to a single mode would make one of those workflows impossible.

## Considered Options

- Single OAuth2 client-credentials abstraction — rejected, doesn't match the real API (no client_id/secret concept exists).
- `login`-only — rejected, too slow/stateful for quick REPL exploration and scripted seeding.
- `m2m`-only — rejected, can't simulate per-user app behavior.

## Consequences

`core/auth.js` must support two token strategies with different lifecycles (never-refreshed `m2m` vs lazy-refresh-on-401 `login`). `core/client.js` must attach the active token via query string or header depending on the active mode — the transport is a per-app/per-mode config concern, not hardcoded.
