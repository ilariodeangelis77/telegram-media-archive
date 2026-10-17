import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const source=path.resolve(process.argv[2]??'');
if(!process.argv[2]||!fs.existsSync(path.join(source,'Catalogue.md')))throw new Error('Provide the backup vault folder as the first argument.');
const destination=path.resolve('content');
const skipped=new Set(['.obsidian','_processing','.git','.trash']);
function walk(folder){return fs.readdirSync(folder,{withFileTypes:true}).flatMap(e=>e.isDirectory()?skipped.has(e.name)?[]:walk(path.join(folder,e.name)):[path.join(folder,e.name)]);}
const files=walk(source),manifest=[];
function publicText(input){
 let text=input.replace(/\r\n/g,'\n');
 // Publication metadata must never point into a private vault or local computer.
 text=text.replace(/^(?:imported_to|source_folder|original_path|source_uri):[^\n]*\n/gm,'');
 text=text.replace(/^\*\*Portato nel vault principale[^\n]*\n/gm,'');
 text=text.replace(/^Creata la nota nel vault principale[^\n]*\n/gm,'');
 text=text.replace(/^(?:## Source folders|### Original files)\n[\s\S]*?(?=\n#{1,3} |\n<!-- reading-files:end -->|$)/gm,'');
 // Convert working local links to their public wiki target; unwrap unavailable ones.
 text=text.replace(/\[([^\]\n]+)\]\(<?((?:file:\/\/\/|obsidian:\/\/)[^\n]*?)>?\)/g,(_,label,uri)=>{
  let target=uri.replace(/>$/,'');
  try{target=target.startsWith('obsidian:')?new URL(target).searchParams.get('path')??'':decodeURIComponent(target.replace(/^file:\/\/\//,''));}catch{}
  target=target.replaceAll('\\','/');
  const marker='/Obsidian_Archive/';
  if(target.includes(marker)){
   const relative=target.split(marker)[1];
   if(!relative.startsWith('_processing/')&&fs.existsSync(path.join(source,relative)))return '[['+relative.replace(/\.md$/,'')+'|'+label+']]';
  }
  return '';
 });
 // Drop empty source bullets and obsolete headings after removing local links.
 text=text.replace(/^\s*-\s*$/gm,'').replace(/^\s*Dettagli nel \.\s*$/gm,'');
 text=text.replace(/^## Telegram context\n\s*(?=## |$)/gm,'');
 // The source filenames remain stable for wiki links; presentation titles omit workflow prefixes.
 text=text.replace(/^(title:\s*")! PORTATO\s*[—-]\s*/gm,'$1').replace(/^# ! PORTATO\s*[—-]\s*/gm,'# ');
 // Local absolute paths occasionally occur in historical prose as well as links.
 text=text.replace(/file:\/\/\/[^\s<>\])"`]+/g,'').replace(/obsidian:\/\/[^\s<>\])"`]+/g,'');
 text=text.replace(/\b[A-Z]:[\\/][^\n<>"`]+/g,'[percorso locale omesso]');
 text=text.replaceAll('[[The Ninja Warriors]]','The Ninja Warriors');
 return text.replace(/\n{4,}/g,'\n\n\n').trimEnd()+'\n';
}
for(const file of files){
 const relative=path.relative(source,file).replaceAll('\\','/');
 const out=path.join(destination,relative),bytes=fs.readFileSync(file);
 fs.mkdirSync(path.dirname(out),{recursive:true});
 let published=bytes;
 if(relative.endsWith('.md'))published=Buffer.from(publicText(bytes.toString('utf8')));
 if(relative==='Image inventory.csv')published=Buffer.from(bytes.toString('utf8').replace(/file:\/\/\/[^,\r\n]+/g,''));
 fs.writeFileSync(out,published);
 manifest.push({file:relative,bytes:published.length,sha256:crypto.createHash('sha256').update(published).digest('hex')});
}
const groups=[['Films','Film'],['Books','Libri'],['Music/Albums','Album'],['Music/Artists','Musicisti'],['Music/Other Releases','Altre uscite musicali'],['Comics','Fumetti e manga'],['Anime','Anime'],['Series','Serie TV'],['Games','Videogiochi'],['Creators','Autori e registi'],['Essays','Saggi e articoli'],['Journals','Riviste'],['Lectures','Lezioni'],['Reading Lists','Liste di lettura'],['Scores','Partiture'],['Podcasts','Podcast'],['Chats','Chat complete']];
const table=groups.map(([dir,label])=>`| [[${dir}/index\\|${label}]] | ${manifest.filter(f=>f.file.startsWith(dir+'/')&&f.file.endsWith('.md')).length} |`).join('\n');
fs.writeFileSync(path.join(destination,'index.md'),'---\ntitle: Archivio Telegram\ndescription: Un catalogo navigabile di film, libri, musica, videogiochi e immagini raccolti su Telegram.\n---\n\n# Archivio Telegram\n\nFilm, libri, musica, videogiochi e altre scoperte raccolte su Telegram. Un archivio da esplorare attraverso le note, le immagini originali e i loro collegamenti.\n\n## Da dove iniziare\n\n- [[Catalogue|Catalogo completo]] — tutte le opere e gli autori.\n- [[Gallery|Galleria delle immagini]] — una selezione delle fonti visive.\n- [[Reading library|Biblioteca]] — libri e documenti con gli allegati disponibili.\n- [[Review|Immagini da identificare]] — i riconoscimenti ancora aperti.\n- [[Chats/index|Chat complete]] — i testi integrali conservati nell’archivio.\n\n## Esplora per categoria\n\n| Categoria | Note |\n| --- | ---: |\n'+table+'\n\n## Come esplorare\n\nUsa la ricerca per trovare un titolo o un autore. I collegamenti nelle note portano alle opere correlate e alle immagini da cui sono state estratte; il grafo mostra le connessioni. I PDF si aprono nel browser quando supportato, gli altri allegati si possono scaricare.\n\nLe identificazioni provengono da un lavoro di estrazione e revisione: alcuni casi restano esplicitamente da verificare.\n\n[Immagini pubblicate su Internet Archive](https://archive.org/details/telegram-image-archive-media-culture-2018-2022) · [Repository su GitHub](https://github.com/ilariodeangelis77/telegram-media-archive)\n');
for(const [dir,label] of groups)fs.writeFileSync(path.join(destination,dir,'index.md'),'---\ntitle: '+label+'\n---\n\n# '+label+'\n\nSfoglia le note di questa categoria.\n');
fs.writeFileSync('publication-manifest.json',JSON.stringify({generated:new Date().toISOString(),files:manifest.length,markdown:manifest.filter(f=>f.file.endsWith('.md')).length,images:manifest.filter(f=>f.file.startsWith('Images/')&&!f.file.endsWith('.md')).length,attachments:manifest.filter(f=>f.file.startsWith('Files/')).length,totalBytes:manifest.reduce((n,f)=>n+f.bytes,0),entries:manifest},null,2)+'\n');
const suspicious=manifest.filter(f=>f.file.endsWith('.md')||f.file.endsWith('.csv')).filter(f=>/file:\/\/\/|obsidian:\/\/|\b[CDE]:[\\/]/.test(fs.readFileSync(path.join(destination,f.file),'utf8'))).map(f=>f.file);
if(suspicious.length)throw new Error('Local references remain in '+JSON.stringify(suspicious));
console.log(JSON.stringify({exported:manifest.length,markdown:manifest.filter(f=>f.file.endsWith('.md')).length,attachments:manifest.filter(f=>f.file.startsWith('Files/')).length,localReferences:0}));
