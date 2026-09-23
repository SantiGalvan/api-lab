# MyTask si autentica con un token M2M statico o con un login interattivo, non con OAuth2 client credentials

Il piano iniziale ipotizzava un unico flusso OAuth2 client-credentials (M2M) per ogni app, con header Bearer. La collection Postman reale di MyTask ha mostrato invece che l'API accetta due meccanismi indipendenti: un token che non scade mai, allegato come parametro di query `?token=`, e un token di sessione ottenuto da `POST /authenticate` (email/password), allegato come header `Authorization: Bearer` e rinnovato in modo lazy su 401. Supportiamo entrambi come `authMode` selezionabile per singola run (`m2m` di default, `login` su richiesta) invece di sceglierne uno solo, perché `m2m` serve per l'esplorazione rapida non presidiata e `login` serve per simulare l'app reale come uno specifico utente — collassare su una sola modalità renderebbe impossibile uno di questi due flussi di lavoro.

## Opzioni considerate

- Un'unica astrazione OAuth2 client-credentials — scartata, non corrisponde all'API reale (non esiste alcun concetto di client_id/secret).
- Solo `login` — scartata, troppo lenta/stateful per l'esplorazione rapida in REPL e per il seeding via script.
- Solo `m2m` — scartata, non permette di simulare il comportamento dell'app per singolo utente.

## Conseguenze

`core/auth.js` deve supportare due strategie di token con cicli di vita diversi (`m2m` mai rinnovato vs `login` con refresh lazy su 401). `core/client.js` deve allegare il token attivo come query string o come header a seconda della modalità attiva — il trasporto è una responsabilità di config per-app/per-modalità, non un dettaglio cablato.

---

_Questo file rispecchia manualmente `/docs/adr/0001-mytask-dual-auth-mode.md` (inglese, percorso funzionale). Aggiornalo ogni volta che l'originale cambia._
