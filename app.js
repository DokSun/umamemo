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
// Shared image URL index is used by both the main counter and saved-preset previews.
let remoteImages = {};

// Each tool declares its data scope and a reset handler. Future tools register here.
const LAYOUT_KEY='uma-tracker-layout-v1';
const TOOLS={
 counter:{name:'서포트 이벤트 카운팅',scope:'session',element:'counter-panel',
  reset(){state.slots.forEach(s=>{s.step=0;s.random=[false,false]});state.slots.forEach((_,i)=>updateEvents(i));save()}},
 memo:{name:'메모장',scope:'independent',element:'memo-panel',
  reset(){state.scenario='';$('scenario').value='';save()}}
};
function readLayout(){
 const initial={mode:'split',tool:'memo',ratio:60,reversed:false};
 try{
  const s=JSON.parse(localStorage.getItem(LAYOUT_KEY));
  if(s&&typeof s==='object')return {
   mode:s.mode==='single'?'single':'split',
   tool:Object.hasOwn(TOOLS,s.tool)?s.tool:'memo',
   ratio:[50,60,70].includes(Number(s.ratio))?Number(s.ratio):60,
   reversed:s.reversed===true
  };
 }catch(e){console.warn('화면 설정을 불러오지 못했습니다',e)}
 return initial;
}
const layout=readLayout();
function saveLayout(){try{localStorage.setItem(LAYOUT_KEY,JSON.stringify(layout))}catch(e){console.warn('화면 설정 저장 실패',e)}}
function visibleToolIds(){return layout.mode==='single'?[layout.tool]:['counter',layout.tool==='counter'?'memo':layout.tool]}
function renderResetActions(){
 const ids=visibleToolIds();
 const allSession=ids.length>1&&ids.every(id=>TOOLS[id].scope==='session');
 const primary=$('reset'),secondary=$('secondary-reset');
 const counterFooter=$('counter-reset-footer'),memoFooter=$('memo-reset-footer');
 if(allSession){
  // A shared session reset appears once, at the bottom of the counter panel.
  primary.textContent='육성 기록 통합 초기화';
  primary.dataset.targets=ids.join(',');
  counterFooter.hidden=false;
  memoFooter.hidden=true;
 }else{
  // Reset buttons belong to their own tool panels, including standalone mode.
  primary.textContent=TOOLS.counter.name+' 초기화';
  primary.dataset.targets='counter';
  counterFooter.hidden=!ids.includes('counter');
  secondary.textContent=TOOLS.memo.name+' 초기화';
  secondary.dataset.targets='memo';
  memoFooter.hidden=!ids.includes('memo');
 }
}
function applyLayout(){
 if(layout.mode==='split'&&layout.tool==='counter')layout.tool='memo';
 const ids=visibleToolIds(),workspace=$('workspace'),solo=layout.mode==='single';
 workspace.classList.toggle('single',solo);
 workspace.classList.toggle('split',!solo);
 workspace.classList.toggle('reversed',!solo&&layout.reversed);
 workspace.style.setProperty('--counter-share',layout.ratio+'fr');
 workspace.style.setProperty('--other-share',(100-layout.ratio)+'fr');
 for(const [id,tool] of Object.entries(TOOLS))$(tool.element).hidden=!ids.includes(id);
 $('split-toggle').checked=!solo;
 $('split-ratio').querySelectorAll('input[type="radio"]').forEach(r=>{r.checked=Number(r.value)===layout.ratio});
 $('split-options').hidden=solo;
 $('swap-panels').setAttribute('aria-pressed',String(layout.reversed));
 $('tool-menu-list').querySelectorAll('[data-tool]').forEach(btn=>{
  const active=btn.dataset.tool===layout.tool;
  btn.classList.toggle('active',active);
  btn.setAttribute('aria-current',active?'true':'false');
 });
 renderResetActions();
 saveLayout();
}
function resetTargets(button){
 const ids=(button.dataset.targets||'').split(',').filter(id=>Object.hasOwn(TOOLS,id));
 if(!ids.length)return;
 const desc=ids.length===1?TOOLS[ids[0]].name+'의 기록을':'현재 표시된 육성 기록을 모두';
 if(!confirm(desc+' 초기화할까요?'))return;
 ids.forEach(id=>TOOLS[id].reset());
 toast(ids.length>1?'육성 기록을 함께 초기화했습니다':'초기화했습니다');
}
function toggleToolMenu(open){
 $('tool-menu').hidden=!open;
 $('tool-menu-toggle').setAttribute('aria-expanded',String(open));
}
function initWorkspace(){
 $('tool-menu-list').replaceChildren(...Object.entries(TOOLS).map(([id,t])=>{
  const btn=document.createElement('button');
  btn.type='button';btn.dataset.tool=id;
  btn.textContent=t.name;
  btn.className='tool-menu-item';
  return btn;
 }));
 $('tool-menu-toggle').addEventListener('click',()=>toggleToolMenu($('tool-menu').hidden));
 $('tool-menu-list').addEventListener('click',e=>{
  const btn=e.target.closest('[data-tool]');if(!btn)return;
  if(layout.mode==='split'&&btn.dataset.tool==='counter')layout.mode='single';
  layout.tool=btn.dataset.tool;
  applyLayout();
  toggleToolMenu(false);
 });
 $('split-toggle').addEventListener('change',e=>{
  layout.mode=e.target.checked?'split':'single';
  if(layout.mode==='split'&&layout.tool==='counter')layout.tool='memo';
  applyLayout();
 });
 $('split-ratio').addEventListener('change',e=>{if(!e.target.matches('input[type="radio"]'))return;layout.ratio=Number(e.target.value);applyLayout()});
 $('swap-panels').addEventListener('click',()=>{layout.reversed=!layout.reversed;applyLayout()});
 document.addEventListener('click',e=>{
  if(!e.target.closest('.tool-menu-wrap'))toggleToolMenu(false);
 });
 document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&!$('tool-menu').hidden){toggleToolMenu(false);$('tool-menu-toggle').focus()}
 });
 $('reset').addEventListener('click',()=>resetTargets($('reset')));
 $('secondary-reset').addEventListener('click',()=>resetTargets($('secondary-reset')));
 applyLayout();
}


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
  row.innerHTML=`<span class="preset-label" tabindex="0" aria-describedby="preset-preview-${i}">세트 ${i+1}<small>${p?'저장됨':'비어 있음'}</small></span><button type="button" data-save-preset="${i}">저장</button><button type="button" data-load-preset="${i}" ${p?'':'disabled'}>불러오기</button>`;
  if(p){
   const preview=document.createElement('div');
   preview.className='preset-preview';
   preview.id='preset-preview-'+i;
   preview.setAttribute('role','tooltip');
   const label=document.createElement('div');
   label.className='preset-preview-title';
   label.textContent='세트 '+(i+1)+' · 서포트 카드 6장';
   preview.append(label);
   const grid=document.createElement('div');
   grid.className='preset-preview-grid';
   for(const slot of p.slots){
    const item=document.createElement('div');
    item.className='preset-preview-card';
    const card=findCard(slot.id);
    const url=slot.id!=null?remoteImages[String(slot.id)]:null;
    if(card&&validRemoteURL(url)){
     const img=document.createElement('img');
     img.src=url;
     img.alt=cardLabel(card);
     img.title=cardLabel(card);
     img.loading='lazy';
     img.referrerPolicy='no-referrer';
     img.onerror=()=>{item.textContent='이미지 없음';item.classList.add('missing')};
     item.append(img);
    }else{
     item.textContent=slot.id!=null?'이미지 없음':'빈 슬롯';
     item.classList.add('missing');
    }
    grid.append(item);
   }
   preview.append(grid);
   row.append(preview);
  }
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
// Compare ISO release dates in Korean local time; missing dates mean not released.
function koreaDate(){
 return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
}
function visibleCard(c){
 return serverMode==='jp'||(typeof c.releaseKo==='string'&&/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(c.releaseKo)&&c.releaseKo<=koreaDate());
}
function findCard(id){return cards.find(c=>String(c.id)===String(id))}
function category(c){return c?.type==='친구'?'friend':c?.type==='그룹'?'group':'normal'}
function countFor(slot,c){return category(c)==='friend'?5:category(c)==='group'?slot.groupCount:3}
const TYPE_ICONS={스피드:'speed',스태미나:'stamina',파워:'power',근성:'guts',지능:'wisdom',친구:'friend',그룹:'group'};
function slotRender(i){const s=state.slots[i],c=findCard(s.id),n=countFor(s,c),kind=category(c);const el=document.createElement('div');el.className='slot';el.innerHTML=`<div><button type="button" class="portrait-trigger" data-open-picker="${i}" aria-label="${escapeHTML(cardLabel(c)||"서포트 카드 선택")}"><div class="portrait placeholder" id="photo-${i}">카드 선택</div></button></div><div class="info"><div class="topline"><div class="choices" style="flex:1"><span class="card-title-line">${c&&TYPE_ICONS[c.type]?`<span class="type-icon type-icon-${TYPE_ICONS[c.type]} card-type-icon" title="${escapeHTML(c.type)}" aria-label="${escapeHTML(c.type)}"></span>`:'' }<span class="search card-name-text" title="${escapeHTML(cardLabel(c)||"카드를 선택하세요")}">${escapeHTML(cardLabel(c)||"카드를 선택하세요")}</span></span></div><button data-clear="${i}">비우기</button></div>${c?`<div class="events">${Array.from({length:n},(_,j)=>`<button data-step="${i}:${j+1}" class="${s.step>=j+1?'on':''}" aria-pressed="${s.step>=j+1}">${j+1}</button>`).join('')}${kind==='group'?`<label class="groupopts">단계 수 <select data-group="${i}">${[1,2,3,4,5].map(x=>`<option value="${x}" ${n===x?'selected':''}>${x}</option>`).join('')}</select></label>`:''}</div>${kind==='normal'?`<div class="events">${['A','B'].map((x,j)=>`<button data-random="${i}:${j}" class="${s.random[j]?'on':''}" aria-pressed="${!!s.random[j]}">${x}</button>`).join('')}</div>`:''}`:''}</div>`;return el}
// External URL metadata, not image files, is published with the site.
const wikiLookups = new Map();
const photoVersions = Array(6).fill(0);
function validRemoteURL(url){
 try{return typeof url==='string'&&new URL(url).protocol==='https:'}catch{return false}
}
async function lookupWikiImage(id){
 const key=String(id);
 if(wikiLookups.has(key))return wikiLookups.get(key);
 const promise=(async()=>{
  const endpoints=['https://umamusu.wiki/api.php','https://umamusu.wiki/w/api.php'];
  for(const endpoint of endpoints){
   try{
    const params=new URLSearchParams({
     action:'query',prop:'imageinfo',iiprop:'url',iiurlwidth:'180',
     titles:'File:Support Card '+key+'.png|File:Support Card '+key+' Icon.png',
     format:'json',formatversion:'2',origin:'*'
    });
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),7500);
    let data;
    try{
     const response=await fetch(endpoint+'?'+params,{signal:controller.signal,mode:'cors',credentials:'omit'});
     if(!response.ok)continue;
     data=await response.json();
    }finally{clearTimeout(timeout)}
    const pages=data?.query?.pages||[];
    for(const page of pages){
     const link=page?.imageinfo?.[0]?.thumburl||page?.imageinfo?.[0]?.url;
     if(validRemoteURL(link)){
      remoteImages[key]=link;
      return link;
     }
    }
   }catch(e){console.debug('Wiki image lookup unavailable',e)}
  }
  return null;
 })();
 wikiLookups.set(key,promise);
 return promise;
}
async function renderPhoto(i){
 const token=++photoVersions[i],card=findCard(state.slots[i]?.id),box=$('photo-'+i);
 if(!box||!card)return;
 const id=String(card.id);
 function stillCurrent(){
  return token===photoVersions[i]&&String(state.slots[i]?.id)===id&&box.isConnected;
 }
 let src=remoteImages[id];
 if(!validRemoteURL(src))src=await lookupWikiImage(id);
 if(!stillCurrent()||!validRemoteURL(src))return;
 const img=document.createElement('img');
 img.className='portrait';img.id='photo-'+i;img.alt=cardLabel(card);
 img.referrerPolicy='no-referrer';
 img.onerror=()=>{
  if(img.isConnected){
   const placeholder=document.createElement('div');
   placeholder.className='portrait placeholder';placeholder.id='photo-'+i;
   placeholder.textContent='이미지 없음';
   img.replaceWith(placeholder);
  }
 };
 img.src=src;
 if(stillCurrent())box.replaceWith(img);
}
async function loadRemoteImageIndex(){
 try{
  const response=await fetch('./data/image_sources.json',{cache:'no-store'});
  if(!response.ok)throw Error('Image URL index missing');
  const index=await response.json();
  if(index&&typeof index.images==='object'&&!Array.isArray(index.images))
   remoteImages=index.images;
  if(!$('card-picker').hidden)pickerRender();
  presetRender();
 }catch(e){console.debug('Using on-demand wiki image lookup',e)}
 state.slots.forEach((_,i)=>{
  const box=$('photo-'+i);
  if(box&&box.classList.contains('placeholder'))renderPhoto(i);
 });
}
loadRemoteImageIndex();

