import fs from 'node:fs';
import YAML from 'yaml';
const config=YAML.parse(fs.readFileSync('quartz/cli/templates/obsidian.yaml','utf8'));
Object.assign(config.configuration,{pageTitle:'Archivio Telegram',pageTitleSuffix:' · Media e cultura',baseUrl:'ilariodeangelis77.github.io/telegram-media-archive',locale:'it-IT',analytics:null,ignorePatterns:['.obsidian','_processing','.trash']});
config.configuration.theme.fontOrigin='local';
config.configuration.theme.colors.lightMode.secondary='#496c59';
config.configuration.theme.colors.darkMode.secondary='#a1c5af';
const disabled=['og-image','encrypted-pages','canvas-page','bases-page','obsidian-plugin-excalidraw','alias-redirects','cname','article-title','content-meta'];
for(const plugin of config.plugins){
 if(disabled.some(n=>plugin.source.endsWith('/'+n)))plugin.enabled=false;
 if(plugin.source.endsWith('/crawl-links'))plugin.options={...plugin.options,markdownLinkResolution:'absolute',disableBrokenWikilinks:true};
 if(plugin.source.endsWith('/created-modified-date'))plugin.options.priority=['frontmatter','filesystem'];
 if(plugin.source.endsWith('/note-properties'))plugin.options={...plugin.options,hidePropertiesView:true};
 if(plugin.source.endsWith('/footer'))plugin.options={links:{GitHub:'https://github.com/ilariodeangelis77/telegram-media-archive','Internet Archive':'https://archive.org/details/telegram-image-archive-media-culture-2018-2022'}};
}
fs.writeFileSync('quartz.config.yaml',YAML.stringify(config));
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
pkg.name='telegram-media-archive';pkg.description='Archivio navigabile di media, immagini, chat e documenti raccolti su Telegram.';
pkg.scripts={...pkg.scripts,build:'node quartz/bootstrap-cli.mjs build',preview:'node quartz/bootstrap-cli.mjs build --serve',export:'node scripts/export-vault.mjs',publish:'node scripts/publish-pages.mjs'};
fs.writeFileSync('package.json',JSON.stringify(pkg,null,2)+'\n');
// Upstream automation belongs to Quartz itself, not to this independent archive.
for(const n of fs.readdirSync('.github/workflows'))if(/\.ya?ml$/.test(n))fs.unlinkSync('.github/workflows/'+n);
fs.writeFileSync('.gitignore',fs.readFileSync('.gitignore','utf8')+'\npublication-private-audit.json\n');
fs.writeFileSync('README.md','# Archivio Telegram\n\nCatalogo pubblico navigabile di film, libri, musica, videogiochi e altri materiali raccolti su Telegram, con immagini, chat complete e 110 allegati di lettura.\n\n- **Sito:** https://ilariodeangelis77.github.io/telegram-media-archive/\n- **Note e allegati:** `content/`\n- **Inventario pubblico:** `publication-manifest.json`\n\nIl sito usa [Quartz 5](https://quartz.jzhao.xyz/): ricerca, collegamenti tra note, anteprime e grafo. I Markdown restano leggibili anche come vault Obsidian aprendo la cartella `content`.\n\n## Aggiornare la copia pubblica\n\n```sh\nnpm ci\nnpm run export -- "PERCORSO_DEL_VAULT_DI_BACKUP"\nnpm run build\nnpm run preview\n```\n\nL’esportazione include note, immagini, chat e allegati. Esclude impostazioni locali, cestino e file di lavorazione; rimuove i percorsi del computer e i rimandi al vault principale. Il vault sorgente non viene modificato.\n\nDopo avere verificato la copia, pubblicare con `npm run publish`. La prima pubblicazione richiede GitHub CLI autenticato e il repository già configurato per GitHub Pages dal ramo `gh-pages`.\n\n## Sorgenti e pubblicazione\n\nIl ramo principale contiene la copia pubblica del vault e il generatore. `gh-pages` contiene il sito generato. Gli allegati binari sono conservati senza modifiche. Le note non verificate restano segnalate come tali.\n\nIl codice di Quartz mantiene la sua licenza MIT in `LICENSE.txt`; questa licenza non riassegna i diritti sui documenti e sui materiali di terzi contenuti nell’archivio.\n');
