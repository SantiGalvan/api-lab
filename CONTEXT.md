# api-lab

A Node/ESM lab for exploring, debugging, and orchestrating API calls to external services: a layer above Postman meant to be used from a REPL or from scripts, never from a GUI.

## Language

**App**:
An isolated external service/API, living under its own `apps/<name>/` folder: config (baseUrl + credentials), domain functions, and single-app scenarios. An app never imports from another app.
_Avoid_: service, integration, target, API (when referring to the folder/island itself rather than the remote service).

**Domain function**:
A business-meaningful operation exposed by `apps/<app>/api.js` (e.g. `createUser`, `getInvoice`), built on top of the shared engine's generic HTTP verbs. This is the layer scenarios and the REPL actually use — never the generic verbs directly.
_Avoid_: wrapper, endpoint, method.

**Scenario**:
A repeatable script that chains domain functions to reproduce a real flow (e.g. login → create → read → update → delete). Lives under `apps/<app>/scenarios/` when it involves a single app.
_Avoid_: test, flow.

**Cross-app scenario**:
A scenario that imports domain functions from more than one app. Lives in the root `scenarios/` folder, never inside a single app's folder.
_Avoid_: integration scenario, shared scenario.

**Run**:
A single execution of a scenario, from start to finish, that produces a report.
_Avoid_: execution, session.

**Report**:
The timestamped JSON file saved under `runs/` at the end of a run, summarizing environment, duration, and outcomes (ok/failed). Distinct from the individual HTTP responses saved during the run.
_Avoid_: log, result.

**Auth mode**:
Which of an app's two ways of authenticating is active for a given run: `m2m` or `login`. Chosen situationally (ad-hoc exploration vs simulating the real app), not fixed once per app.
_Avoid_: grant type (misleading — this isn't OAuth), login method.

**M2M token**:
A pre-provisioned token supplied directly via config/env and attached to every request with no login call involved. It does not expire, so api-lab never attempts to refresh it — a 401 while using it is a generic error, not a routine event. The default auth mode.
_Avoid_: client credentials, service token.

**Login token**:
A short-lived token obtained by calling an app's login endpoint with credentials, kept in memory for the run, and refreshed automatically by api-lab on a 401. Used when simulating real app flows rather than poking the API directly.
_Avoid_: session token, bearer token (that names the transport, not the concept).
