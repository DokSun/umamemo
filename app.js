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
// Image URL index for the card counter and card picker.
let remoteImages = {};

// Each tool declares its data scope and a reset handler. Future tools register here.
const LAYOUT_KEY='uma-tracker-layout-v1';
const RESET_POPUP_KEY='uma-tracker-reset-popup-v1';
// Confirmation remains enabled for existing users unless explicitly switched off.
let confirmCounterReset=true;
try{confirmCounterReset=localStorage.getItem(RESET_POPUP_KEY)!=='off'}catch(e){console.warn('초기화 팝업 설정 읽기 실패',e)}

const TOOLS={
 counter:{name:'서포트 이벤트 카운팅',scope:'session',element:'counter-panel',
  reset(){state.slots.forEach(s=>{s.step=0;s.random=[false,false]});state.slots.forEach((_,i)=>updateEvents(i));save()}},
 memo:{name:'메모장',scope:'independent',element:'memo-panel',
  reset(){state.scenario='';$('scenario').value='';save()}},
 schedule:{name:'스케줄표',scope:'session',element:'schedule-panel',
  reset(){scheduleCurrent=emptySchedule();saveScheduleCurrent();renderSchedule()}}
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
 const sessionIds=ids.filter(id=>TOOLS[id].scope==='session');
 const primary=$('reset'),secondary=$('secondary-reset');
 const counterFooter=$('counter-reset-footer'),memoFooter=$('memo-reset-footer');
 const scheduleFooter=$('schedule-reset-footer');
 const unified=ids.length>1&&sessionIds.length===ids.length;
 primary.textContent=unified?'육성 기록 통합 초기화':TOOLS.counter.name+' 초기화';
 primary.dataset.targets=unified?ids.join(','):'counter';
 counterFooter.hidden=!ids.includes('counter');
 memoFooter.hidden=!ids.includes('memo');
 secondary.dataset.targets='memo';
 scheduleFooter.hidden=!ids.includes('schedule')||unified;
 $('schedule-reset').dataset.targets='schedule';
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
 const sessionReset=ids.every(id=>TOOLS[id].scope==='session');
 if((!sessionReset||confirmCounterReset)&&!confirm(desc+' 초기화할까요?'))return;
 ids.forEach(id=>TOOLS[id].reset());
 toast(ids.length>1?'육성 기록을 함께 초기화했습니다':'초기화했습니다');
}
function toggleToolMenu(open){
 const menu=$('tool-menu');
 menu.hidden=!open;
 $('tool-menu-backdrop').hidden=!open;
 $('tool-menu-toggle').setAttribute('aria-expanded',String(open));
 menu.setAttribute('aria-modal',String(open));
 document.body.classList.toggle('tool-drawer-open',open);
 if(open){
  $('tool-menu-close').focus();
 }
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
 $('tool-menu-close').addEventListener('click',()=>{toggleToolMenu(false);$('tool-menu-toggle').focus()});
 $('tool-menu-backdrop').addEventListener('click',()=>{toggleToolMenu(false);$('tool-menu-toggle').focus()});
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
  if(!$('tool-menu').hidden&&!e.target.closest('.tool-menu-wrap')&&!e.target.closest('#tool-menu')&&!e.target.closest('#tool-menu-backdrop'))toggleToolMenu(false);
 });
 document.addEventListener('keydown',e=>{
  if($('tool-menu').hidden)return;
  if(e.key==='Escape'){e.preventDefault();toggleToolMenu(false);$('tool-menu-toggle').focus();return}
  if(e.key==='Tab'){
   const nodes=[...$('tool-menu').querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled])')].filter(el=>el.getClientRects().length);
   const first=nodes[0],last=nodes[nodes.length-1];
   if(!first||!last)return;
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
  }
 });
 $('reset-popup-toggle').checked=confirmCounterReset;
 $('reset-popup-toggle').addEventListener('change',e=>{
  confirmCounterReset=e.target.checked;
  try{localStorage.setItem(RESET_POPUP_KEY,confirmCounterReset?'on':'off')}catch(err){console.warn('초기화 팝업 설정 저장 실패',err)}
 });
 $('reset').addEventListener('click',()=>resetTargets($('reset')));
 $('secondary-reset').addEventListener('click',()=>resetTargets($('secondary-reset')));
 $('schedule-reset').addEventListener('click',()=>resetTargets($('schedule-reset')));
 applyLayout();
}


