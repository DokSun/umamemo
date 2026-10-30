'use strict';
const SERVER_KEY='uma-tracker-server-v1';
let serverMode=localStorage.getItem(SERVER_KEY)==='jp'?'jp':'ko';
let KEY=serverMode==='ko'?'uma-tracker-v1':'uma-tracker-v1-jp';
function initialState(){return {slots:Array.from({length:6},()=>({id:null,step:0,random:[false,false],groupCount:3})),scenario:''}}
function readState(){
 const base=initialState();
 try{
  const old=JSON.parse(localStorage.getItem(KEY));
  if(old&&Array.isArray(old.slots))
   return {...base,...old,slots:Array.from({length:6},(_,i)=>({...base.slots[i],...(old.slots[i]||{})}))};
 }catch(err){console.warn('진행 상태 읽기 실패',err)}
 return base;
}
let cards=[],state=readState();

const $=id=>document.getElementById(id);const save=()=>localStorage.setItem(KEY,JSON.stringify(state));
let PRESET_KEY=serverMode==='ko'?'uma-tracker-presets-v1':'uma-tracker-presets-v1-jp';
const emptySlot=()=>({id:null,step:0,random:[false,false],groupCount:3});
function readPresets(){
 try{
  const stored=JSON.parse(localStorage.getItem(PRESET_KEY));
  if(Array.isArray(stored))return Array.from({length:3},(_,i)=>stored[i]&&Array.isArray(stored[i].slots)&&stored[i].slots.length===6?stored[i]:null);
 }catch(err){console.warn('편성 세트 읽기 실패',err)}
 return [null,null,null];
}
let presets=readPresets();
function cleanSlot(s){
 const count=Math.max(1,Math.min(5,Number(s?.groupCount)||3));
 return {id:s?.id??null,step:Math.max(0,Math.min(5,Number(s?.step)||0)),random:[!!s?.random?.[0],!!s?.random?.[1]],groupCount:count};
}
function presetRender(){
 const root=$('preset-menu');
 root.replaceChildren(...presets.map((p,i)=>{
  const row=document.createElement('div');
  row.className='preset-row';
  row.innerHTML=`<span class="preset-label">세트 ${i+1}<small>${p?'저장됨':'비어 있음'}</small></span><button type="button" data-save-preset="${i}">저장</button><button type="button" data-load-preset="${i}" ${p?'':'disabled'}>불러오기</button>`;
  return row;
 }));
}
function togglePresetMenu(open){
 $('preset-menu').hidden=!open;
 $('preset-toggle').setAttribute('aria-expanded',String(open));
}
$('preset-toggle').addEventListener('click',()=>togglePresetMenu($('preset-menu').hidden));
$('preset-menu').addEventListener('click',e=>{
 const btn=e.target.closest('button');
 if(!btn)return;
 if('savePreset' in btn.dataset){
  const i=Number(btn.dataset.savePreset);
  if(presets[i]&&!confirm(`세트 ${i+1}을(를) 현재 편성으로 덮어쓸까요?`))return;
  const next=presets.slice();
  next[i]={slots:state.slots.map(cleanSlot)};
  try{
   localStorage.setItem(PRESET_KEY,JSON.stringify(next));
   presets=next;
   presetRender();
   toast(`세트 ${i+1} 저장 완료`);
  }catch(err){toast('편성 세트 저장 실패: '+err.message)}
 }else if('loadPreset' in btn.dataset){
  const i=Number(btn.dataset.loadPreset),p=presets[i];
  if(!p)return;
  state.slots=p.slots.map(cleanSlot);
  render();
  togglePresetMenu(false);
  toast(`세트 ${i+1} 불러오기 완료`);
 }
});
document.addEventListener('click',e=>{
 if(!e.target.closest('.preset-dropdown'))togglePresetMenu(false);
});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&!$('preset-menu').hidden){togglePresetMenu(false);$('preset-toggle').focus()}
});
presetRender();