function render(){const target=$('slots');target.replaceChildren(...state.slots.map((_,i)=>slotRender(i)));state.slots.forEach((_,i)=>renderPhoto(i));save()}
function updateEvents(i){const s=state.slots[i];document.querySelectorAll('[data-step]').forEach(b=>{const [slot,n]=b.dataset.step.split(':').map(Number);if(slot!==i)return;const on=s.step>=n;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on))});document.querySelectorAll('[data-random]').forEach(b=>{const [slot,n]=b.dataset.random.split(':').map(Number);if(slot!==i)return;const on=!!s.random[n];b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on))})}
// Image gallery card picker: uses the existing card DB and external thumbnail index.
const PICKER_PAGE_SIZE=20;
const PICKER_TYPES=[
 ['전체','전체',null],['스피드','스피드','speed'],['스태미나','스태미나','stamina'],['파워','파워','power'],
 ['근성','근성','guts'],['지능','지능','wisdom'],['친구','친구','friend'],['그룹','그룹','group']
];
let pickerSlot=null,pickerType='전체',pickerRarity='SSR',pickerPage=0;
let pickerPreviousFocus=null;
function pickerClose(){
 $('card-picker').hidden=true;
 document.body.classList.remove('picker-open');
 pickerSlot=null;
 if(pickerPreviousFocus&&pickerPreviousFocus.isConnected)pickerPreviousFocus.focus();
 pickerPreviousFocus=null;
}
function pickerOpen(i){
 if(!cards.length)return toast('카드 DB를 불러오는 중입니다');
 pickerSlot=i;
 pickerPreviousFocus=document.activeElement;
 pickerPage=0;
 $('card-picker').hidden=false;
 document.body.classList.add('picker-open');
 pickerRender();
 $('picker-close').focus();
}
function pickerFiltered(){
 return cards.filter(c=>{
  if(!visibleCard(c))return false;
  if(pickerType!=='전체'&&c.type!==pickerType)return false;
  if(c.rarity!==pickerRarity)return false;
  return true;
 }).sort((a,b)=>Number(b.id)-Number(a.id));
}
function pickerRender(){
 if($('card-picker').hidden)return;
 $('picker-types').innerHTML=PICKER_TYPES.map(([key,label,icon])=>
  `<button type="button" data-picker-type="${escapeHTML(key)}" title="${escapeHTML(label)}" aria-label="${escapeHTML(label)}" aria-pressed="${pickerType===key}" class="${pickerType===key?'active':''}">${icon?`<span class="type-icon type-icon-${icon}" aria-hidden="true"></span>`:'전체'}</button>`
 ).join('');
 $('picker-rarities').innerHTML=['SSR','SR','R'].map(x=>
  `<button type="button" data-picker-rarity="${x}" aria-pressed="${pickerRarity===x}" class="${pickerRarity===x?'active':''}">${x}</button>`
 ).join('');
 const matched=pickerFiltered(),pages=Math.max(1,Math.ceil(matched.length/PICKER_PAGE_SIZE));
 pickerPage=Math.max(0,Math.min(pickerPage,pages-1));
 const windowCards=matched.slice(pickerPage*PICKER_PAGE_SIZE,(pickerPage+1)*PICKER_PAGE_SIZE);
 $('picker-grid').innerHTML=windowCards.length?windowCards.map(c=>{
  const src=remoteImages[String(c.id)],name=escapeHTML(cardLabel(c));
  const image=validRemoteURL(src)?
   `<img src="${escapeHTML(src)}" alt="" loading="lazy" referrerpolicy="no-referrer">`:
   '<span class="picker-noimage">이미지 없음</span>';
  return `<button type="button" class="picker-card" data-picker-card="${c.id}" title="${name}" aria-label="${escapeHTML(c.rarity)} ${escapeHTML(c.type)} ${name}">${image}</button>`;
 }).join(''):'<div class="picker-empty">검색 조건에 맞는 카드가 없습니다.</div>';
 const pager=$('picker-pager');
 const start=Math.max(0,Math.min(pickerPage-2,pages-5));
 const end=Math.min(pages,start+5);
 pager.innerHTML=`<button type="button" data-picker-page="${pickerPage-1}" ${pickerPage===0?'disabled':''}>◀ 이전</button><span class="picker-pages">${Array.from({length:end-start},(_,i)=>{
  const p=start+i;return `<button type="button" data-picker-page="${p}" class="${p===pickerPage?'active':''}" aria-current="${p===pickerPage?'page':'false'}">${p+1}</button>`;
 }).join('')}</span><button type="button" data-picker-page="${pickerPage+1}" ${pickerPage>=pages-1?'disabled':''}>다음 ▶</button>`;
}
$('picker-types').addEventListener('click',e=>{
 const b=e.target.closest('[data-picker-type]');if(!b)return;
 pickerType=b.dataset.pickerType;pickerPage=0;pickerRender();
});
$('picker-rarities').addEventListener('click',e=>{
 const b=e.target.closest('[data-picker-rarity]');if(!b)return;
 pickerRarity=b.dataset.pickerRarity;pickerPage=0;pickerRender();
});
$('picker-pager').addEventListener('click',e=>{
 const b=e.target.closest('[data-picker-page]');if(!b||b.disabled)return;
 pickerPage=Number(b.dataset.pickerPage);pickerRender();
});
$('picker-grid').addEventListener('click',e=>{
 const b=e.target.closest('[data-picker-card]');if(!b||pickerSlot===null)return;
 const c=findCard(b.dataset.pickerCard);if(!c||!visibleCard(c))return;
 state.slots[pickerSlot]={id:c.id,step:0,random:[false,false],groupCount:3};
 pickerClose();render();
});
$('picker-close').addEventListener('click',pickerClose);
$('card-picker').addEventListener('click',e=>{if(e.target===$('card-picker'))pickerClose()});
document.addEventListener('keydown',e=>{
 if($('card-picker').hidden)return;
 if(e.key==='Escape'){e.preventDefault();pickerClose();return}
 if(e.key==='Tab'){
  const f=[...$('card-picker').querySelectorAll('button:not([disabled]),input:not([disabled])')].filter(x=>x.offsetParent!==null);
  if(!f.length)return;
  if(e.shiftKey&&document.activeElement===f[0]){e.preventDefault();f[f.length-1].focus()}
  else if(!e.shiftKey&&document.activeElement===f[f.length-1]){e.preventDefault();f[0].focus()}
 }
});

