# Archivio Telegram

Catalogo pubblico navigabile di film, libri, musica, videogiochi e altri materiali raccolti su Telegram, con immagini, chat complete e 110 allegati di lettura.

- **Sito:** https://ilariodeangelis77.github.io/telegram-media-archive/
- **Note e allegati:** `content/`
- **Inventario pubblico:** `publication-manifest.json`

Il sito usa [Quartz 5](https://quartz.jzhao.xyz/): ricerca, collegamenti tra note, anteprime e grafo. I Markdown restano leggibili anche come vault Obsidian aprendo la cartella `content`.

## Aggiornare la copia pubblica

```sh
npm ci
npm run export -- "PERCORSO_DEL_VAULT_DI_BACKUP"
npm run build
npm run preview
```

L’esportazione include note, immagini, chat e allegati. Esclude impostazioni locali, cestino e file di lavorazione; rimuove i percorsi del computer e i rimandi al vault principale. Il vault sorgente non viene modificato.

Dopo avere verificato la copia, pubblicare con `npm run publish`. La prima pubblicazione richiede GitHub CLI autenticato e il repository già configurato per GitHub Pages dal ramo `gh-pages`.

## Sorgenti e pubblicazione

Il ramo principale contiene la copia pubblica del vault e il generatore. `gh-pages` contiene il sito generato. Gli allegati binari sono conservati senza modifiche. Le note non verificate restano segnalate come tali.

Il codice di Quartz mantiene la sua licenza MIT in `LICENSE.txt`; questa licenza non riassegna i diritti sui documenti e sui materiali di terzi contenuti nell’archivio.