function toast(msg){$('toast').textContent=msg;$('toast').style.display='block';clearTimeout(toast.t);toast.t=setTimeout(()=>$('toast').style.display='none',3200)}
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function openDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open('uma-tracker-images',1);r.onupgradeneeded=()=>r.result.createObjectStore('images');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function imageGet(id){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction('images','readonly');const r=tx.objectStore('images').get(String(id));r.onsuccess=()=>{resolve(r.result);db.close()};r.onerror=()=>{reject(r.error);db.close()}})}
async function imagePut(id,blob){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction('images','readwrite');tx.objectStore('images').put(blob,String(id));tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(tx.error)}})}
function cardLabel(c){
 if(!c)return '';
 if(serverMode==='ko')return c.nameKo||c.characterKo||'';
 return String(c.titleJa||'')+String(c.characterKo||'');
}
function switchServer(next){
 if(next!== 'ko'&&next!=='jp')return;
 if(serverMode===next)return;
 save();
 serverMode=next;
 KEY=next==='ko'?'uma-tracker-v1':'uma-tracker-v1-jp';
 PRESET_KEY=next==='ko'?'uma-tracker-presets-v1':'uma-tracker-presets-v1-jp';
 try{localStorage.setItem(SERVER_KEY,next)}catch(err){console.warn('서버 선택 저장 실패',err)}
 state=readState();
 presets=readPresets();
 $('scenario').value=state.scenario||'';
 presetRender();
 render();
 toast(next==='ko'?'한국 서버 모드':'일본 서버 모드');
}
$('server-mode').value=serverMode;
$('server-mode').addEventListener('change',e=>switchServer(e.target.value));
const findCard=id=>cards.find(c=>String(c.id)===String(id));
function category(c){return c?.type==='친구'?'friend':c?.type==='그룹'?'group':'normal'}
function countFor(slot,c){return category(c)==='friend'?5:category(c)==='group'?slot.groupCount:3}
function slotRender(i){const s=state.slots[i],c=findCard(s.id),n=countFor(s,c),kind=category(c);const el=document.createElement('div');el.className='slot';el.innerHTML=`<div><div class="portrait placeholder" id="photo-${i}">이미지 없음</div><div class="imageops"><label class="button">사진 등록<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden data-image="${i}"></label></div></div><div class="info"><div class="topline"><div class="choices" style="flex:1"><input class="search" data-search="${i}" placeholder="카드 이름 검색" value="${escapeHTML(cardLabel(c))}" autocomplete="off"><div class="results" id="results-${i}" hidden></div></div><button data-clear="${i}">비우기</button></div><div class="meta">${c?`${escapeHTML(c.rarity)} · ${escapeHTML(c.type)}`:'카드를 선택하세요'}</div>${c?`<div class="events">${Array.from({length:n},(_,j)=>`<button data-step="${i}:${j+1}" class="${s.step>=j+1?'on':''}" aria-pressed="${s.step>=j+1}">${j+1}</button>`).join('')}${kind==='group'?`<label class="groupopts">단계 수 <select data-group="${i}">${[1,2,3,4,5].map(x=>`<option value="${x}" ${n===x?'selected':''}>${x}</option>`).join('')}</select></label>`:''}</div>${kind==='normal'?`<div class="events">${['A','B'].map((x,j)=>`<button data-random="${i}:${j}" class="${s.random[j]?'on':''}" aria-pressed="${!!s.random[j]}">${x}</button>`).join('')}</div>`:''}`:''}</div>`;return el}
async function renderPhoto(i){const s=state.slots[i],box=$('photo-'+i);if(!box)return;const c=findCard(s.id);if(!c)return;try{const blob=await imageGet(c.id);if(!blob)return;const url=URL.createObjectURL(blob);const img=document.createElement('img');img.className='portrait';img.alt=c.nameKo;img.src=url;img.onload=()=>URL.revokeObjectURL(url);img.onerror=()=>URL.revokeObjectURL(url);if(box.isConnected)box.replaceWith(img);img.id='photo-'+i}catch(e){console.error(e)}}
function render(){const target=$('slots');target.replaceChildren(...state.slots.map((_,i)=>slotRender(i)));state.slots.forEach((_,i)=>renderPhoto(i));save()}
function updateEvents(i){const s=state.slots[i];document.querySelectorAll('[data-step]').forEach(b=>{const [slot,n]=b.dataset.step.split(':').map(Number);if(slot!==i)return;const on=s.step>=n;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on))});document.querySelectorAll('[data-random]').forEach(b=>{const [slot,n]=b.dataset.random.split(':').map(Number);if(slot!==i)return;const on=!!s.random[n];b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on))})}
function results(i,q){const el=$('results-'+i);q=q.trim().toLowerCase();if(!q){el.hidden=true;return}const found=cards.filter(c=>(cardLabel(c)+' '+c.nameKo+' '+c.nameJa+' '+c.characterKo+' '+c.id).toLowerCase().includes(q)).slice(0,35);el.innerHTML=found.map(c=>`<button data-choose="${i}:${c.id}">${escapeHTML(cardLabel(c))} <small>(${escapeHTML(c.rarity)} · ${escapeHTML(c.type)})</small></button>`).join('')||'<p class="hint">검색 결과 없음</p>';el.hidden=false}
$('slots').addEventListener('input',e=>{if(e.target.matches('[data-search]'))results(Number(e.target.dataset.search),e.target.value)});
$('slots').addEventListener('change',async e=>{const t=e.target;if(t.matches('[data-group]')){const i=+t.dataset.group;state.slots[i].groupCount=+t.value;state.slots[i].step=Math.min(state.slots[i].step,+t.value);render()}if(t.matches('[data-image]')){const i=+t.dataset.image,c=findCard(state.slots[i].id),f=t.files?.[0];if(!c)return toast('먼저 카드를 선택하세요');if(!f)return;if(!['image/png','image/jpeg','image/webp','image/gif'].includes(f.type)||f.size>8*1024*1024)return toast('PNG/JPG/WebP/GIF, 8MB 이하만 가능합니다');try{await imagePut(c.id,f);render();toast('이미지가 이 브라우저에 저장되었습니다')}catch(err){toast('이미지 저장 실패: '+err.message)}}});
$('slots').addEventListener('click',async e=>{const t=e.target.closest('button');if(!t)return;let i,j;if(t.dataset.choose){[i,j]=t.dataset.choose.split(':').map(Number);state.slots[i]={id:j,step:0,random:[false,false],groupCount:3};render()}else if(t.dataset.clear){i=+t.dataset.clear;state.slots[i]={id:null,step:0,random:[false,false],groupCount:3};render()}else if(t.dataset.step){[i,j]=t.dataset.step.split(':').map(Number);const s=state.slots[i];s.step=s.step>=j?j-1:j;updateEvents(i);save()}else if(t.dataset.random){[i,j]=t.dataset.random.split(':').map(Number);state.slots[i].random[j]=!state.slots[i].random[j];updateEvents(i);save()}});
document.addEventListener('click',e=>{if(!e.target.closest('.choices'))document.querySelectorAll('.results').forEach(x=>x.hidden=true)});
$('scenario').value=state.scenario||'';$('scenario').addEventListener('input',e=>{state.scenario=e.target.value;save()});
$('reset').onclick=()=>{
 if(!confirm('현재 편성은 유지하고 모든 카드의 이벤트 진행 기록만 초기화할까요?'))return;
 state.slots.forEach(s=>{s.step=0;s.random=[false,false]});
 state.slots.forEach((_,i)=>updateEvents(i));
 save();
 toast('이벤트 진행 기록을 초기화했습니다');
};
fetch('./data/support_cards.json').then(r=>{if(!r.ok)throw Error('DB HTTP '+r.status);return r.json()}).then(d=>{cards=d;render()}).catch(err=>{toast('DB를 읽지 못했습니다. 웹 서버에서 실행하세요.');console.error(err)});