$('slots').addEventListener('change',e=>{
 const t=e.target;
 if(t.matches('[data-group]')){
  const i=+t.dataset.group;
  state.slots[i].groupCount=+t.value;
  state.slots[i].step=Math.min(state.slots[i].step,+t.value);
  render();
 }
});
$('slots').addEventListener('click',async e=>{const t=e.target.closest('button');if(!t)return;let i,j;if(t.dataset.openPicker!==undefined){pickerOpen(Number(t.dataset.openPicker))}else if(t.dataset.clear){i=+t.dataset.clear;state.slots[i]={id:null,step:0,random:[false,false],groupCount:3};render()}else if(t.dataset.step){[i,j]=t.dataset.step.split(':').map(Number);const s=state.slots[i];s.step=s.step>=j?j-1:j;updateEvents(i);save()}else if(t.dataset.random){[i,j]=t.dataset.random.split(':').map(Number);state.slots[i].random[j]=!state.slots[i].random[j];updateEvents(i);save()}});
$('scenario').value=state.scenario||'';$('scenario').addEventListener('input',e=>{state.scenario=e.target.value;save()});
initWorkspace();
fetch('./data/support_cards.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('DB HTTP '+r.status);return r.json()}).then(d=>{cards=d;render();presetRender()}).catch(err=>{toast('DB를 읽지 못했습니다. 웹 서버에서 실행하세요.');console.error(err)});
