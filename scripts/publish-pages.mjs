import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFileSync,spawnSync} from 'node:child_process';
const root=process.cwd();
if(!fs.existsSync(path.join(root,'publication-manifest.json')))throw new Error('Export the backup vault before publishing.');
const run=(cmd,args,extra={})=>execFileSync(cmd,args,{cwd:root,stdio:'inherit',...extra});
const output=(cmd,args,extra={})=>execFileSync(cmd,args,{cwd:root,encoding:'utf8',...extra}).trim();
if(!process.argv.includes('--built'))run(process.execPath,['quartz/bootstrap-cli.mjs','build']);
run(process.execPath,['scripts/check-publication.mjs']);
fs.writeFileSync(path.join(root,'public','.nojekyll'),'');
const branch=output('git',['branch','--show-current']);
if(!branch||branch==='gh-pages')throw new Error('Publish from the source branch.');
run('git',['add','--all']);
const changed=spawnSync('git',['diff','--cached','--quiet'],{cwd:root}).status;
if(changed===1)run('git',['commit','-m','Update public archive']);else if(changed!==0)throw new Error('Could not inspect staged changes.');
run('git',['push','-u','origin',branch]);
// A separate index keeps the source checkout intact and reuses identical attachment blobs.
const index=path.join(os.tmpdir(),'telegram-media-pages-'+process.pid+'.index');
const env={...process.env,GIT_INDEX_FILE:index};
try{
 const gitdir=path.join(root,'.git'),worktree=path.join(root,'public');
 run('git',['--git-dir='+gitdir,'--work-tree='+worktree,'add','--all'],{env});
 const tree=output('git',['write-tree'],{env});
 const old=spawnSync('git',['rev-parse','--verify','refs/heads/gh-pages'],{cwd:root,encoding:'utf8'});
 const parents=old.status===0?['-p',old.stdout.trim()]:[];
 const commit=output('git',['commit-tree',tree,...parents,'-m','Publish navigable Telegram archive']);
 run('git',['update-ref','refs/heads/gh-pages',commit,...(old.status===0?[old.stdout.trim()]:[])]);
 run('git',['push','origin','gh-pages']);
}finally{if(fs.existsSync(index))fs.unlinkSync(index);}
console.log('Published source and gh-pages. GitHub Pages will complete the deployment.');
