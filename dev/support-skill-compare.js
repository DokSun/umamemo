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
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const server=()=>localStorage.getItem('umamemo-dev-v1:uma-tracker-server-v1')==='jp'?'jp':'ko';
 let mode='team',kind='hint',cards=[],cardById=new Map(),hints=null,events=null;
 let selections={team:blankDeck(),pair:blankDeck(),decks:[blankDeck(),blankDeck()]};
 let compareCount=2,activeDeck=0;
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

 const currentIds=()=>mode==='decks'?selections.decks[activeDeck]:selections[mode].slice(0,mode==='pair'?compareCount:5);
 const read=()=>{
  try{
   const data=JSON.parse(localStorage.getItem(keyPrefix+server()));
   if(!data)return;
   if(Array.isArray(data.team))selections.team=cleanDeck(data.team);
   if(Array.isArray(data.pair))selections.pair=cleanDeck(data.pair);
   if(Array.isArray(data.decks)&&data.decks.length>=2){
    selections.decks=data.decks.slice(0,5).map(cleanDeck);
   }
   compareCount=Math.max(2,Math.min(5,Number(data.compareCount)||2));
   activeDeck=Math.min(activeDeck,selections.decks.length-1);
  }catch(err){console.warn('스킬 비교 선택 정보 로딩 실패',err)}
 };
 const save=()=>{
  try{localStorage.setItem(keyPrefix+server(),JSON.stringify({...selections,compareCount}))}
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
 function renderSlots(){
  const holder=root.querySelector('#skill-compare-slots');
  const selected=currentIds();
  holder.innerHTML=Array.from({length:selected.length},(_,i)=>{
   const id=selected[i],card=cardById.get(Number(id));
   return '<div class="skill-compare-slot '+(card?'filled':'')+'"><span class="skill-compare-slot-label">'+labels[mode][i]+'</span>'
    +'<button type="button" class="skill-compare-slot-art" data-skill-pick="'+i+'" aria-label="'+esc(labels[mode][i]+': '+(card?cardName(card):'서포트카드 선택'))+'">'
    +(card?cardArt(card.id):'<span class="skill-compare-add-mark">＋</span>')
    +'</button>'
    +'<button type="button" class="skill-compare-slot-name" data-skill-pick="'+i+'" title="'+esc(card?cardName(card):'서포트카드 선택')+'">'+esc(card?cardName(card):'카드 선택')+'</button>'
    +(card?'<small class="skill-compare-slot-meta">'+esc(cardDesc(card))+'</small>':'')
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
  const sorted=[...rows].sort((a,b)=>b.cards.size-a.cards.size||skillInfo(a.id).name.localeCompare(skillInfo(b.id).name,'ko'));
  const headers=ids.map((id,i)=>{
   const name=id?cardLabel(id):labels[mode][i]+' 미선택';
   return '<th scope="col" class="skill-compare-matrix-card" title="'+esc(name)+'"><div class="skill-compare-matrix-card-heading">'
    +(id?'<span class="skill-compare-matrix-portrait">'+cardArt(id)+'</span>':'<span class="skill-compare-matrix-portrait empty">＋</span>')
    +'<span class="skill-compare-matrix-label">'+esc(labels[mode][i])+'</span></div></th>';
  }).join('');
  return '<section class="skill-compare-table-wrap"><h3>'+esc(heading)+'</h3>'
   +'<div class="skill-compare-scroll"><table class="skill-compare-matrix"><thead><tr><th scope="col" class="skill-compare-matrix-skill">스킬</th>'
   +headers+'<th scope="col" class="skill-compare-matrix-total">제공</th></tr></thead><tbody>'
   +(sorted.length?sorted.map(row=>rowMarkup(row,ids)).join(''):'<tr><td colspan="'+(ids.length+2)+'" class="skill-compare-empty">'+esc(emptyMsg)+'</td></tr>')
   +'</tbody></table></div></section>';
 }
 function renderResults(){
  const out=root.querySelector('#skill-compare-results');
  if(!cards.length||!hints||!events){out.innerHTML='<p class="skill-compare-note">서포트카드 및 스킬 DB를 불러오는 중입니다.</p>';return}
  const ids=currentIds(),picked=ids.filter(Boolean),map=entryMap(ids);
  if(!picked.length){out.innerHTML='<p class="skill-compare-note">카드를 선택하면 비교 결과가 표시됩니다.</p>';return}
  const values=[...map.values()],total=values.reduce((n,x)=>n+x.cards.size,0),duplicated=values.filter(x=>x.cards.size>=2).length;
  let html='<div class="skill-compare-stats">'+statBox('고유 스킬',values.length+'종')+statBox('중복 스킬',duplicated+'종')+statBox('총 카드별 스킬 항목',total+'건')+'</div>';
  if(mode==='team'){
   html+='<p class="skill-compare-note">격자의 각 열은 서포트카드, 각 행은 스킬입니다. 초록색 ✓는 해당 카드가 제공하는 스킬입니다. 같은 카드에서 훈련·이벤트가 겹쳐도 1회로 셉니다.</p>';
   html+=renderTable(values,ids,'5장 편성 스킬 목록','선택한 카드에 해당하는 스킬이 없습니다.');
   const dist=[1,2,3,4,5].map(n=>n+'장 제공 '+values.filter(x=>x.cards.size===n).length+'종').join(' · ');
   html+='<p class="skill-compare-note">'+dist+'</p>';
  }else if(mode==='pair'){
   const all=values.filter(x=>x.cards.size===picked.length&&picked.length>=2);
   html+='<p class="skill-compare-note">선택한 '+picked.length+'장 중 제공하는 카드가 하나뿐인 스킬과 여러 카드에 겹치는 스킬을 격자로 비교합니다.</p>';
   html+='<div class="skill-compare-stats">'+statBox('한 카드에만 있는 스킬',values.filter(x=>x.cards.size===1).length+'종')
    +statBox('여러 카드 공통 스킬',duplicated+'종')+statBox('선택한 모든 카드 공통',all.length+'종')+'</div>';
   html+=renderTable(values,ids,'카드별 스킬 격자','선택한 카드의 스킬이 없습니다.');
  }else{
   const decks=selections.decks.map((deck,index)=>({index,deck,map:entryMap(deck),selected:deck.filter(Boolean).length}));
   const top=Math.max(0,...decks.map(d=>d.map.size));
   const min=Math.min(...decks.map(d=>d.map.size));
   html='<section class="skill-compare-deck-summary"><h3>편성별 총 스킬 개수</h3>'
    +'<p class="skill-compare-note">각 편성에서 중복을 제거한 획득 가능 스킬 종류를 비교합니다. 미선택 카드는 계산에서 제외됩니다.</p>'
    +'<div class="skill-compare-deck-comparisons">'
    +decks.map(d=>{
     const totalEntries=[...d.map.values()].reduce((sum,x)=>sum+x.cards.size,0);
     const repeated=[...d.map.values()].filter(x=>x.cards.size>=2).length;
     const diff=d.map.size-top;
     return '<div class="skill-compare-deck-result '+(d.index===activeDeck?'is-active':'')+'"><div class="skill-compare-deck-result-head"><strong>편성 '+(d.index+1)+'</strong><span>'+d.selected+'/5장</span></div>'
      +'<div class="skill-compare-deck-result-count">'+d.map.size+'종</div>'
      +'<div class="skill-compare-deck-bar"><span style="width:'+(top?Math.max(0,d.map.size/top*100):0)+'%"></span></div>'
      +'<div class="skill-compare-deck-stats">중복 스킬 '+repeated+'종 · 중복 포함 '+totalEntries+'건</div>'
      +'<div class="skill-compare-deck-stats">최다 편성 대비 '+diff+'종</div>'
      +'<button type="button" data-skill-deck="'+d.index+'">편성 '+(d.index+1)+' 확인·수정</button></div>';
    }).join('')
    +'</div>'
    +'<p class="skill-compare-note">최다 편성과 최소 편성의 차이: '+(top-min)+'종</p></section>';
   const active=decks[activeDeck];
   const ownership=decks.map(d=>new Set(d.map.keys()));
   const exclusive=[...active.map.values()].filter(x=>ownership.every((set,i)=>i===activeDeck||!set.has(x.id)));
   html+=statBox('현재 편성에서만 획득 가능한 스킬',exclusive.length+'종');
   html+=renderTable([...active.map.values()],active.deck,'편성 '+(activeDeck+1)+' 스킬 구성','선택한 편성의 스킬이 없습니다.');
  }
  html+='<p class="skill-compare-note">표시된 스킬은 획득 가능한 후보입니다. 실제 획득 확률은 계산하지 않습니다. 이벤트 스킬의 ID 미확정 항목은 별도 이름으로 표시됩니다.</p>';
  out.innerHTML=html;
 }
 function render(){
  root.querySelectorAll('[data-skill-mode]').forEach(b=>{b.classList.toggle('active',b.dataset.skillMode===mode);b.setAttribute('aria-pressed',String(b.dataset.skillMode===mode))});
  root.querySelectorAll('[data-skill-kind]').forEach(b=>{b.classList.toggle('active',b.dataset.skillKind===kind);b.setAttribute('aria-pressed',String(b.dataset.skillKind===kind))});
  root.querySelector('#skill-compare-intro').textContent=mode==='team'?'5장의 서포트카드가 제공하는 스킬을 확인합니다.':mode==='pair'?'2~5장의 서포트카드 스킬을 서로 비교합니다.':'여러 개의 5장 편성에서 획득 가능한 총 스킬 종류 수를 비교합니다.';
  root.querySelector('#skill-compare-card-count-wrap').hidden=mode!=='pair';
  root.querySelector('#skill-compare-card-count').value=String(compareCount);
  root.querySelector('#skill-compare-deck-controls').hidden=mode!=='decks';
  renderDeckControls();renderSlots();renderResults();
 }
 function renderDeckControls(){
  const list=root.querySelector('#skill-compare-deck-tabs');
  list.innerHTML=selections.decks.map((d,i)=>'<button type="button" data-skill-deck="'+i+'" class="'+(i===activeDeck?'active':'')+'" aria-pressed="'+(i===activeDeck)+'">편성 '+(i+1)+'</button>').join('');
  root.querySelector('#skill-compare-add-deck').disabled=selections.decks.length>=5;
  root.querySelector('#skill-compare-remove-deck').disabled=selections.decks.length<=2;
 }
 function openPicker(i){
  if(typeof window.umamemoOpenSupportPicker!=='function')return;
  const ids=currentIds();
  const unavailable=new Set(ids.filter((_,idx)=>idx!==i).filter(Boolean));
  window.umamemoOpenSupportPicker({
   title:(mode==='decks'?'편성 '+(activeDeck+1)+' · ':'')+labels[mode][i]+' 선택',
   filter:c=>!['friend','group'].includes(c.typeRaw)&&!unavailable.has(c.id),
   onSelect:c=>{
    if(mode==='decks')selections.decks[activeDeck][i]=c.id;
    else selections[mode][i]=c.id;
    save();render();
   },
   onClear:()=>{
    if(mode==='decks')selections.decks[activeDeck][i]=null;
    else selections[mode][i]=null;
    save();render();
   }
  });
 }
 root.addEventListener('click',e=>{
  const m=e.target.closest('[data-skill-mode]');
  if(m){mode=m.dataset.skillMode;render();return}
  const k=e.target.closest('[data-skill-kind]');
  if(k){kind=k.dataset.skillKind;renderResults();root.querySelectorAll('[data-skill-kind]').forEach(b=>{b.classList.toggle('active',b.dataset.skillKind===kind);b.setAttribute('aria-pressed',String(b.dataset.skillKind===kind))});return}
  const pick=e.target.closest('[data-skill-pick]');
  if(pick){openPicker(Number(pick.dataset.skillPick));return}
  const remove=e.target.closest('[data-skill-remove]');
  if(remove){
   if(mode==='decks')selections.decks[activeDeck][Number(remove.dataset.skillRemove)]=null;
   else selections[mode][Number(remove.dataset.skillRemove)]=null;
   save();render();return;
  }
  const deck=e.target.closest('[data-skill-deck]');
  if(deck){activeDeck=Number(deck.dataset.skillDeck);render();return}
  if(e.target.closest('#skill-compare-add-deck')){
   if(selections.decks.length<5){selections.decks.push(blankDeck());activeDeck=selections.decks.length-1;save();render()}return;
  }
  if(e.target.closest('#skill-compare-remove-deck')){
   if(selections.decks.length>2){
    selections.decks.splice(activeDeck,1);
    activeDeck=Math.max(0,Math.min(activeDeck,selections.decks.length-1));save();render();
   }return;
  }
 });
 root.querySelector('#skill-compare-card-count').addEventListener('change',e=>{
  compareCount=Math.max(2,Math.min(5,Number(e.target.value)||2));save();render();
 });
 // Keep the comparison independent per server, including when the user changes
 // servers without reloading the page.
 document.getElementById('server-mode')?.addEventListener('change',()=>{
  selections={team:blankDeck(),pair:blankDeck(),decks:[blankDeck(),blankDeck()]};
  compareCount=2;activeDeck=0;read();
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
