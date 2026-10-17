import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {slugifyFilePath} from '@quartz-community/utils';
const root=path.resolve('public'),manifest=JSON.parse(fs.readFileSync('publication-manifest.json','utf8'));
function walk(d){return fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);}
const assets=manifest.entries.filter(f=>!f.file.endsWith('.md')&&f.file!=='Image inventory.csv');
for(const f of assets){const publicFile=path.join(root,slugifyFilePath(f.file));if(!fs.existsSync(publicFile))throw new Error('Missing asset '+f.file);const actual=crypto.createHash('sha256').update(fs.readFileSync(publicFile)).digest('hex');if(actual!==f.sha256)throw new Error('Modified attachment '+f.file);}
const failures=[],seen=new Set();let links=0;
for(const f of walk(root).filter(f=>f.endsWith('.html'))){
 const html=fs.readFileSync(f,'utf8');
 if(/file:\/\/\/|obsidian:\/\/|[CDE]:[\\/](?:Users|Main|Audio_Rust)/.test(html))throw new Error('Local reference in generated page '+f);
 for(const m of html.matchAll(/(?:href|src)="([^"]+)"/g)){
  const href=m[1].replaceAll('&amp;','&');if(/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(href))continue;
  let relative;try{relative=decodeURIComponent(href.split('#')[0].split('?')[0]);}catch{continue;}
  if(!relative)continue;
  if(relative==='/telegram-media-archive'||relative.startsWith('/telegram-media-archive/'))relative=relative.slice('/telegram-media-archive'.length)||'/';
  const target=relative.startsWith('/')?path.join(root,relative):path.resolve(path.dirname(f),relative),key=target;
  if(seen.has(key))continue;seen.add(key);links++;
  if(!fs.existsSync(target)&&!fs.existsSync(target+'.html')&&!fs.existsSync(path.join(target,'index.html')))failures.push({from:path.relative(root,f).replaceAll('\\','/'),href,target:path.relative(root,target).replaceAll('\\','/')});
 }
}
const bytes=walk(root).reduce((n,f)=>n+fs.statSync(f).size,0);
const result={htmlPages:walk(root).filter(f=>f.endsWith('.html')).length,binaryAssetsVerified:assets.length,uniqueLocalLinks:links,bytes,brokenLinks:failures};
fs.writeFileSync('publication-check.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({...result,brokenLinks:failures.slice(0,15)},null,2));
if(bytes>=1e9)throw new Error('Site exceeds the GitHub Pages size limit.');
if(failures.length)process.exitCode=1;
