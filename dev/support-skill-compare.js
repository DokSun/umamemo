'use strict';
(() => {
 const root=document.getElementById('support-skills-panel');
 if(!root)return;
 const keyPrefix='umamemo-dev-v1:skill-compare-';
 const slotsByMode={team:5,pair:2,swap:6};
 const labels={team:['카드 1','카드 2','카드 3','카드 4','카드 5'],pair:['카드 A','카드 B'],swap:['고정 1','고정 2','고정 3','고정 4','후보 A','후보 B']};
 const typeNames={speed:'스피드',stamina:'스태미나',power:'파워',guts:'근성',intelligence:'지능'};
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const server=()=>localStorage.getItem('umamemo-dev-v1:uma-tracker-server-v1')==='jp'?'jp':'ko';
 let mode='team',kind='hint',cards=[],cardById=new Map(),hints=null,events=null;
 let selections={team:[null,null,null,null,null],pair:[null,null],swap:[null,null,null,null,null,null]};
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

 const read=()=>{try{const data=JSON.parse(localStorage.getItem(keyPrefix+server()));if(data){for(const m of Object.keys(slotsByMode))if(Array.isArray(data[m]))selections[m]=Array.from({length:slotsByMode[m]},(_,i)=>Number(data[m][i])||null)}}catch(err){console.warn(err)}};
 const save=()=>{try{localStorage.setItem(keyPrefix+server(),JSON.stringify(selections))}catch(err){console.warn(err)}};
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
  holder.innerHTML=Array.from({length:slotsByMode[mode]},(_,i)=>{
   const id=selections[mode][i],card=cardById.get(Number(id));
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
 function rowMarkup(entry,columnIds,sortMode='count'){
  const details=skillInfo(entry.id);
  const mapped=columnIds.map((id,i)=>{
   const found=id&&entry.cards.has(Number(id));
   const types=found?[...entry.perCard.get(Number(id))].map(t=>t==='hint'?'훈련':'이벤트').join('+'):'';
   return '<span class="skill-compare-presence '+(found?'yes':'')+'" title="'+esc(labels[mode][i]+(types?' · '+types:''))+'">'+(found?'●':'·')+'</span>';
  }).join('');
  const flag=entry.sources.has('hint')&&entry.sources.has('event')?'훈련+이벤트':entry.sources.has('hint')?'훈련':'이벤트';
  return '<tr><td><span class="skill-compare-skill-name">'+esc(details.name)+'</span><small>'+flag+'</small></td><td><div class="skill-compare-dots">'+mapped+'</div></td><td class="skill-compare-count">'+entry.cards.size+'장</td></tr>';
 }
 function renderTable(rows,ids,heading,emptyMsg){
  const sorted=[...rows].sort((a,b)=>b.cards.size-a.cards.size||skillInfo(a.id).name.localeCompare(skillInfo(b.id).name,'ko'));
  return '<section class="skill-compare-table-wrap"><h3>'+esc(heading)+'</h3><div class="skill-compare-scroll"><table><thead><tr><th>스킬</th><th>'+ids.map((_,i)=>'<span title="'+esc(labels[mode][i])+'">'+esc(String(i+1))+'</span>').join('')+'</th><th>제공</th></tr></thead><tbody>'
   +(sorted.length?sorted.map(row=>rowMarkup(row,ids)).join(''):'<tr><td colspan="3">'+esc(emptyMsg)+'</td></tr>')
   +'</tbody></table></div></section>';
 }
 function renderResults(){
  const out=root.querySelector('#skill-compare-results');
  if(!cards.length||!hints||!events){out.innerHTML='<p class="skill-compare-note">서포트카드 및 스킬 DB를 불러오는 중입니다.</p>';return}
  const ids=selections[mode],picked=ids.filter(Boolean),map=entryMap(ids);
  if(!picked.length){out.innerHTML='<p class="skill-compare-note">카드를 선택하면 비교 결과가 표시됩니다.</p>';return}
  const values=[...map.values()],total=values.reduce((n,x)=>n+x.cards.size,0),duplicated=values.filter(x=>x.cards.size>=2).length;
  let html='<div class="skill-compare-stats">'+statBox('고유 스킬',values.length+'종')+statBox('중복 스킬',duplicated+'종')+statBox('총 카드별 스킬 항목',total+'건')+'</div>';
  if(mode==='team'){
   html+='<p class="skill-compare-note">스킬별 ●은 제공 카드입니다. 같은 카드의 훈련·이벤트 중복은 카드별 1회로 셉니다.</p>';
   html+=renderTable(values,ids,'5장 편성 스킬 목록','선택한 카드에 해당하는 스킬이 없습니다.');
   const dist=[1,2,3,4,5].map(n=>n+'장 제공 '+values.filter(x=>x.cards.size===n).length+'종').join(' · ');
   html+='<p class="skill-compare-note">'+dist+'</p>';
  }else if(mode==='pair'){
   const a=ids[0],b=ids[1];
   const onlyA=values.filter(x=>a&&x.cards.has(a)&&(!b||!x.cards.has(b)));
   const onlyB=values.filter(x=>b&&x.cards.has(b)&&(!a||!x.cards.has(a)));
   const both=values.filter(x=>a&&b&&x.cards.has(a)&&x.cards.has(b));
   html+='<div class="skill-compare-stats">'+statBox('A 전용',onlyA.length+'종')+statBox('공통',both.length+'종')+statBox('B 전용',onlyB.length+'종')+'</div>';
   html+=renderTable(both,ids,'A·B 공통 스킬','공통 스킬이 없습니다.');
   html+=renderTable(onlyA,ids,'A에만 있는 스킬','해당 스킬이 없습니다.');
   html+=renderTable(onlyB,ids,'B에만 있는 스킬','해당 스킬이 없습니다.');
  }else{
   const fixed=ids.slice(0,4).filter(Boolean),a=ids[4],b=ids[5];
   const base=entryMap(fixed),setA=entryMap([...fixed,a]),setB=entryMap([...fixed,b]);
   const extraA=[...setA.keys()].filter(k=>!base.has(k));
   const extraB=[...setB.keys()].filter(k=>!base.has(k));
   const onlyA=[...setA.keys()].filter(k=>!setB.has(k));
   const onlyB=[...setB.keys()].filter(k=>!setA.has(k));
   const both=[...setA.keys()].filter(k=>setB.has(k));
   const createRows=(keys)=>keys.map(k=>map.get(k)).filter(Boolean);
   html='<div class="skill-compare-stats">'+statBox('공통 4장',base.size+'종')+statBox('4장 + A',setA.size+'종','신규 +'+extraA.length+'종')+statBox('4장 + B',setB.size+'종','신규 +'+extraB.length+'종')+'</div>';
   html+='<p class="skill-compare-note">B − A 고유 스킬 차이: '+(setB.size-setA.size>0?'+':'')+(setB.size-setA.size)+'종 · A 전용 '+onlyA.length+'종 · B 전용 '+onlyB.length+'종</p>';
   html+=renderTable(createRows(onlyA),ids,'A 편성에서만 획득 가능한 스킬','A 편성 전용 스킬이 없습니다.');
   html+=renderTable(createRows(onlyB),ids,'B 편성에서만 획득 가능한 스킬','B 편성 전용 스킬이 없습니다.');
   html+=renderTable(createRows(both),ids,'양쪽 편성 공통 스킬','공통 스킬이 없습니다.');
  }
  html+='<p class="skill-compare-note">표시된 스킬은 획득 가능한 후보입니다. 실제 획득 확률은 계산하지 않습니다. 이벤트 스킬의 ID 미확정 항목은 별도 이름으로 표시됩니다.</p>';
  out.innerHTML=html;
 }
 function render(){
  root.querySelectorAll('[data-skill-mode]').forEach(b=>{b.classList.toggle('active',b.dataset.skillMode===mode);b.setAttribute('aria-pressed',String(b.dataset.skillMode===mode))});
  root.querySelectorAll('[data-skill-kind]').forEach(b=>{b.classList.toggle('active',b.dataset.skillKind===kind);b.setAttribute('aria-pressed',String(b.dataset.skillKind===kind))});
  root.querySelector('#skill-compare-intro').textContent=mode==='team'?'친구·그룹 카드를 제외한 5장을 선택합니다.':mode==='pair'?'서포트카드 두 장의 공통·전용 스킬을 비교합니다.':'공통 4장에 각각 A 또는 B를 추가한 두 편성을 비교합니다.';
  renderSlots();renderResults();
 }
 function openPicker(i){
  if(typeof window.umamemoOpenSupportPicker!=='function')return;
  const unavailable=new Set(selections[mode].filter((_,idx)=>idx!==i).filter(Boolean));
  window.umamemoOpenSupportPicker({
   title:labels[mode][i]+' 선택',
   filter:c=>!['friend','group'].includes(c.typeRaw)&&!unavailable.has(c.id),
   onSelect:c=>{selections[mode][i]=c.id;save();render()},
   onClear:()=>{selections[mode][i]=null;save();render()}
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
  if(remove){selections[mode][Number(remove.dataset.skillRemove)]=null;save();render();return}
 });
 // Keep the comparison independent per server, including when the user changes
 // servers without reloading the page.
 document.getElementById('server-mode')?.addEventListener('change',()=>{
  selections={team:[null,null,null,null,null],pair:[null,null],swap:[null,null,null,null,null,null]};
  read();
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
