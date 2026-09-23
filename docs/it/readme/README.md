# api-lab

`api-lab` è una repository di laboratorio per costruire e sperimentare progetti API, sviluppata insieme a Claude Code seguendo un workflow rigoroso e documentato.

🇬🇧 Versione inglese: [../../../README.md](../../../README.md)

## Regole di lavorazione

Tutte le regole che governano come Claude Code opera in questa repository — modello dei branch, processo delle lavorazioni, test, organizzazione dei file, documentazione, uso di GitHub — sono definite in [CLAUDE.md](../../../CLAUDE.md) (disponibile anche come [AGENTS.md](../../../AGENTS.md), symlink allo stesso file). Leggerlo prima di iniziare qualunque lavorazione. Questo file, [docs/it/agents/AGENTS.md](../agents/AGENTS.md), ne è la traduzione italiana per la lettura umana.

Un riepilogo:

- **Branch**: `main` è permanentemente protetto e congelato — nessun lavoro diretto, nessun merge, mai, nemmeno manualmente. `release/1` è il branch di default di fatto ed il branch di lavoro stabile; non si aprono PR verso `main`.
- **Processo delle lavorazioni**: ogni nuova lavorazione, inclusi i fix piccoli, segue un flusso fisso — `/grill-with-docs` per la raccolta dei requisiti, un ciclo opzionale `/prototype` → `/handoff` per tutto ciò che va verificato in pratica, `/to-spec`/`/to-tickets` per le lavorazioni multi-sessione (tenute in memoria, non pubblicate come issue GitHub), implementazione con `/implement` e `/tdd` per il red-green-refactor. Vedi [CLAUDE.md](../../../CLAUDE.md) §2 per il flusso completo.
- **Test**: [Vitest](https://vitest.dev), un file `.test.ts` per ogni file sorgente con logica, eseguiti con `npm run test` / `npm run test:watch`.
- **Organizzazione dei file**: una cartella per modulo (`Modulo.ts`, `Modulo.test.ts`, `index.ts`), una responsabilità per file.
- **Tracciamento issue**: spec e sotto-task sono tracciati in memoria (sistema di memoria di questa sessione), non come issue GitHub.

## Documentazione

```
docs/
  it/
    agents/     — mirror italiano di CLAUDE.md, per lettura umana
    changelog/  — entry di changelog in italiano, un file per push
    readme/     — README in italiano
  en/
    changelog/  — entry di changelog in inglese, un file per push
```

- La documentazione di prodotto (come funziona l'app, guide) vive sotto `docs/it/` e `docs/en/`, una cartella dedicata per argomento, sempre in entrambe le lingue.
- Ogni push aggiunge una entry di changelog in entrambe le lingue prima che il codice venga pushato — vedi [CLAUDE.md](../../../CLAUDE.md) §5 per lo schema dei nomi e il template.

## Per iniziare

Questa repository al momento contiene le regole di lavorazione e l'impalcatura di documentazione; il codice applicativo e le relative istruzioni di setup verranno aggiunti qui man mano che il progetto cresce.
