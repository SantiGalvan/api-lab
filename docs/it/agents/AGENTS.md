# CLAUDE.md — Regole di lavorazione per api-lab

Queste regole governano come Claude Code deve lavorare su questa repository. Non sono suggerimenti: vanno seguite ad ogni sessione, per ogni lavorazione, senza eccezioni salvo istruzione esplicita e puntuale dell'utente che le sovrascriva per quel singolo caso.

## 1. Branch

- **`main`**: permanentemente protetto e congelato. Non riceve mai merge, nemmeno manualmente dall'utente, mai. Non si lavora mai qui, non si apre mai una PR verso questo branch.
- **`release/1`**: il branch di default di fatto, ed il branch di lavoro stabile. Tutto il lavoro avviene direttamente qui — nessun branch `feature/`/`epic/` per singola lavorazione, nessuna PR verso `main`. I commit atomici vanno direttamente su `release/1`.

## 2. Processo per ogni nuova lavorazione

Prima di scrivere codice, per **ogni** nuova implementazione — inclusi i fix piccoli — si segue questo flusso, passo per passo. Nessun passo si salta silenziosamente: se non applicabile, lo si dichiara esplicitamente e si passa al successivo.

**Passo 1 — `/grill-with-docs`**
Intervista approfondita sull'idea (chiama `grilling` + `domain-modeling`), aggiornando `CONTEXT.md` e gli ADR in `docs/adr/` mano a mano che emergono decisioni/termini di dominio. Non si procede al passo 2 finché la frontier non è vuota e l'utente ha confermato la comprensione condivisa.