const $=id=>document.getElementById(id);const save=()=>localStorage.setItem(KEY,JSON.stringify(state));

// Schedule prototype: 24 turns per year, reusable plans and expandable scenario actions.
// Character goals are fixed using the local career database.
const SCHEDULE_YEARS={junior:1,classic:1,senior:1};
let scheduleDb={characters:[],races:[]};
const SCHEDULE_YEAR_ORDER=['junior','classic','senior'];
const SCHEDULE_YEAR_KO={junior:'주니어',classic:'클래식',senior:'시니어'};
function scheduleGlobalTurn(year,halfMonthIndex){return SCHEDULE_YEAR_ORDER.indexOf(year)*24+halfMonthIndex+1}
function findScheduleCharacter(value=scheduleCurrent.character){return scheduleDb.characters.find(c=>c.id===value||c.ko===value||c.en===value||c.legacyIds?.includes(value))}
function scheduleCharacterLabel(value){
 if(!value)return '캐릭터 미지정';
 return findScheduleCharacter(value)?.ko||(!/^uma-\d+$/.test(value)?value:'캐릭터 정보 불러오는 중');
}
function scheduleGoalAt(year,i){
 const character=findScheduleCharacter();
 if(!character)return null;
 const turn=scheduleGlobalTurn(year,i);
 return character.goals.find(g=>g.t===turn)||null;
}
function scheduleRacesAt(year,i){
 const turn=scheduleGlobalTurn(year,i);
 if(year==='junior'&&i<=12)return []; // Debut only through July first half
 return scheduleDb.races.filter(r=>r.t===turn);
}
let scheduleRaceKoNames={};
const SCHEDULE_RACE_TRANSLATIONS={
 Turf:'잔디',Dirt:'더트',Left:'좌회전',Right:'우회전',Straight:'직선',
 Sprint:'단거리',Mile:'마일',Medium:'중거리',Long:'장거리',
 Tokyo:'도쿄',Kyoto:'교토',Nakayama:'나카야마',Hanshin:'한신',
 Chukyo:'주쿄',Niigata:'니가타',Fukushima:'후쿠시마',
 Sapporo:'삿포로',Hakodate:'하코다테',Kokura:'고쿠라',
 Oi:'오이',Kawasaki:'가와사키',Funabashi:'후나바시',
 Morioka:'모리오카',Nagoya:'나고야',
 '札幌':'삿포로','函館':'하코다테','福島':'후쿠시마','新潟':'니가타',
 '中山':'나카야마','東京':'도쿄','中京':'주쿄','京都':'교토',
 '阪神':'한신','小倉':'고쿠라','大井':'오이','船橋':'후나바시',
 '盛岡':'모리오카','佐賀':'사가','ロンシャン':'롱샹','サンタアニタパーク':'산타 아니타 파크'
};
function localizeRaceField(value){
 return SCHEDULE_RACE_TRANSLATIONS[value]||value||'';
}
function describeRace(r){
 if(!r)return '';
 return [r.g,localizeRaceField(r.track),localizeRaceField(r.surface),r.m?r.m+'m':'',localizeRaceField(r.dir)].filter(Boolean).join(' · ');
}
function scheduleRaceName(r){return r?.ko||scheduleRaceKoNames[r?.n]||r?.n||''}
function scheduleGoalName(o){return o?.ko||scheduleRaceKoNames[o?.n]||o?.n||''}
function scheduleGoalDetailHtml(goal){
 if(!goal)return '';
 const list=goal.o.map(o=>{
  const hasRace=!!(o.track||o.m||o.g);
  const title=escapeHTML(scheduleGoalName(o));
  const details=hasRace?describeRace(o):o.d||'레이스 외 목표 또는 상세 정보 미등록';
  const fan=o.f?' · 필요 팬 '+Number(o.f).toLocaleString():'';
  return '<div class="schedule-goal-entry"><strong>'+title+'</strong><span>'+escapeHTML(details+fan)+'</span></div>';
 }).join('');
 return '<div class="schedule-goal-heading">'+(goal.c?'선택 목표':'육성 목표')+'</div>'+list;
}
function renderScheduleCharacterOptions(){
 const selector=$('schedule-character');
 const selected=findScheduleCharacter();
 const value=selected?.id||scheduleCurrent.character;
 selector.replaceChildren(new Option('캐릭터 선택 (목표 레이스 표시)',''));
 for(const ch of scheduleDb.characters)selector.add(new Option(ch.ko,ch.id||ch.ko));
 if(value&&!scheduleDb.characters.some(ch=>ch.id===value))selector.add(new Option(value+' (목표 정보 없음)',value));
 selector.value=value;
}
function showScheduleRaceInfo(goal,year,i,selected){
 const info=$('schedule-race-info');
 const active=goal?.o||[];
 const race=scheduleDb.races.find(r=>r.t===scheduleGlobalTurn(year,i)&&r.n===selected);
 if(!goal&&!race){info.hidden=true;info.textContent='';return}
 const yearName=SCHEDULE_YEAR_KO[year];
 const date=(1+Math.floor(i/2))+'월 '+(i%2?'후반':'전반');
 info.hidden=false;
 const goals=active.map(scheduleGoalName).join(' / ');
 info.textContent=yearName+' '+date+' · '+(goal?'목표: '+goals+(goal.c?' (선택 목표)':''):'출전: '+(race? scheduleRaceName(race):selected))+(race?' · '+describeRace(race):'');
}
async function loadScheduleDatabase(){
 try{
  const response=await fetch('./data/schedule_jp.json',{cache:'no-store'});
  if(!response.ok)throw Error('일본 서버 DB HTTP '+response.status);
  const data=await response.json();
  if(!Array.isArray(data.characters)||data.characters.length<100||
     !Array.isArray(data.races)||data.races.length<300)throw Error('일본 서버 DB 형식 또는 데이터 개수 오류');
  scheduleDb={characters:data.characters,races:data.races};
   try{const kr=await fetch('./data/race_ko_names.json',{cache:'no-store'});
    if(kr.ok){const names=(await kr.json()).names;scheduleRaceKoNames=names&&typeof names==='object'?names:{};}
   }catch(e){console.warn('레이스 한국어 목록 로드 실패',e)}
 }catch(err){
  // Never substitute global-only objectives when JP loading fails.
  console.error('일본 서버 스케줄 DB 불러오기 실패',err);
  scheduleDb={characters:[],races:[]};
 }
 renderSchedule();
 if($('schedule-plans-backdrop')&&!$('schedule-plans-backdrop').hidden)renderSchedulePlans();
}

