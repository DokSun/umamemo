'use strict';
(() => {
 const root=document.getElementById('support-skills-panel');
 if(!root)return;
 const keyPrefix='umamemo-dev-v1:skill-compare-';
 const slotsByMode={team:5,pair:5,decks:5};
 const labels={team:['카드 1','카드 2','카드 3','카드 4','카드 5'],pair:['카드 A','카드 B','카드 C','카드 D','카드 E'],decks:['카드 1','카드 2','카드 3','카드 4','카드 5']};
 const blankDeck=()=>[null,null,null,null,null];
 const cleanDeck=arr=>Array.from({length:5},(_,i)=>Number(Array.isArray(arr)?arr[i]:null)||null);
 const typeNames={speed:'스피드',stamina:'스태미나',power:'파워',guts:'근성',intelligence:'지능'};
 const types=Object.keys(typeNames);
 const defaultTypeSlots=()=>[];
 const typeIcon={speed:'speed',stamina:'stamina',power:'power',guts:'guts',intelligence:'wisdom'};
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const server=()=>localStorage.getItem('umamemo-dev-v1:uma-tracker-server-v1')==='jp'?'jp':'ko';
 let mode='team',kind='hint',cards=[],cardById=new Map(),hints=null,events=null;
 let selections={team:blankDeck(),pair:blankDeck(),decks:[blankDeck(),blankDeck()]};
 let candidates=[[],[],[],[],[]],typeSlots=defaultTypeSlots(),page=0;
 const typeCounts=()=>types.map(type=>typeSlots.filter(t=>t===type).length);
 let modalPreviousFocus=null;
 const candidateLimit=8,resultsPageSize=25;
 let activeSlot=null,pickerPage=0;
 const pickerPageSize=24;
 let imageIndex={};
 const imageURL=id=>{
  const src=imageIndex[String(id)];
  try{return typeof src==='string'&&new URL(src).protocol==='https:'?src:null}catch{return null}
 };
 const cardArt=(id,loading='lazy')=>{
  const src=imageURL(id);
  return src?'<img src="'+esc(src)+'" alt="" loading="'+loading+'" decoding="async" referrerpolicy="no-referrer" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="skill-compare-no-image" hidden>이미지 없음</span>'
   :'<span class="skill-compare-no-image">이미지 없음</span>';
 };

 const currentIds=()=>mode==='decks'?[]:selections[mode];
 const read=()=>{
  try{
   const data=JSON.parse(localStorage.getItem(keyPrefix+server()));
   if(!data)return;
   if(Array.isArray(data.team))selections.team=cleanDeck(data.team);
   if(Array.isArray(data.pair))selections.pair=cleanDeck(data.pair);
   if(Array.isArray(data.typeSlots)&&data.typeSlots.length<=5&&data.typeSlots.every(t=>types.includes(t))){
    typeSlots=[...data.typeSlots];
   }else if(Array.isArray(data.typeCounts)&&data.typeCounts.length===5){
    typeSlots=types.flatMap((type,i)=>Array.from({length:Math.min(5,Math.max(0,Number(data.typeCounts[i])||0))},()=>type)).slice(0,5);
   }
   if(Array.isArray(data.typeCandidates)&&data.typeCandidates.length===5){
    candidates=data.typeCandidates.map((arr,i)=>Array.isArray(arr)?[...new Set(arr.map(Number).filter(id=>id>0&&(!cardById.size||cardById.get(id)?.typeRaw===types[i])))].slice(0,candidateLimit):[]);
   }
  }catch(err){console.warn('스킬 비교 선택 정보 로딩 실패',err)}
 };
 const save=()=>{
  try{localStorage.setItem(keyPrefix+server(),JSON.stringify({team:selections.team,pair:selections.pair,typeSlots,typeCandidates:candidates}))}
  catch(err){console.warn('스킬 비교 선택 정보 저장 실패',err)}
 };
 const cardName=c=>server()==='ko'?c.nameKo:(c.nameJa||c.nameKo);
 const cardDesc=c=>[typeNames[c.typeRaw]||c.type,c.rarity].filter(Boolean).join(' · ');
 const skillInfo=id=>{
  if(typeof id==='string'&&id.startsWith('en:'))return {name:id.slice(3)+' (ID 확인 필요)',ambiguous:true};
  const info=hints?.skills?.[id]||events?.skills?.[id]||{};
  return {name:info.ko||info.en||'#'+id,ambiguous:false};
 };
 const entryMap=(ids)=>{
  const result=new Map();
  for(const id of ids.filter(Boolean)){
   const owned=cardById.get(Number(id));if(!owned)continue;
   const sets=[];
   if(kind!=='event')sets.push(['hint',hints?.cards?.[id]||[]]);
   if(kind!=='hint')sets.push(['event',events?.cards?.[id]||[]]);
   for(const [source,skills] of sets)for(const sid of skills){
    const key=String(sid);
    if(!result.has(key))result.set(key,{id:key,cards:new Set(),sources:new Set(),perCard:new Map()});
    const row=result.get(key);row.cards.add(Number(id));row.sources.add(source);
    if(!row.perCard.has(Number(id)))row.perCard.set(Number(id),new Set());
    row.perCard.get(Number(id)).add(source);
   }
  }
  return result;
 };
 const cardLabel=id=>{const c=cardById.get(Number(id));return c?cardName(c):'미선택'};
 const cardCount=id=>entryMap([id]).size;
 function renderTypeSelector(){
  const area=root.querySelector('#skill-compare-type-configuration');
  area.hidden=mode!=='decks';
  if(mode!=='decks')return;
  const counts=typeCounts();
  root.querySelector('#skill-compare-type-buttons').innerHTML=types.map((type,i)=>{
   const disabled=typeSlots.length>=5?' disabled':'';
   return '<button type="button" class="skill-compare-type-add" data-skill-type-add="'+i+'"'+disabled+' aria-label="'+esc(typeNames[type]+' 추가')+'">'
    +'<span class="type-icon type-icon-'+typeIcon[type]+'" aria-hidden="true"></span>'
    +'<span>'+typeNames[type]+'</span><small>'+counts[i]+'장</small></button>';
  }).join('');
  root.querySelector('#skill-compare-type-slots').innerHTML=Array.from({length:5},(_,i)=>{
   const type=typeSlots[i];
   return type
    ?'<button type="button" class="skill-compare-equipped-type" data-skill-type-remove="'+i+'" aria-label="'+esc((i+1)+'번 '+typeNames[type]+' 제거')+'" title="'+esc(typeNames[type]+' 제거')+'">'
     +'<span class="type-icon type-icon-'+typeIcon[type]+'" aria-hidden="true"></span><span class="skill-compare-equipped-remove" aria-hidden="true">×</span></button>'
    :'<span class="skill-compare-empty-type" aria-label="'+(i+1)+'번 빈 칸">＋</span>';
  }).join('');
  root.querySelector('#skill-compare-type-total').textContent=typeSlots.length+' / 5장';
 }
 function renderSlots(){
  const holder=root.querySelector('#skill-compare-slots');
  const selected=currentIds();
  if(mode==='decks'){
   holder.classList.add('candidate-layout','skill-compare-typed-candidates');
   const counts=typeCounts();
   holder.innerHTML=types.map((type,i)=>{
    const group=candidates[i];
    const cardsHtml=group.map((id,j)=>{
     const card=cardById.get(id);
     return '<div class="skill-compare-candidate">'
      +'<button type="button" class="skill-compare-slot-art" data-skill-pick="'+i+'" data-skill-replace="'+j+'" aria-label="'+esc(typeNames[type]+' · '+(card?cardName(card):'카드 선택'))+'">'+cardArt(id)+'</button>'
      +'<span class="skill-compare-candidate-count">'+cardCount(id)+'종</span>'
      +'<button type="button" class="skill-compare-remove" data-skill-candidate-remove="'+i+':'+j+'" aria-label="'+esc(typeNames[type]+' 후보 제거')+'">×</button></div>';
    }).join('');
    return '<div class="skill-compare-candidate-column"><strong>'+typeNames[type]+'</strong>'
     +'<span class="skill-compare-type-status">'+group.length+'장 후보 · '+counts[i]+'장 편성</span>'
     +'<div class="skill-compare-candidate-stack">'+cardsHtml+'</div>'
     +(group.length<candidateLimit?'<button type="button" class="skill-compare-add-candidate" data-skill-add-candidate="'+i+'">＋ '+typeNames[type]+' 후보</button>':'')
     +'</div>';
   }).join('');
   return;
  }
  holder.classList.remove('candidate-layout');
  holder.innerHTML=Array.from({length:5},(_,i)=>{
   const id=selected[i],card=cardById.get(Number(id));
   return '<div class="skill-compare-slot '+(card?'filled':'')+'"><span class="skill-compare-slot-label">'+labels[mode][i]+'</span>'
    +'<button type="button" class="skill-compare-slot-art" data-skill-pick="'+i+'" aria-label="'+esc(labels[mode][i]+': '+(card?cardName(card):'서포트카드 선택'))+'">'
    +(card?cardArt(card.id):'<span class="skill-compare-add-mark">＋</span>')+'</button>'
    +'<button type="button" class="skill-compare-slot-name" data-skill-pick="'+i+'" title="'+esc(card?cardName(card):'서포트카드 선택')+'">'+esc(card?cardName(card):'카드 선택')+'</button>'
    +'<span class="skill-compare-slot-meta">'+(card?cardCount(card.id)+'종 · '+esc(cardDesc(card)):'미선택')+'</span>'
    +(card?'<button type="button" class="skill-compare-remove" data-skill-remove="'+i+'" aria-label="'+esc(labels[mode][i])+' 제거">×</button>':'')
    +'</div>';
  }).join('');
 }
 function statBox(name,val,detail=''){return '<div class="skill-compare-stat"><span>'+esc(name)+'</span><strong>'+esc(val)+'</strong>'+(detail?'<small>'+esc(detail)+'</small>':'')+'</div>'}
 const percentage=(n,d)=>d?(100*n/d).toFixed(1)+'%':'—';
 function rowMarkup(entry,columnIds){
  const details=skillInfo(entry.id);
  const mapped=columnIds.map((id,i)=>{
   const found=id&&entry.cards.has(Number(id));
   const types=found?[...entry.perCard.get(Number(id))].map(t=>t==='hint'?'훈련 힌트':'이벤트').join(' + '):'';
   const title=labels[mode][i]+(id?' · '+cardLabel(id):' · 미선택')+(types?' · '+types:'');
   return '<td class="skill-compare-matrix-cell '+(found?'has-skill':'no-skill')+'" title="'+esc(title)+'" aria-label="'+esc(title+(found?' · 스킬 제공':' · 해당 스킬 없음'))+'">'
    +(found?'<span aria-hidden="true">✓</span>':'<span aria-hidden="true">·</span>')+'</td>';
  }).join('');
  const flag=entry.sources.has('hint')&&entry.sources.has('event')?'훈련+이벤트':entry.sources.has('hint')?'훈련':'이벤트';
  return '<tr><th scope="row" class="skill-compare-matrix-skill"><span class="skill-compare-skill-name">'+esc(details.name)+'</span><small>'+flag+'</small></th>'
   +mapped+'<td class="skill-compare-count">'+entry.cards.size+'장</td></tr>';
 }
 function renderTable(rows,ids,heading,emptyMsg){
  // Priority: overlapping skills first, first owning card A-E, then its original skill order.
  const cardOrder=id=>{
   const ids=[];
   if(kind!=='event')ids.push(...(hints?.cards?.[id]||[]));
   if(kind!=='hint')ids.push(...(events?.cards?.[id]||[]));
   return ids.map(String);
  };
  const orders=ids.map(id=>id?cardOrder(id):[]);
  const sortKey=row=>{
   for(let i=0;i<ids.length;i++){
    if(ids[i]&&row.cards.has(Number(ids[i])))return [i,orders[i].indexOf(String(row.id))];
   }
   return [99,99];
  };
  const sorted=[...rows].sort((a,b)=>{
   const repeated=Number(b.cards.size>1)-Number(a.cards.size>1);
   if(repeated)return repeated;
   const x=sortKey(a),y=sortKey(b);
   return x[0]-y[0]||x[1]-y[1]||skillInfo(a.id).name.localeCompare(skillInfo(b.id).name,'ko');
  });
  const headers=ids.map((id,i)=>{
   const name=id?cardLabel(id):labels[mode][i]+' 미선택';
   return '<th scope="col" class="skill-compare-matrix-card" title="'+esc(name)+'"><div class="skill-compare-matrix-card-heading">'
    +(id?'<span class="skill-compare-matrix-portrait">'+cardArt(id)+'</span>':'<span class="skill-compare-matrix-portrait empty">＋</span>')
    +'<span class="skill-compare-matrix-label">'+esc(labels[mode][i])+'</span>'
    +'<span class="skill-compare-matrix-card-count">'+(id?cardCount(id)+'종':'0종')+'</span></div></th>';
  }).join('');
  return '<section class="skill-compare-table-wrap"><h3>'+esc(heading)+'</h3>'
   +'<div class="skill-compare-scroll"><table class="skill-compare-matrix"><thead><tr><th scope="col" class="skill-compare-matrix-skill">스킬</th>'
   +headers+'<th scope="col" class="skill-compare-matrix-total">제공</th></tr></thead><tbody>'
   +(sorted.length?sorted.map(row=>rowMarkup(row,ids)).join(''):'<tr><td colspan="'+(ids.length+2)+'" class="skill-compare-empty">'+esc(emptyMsg)+'</td></tr>')
   +'</tbody></table></div></section>';
 }
 // Enumerate all valid combinations of exactly one candidate per position.
 // Duplicate support cards cannot appear twice within one deck.

 function chooseCards(group,n){
  if(n===0)return [[]];
  if(group.length<n)return [];
  const out=[],picked=[];
  const dfs=start=>{
   if(picked.length===n){out.push([...picked]);return}
   for(let i=start;i<=group.length-(n-picked.length);i++){
    picked.push(group[i]);dfs(i+1);picked.pop();
   }
  };
  dfs(0);return out;
 }
 function combinations(){
  if(typeSlots.length!==5)return [];
  const counts=typeCounts();
  const options=candidates.map((group,i)=>chooseCards(group,counts[i]));
  if(options.some(group=>group.length===0))return [];
  const skillsByCard=new Map();
  for(const id of new Set(candidates.flat())){
   const set=new Set();
   if(kind!=='event')for(const sid of hints?.cards?.[id]||[])set.add(String(sid));
   if(kind!=='hint')for(const sid of events?.cards?.[id]||[])set.add(String(sid));
   skillsByCard.set(id,set);
  }
  const combos=[],picked=[];
  const walk=(type,union,total)=>{
   if(type===5){
    combos.push({ids:[...picked],count:union.size,total,overlap:total-union.size});
    return;
   }
   for(const group of options[type]){
    const next=new Set(union);
    let entries=total;
    for(const id of group){
     picked.push(id);
     const skills=skillsByCard.get(id)||new Set();
     entries+=skills.size;
     for(const sid of skills)next.add(sid);
    }
    walk(type+1,next,entries);
    picked.length-=group.length;
   }
  };
  walk(0,new Set(),0);
  combos.sort((a,b)=>b.count-a.count||a.overlap-b.overlap||a.ids.join(',').localeCompare(b.ids.join(',')));
  return combos;
 }
 function renderCombinationResults(){
  const totalCount=typeSlots.length;
  const counts=typeCounts();
  if(totalCount!==5)return '<p class="skill-compare-validation">속성별 편성 장수 합계가 5장이 되도록 설정하세요. 현재 '+totalCount+'장입니다.</p>';
  const missing=types.filter((type,i)=>candidates[i].length<counts[i]).map(type=>typeNames[type]);
  if(missing.length)return '<p class="skill-compare-validation">'+esc(missing.join(' · '))+' 속성에 지정된 장수 이상의 후보 카드를 추가하세요.</p>';
  const possible=candidates.map((group,i)=>chooseCards(group,counts[i]).length).reduce((n,x)=>n*x,1);
  const combos=combinations(),maxPages=Math.max(1,Math.ceil(combos.length/resultsPageSize));
  if(page>=maxPages)page=0;
  const visible=combos.slice(page*resultsPageSize,(page+1)*resultsPageSize);
  let html='<section class="skill-compare-deck-summary"><h3>편성 조합 순위</h3>'
   +'<p class="skill-compare-note">각 속성에서 설정한 장수만큼 선택하는 모든 편성을 계산합니다. 중복을 제거한 스킬 종류가 많은 순서로 표시합니다.</p>'
   +'<div class="skill-compare-combo-meta">유효 편성 '+possible.toLocaleString()+'개 · 고유 스킬 수 내림차순</div>';
  html+='<div class="skill-compare-combo-list">'+visible.map((combo,i)=>{
   const rank=page*resultsPageSize+i+1;
   const images=combo.ids.map(id=>'<div class="skill-compare-combo-member" title="'+esc(cardLabel(id))+'">'+cardArt(id)+'</div>').join('');
   return '<div class="skill-compare-combo-row"><span class="skill-compare-combo-rank">'+rank+'위</span><div class="skill-compare-combo-images">'+images+'</div>'
    +'<div class="skill-compare-combo-scores"><strong>'+combo.count+'종</strong><small>중복 포함 '+combo.total+'건 · 중복 초과 '+combo.overlap+'건</small></div>'
    +'<button type="button" data-skill-combo-detail="'+(page*resultsPageSize+i)+'">스킬 보기</button></div>';
  }).join('')+'</div>';
  html+='<div class="skill-compare-combo-pager"><button type="button" data-skill-combo-page="'+(page-1)+'" '+(page===0?'disabled':'')+'>◀ 이전</button>'
   +'<span>'+(page+1)+' / '+maxPages+' 페이지</span><button type="button" data-skill-combo-page="'+(page+1)+'" '+(page===maxPages-1?'disabled':'')+'>다음 ▶</button></div>';
  return html+'</section>';
 }
 function openCombinationDetail(index){
  const combo=combinations()[index];if(!combo)return;
  modalPreviousFocus=document.activeElement;
  const modal=root.querySelector('#skill-compare-detail-dialog');
  root.querySelector('#skill-compare-detail-title').textContent='편성 스킬 · '+combo.count+'종';
  root.querySelector('#skill-compare-detail-content').innerHTML=renderTable([...entryMap(combo.ids).values()],combo.ids,'보유 스킬 목록','보유 스킬이 없습니다.');
  modal.hidden=false;
  document.body.classList.add('skill-compare-dialog-open');
  root.querySelector('#skill-compare-detail-close').focus();
 }
 function closeCombinationDetail(){
  const modal=root.querySelector('#skill-compare-detail-dialog');
  if(modal.hidden)return;
  modal.hidden=true;
  document.body.classList.remove('skill-compare-dialog-open');
  if(modalPreviousFocus?.isConnected)modalPreviousFocus.focus();
  modalPreviousFocus=null;
 }
 function renderResults(){
  const out=root.querySelector('#skill-compare-results');
  if(!cards.length||!hints||!events){out.innerHTML='<p class="skill-compare-note">서포트카드 및 스킬 DB를 불러오는 중입니다.</p>';return}
  const ids=currentIds(),picked=ids.filter(Boolean),map=entryMap(ids);
  if(!picked.length&&mode!=='decks'){out.innerHTML='<p class="skill-compare-note">카드를 선택하면 비교 결과가 표시됩니다.</p>';return}
  const values=[...map.values()],total=values.reduce((n,x)=>n+x.cards.size,0),duplicated=values.filter(x=>x.cards.size>=2).length;
  let html='<div class="skill-compare-stats">'+statBox('고유 스킬',values.length+'종')+statBox('중복 스킬',duplicated+'종')+statBox('총 카드별 스킬 항목',total+'건')+'</div>';
  if(mode==='team'){
   html+='<p class="skill-compare-note">격자의 각 열은 서포트카드, 각 행은 스킬입니다. 초록색 ✓는 해당 카드가 제공하는 스킬입니다. 같은 카드에서 훈련·이벤트가 겹쳐도 1회로 셉니다.</p>';
   html+=renderTable(values,ids,'보유 스킬 목록','선택한 카드에 해당하는 스킬이 없습니다.');
   const dist=[1,2,3,4,5].map(n=>n+'장 제공 '+values.filter(x=>x.cards.size===n).length+'종').join(' · ');
   html+='<p class="skill-compare-note">'+dist+'</p>';
  }else if(mode==='pair'){
   const all=values.filter(x=>x.cards.size===picked.length&&picked.length>=2);
   html+='<p class="skill-compare-note">선택한 '+picked.length+'장 중 제공하는 카드가 하나뿐인 스킬과 여러 카드에 겹치는 스킬을 격자로 비교합니다.</p>';
   html+='<div class="skill-compare-stats">'+statBox('한 카드에만 있는 스킬',values.filter(x=>x.cards.size===1).length+'종')
    +statBox('여러 카드 공통 스킬',duplicated+'종')+statBox('선택한 모든 카드 공통',all.length+'종')+'</div>';
   html+=renderTable(values,ids,'보유 스킬 목록','선택한 카드의 스킬이 없습니다.');
  }else{
   html=renderCombinationResults();
  }
  html+='<p class="skill-compare-note">표시된 스킬은 획득 가능한 후보입니다. 실제 획득 확률은 계산하지 않습니다. 이벤트 스킬의 ID 미확정 항목은 별도 이름으로 표시됩니다.</p>';
  out.innerHTML=html;
 }
 function render(){
  root.querySelectorAll('[data-skill-mode]').forEach(b=>{b.classList.toggle('active',b.dataset.skillMode===mode);b.setAttribute('aria-pressed',String(b.dataset.skillMode===mode))});
  root.querySelectorAll('[data-skill-kind]').forEach(b=>{b.classList.toggle('active',b.dataset.skillKind===kind);b.setAttribute('aria-pressed',String(b.dataset.skillKind===kind))});
  closeCombinationDetail();
  root.querySelector('#skill-compare-result-section').classList.toggle('comparison-decks',mode==='decks');
  root.querySelector('#skill-compare-candidate-section').hidden=mode!=='decks';
  renderTypeSelector();
  root.querySelector('#skill-compare-intro').textContent=mode==='team'
   ?'서포트카드 5장의 획득 가능 스킬을 확인합니다.'
   :mode==='pair'?'카드 A~E의 보유 스킬과 중복을 비교합니다. 비워 둔 슬롯은 제외합니다.'
   :'속성별 편성 장수를 설정하고, 각 속성에 후보 카드를 등록하면 모든 가능한 편성을 계산합니다.';
  renderSlots();renderResults();
 }
 function openPicker(i,replaceIndex=null){
  if(typeof window.umamemoOpenSupportPicker!=='function')return;
  const current=mode==='decks'?candidates[i]:(selections[mode]||[]);
  const used=new Set(mode==='decks'?candidates[i]:current);
  if(mode!=='decks')used.delete(current[i]);
  if(mode==='decks'&&replaceIndex!==null)used.delete(candidates[i][replaceIndex]);
  window.umamemoOpenSupportPicker({
   title:(mode==='decks'?typeNames[types[i]]+' · ':'')+labels[mode][i]+' 선택',
   filter:c=>!['friend','group'].includes(c.typeRaw)&&!used.has(c.id)&&(mode!=='decks'||c.typeRaw===types[i]),
   onSelect:c=>{
    if(mode==='decks'){
     if(replaceIndex===null)candidates[i].push(c.id);
     else candidates[i][replaceIndex]=c.id;
     page=0;
    }else selections[mode][i]=c.id;
    save();render();
   },
   onClear:()=>{
    if(mode==='decks'){
     if(replaceIndex!==null)candidates[i].splice(replaceIndex,1);
     page=0;
    }else selections[mode][i]=null;
    save();render();
   }
  });
 }
 root.addEventListener('click',e=>{
  const typeAdd=e.target.closest('[data-skill-type-add]');
  if(typeAdd&&typeSlots.length<5){
   const type=types[Number(typeAdd.dataset.skillTypeAdd)];
   if(type){typeSlots.push(type);page=0;save();render()}return;
  }
  const typeRemove=e.target.closest('[data-skill-type-remove]');
  if(typeRemove){
   typeSlots.splice(Number(typeRemove.dataset.skillTypeRemove),1);
   page=0;save();render();return;
  }
  const m=e.target.closest('[data-skill-mode]');
  if(m){mode=m.dataset.skillMode;page=0;render();return}
  const k=e.target.closest('[data-skill-kind]');
  if(k){kind=k.dataset.skillKind;page=0;render();return}
  const removeCandidate=e.target.closest('[data-skill-candidate-remove]');
  if(removeCandidate){
   const [i,j]=removeCandidate.dataset.skillCandidateRemove.split(':').map(Number);
   candidates[i].splice(j,1);page=0;save();render();return;
  }
  const add=e.target.closest('[data-skill-add-candidate]');
  if(add){openPicker(Number(add.dataset.skillAddCandidate));return}
  const pick=e.target.closest('[data-skill-pick]');
  if(pick){
   const replace=pick.hasAttribute('data-skill-replace')?Number(pick.dataset.skillReplace):null;
   openPicker(Number(pick.dataset.skillPick),replace);return;
  }
  const remove=e.target.closest('[data-skill-remove]');
  if(remove){selections[mode][Number(remove.dataset.skillRemove)]=null;save();render();return}
  const resultPage=e.target.closest('[data-skill-combo-page]');
  if(resultPage&&!resultPage.disabled){page=Number(resultPage.dataset.skillComboPage);renderResults();return}
  const detail=e.target.closest('[data-skill-combo-detail]');
  if(detail){openCombinationDetail(Number(detail.dataset.skillComboDetail));return}
  if(e.target.closest('#skill-compare-detail-close')||e.target.id==='skill-compare-detail-dialog'){closeCombinationDetail();return}
 });
 document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&!root.querySelector('#skill-compare-detail-dialog').hidden){e.preventDefault();closeCombinationDetail()}
 });
 // Keep the comparison independent per server, including when the user changes
 // servers without reloading the page.
 document.getElementById('server-mode')?.addEventListener('change',()=>{
  selections={team:blankDeck(),pair:blankDeck(),decks:[blankDeck(),blankDeck()]};
  candidates=[[],[],[],[],[]];typeSlots=defaultTypeSlots();page=0;closeCombinationDetail();read();
  render();
 });
 async function load(){
  try{
   const responses=await Promise.all(['support_cards.json','support_skill_hints.json','support_skill_events.json','image_sources.json'].map(f=>fetch('./data/'+f,{cache:'no-store'})));
   if(responses.some(x=>!x.ok))throw Error('서포트 카드/스킬/이미지 DB HTTP 오류');
   const [allCards,hintData,eventData,imageData]=await Promise.all(responses.map(x=>x.json()));
   cards=allCards;hints=hintData;events=eventData;
   imageIndex=imageData?.images&&typeof imageData.images==='object'?imageData.images:{};
   cards=cards.filter(c=>!['friend','group'].includes(c.typeRaw));cardById=new Map(cards.map(c=>[c.id,c]));
   read();render();
  }catch(err){console.error('서포트 스킬 비교 DB 로딩 실패',err);root.querySelector('#skill-compare-results').textContent='스킬 DB를 불러오지 못했습니다. 페이지를 새로고침해 주세요.'}
 }
 render();load();
})();
