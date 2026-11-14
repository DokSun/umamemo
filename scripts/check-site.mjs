import {readFileSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import assert from 'node:assert/strict';
import {Script} from 'node:vm';
const root=resolve(process.argv[2]||'.');
const read=p=>readFileSync(join(root,p),'utf8');
const html=read('index.html'),app=read('app.js'),copy=read('ui-text.js'),css=read('style.css');
for(const [filename,source] of [['app.js',app],['ui-text.js',copy],['training-levels.js',read('training-levels.js')]])new Script(source,{filename});
assert(!/\binitTextManager\s*\(/.test(app),'Removed text manager must not be initialized');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(ids.length,new Set(ids).size,'Duplicate HTML ids');
const idset=new Set(ids);
for(const [,id] of app.matchAll(/\$\('([^']+)'\)/g))assert(idset.has(id),'Missing HTML element #'+id);
for(const [,raw] of html.matchAll(/(?:href|src)="([^"]+)"/g)){
 if(/^(https?:|#|data:)/.test(raw))continue;
 assert(existsSync(join(root,raw.split('?')[0])),'Missing linked asset '+raw);
}
for(const src of [app,css])for(const [,p] of src.matchAll(/\.\/(assets\/[a-zA-Z0-9_./-]+\.(?:png|webp|svg))/g)){
 assert(existsSync(join(root,p)),'Missing icon '+p);
}
for(const file of ['data/support_cards.json','data/image_sources.json','data/schedule_jp.json','data/race_ko_names.json','data/character_ko_names.json'])JSON.parse(read(file));
const schedule=JSON.parse(read('data/schedule_jp.json'));
assert(schedule.races?.length>300,'Race DB too small');
assert(schedule.characters?.length>100,'Character DB too small');
console.log('PASS: script syntax, HTML ids, assets and JSON data');