import {readFileSync,writeFileSync,cpSync,mkdirSync,rmSync} from 'node:fs';
import {join,resolve} from 'node:path';
const source=resolve(process.argv[2]||'.'),destination=resolve(process.argv[3]||'preview-build');
if(source===destination)throw new Error('Preview destination must differ from source');
rmSync(destination,{recursive:true,force:true});
mkdirSync(destination,{recursive:true});
for(const dir of ['assets','data'])cpSync(join(source,dir),join(destination,dir),{recursive:true});
for(const name of ['index.html','style.css','ui-text.js','training-levels.js'])cpSync(join(source,name),join(destination,name));
const app=readFileSync(join(source,'app.js'),'utf8');
if(!/\blocalStorage\b/.test(app))throw new Error('Storage API changed; check dev isolation');
const scoped=app.replace(/\blocalStorage\b/g,'devStorage').replace(/^'use strict';\s*/,'');
const shim=[
 "'use strict';",
 "// Dev preview uses the same domain as production: scope all storage keys.",
 "const devStorage={",
 " getItem(key){return window.localStorage.getItem('umamemo-dev-v1:'+key)},",
 " setItem(key,value){return window.localStorage.setItem('umamemo-dev-v1:'+key,value)},",
 " removeItem(key){return window.localStorage.removeItem('umamemo-dev-v1:'+key)}",
 "};"
].join('\n');
writeFileSync(join(destination,'app.js'),shim+'\n'+scoped,'utf8');
const html=readFileSync(join(destination,'index.html'),'utf8');
writeFileSync(join(destination,'index.html'),html
 .replace('<title>우마 메모</title>','<title>우마 메모 · 개발판</title>')
 .replace('</header>','<span style="font-size:12px;color:#ffcf82;border:1px solid #d49b54;padding:3px 8px;border-radius:6px">개발판 · 실제 기록과 분리</span></header>'),'utf8');
console.log('Preview built: '+destination);