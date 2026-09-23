# api-lab

Un laboratorio Node/ESM per esplorare, debuggare e orchestrare chiamate API verso servizi esterni: un livello sopra Postman pensato per essere usato in REPL o in script, non in una GUI.

## Linguaggio

**App**:
Un servizio/API esterno isolato, con una propria cartella sotto `apps/<nome>/`: config (baseUrl + credenziali), funzioni di dominio, e scenari mono-app. Un'app non importa mai da un'altra app.
_Evitare_: servizio, integrazione, target, API (quando si intende la cartella/isola, non il servizio remoto in sé).

**Domain function (funzione di dominio)**:
Un'operazione con significato di business esposta da `apps/<app>/api.js` (es. `createUser`, `getInvoice`), costruita sopra i verbi HTTP generici del motore condiviso. È il livello che gli scenari e la REPL usano davvero — mai i verbi generici direttamente.
_Evitare_: wrapper, endpoint, metodo.

**Scenario**:
Uno script ripetibile che incatena funzioni di dominio per riprodurre un flusso reale (es. login → crea → leggi → modifica → cancella). Vive sotto `apps/<app>/scenarios/` se coinvolge una sola app.
_Evitare_: test, flow.

**Cross-app scenario (scenario cross-app)**:
Uno scenario che importa funzioni di dominio da più di un'app. Vive nella cartella `scenarios/` alla radice, mai dentro la cartella di una singola app.
_Evitare_: integration scenario, scenario condiviso.

**Run**:
Una singola esecuzione di uno scenario, dall'inizio alla fine, da cui nasce un report.
_Evitare_: esecuzione, sessione.

**Report**:
Il file JSON salvato sotto `runs/` al termine di una run, con timestamp nel nome, che riassume ambiente, durata ed esiti (ok/falliti). Distinto dalle singole risposte HTTP salvate durante la run.
_Evitare_: log, risultato.

**Auth mode (modalità di autenticazione)**:
Quale delle due modalità di autenticazione di un'app è attiva per una data run: `m2m` o `login`. Si sceglie di volta in volta in base alla situazione (esplorazione ad-hoc vs simulazione dell'app reale), non è fissa una volta per app.
_Evitare_: grant type (fuorviante — non è vero OAuth), metodo di login.

**M2M token**:
Un token fornito direttamente via config/env e allegato a ogni richiesta senza alcuna chiamata di login. Non scade, quindi api-lab non tenta mai di rinnovarlo — un 401 mentre lo si usa è un errore generico, non un evento di routine. È la modalità di default.
_Evitare_: client credentials, service token.

**Login token**:
Un token a breve vita ottenuto chiamando l'endpoint di login di un'app con le credenziali, tenuto in memoria per la durata della run, e rinnovato automaticamente da api-lab su un 401. Usato quando si simulano i flussi reali dell'app invece di interrogare l'API direttamente.
_Evitare_: session token, bearer token (nomina il trasporto, non il concetto).

---

_Questo file rispecchia manualmente `/CONTEXT.md` (inglese, percorso funzionale letto dalle skill). Aggiornalo ogni volta che l'originale cambia._