**Passo 2 — Tutto risolvibile in conversazione?**
- **Sì** → passo 3.
- **No** (serve verificare in pratica un'idea di stato/comportamento prima di poterla discutere) → `/prototype` (sessione usa e getta) → `/handoff` (riporta il risultato) → si torna al passo 1 con quel risultato come nuovo input.

**Passo 3 — È una lavorazione multi-sessione?** (più di una issue, più di un componente coinvolto, stima oltre le 2 ore):
- **Sì** → `/to-spec` (tiene lo spec in memoria, non lo pubblica come issue GitHub) → `/to-tickets` (lo spezza in sotto-task indipendenti, verticalmente sliced, anch'essi tenuti in memoria, non come issue GitHub). Poi: **una nuova sessione per ogni sotto-task**, con `/implement` passandogli lo spec principale + il singolo sotto-task — tutto committato direttamente su `release/1`.
- **No** → `/implement` nella stessa finestra di contesto, direttamente su `release/1`.

**Passo 4 — Flusso Git** (vedi punto 1): lavoro diretto su `release/1` → commit atomici → push su `release/1`. Non si apre mai una PR verso `main` — `main` è permanentemente congelato e fuori scope per questo flusso.

**Passo 4.5 — Changelog** (vedi punto 5) — **obbligatorio prima di ogni push**:
1. Crea `docs/it/changelog/AAAA-MM-GG-X.Y.Z-nome-branch.md` e `docs/en/changelog/YYYY-MM-DD-X.Y.Z-branch-name.md` con il template del punto 5.
2. Aggiorna gli indici `docs/it/changelog/CHANGELOG.md` e `docs/en/changelog/CHANGELOG.md` con un link + riassunto di una riga sotto l'intestazione della versione corrente.

Non fare push prima di aver completato questo passo.

**Passo 5 — `/tdd`**
Ogni implementazione segue red-green-refactor (vedi anche punto 3). Non si considera concluso un sotto-task senza un test corrispondente che passa.

**Passo 3.5 (verifica browser)**: non applicabile per ora — nessuna skill/MCP di verifica browser è collegata a questa repo/sessione. Se in futuro viene collegato un MCP di questo tipo, va aggiunto qui come passo condizionale tra il 3 e il 4.

## 3. Test

- Ogni file con logica (funzioni, moduli, utility) ha il proprio file di test accanto, stesso nome con suffisso `.test.ts`.
- Framework: **Vitest**.
- Comandi: `npm run test` (single run, usato anche in CI) e `npm run test:watch` (sviluppo locale).
- Ordine d'implementazione (red-green-refactor) imposto dal processo al punto 2, passo 5 (`/tdd`): nessun sotto-task si chiude senza un test corrispondente che passa.

## 4. Organizzazione dei file

- **Una cartella per elemento**: ogni modulo con una sola responsabilità ha la propria cartella, con dentro il file, il relativo test e un `index.ts` di re-export.

  ```
  Parser/
    Parser.ts
    Parser.test.ts
    index.ts
  ```

- **Un file = una responsabilità**: un file contiene una sola funzione "grande" o un solo modulo. File con più funzioni/moduli indipendenti vanno divisi in file separati, ciascuno nella propria cartella.
- **Styling/config custom**, se mai necessari, vanno centralizzati in `src/styles/` (o cartella di config equivalente), non sparsi per-file.

## 5. Documentazione (`docs/`)

Struttura in root:

```
docs/
  it/
    changelog/
  en/
    changelog/
```

- **Documentazione di prodotto** (come funziona l'app, guide): va dentro `docs/it/` e `docs/en/`. Ogni file di documentazione ha la propria cartella dedicata (stesso principio dei moduli al punto 4), sempre in entrambe le lingue.
- **Changelog per implementazione**: dentro `docs/it/changelog/` e `docs/en/changelog/`, **struttura flat** (nessuna sottocartella per file). Un file per ogni push (non solo a fine lavorazione, vedi punto 2 passo 4.5), in entrambe le lingue, nome:

  ```
  AAAA-MM-GG-X.Y.Z-nome-branch.md
  ```

  (versione subito dopo la data, poi il nome del branch — non l'ordine inverso usato in passato)

  Esempio: push del 7 settembre 2026 con versione `0.3.0`, su `release/1` →
  `docs/it/changelog/2026-09-07-0.3.0-release-1.md`
  `docs/en/changelog/2026-09-07-0.3.0-release-1.md`

  **Template di ogni entry** (in italiano per `docs/it/changelog/`, tradotto in inglese per `docs/en/changelog/`):

  ```markdown
  # <Titolo descrittivo della modifica>

  ## Contesto
  Perché questo lavoro è stato fatto — bug report, richiesta utente o decisione presa in una sessione di grilling.

  ## Tracking
  Riferimento allo spec/sotto-task tenuto in memoria che questo lavoro implementa (vedi punto 7 — le issue sono tracciate in memoria, non su GitHub).

  ## Branch & Versione
  - **Branch:** `release/1`
  - **Versione:** `X.Y.Z`

  ## File modificati
  | File | Modifica |
  |------|----------|
  | `path/to/file.ext` | Descrizione di una riga di cosa è cambiato in questo file |

  ## Modifiche tecniche
  Snippet chiave del codice finale con un commento che spiega il perché, non il cosa.

  ## Motivazione
  Il ragionamento dietro la soluzione scelta — perché questo approccio e non un altro.
  ```

  **Indice**: dopo aver creato la entry, aggiungere una riga a `docs/it/changelog/CHANGELOG.md` e `docs/en/changelog/CHANGELOG.md`, sotto l'intestazione della versione corrente:

  ```markdown
  - [release-1](2026-09-07-0.3.0-release-1.md) — descrizione di una riga
  ```

## 6. README

- Nella **root** della repo resta solo `README.md`, in inglese (default "nativo" della repo, standard GitHub).
- Il README italiano vive in `docs/it/readme/README.md`.
- I due file sono **sempre linkati tra loro**: ognuno rimanda alla versione nell'altra lingua.

## 7. GitHub

- `gh` CLI è autenticato (account `SantiGalvan`) e usato per questa repo, `SantiGalvan/api-lab`.
- **Le issue non si creano su GitHub.** Spec e sotto-task prodotti da `/to-spec` e `/to-tickets` restano in memoria (sistema di memoria di questa sessione) invece che con `gh issue create` — non viene pubblicato nulla come issue GitHub.
- **Autore dei commit**: questo ambiente non ha un'identità git configurata (né locale né globale), quindi i commit ricadono silenziosamente sull'utente/hostname del sistema operativo (es. `root@<hostname>`) invece che sull'utente. Claude Code non deve mai risolvere questo problema eseguendo `git config` (mai consentito, nessuna eccezione) — ogni commit che crea deve invece impostare esplicitamente autore e committer per quella singola invocazione, ad es.:

  ```
  GIT_AUTHOR_NAME="Santi Galvan" GIT_AUTHOR_EMAIL="santiagogalvancolorado@gmail.com" \
  GIT_COMMITTER_NAME="Santi Galvan" GIT_COMMITTER_EMAIL="santiagogalvancolorado@gmail.com" \
  git commit -m "..."
  ```

  Così i commit restano correttamente attribuiti senza mai toccare `.git/config` o `~/.gitconfig`.

## 8. Lingua e file di istruzioni per agenti

- `CLAUDE.md` (root del repo) è la fonte canonica, in inglese — letto direttamente da Claude Code e da qualunque altro agente che rispetti questa convenzione.
- `AGENTS.md` (root del repo) è un **symlink** a `CLAUDE.md`: stesso contenuto, nessuna manutenzione separata, esiste per far sì che gli strumenti che cercano specificamente `AGENTS.md` ricevano automaticamente le stesse regole.
- `docs/it/agents/AGENTS.md` (questo file) è una **traduzione italiana** mantenuta manualmente di `CLAUDE.md`, per la lettura umana. **Ogni volta che `CLAUDE.md` viene modificato, `docs/it/agents/AGENTS.md` va aggiornato di conseguenza** — non esiste symlink o automazione per questo, dato che il contenuto differisce per lingua.

## Agent skills

### Issue tracking

Spec e sotto-task da `/to-spec`/`/to-tickets` sono tracciati **in memoria**, non come issue GitHub (vedi punto 7). Vedi `docs/agents/issue-tracker.md`.

### Triage labels

Etichette concettuali di stato usate sugli elementi tracciati in memoria (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). Vedi `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` alla root del repo. Vedi `docs/agents/domain.md`. Questo è il percorso funzionale — inglese, posizione fissa, letto direttamente da `domain-modeling`/`grill-with-docs` — e non va spostato. `docs/it/domain/` (`CONTEXT.md` + `adr/`) ne è il mirror italiano per la sola lettura umana; aggiornarlo manualmente ogni volta che `CONTEXT.md` o `docs/adr/` cambiano, incluso per ogni nuovo ADR.

### Nota sulla lingua

I file sotto `docs/agents/` sono il percorso **funzionale**: le skill (`to-spec`, `to-tickets`, `triage`, `domain-modeling`, ecc.) leggono e scrivono esattamente lì, in inglese, e questo percorso non va spostato o rinominato. `docs/it/agents/` è un mirror in italiano degli stessi contenuti, per la sola lettura umana — tenerlo allineato manualmente quando `docs/agents/` cambia, ma non è consultato dalle skill.