const SCHEDULE_ACTIONS={
 speed:{label:'스피드 훈련',typeIcon:'speed'},
 stamina:{label:'스태미나 훈련',typeIcon:'stamina'},
 power:{label:'파워 훈련',typeIcon:'power'},
 guts:{label:'근성 훈련',typeIcon:'guts'},
 wisdom:{label:'지능 훈련',typeIcon:'wisdom'},
 rest:{label:'휴식',image:'./assets/ui/rest.png'},
 outing:{label:'외출',image:'./assets/ui/outing.png'},
 race:{label:'레이스',image:'./assets/ui/race.png'}
};
// Each scenario may define its own extra actions in this registry later.
// Entries are merged with the shared actions without replacing existing IDs.
const SCHEDULE_SCENARIO_ACTIONS={basic:{}};
// Legacy actions remain visible in existing records but are no longer choices for new turns.
const LEGACY_SCHEDULE_ACTIONS={
 train:{label:'훈련 (이전 기록)',icon:'💪'},
 clinic:{label:'보건실 (이전 기록)',icon:'🏥'},
 other:{label:'기타 (이전 기록)',icon:'📝'}
};
function scheduleAvailableActions(scenario='basic'){
 return {...SCHEDULE_ACTIONS,...(SCHEDULE_SCENARIO_ACTIONS[scenario]||{})};
}
function scheduleKey(kind){return 'uma-schedule-'+kind+'-v1-'+serverMode}
function scheduleSlots(year){return 24}
function emptySchedule(){
 return {character:'',year:'junior',scenario:'basic',turns:Object.fromEntries(Object.keys(SCHEDULE_YEARS).map(year=>[year,Array(scheduleSlots(year)).fill(null)])),selectedRaces:{}};
}
function normalizeSchedule(raw){
 const result=emptySchedule();
 if(!raw||typeof raw!=='object')return result;
 result.character=typeof raw.character==='string'?raw.character.slice(0,60):'';
 result.year=Object.hasOwn(SCHEDULE_YEARS,raw.year)?raw.year:'junior';
 result.scenario=typeof raw.scenario==='string'&&Object.hasOwn(SCHEDULE_SCENARIO_ACTIONS,raw.scenario)?raw.scenario:'basic';
 if(raw.selectedRaces&&typeof raw.selectedRaces==='object'){
  result.selectedRaces=Object.fromEntries(Object.entries(raw.selectedRaces).filter(([k,v])=>/^(junior|classic|senior)-([0-9]|1[0-9]|2[0-3])$/.test(k)&&typeof v==='string').map(([k,v])=>[k,v.slice(0,120)]));
 }
 const allowed=scheduleAvailableActions(result.scenario);
 for(const year of Object.keys(SCHEDULE_YEARS)){
  const entries=raw.turns?.[year];
  if(!Array.isArray(entries))continue;
  // Old junior schedules started at April (18 turns): shift to Jan-Dec,
  // keeping saved April-December actions in their original calendar dates.
  const migrated=year==='junior'&&entries.length===18?[...Array(6).fill(null),...entries]:entries;
  result.turns[year]=Array.from({length:24},(_,i)=>{
   const action=migrated[i];
   if(action==='race'&&year==='junior'&&i<=12)return null;
   if(Object.hasOwn(allowed,action))return action;
   if(Object.hasOwn(LEGACY_SCHEDULE_ACTIONS,action))return action;
   // Old manually assigned goals no longer exist as selectable actions.
   if(action==='target')return null;
   return null;
  });
 }
 for(let i=0;i<=12;i++)delete result.selectedRaces['junior-'+i];
 return result;
}
function readScheduleCurrent(){
 try{return normalizeSchedule(JSON.parse(localStorage.getItem(scheduleKey('current'))))}
 catch(e){console.warn('스케줄표 불러오기 실패',e);return emptySchedule()}
}
function readSchedulePlans(){
 try{
  const data=JSON.parse(localStorage.getItem(scheduleKey('plans')));
  if(!Array.isArray(data))return [];
  return data.filter(p=>p&&typeof p.name==='string'&&p.schedule).slice(0,50)
   .map(p=>({id:String(p.id),name:p.name.slice(0,80),schedule:normalizeSchedule(p.schedule)}));
 }catch(e){console.warn('저장된 계획 불러오기 실패',e);return []}
}
let scheduleCurrent=readScheduleCurrent();
let schedulePlans=readSchedulePlans();
let scheduleTurn=null;
function saveScheduleCurrent(){
 try{localStorage.setItem(scheduleKey('current'),JSON.stringify(scheduleCurrent))}
 catch(e){toast('스케줄 저장 실패: 저장 공간을 확인해 주세요')}
}
function saveSchedulePlans(){
 try{localStorage.setItem(scheduleKey('plans'),JSON.stringify(schedulePlans));return true}
 catch(e){toast('계획 저장 실패: 저장 공간을 확인해 주세요');return false}
}
function scheduleActionIcon(action){
 if(!action)return '<span class="schedule-empty-mark">+</span>';
 if(action.image)return '<img class="schedule-action-image" src="'+escapeHTML(action.image)+'" alt="" aria-hidden="true" loading="lazy">';
 if(action.typeIcon&&['speed','stamina','power','guts','wisdom','friend','group'].includes(action.typeIcon))
  return '<span class="type-icon type-icon-'+action.typeIcon+' schedule-type-icon" aria-hidden="true"></span>';
 return '<span class="schedule-emoji-icon" aria-hidden="true">'+escapeHTML(action.icon||'•')+'</span>';
}
// GameTora hosts Korean race banners by race ID. Fall back to a Korean
// text label for races without a banner or without a stable race ID.
function scheduleBannerHtml(race){
 const label=scheduleGoalName(race)||scheduleRaceName(race)||'목표 레이스';
 const grade=String(race?.g||'').toUpperCase();
 const fallback='<span class="schedule-ko-banner schedule-banner-fallback" aria-hidden="true"'
   +((race?.n==='Junior Make Debut'||Number.isInteger(Number(race?.rid))&&Number(race.rid)>0)?' hidden':'')+'>'
   +'<span class="schedule-ko-banner-grade">'+escapeHTML(grade||'목표')+'</span>'
   +'<span class="schedule-ko-banner-name">'+escapeHTML(label)+'</span></span>';
 const id=race?.n==='Junior Make Debut'?9002:Number(race?.rid);
 if(!Number.isInteger(id)||id<=0)return fallback;
 const url='https://media.gametora.com/umamusume/races/banners/ko/'+id+'.png';
 return '<img class="schedule-race-banner" src="'+url+'" alt="" loading="lazy"'
  +' onerror="this.hidden=true;this.nextElementSibling.hidden=false">'+fallback;
}
function scheduleIsPrepTurn(year,i){return year==='junior'&&i<12}
function scheduleIsLockedGoal(year,i){return !!scheduleGoalAt(year,i)}
function renderSchedule(){
 if(!$('schedule-grid'))return;
 const activeYear=scheduleCurrent.year;
 renderScheduleCharacterOptions();
 $('schedule-plan-caption').textContent=findScheduleCharacter()?.ko||scheduleCurrent.character||'자유 편집';
 $('schedule-panel').querySelectorAll('[data-schedule-year]').forEach(btn=>{
  const active=btn.dataset.scheduleYear===activeYear;
  btn.classList.toggle('active',active);
  btn.setAttribute('aria-selected',String(active));
 });
 const actions=scheduleAvailableActions(scheduleCurrent.scenario);
 $('schedule-grid').innerHTML=SCHEDULE_YEAR_ORDER.map(year=>{
  const cells=scheduleCurrent.turns[year].map((action,i)=>{
   const month=1+Math.floor(i/2),half=i%2===0?'전반':'후반';
   const goal=scheduleGoalAt(year,i);
   const selection=scheduleCurrent.selectedRaces[year+'-'+i];
   const selectedRace=!(year==='junior'&&i<=12)&&action==='race'&&selection?scheduleDb.races.find(r=>r.t===scheduleGlobalTurn(year,i)&&(r.n===selection||r.ko===selection)):null;
   const display=(year==='junior'&&i<=12&&action==='race')?null:(actions[action]||LEGACY_SCHEDULE_ACTIONS[action]||null);
   const seasonal=scheduleIsPrepTurn(year,i);
   const label=display?display.label:'행동 추가';
   const selectedGoal=goal?.o.find(o=>o.rid)||goal?.o[0]||null;
   const mark=goal?'<span class="schedule-goal-marker" aria-hidden="true">'+(goal.c?'선택 목표':'목표')+'</span>':'';
   const icon=goal?scheduleBannerHtml(selectedGoal):(selectedRace?scheduleBannerHtml(selectedRace):(display?scheduleActionIcon(display):scheduleActionIcon(null)));
   const goalTitle=goal?' · 목표: '+goal.o.map(scheduleGoalName).join(' / '):'';
   const raceTitle=selectedRace?' · 출전: '+scheduleRaceName(selectedRace):'';
   const title=goal?'고정 목표 레이스':label;
   return `<button type="button" class="schedule-cell ${action?'filled':''} ${seasonal?'seasonal':''} ${goal?'has-goal locked-goal':(['rest','outing','race'].includes(action)?'schedule-action-'+action:'')}" data-schedule-year-cell="${year}" data-schedule-turn="${i}" aria-label="${SCHEDULE_YEAR_KO[year]} ${month}월 ${half}: ${escapeHTML(title+goalTitle+raceTitle)}"><span class="schedule-cell-face">${icon}${mark}</span><span class="schedule-cell-label">${month}월 ${half}</span></button>`;
  }).join('');
  return `<section class="schedule-year-section ${year===activeYear?'active':''}" aria-label="${SCHEDULE_YEAR_KO[year]} 일정"><h3 class="schedule-year-heading">${SCHEDULE_YEAR_KO[year]}</h3><div class="schedule-year-grid">${cells}</div></section>`;
 }).join('');
}
function closeScheduleDialog(){
 $('schedule-action-backdrop').hidden=true;
 $('schedule-plans-backdrop').hidden=true;
 scheduleTurn=null;
 document.body.classList.remove('schedule-dialog-open');
}
function openScheduleDialog(which){
 const target=$(which);
 target.hidden=false;
 document.body.classList.add('schedule-dialog-open');
 target.querySelector('button')?.focus();
}
$('schedule-character').addEventListener('change',e=>{
 scheduleCurrent.character=e.target.value;
 saveScheduleCurrent();
 renderSchedule();
});
$('schedule-panel').querySelector('.schedule-year-tabs').addEventListener('click',e=>{
 const btn=e.target.closest('[data-schedule-year]');
 if(!btn)return;
 scheduleCurrent.year=btn.dataset.scheduleYear;
 saveScheduleCurrent();renderSchedule();
});
$('schedule-grid').addEventListener('click',e=>{
 const btn=e.target.closest('[data-schedule-turn]');
 if(!btn)return;
 const year=btn.dataset.scheduleYearCell;
 if(!Object.hasOwn(SCHEDULE_YEARS,year))return;
 const clickedTurn=Number(btn.dataset.scheduleTurn);
 scheduleCurrent.year=year;
 scheduleTurn=clickedTurn;
 const month=1+Math.floor(scheduleTurn/2);
 $('schedule-action-title').textContent=SCHEDULE_YEAR_KO[year]+' '+month+'월 '+(scheduleTurn%2===0?'전반':'후반')+' · 행동 선택';
 const goal=scheduleGoalAt(year,scheduleTurn);
 const detail=$('schedule-goal-detail');
 detail.hidden=!goal;
 if(goal)detail.innerHTML=scheduleGoalDetailHtml(goal);
 const readOnly=!!goal;
 $('schedule-action-title').textContent=readOnly?'고정 목표 · '+SCHEDULE_YEAR_KO[year]+' '+month+'월 '+(scheduleTurn%2===0?'전반':'후반'):'행동 선택 · '+SCHEDULE_YEAR_KO[year]+' '+month+'월 '+(scheduleTurn%2===0?'전반':'후반');
 $('schedule-action-choices').hidden=readOnly;
 $('schedule-race-picker').hidden=readOnly;
 $('schedule-action-clear').hidden=readOnly;
 if(readOnly){
  $('schedule-action-choices').replaceChildren();
  openScheduleDialog('schedule-action-backdrop');
  return;
 }
 const r= scheduleRacesAt(year,scheduleTurn);
 $('schedule-race-picker').hidden=!r.length;
 const select=$('schedule-race-select');
 select.replaceChildren(new Option('출전할 레이스 선택',''));
 for(let i=0;i<r.length;i++)select.add(new Option(scheduleRaceName(r[i])+' · '+r[i].g+' · '+r[i].m+'m',String(i)));
 const selected=scheduleCurrent.selectedRaces[year+'-'+scheduleTurn];
 const previous=r.findIndex(x=>x.n===selected);
 select.value=previous>=0?String(previous):'';
 updateSelectedRaceDescription();
 $('schedule-action-choices').replaceChildren(...Object.entries(scheduleAvailableActions(scheduleCurrent.scenario)).filter(([key])=>!(year==='junior'&&scheduleTurn<=12&&key==='race')).map(([key,action])=>{
  const b=document.createElement('button');b.type='button';b.dataset.scheduleAction=key;
  b.className='schedule-action-option'+(['rest','outing','race'].includes(key)?' schedule-action-'+key:'');
  b.innerHTML=scheduleActionIcon(action);
   b.setAttribute('aria-label',action.label);
   b.title=action.label;
  if(scheduleCurrent.turns[year][scheduleTurn]===key)b.classList.add('selected');
  return b;
 }));
 openScheduleDialog('schedule-action-backdrop');
});
function updateSelectedRaceDescription(){
 const index=$('schedule-race-select').value;
 const race=scheduleTurn===null?null:scheduleRacesAt(scheduleCurrent.year,scheduleTurn)[Number(index)];
 $('schedule-race-description').textContent=index===''?'레이스를 선택하면 상세 정보가 표시됩니다.':describeRace(race)+(race?.f?' · 필요 팬 '+race.f.toLocaleString():'');
}
$('schedule-race-select').addEventListener('change',updateSelectedRaceDescription);
$('schedule-race-apply').addEventListener('click',()=>{
 if(scheduleTurn===null||scheduleIsLockedGoal(scheduleCurrent.year,scheduleTurn)||(scheduleCurrent.year==='junior'&&scheduleTurn<=12)||$('schedule-race-select').value==='')return toast('레이스를 먼저 선택하세요');
 const race=scheduleRacesAt(scheduleCurrent.year,scheduleTurn)[Number($('schedule-race-select').value)];
 if(!race)return;
 scheduleCurrent.turns[scheduleCurrent.year][scheduleTurn]='race';
 scheduleCurrent.selectedRaces[scheduleCurrent.year+'-'+scheduleTurn]=race.n;
 saveScheduleCurrent();closeScheduleDialog();renderSchedule();
});
$('schedule-action-choices').addEventListener('click',e=>{
 const btn=e.target.closest('[data-schedule-action]');
 if(!btn||scheduleTurn===null||scheduleIsLockedGoal(scheduleCurrent.year,scheduleTurn)||(scheduleCurrent.year==='junior'&&scheduleTurn<=12&&btn.dataset.scheduleAction==='race')||!Object.hasOwn(scheduleAvailableActions(scheduleCurrent.scenario),btn.dataset.scheduleAction))return;
 scheduleCurrent.turns[scheduleCurrent.year][scheduleTurn]=btn.dataset.scheduleAction;
 if(btn.dataset.scheduleAction!=='race')delete scheduleCurrent.selectedRaces[scheduleCurrent.year+'-'+scheduleTurn];
 saveScheduleCurrent();closeScheduleDialog();renderSchedule();
});
$('schedule-action-clear').addEventListener('click',()=>{
 if(scheduleTurn===null||scheduleIsLockedGoal(scheduleCurrent.year,scheduleTurn))return;
 scheduleCurrent.turns[scheduleCurrent.year][scheduleTurn]=null;
 delete scheduleCurrent.selectedRaces[scheduleCurrent.year+'-'+scheduleTurn];
 saveScheduleCurrent();closeScheduleDialog();renderSchedule();
});
function renderSchedulePlans(){
 const root=$('schedule-plan-list');
 if(!schedulePlans.length){
  root.innerHTML='<p class="schedule-plans-empty">저장된 계획이 없습니다.</p>';
  return;
 }
 root.innerHTML=schedulePlans.map((p,i)=>`<div class="schedule-plan-row"><div class="schedule-plan-name"><strong>${escapeHTML(p.name)}</strong><small>${escapeHTML(scheduleCharacterLabel(p.schedule.character))}</small></div><div class="schedule-plan-actions"><button type="button" data-plan-load="${i}">불러오기</button><button type="button" data-plan-overwrite="${i}">덮어쓰기</button><button type="button" data-plan-rename="${i}">이름</button><button type="button" data-plan-delete="${i}">삭제</button></div></div>`).join('');
}
$('schedule-plans-open').addEventListener('click',()=>{renderSchedulePlans();openScheduleDialog('schedule-plans-backdrop')});
$('schedule-plan-save').addEventListener('click',()=>{
 const raw=prompt('저장할 계획의 이름을 입력하세요.');
 if(raw===null)return;
 const name=raw.trim().slice(0,80);
 if(!name)return toast('계획 이름을 입력해 주세요');
 if(schedulePlans.length>=50)return toast('계획은 최대 50개까지 저장할 수 있습니다');
 const next={id:String(Date.now())+'-'+String(Math.random()).slice(2),name,schedule:normalizeSchedule(scheduleCurrent)};
 schedulePlans.push(next);
 if(!saveSchedulePlans()){schedulePlans.pop();return}
 renderSchedulePlans();toast('계획을 저장했습니다');
});
$('schedule-plan-list').addEventListener('click',e=>{
 const btn=e.target.closest('button');
 if(!btn)return;
 const match=Object.keys(btn.dataset).find(k=>k.startsWith('plan'));
 if(!match)return;
 const index=Number(btn.dataset[match]),entry=schedulePlans[index];
 if(!entry)return;
 if(match==='planLoad'){
  if(!confirm('현재 스케줄을 '+entry.name+' 계획으로 교체할까요? 저장된 계획은 유지됩니다.'))return;
  scheduleCurrent=normalizeSchedule(entry.schedule);
  saveScheduleCurrent();renderSchedule();closeScheduleDialog();toast('계획을 불러왔습니다');
 }else if(match==='planOverwrite'){
  if(!confirm(entry.name+' 계획을 현재 스케줄로 덮어쓸까요?'))return;
  const previous=entry.schedule;
  entry.schedule=normalizeSchedule(scheduleCurrent);
  if(!saveSchedulePlans()){entry.schedule=previous;return}
  renderSchedulePlans();toast('계획을 덮어썼습니다');
 }else if(match==='planRename'){
  const raw=prompt('새 이름을 입력하세요.',entry.name);
  if(raw===null||!raw.trim())return;
  const previous=entry.name;entry.name=raw.trim().slice(0,80);
  if(!saveSchedulePlans()){entry.name=previous;return}
  renderSchedulePlans();
 }else if(match==='planDelete'){
  if(!confirm(entry.name+' 계획을 삭제할까요?'))return;
  const removed=schedulePlans.splice(index,1);
  if(!saveSchedulePlans()){schedulePlans.splice(index,0,removed[0]);return}
  renderSchedulePlans();toast('계획을 삭제했습니다');
 }
});
document.querySelectorAll('[data-schedule-close]').forEach(btn=>btn.addEventListener('click',closeScheduleDialog));
['schedule-action-backdrop','schedule-plans-backdrop'].forEach(id=>{
 $(id).addEventListener('click',e=>{if(e.target===$(id))closeScheduleDialog()});
});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&(!$('schedule-action-backdrop').hidden||!$('schedule-plans-backdrop').hidden)){
  e.preventDefault();closeScheduleDialog();
 }
});

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
 try{localStorage.setItem(SERVER_KEY,next)}catch(err){console.warn('서버 선택 저장 실패',err)}
 state=readState();
 scheduleCurrent=readScheduleCurrent();
 schedulePlans=readSchedulePlans();
 $('scenario').value=state.scenario||'';
 renderSchedule();
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
function slotRender(i){const s=state.slots[i],c=findCard(s.id),n=countFor(s,c),kind=category(c);const el=document.createElement('div');el.className='slot';el.innerHTML=`<div><button type="button" class="portrait-trigger" data-open-picker="${i}" aria-label="${escapeHTML(cardLabel(c)||"서포트 카드 선택")}"><div class="portrait placeholder" id="photo-${i}">카드 선택</div></button></div><div class="info"><div class="topline"><div class="choices" style="flex:1"><span class="card-title-line">${c&&TYPE_ICONS[c.type]?`<span class="type-icon type-icon-${TYPE_ICONS[c.type]} card-type-icon" title="${escapeHTML(c.type)}" aria-label="${escapeHTML(c.type)}"></span>`:'' }<span class="search card-name-text" title="${escapeHTML(cardLabel(c)||"카드를 선택하세요")}">${escapeHTML(cardLabel(c)||"카드를 선택하세요")}</span></span></div></div>${c?`<div class="event-controls"><div class="events">${Array.from({length:n},(_,j)=>`<button data-step="${i}:${j+1}" class="${s.step>=j+1?'on':''}" aria-pressed="${s.step>=j+1}">${j+1}</button>`).join('')}${kind==='group'?`<label class="groupopts">단계 수 <select data-group="${i}">${[1,2,3,4,5].map(x=>`<option value="${x}" ${n===x?'selected':''}>${x}</option>`).join('')}</select></label>`:''}</div>${kind==='normal'?`<div class="events">${['A','B'].map((x,j)=>`<button data-random="${i}:${j}" class="${s.random[j]?'on':''}" aria-pressed="${!!s.random[j]}">${x}</button>`).join('')}</div>`:''}</div>`:''}</div>`;return el}
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
$('picker-clear').addEventListener('click',()=>{
 if(pickerSlot===null)return;
 state.slots[pickerSlot]={id:null,step:0,random:[false,false],groupCount:3};
 pickerClose();
 render();
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
$('slots').addEventListener('click',async e=>{const t=e.target.closest('button');if(!t)return;let i,j;if(t.dataset.openPicker!==undefined){pickerOpen(Number(t.dataset.openPicker))}else if(t.dataset.step){[i,j]=t.dataset.step.split(':').map(Number);const s=state.slots[i];s.step=s.step>=j?j-1:j;updateEvents(i);save()}else if(t.dataset.random){[i,j]=t.dataset.random.split(':').map(Number);state.slots[i].random[j]=!state.slots[i].random[j];updateEvents(i);save()}});
$('scenario').value=state.scenario||'';$('scenario').addEventListener('input',e=>{state.scenario=e.target.value;save()});
initWorkspace();
renderSchedule();
loadScheduleDatabase();
fetch('./data/support_cards.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('DB HTTP '+r.status);return r.json()}).then(d=>{cards=d;render()}).catch(err=>{toast('DB를 읽지 못했습니다. 웹 서버에서 실행하세요.');console.error(err)});
