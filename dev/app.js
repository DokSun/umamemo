'use strict';
// Dev preview uses the same domain as production: scope all storage keys.
const devStorage={
 getItem(key){return window.localStorage.getItem('umamemo-dev-v1:'+key)},
 setItem(key,value){return window.localStorage.setItem('umamemo-dev-v1:'+key,value)},
 removeItem(key){return window.localStorage.removeItem('umamemo-dev-v1:'+key)}
};
const SERVER_KEY='uma-tracker-server-v1';
let serverMode=devStorage.getItem(SERVER_KEY)==='jp'?'jp':'ko';
let KEY=serverMode==='ko'?'uma-tracker-v1':'uma-tracker-v1-jp';
function initialState(){return {slots:Array.from({length:6},()=>({id:null,step:0,random:[false,false],groupCount:3})),scenario:''}}
function readState(){
 const base=initialState();
 try{
  const old=JSON.parse(devStorage.getItem(KEY));
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
try{confirmCounterReset=devStorage.getItem(RESET_POPUP_KEY)!=='off'}catch(e){console.warn('초기화 팝업 설정 읽기 실패',e)}

const TOOLS={
 counter:{name:'서포트 이벤트 카운팅',scope:'session',element:'counter-panel',
  reset(){state.slots.forEach(s=>{s.step=0;s.random=[false,false]});state.slots.forEach((_,i)=>updateEvents(i));save()}},
 memo:{name:'메모장',scope:'independent',element:'memo-panel',
  reset(){state.scenario='';$('scenario').value='';save()}},
 schedule:{name:'육성 기록',group:'record',scope:'session',element:'schedule-panel',reset(){resetCurrentScheduleOnly()}},
 plan:{name:'육성 계획',group:'plan',scope:'independent',element:'plan-panel',reset(){}}
};
function readLayout(){
 const initial={mode:'split',tool:'memo',ratio:60,reversed:false};
 try{
  const s=JSON.parse(devStorage.getItem(LAYOUT_KEY));
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
function saveLayout(){try{devStorage.setItem(LAYOUT_KEY,JSON.stringify(layout))}catch(e){console.warn('화면 설정 저장 실패',e)}}
function visibleToolIds(){return layout.mode==='single'?[layout.tool]:['counter',layout.tool==='counter'?'memo':layout.tool]}
function shouldShowScheduleReset(ids=visibleToolIds()){
 return !scheduleEditingPlan&&ids.includes('schedule')&&!ids.includes('counter');
}
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
 // The counter's unified reset already clears both records in split mode.
 scheduleFooter.hidden=!shouldShowScheduleReset(ids);
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
 if(ids.includes('plan')&&scheduleEditingPlan){$('plan-panel').hidden=true;$('schedule-panel').hidden=false;}
 $('split-toggle').checked=!solo;
 $('split-ratio').querySelectorAll('input[type="radio"]').forEach(r=>{r.checked=Number(r.value)===layout.ratio});
 $('split-options').hidden=false;
 $('split-options').classList.toggle('inactive',solo);
 $('split-ratio').disabled=solo;
 $('swap-panels').disabled=solo;
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
 if(ids.includes('schedule')&&scheduleEditingPlan)return toast('계획 편집을 저장하거나 취소한 후 초기화해 주세요');
 const includesSchedule=ids.includes('schedule');
 const desc=ids.length===1?(includesSchedule?'현재 육성 스케줄을':TOOLS[ids[0]].name+'의 기록을'):'현재 표시된 육성 기록을 모두';
 const sessionReset=ids.every(id=>TOOLS[id].scope==='session');
 const planNotice=includesSchedule?'\n\n저장된 계획은 유지되고 지정한 초기 계획이 육성 기록에 다시 적용됩니다.':'';
 if((!sessionReset||confirmCounterReset)&&!confirm(desc+' 초기화할까요?'+planNotice))return;
 ids.forEach(id=>TOOLS[id].reset());
 toast(includesSchedule?(ids.length>1?'이벤트 카운팅을 초기화하고 육성 기록을 초기 계획으로 복원했습니다.':'육성 기록을 초기 계획으로 복원했습니다.'):ids.length>1?'육성 기록을 함께 초기화했습니다':'초기화했습니다');
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
// Settings are inline accordion sections within the feature drawer.
// The original form elements are moved into the drawer once so saved settings
// and all existing change handlers keep their identity.
function toggleInlineSettings(tab){
 const button=$('tool-menu-list').querySelector('[data-settings-open="'+tab+'"]');
 if(!button)return;
 const open=button.getAttribute('aria-expanded')!=='true';
 $('tool-menu-list').querySelectorAll('[data-settings-open]').forEach(item=>{
  const selected=open&&item===button;
  item.setAttribute('aria-expanded',String(selected));
  const pane=$(item.getAttribute('aria-controls'));
  pane.hidden=!selected;
 });
 if(open)button.scrollIntoView({block:'nearest'});
}
function setupInlineSettings(){
 for(const tab of ['counter','general']){
  const source=$('settings-source').querySelector('[data-settings-pane="'+tab+'"]');
  const target=$('settings-inline-'+tab);
  source.hidden=false;
  target.appendChild(source);
 }
 $('settings-source').remove();
}
function initSettings(){
 $('schedule-edit-settings-open').addEventListener('click',()=>{
  if(!scheduleEditingPlan)return;
  const fields=$('plan-info-fields');
  fields.hidden=!fields.hidden;
  if(!fields.hidden){
   renderScheduleCharacterOptionsFor($('plan-edit-character'),scheduleCurrent.character);
   $('plan-edit-scenario').value=scheduleCurrent.scenario;
   $('plan-edit-character').focus();
  }
 });
 $('plan-edit-character').addEventListener('change',e=>{
  if(!scheduleEditingPlan)return;
  scheduleCurrent.character=e.target.value;
  renderSchedule();
 });
 $('plan-edit-scenario').addEventListener('change',e=>{
  if(!scheduleEditingPlan||!Object.hasOwn(SCHEDULE_SCENARIO_ACTIONS,e.target.value))return;
  scheduleCurrent.scenario=e.target.value;
  // Preserve all compatible actions, but drop scenario-only commands when
  // switching to a scenario that doesn't offer them.
  const normalized=normalizeSchedule(scheduleCurrent);
  scheduleCurrent.turns=normalized.turns;
  scheduleCurrent.scenarioEvents=normalized.scenarioEvents;
  renderSchedule();
 });

}
function initWorkspace(){
 const nodes=[];
 for(const [category,heading,ids] of [['plan','계획',['plan']],['record','기록',['schedule','counter','memo']]]){
  const group=document.createElement('div');group.className='tool-menu-heading tool-menu-group-heading';group.dataset.toolCategory=category;group.textContent=heading;nodes.push(group);
  for(const id of ids){const tool=TOOLS[id];const btn=document.createElement('button');btn.type='button';btn.dataset.tool=id;btn.textContent=tool.name;btn.className='tool-menu-item';nodes.push(btn);}
 }
 const settingsGroup=document.createElement('div');
 settingsGroup.className='tool-menu-heading tool-menu-group-heading';
 settingsGroup.dataset.toolCategory='settings';
 settingsGroup.textContent='설정';
 nodes.push(settingsGroup);
 const counterButton=document.createElement('button');
 counterButton.type='button';
 counterButton.className='tool-menu-item tool-menu-setting-item';
 counterButton.dataset.settingsOpen='counter';
 counterButton.textContent='카운팅 설정';
 counterButton.setAttribute('aria-expanded','false');
 counterButton.setAttribute('aria-controls','settings-inline-counter');
 const counterPanel=document.createElement('div');
 counterPanel.id='settings-inline-counter';
 counterPanel.className='tool-setting-panel';
 counterPanel.hidden=true;
 nodes.push(counterButton,counterPanel);
 const generalPanel=document.createElement('div');
 generalPanel.id='settings-inline-general';
 generalPanel.className='tool-setting-panel permanent-settings-panel';
 nodes.push(generalPanel);
 $('tool-menu-list').replaceChildren(...nodes);
 setupInlineSettings();
 $('tool-menu-toggle').addEventListener('click',()=>toggleToolMenu($('tool-menu').hidden));
 $('tool-menu-close').addEventListener('click',()=>{toggleToolMenu(false);$('tool-menu-toggle').focus()});
 $('tool-menu-backdrop').addEventListener('click',()=>{toggleToolMenu(false);$('tool-menu-toggle').focus()});
 $('tool-menu-list').addEventListener('click',e=>{
  const settingsButton=e.target.closest('[data-settings-open]');
  if(settingsButton){toggleInlineSettings(settingsButton.dataset.settingsOpen);return}
  const btn=e.target.closest('[data-tool]');if(!btn)return;
  if(scheduleEditingPlan&&btn.dataset.tool!=='plan'){
   if(!confirm('저장하지 않은 계획 편집을 취소하고 다른 기능으로 이동할까요?'))return;
   scheduleFinishPlanEdit(false);
  }
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
  try{devStorage.setItem(RESET_POPUP_KEY,confirmCounterReset?'on':'off')}catch(err){console.warn('초기화 팝업 설정 저장 실패',err)}
 });
 $('reset').addEventListener('click',()=>resetTargets($('reset')));
 $('secondary-reset').addEventListener('click',()=>resetTargets($('secondary-reset')));
 $('schedule-reset').addEventListener('click',()=>resetTargets($('schedule-reset')));
 applyLayout();
}


const $=id=>document.getElementById(id);const save=()=>devStorage.setItem(KEY,JSON.stringify(state));

/* Apply developer-maintained strings from ui-text.js. */
function applyUiTexts(){
 const bindings={
  'onsen.heading':'.schedule-onsen-panel h4',
  'onsen.digHint':'.schedule-onsen-subheading',
  'onsen.ticketLabel':'#schedule-onsen-ticket-label',
  'onsen.ticketNormal':'#schedule-onsen-ticket',
  'onsen.ticketSuper':'#schedule-onsen-ticket-super',
  'race.selectHeading':'label[for="schedule-race-select"]',
  'plans.help':'.schedule-plans-help'
 };
 for(const [key,selector] of Object.entries(bindings)){
  const node=document.querySelector(selector);
  if(node)node.textContent=uiText(key);
 }
}

// Schedule: 24 turns per year, reusable plans and expandable scenario actions.
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
function scheduleGoalAt(year,i,source=scheduleCurrent){
 const character=findScheduleCharacter(source.character);
 if(!character)return null;
 const turn=scheduleGlobalTurn(year,i);
 return character.goals.find(g=>g.t===turn)||null;
}
function scheduleRacesAt(year,i){
 const turn=scheduleGlobalTurn(year,i);
 if(year==='junior'&&i<=12)return []; // Debut only through July first half
 // Race ID ascending is the canonical priority; names/grades do not affect order.
 return scheduleDb.races.filter(r=>r.t===turn).sort((a,b)=>
  (Number(a.rid)||Number.MAX_SAFE_INTEGER)-(Number(b.rid)||Number.MAX_SAFE_INTEGER)||
  scheduleRaceName(a).localeCompare(scheduleRaceName(b),'ko'));
}
let scheduleRaceKoNames={};
const SCHEDULE_RACE_TRANSLATIONS={
 Turf:'잔디',Dirt:'더트',Left:'좌회전',Right:'우회전',Straight:'직선',
 Sprint:'단거리',Mile:'마일',Medium:'중거리',Long:'장거리',
 Tokyo:'도쿄',Kyoto:'교토',Nakayama:'나카야마',Hanshin:'한신',
 Chukyo:'츄쿄',Niigata:'니가타',Fukushima:'후쿠시마',
 Sapporo:'삿포로',Hakodate:'하코다테',Kokura:'코쿠라',
 Oi:'오이',Kawasaki:'가와사키',Funabashi:'후나바시',
 Morioka:'모리오카',Nagoya:'나고야',
 '札幌':'삿포로','函館':'하코다테','福島':'후쿠시마','新潟':'니가타',
 '中山':'나카야마','東京':'도쿄','中京':'츄쿄','京都':'교토',
 '阪神':'한신','小倉':'코쿠라','大井':'오이','船橋':'후나바시',
 '盛岡':'모리오카','佐賀':'사가','ロンシャン':'롱샹','サンタアニタパーク':'산타 아니타 파크'
};
function localizeRaceField(value){
 return SCHEDULE_RACE_TRANSLATIONS[value]||value||'';
}
function describeRace(r){
 if(!r)return '';
 return [r.g,localizeRaceField(r.track),localizeRaceField(r.surface),r.m?r.m+'m':'',localizeRaceField(r.dir)].filter(Boolean).join(' · ');
}
// The curated translation table takes precedence over stale localized fields in the JP race database.
function scheduleRaceName(r){return scheduleRaceKoNames[r?.n]||r?.ko||r?.n||''}
function scheduleGoalName(o){return scheduleRaceKoNames[o?.n]||o?.ko||o?.n||''}
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
function scheduleScenarioLabel(id){
 return id==='onsen'?'극락♪ 유코마 온천향':'기본';
}
function renderScheduleCharacterOptionsFor(selector,characterValue){
 const value=findScheduleCharacter(characterValue)?.id||characterValue;
 selector.replaceChildren(new Option('캐릭터 선택 (목표 레이스 표시)',''));
 for(const ch of scheduleDb.characters){
  const isSelected=(ch.id||ch.ko)===value;
  const option=new Option(ch.ko,ch.id||ch.ko);
  if(isSelected){option.classList.add('current-character');option.style.fontWeight='bold';}
  selector.add(option);
 }
 if(value&&!scheduleDb.characters.some(ch=>ch.id===value))selector.add(new Option(value+' (목표 정보 없음)',value));
 selector.value=value;
}
function renderScheduleCharacterOptions(){
 renderScheduleCharacterOptionsFor($('schedule-character'),scheduleCurrent.character);
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
const SCHEDULE_SCENARIO_ACTIONS={basic:{},onsen:{pr:{label:'PR활동',image:'./assets/ui/pr-training-matched.svg',unlocksAt:3}}};
// The nine original Onsen excavation icons are arranged in the order uploaded.
// spriteIndex maps that visual order to the source image order in the sprite sheet.
// Sprite positions follow the images' upload order (5,4,2,3,1,9,8,7,6), not filename order.
// Map original1.webp through original9.webp to the correct sprite positions.
const SCHEDULE_ONSEN_SPRITE_ORDER=[4,2,3,1,0,8,7,6,5];
// Global turn numbers are 1-based: junior turn 3, classic Jan early, senior Jan early, senior Sep late.
const SCHEDULE_ONSEN_UNLOCK_TURNS=[3,3,3,25,25,25,25,49,66];
const SCHEDULE_ONSEN_DIGS=Object.fromEntries(SCHEDULE_ONSEN_SPRITE_ORDER.map((spriteIndex,i)=>['dig'+(i+1),{label:'온천 '+(i+1),spriteIndex,unlocksAt:SCHEDULE_ONSEN_UNLOCK_TURNS[i]}]));
function scheduleOnsenUnlocked(id,year,i){
 const dig=SCHEDULE_ONSEN_DIGS[id];
 return !dig||scheduleGlobalTurn(year,i)>=dig.unlocksAt;
}
const SCHEDULE_ONSEN_EVENTS={...SCHEDULE_ONSEN_DIGS,ticket:{label:'온천권 회복',symbol:'♨'},ticketSuper:{label:'온천권 초회복',symbol:'✦♨'}};
const SCHEDULE_ONSEN_TICKET_IDS=['ticket','ticketSuper'];
function scheduleHasTicket(events){return Array.isArray(events)&&events.some(id=>SCHEDULE_ONSEN_TICKET_IDS.includes(id));}
const SCHEDULE_ONSEN_EVENT_IDS=Object.keys(SCHEDULE_ONSEN_EVENTS);
function scheduleOnsenIconHtml(id){
 const info=SCHEDULE_ONSEN_DIGS[id];
 if(!info)return '';
 return '<span class="schedule-onsen-icon" aria-hidden="true" style="background-position:'+((info.spriteIndex/8)*100)+'% 0"></span>';
}
function scheduleTurnEventKey(year,i){return year+'-'+i}
function scheduleOnsenEvents(year,i,source=scheduleCurrent){
 if(scheduleGlobalTurn(year,i)<3)return [];
 const value=source.scenarioEvents?.[scheduleTurnEventKey(year,i)];
 return Array.isArray(value)?value.filter(id=>Object.hasOwn(SCHEDULE_ONSEN_EVENTS,id)&&scheduleOnsenUnlocked(id,year,i)):[];
}
function scheduleOnsenTicketBlocked(year,i,events=scheduleCurrent.scenarioEvents){
 const index=SCHEDULE_YEAR_ORDER.indexOf(year)*24+i;
 if(index<=0)return false;
 const prevYear=SCHEDULE_YEAR_ORDER[Math.floor((index-1)/24)];
 const previous=events?.[scheduleTurnEventKey(prevYear,(index-1)%24)];
 return scheduleHasTicket(previous);
}
function scheduleOnsenTicketStatus(year,i,source=scheduleCurrent){
 const index=SCHEDULE_YEAR_ORDER.indexOf(year)*24+i;
 if(index<0)return {turn:0,superRecovery:false};
 if(scheduleOnsenTicketBlocked(year,i,source.scenarioEvents)){
  const prevYear=SCHEDULE_YEAR_ORDER[Math.floor((index-1)/24)];
  return {turn:2,superRecovery:scheduleOnsenEvents(prevYear,(index-1)%24,source).includes('ticketSuper')};
 }
 const events=scheduleOnsenEvents(year,i,source);
 if(events.includes('ticketSuper'))return {turn:1,superRecovery:true};
 return {turn:events.includes('ticket')?1:0,superRecovery:false};
}
function scheduleOnsenTicketTurn(year,i,source=scheduleCurrent){return scheduleOnsenTicketStatus(year,i,source).turn;}
function scheduleOnsenBadges(year,i,source=scheduleCurrent){
 if(source.scenario!=='onsen')return '';
 const events=scheduleOnsenEvents(year,i,source);
 const badges=[];
 const dig=events.find(id=>Object.hasOwn(SCHEDULE_ONSEN_DIGS,id));
 if(dig)badges.push('<span class="schedule-onsen-dig-badge" title="'+SCHEDULE_ONSEN_DIGS[dig].label+'">'+scheduleOnsenIconHtml(dig)+'</span>');
 const ticket=scheduleOnsenTicketStatus(year,i,source);
 if(ticket.turn){
  const label=(ticket.turn===1?'온천권 사용 · 효과 1턴째':'온천 효과 2턴째')+(ticket.superRecovery?' · 초회복':'');
  badges.push('<span class="schedule-onsen-badge schedule-onsen-ticket '+(ticket.superRecovery?'super-recovery':'')+'" title="'+label+'">'+(ticket.superRecovery?'✦':'')+'♨'+ticket.turn+'</span>');
 }
 return badges.length?'<span class="schedule-onsen-badges" aria-hidden="true">'+badges.join('')+'</span>':'';
}
// Legacy actions remain visible in existing records but are no longer choices for new turns.
const LEGACY_SCHEDULE_ACTIONS={
 train:{label:'훈련 (이전 기록)',icon:'💪'},
 clinic:{label:'보건실 (이전 기록)',icon:'🏥'},
 other:{label:'기타 (이전 기록)',icon:'📝'}
};
function scheduleAvailableActions(scenario='basic'){
 return {...SCHEDULE_ACTIONS,...(SCHEDULE_SCENARIO_ACTIONS[scenario]||{})};
}
// A scenario-specific command can be used from its unlock turn onward.
function scheduleActionUnlocked(action,year,i){
 return !action?.unlocksAt||scheduleGlobalTurn(year,i)>=action.unlocksAt;
}
function scheduleKey(kind){return 'uma-schedule-'+kind+'-v1-'+serverMode}
function scheduleSlots(year){return 24}
function emptySchedule(){
 return {character:'',year:'junior',scenario:'basic',turns:Object.fromEntries(Object.keys(SCHEDULE_YEARS).map(year=>[year,Array(scheduleSlots(year)).fill(null)])),selectedRaces:{},scenarioEvents:{}};
}
function normalizeSchedule(raw){
 const result=emptySchedule();
 if(!raw||typeof raw!=='object')return result;
 result.character=typeof raw.character==='string'?raw.character.slice(0,60):'';
 result.year=Object.hasOwn(SCHEDULE_YEARS,raw.year)?raw.year:'junior';
 result.scenario=typeof raw.scenario==='string'&&Object.hasOwn(SCHEDULE_SCENARIO_ACTIONS,raw.scenario)?raw.scenario:'basic';
 if(raw.scenarioEvents&&typeof raw.scenarioEvents==='object'&&!Array.isArray(raw.scenarioEvents)){
  for(const [key,events] of Object.entries(raw.scenarioEvents)){
   if(!/^(junior|classic|senior)-([0-9]|1[0-9]|2[0-3])$/.test(key)||!Array.isArray(events))continue;
   const [eventYear,eventTurnText]=key.split('-');
   const eventTurn=Number(eventTurnText);
   const valid=scheduleGlobalTurn(eventYear,eventTurn)<3?[]:[...new Set(events.filter(id=>typeof id==='string'&&SCHEDULE_ONSEN_EVENT_IDS.includes(id)&&scheduleOnsenUnlocked(id,eventYear,eventTurn)))];
   if(valid.length)result.scenarioEvents[key]=valid;
  }
 }
 // The second turn of a ticket effect cannot activate another ticket.
 for(const year of SCHEDULE_YEAR_ORDER){
  for(let i=0;i<24;i++){
   const key=scheduleTurnEventKey(year,i);
   let events=result.scenarioEvents[key];
   if(!events)continue;
   const index=SCHEDULE_YEAR_ORDER.indexOf(year)*24+i;
   const py=SCHEDULE_YEAR_ORDER[Math.floor((index-1)/24)];
   const previous=index>0?result.scenarioEvents[scheduleTurnEventKey(py,(index-1)%24)]:null;
   if(scheduleHasTicket(previous))events=events.filter(id=>!SCHEDULE_ONSEN_TICKET_IDS.includes(id));
   if(events.includes('ticketSuper'))events=events.filter(id=>id!=='ticket');
   if(events.length)result.scenarioEvents[key]=events;
   else delete result.scenarioEvents[key];
  }
 }
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
   if(Object.hasOwn(allowed,action)&&scheduleActionUnlocked(allowed[action],year,i))return action;
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
 try{return normalizeSchedule(JSON.parse(devStorage.getItem(scheduleKey('current'))))}
 catch(e){console.warn('스케줄표 불러오기 실패',e);return emptySchedule()}
}
function readSchedulePlans(){
 try{
  const data=JSON.parse(devStorage.getItem(scheduleKey('plans')));
  if(!Array.isArray(data))return [];
  return data.filter(p=>p&&typeof p.name==='string'&&p.schedule).slice(0,50)
   .map(p=>({id:String(p.id),name:p.name.slice(0,80),schedule:normalizeSchedule(p.schedule)}));
 }catch(e){console.warn('저장된 계획 불러오기 실패',e);return []}
}
let scheduleCurrent=readScheduleCurrent();
let schedulePlans=readSchedulePlans();
let scheduleTurn=null;
let scheduleActivePlanId='';
try{scheduleActivePlanId=devStorage.getItem(scheduleKey('active-plan'))||''}catch(e){}
let scheduleEditingPlan=null, scheduleRunBeforeEdit=null;
// Actual completion is separate from plan-filled actions.
function scheduleReadRecordedTurns(){
 try{
  const raw=devStorage.getItem(scheduleKey('recorded-turns-v2'));
  if(raw!==null){const data=JSON.parse(raw);if(Array.isArray(data))return Array.from({length:72},(_,i)=>data[i]===true)}
  const count=Math.max(0,Math.min(72,Math.trunc(Number(devStorage.getItem(scheduleKey('completed-turns')))||0)));
  return Array.from({length:72},(_,i)=>i<count);
 }catch(e){return Array(72).fill(false)}
}
let scheduleRecordedTurns=scheduleReadRecordedTurns();
function scheduleCompletedPrefix(){
 const first=scheduleRecordedTurns.findIndex(done=>!done);
 return first<0?72:first;
}
function scheduleCurrentTurn(){return scheduleCompletedPrefix()+1}
function scheduleIsRecorded(year,i){return scheduleRecordedTurns[scheduleGlobalTurn(year,i)-1]===true}
function scheduleSaveRecordedTurns(){
 try{devStorage.setItem(scheduleKey('recorded-turns-v2'),JSON.stringify(scheduleRecordedTurns))}
 catch(e){console.warn('진행 턴 저장 실패',e)}
}
function scheduleResetRecordedTurns(){
 scheduleRecordedTurns=Array(72).fill(false);
 scheduleSaveRecordedTurns();
}
function scheduleTurnEditable(year,i){
 // Recorded actions can always be revised. Plan-filled future turns are not recorded.
 return Boolean(scheduleEditingPlan)||scheduleIsRecorded(year,i)||scheduleGlobalTurn(year,i)===scheduleCurrentTurn();
}
function scheduleCompleteTurn(year,i){
 if(scheduleEditingPlan)return;
 const turn=scheduleGlobalTurn(year,i);
 if(turn!==scheduleCurrentTurn())return;
 scheduleRecordedTurns[turn-1]=true;
 scheduleSaveRecordedTurns();
 if(turn<72)scheduleCurrent.year=SCHEDULE_YEAR_ORDER[Math.floor(turn/24)];
 saveScheduleCurrent();
}
function scheduleProgressLabel(turn){
 if(turn>72)return '육성 완료 · 72/72턴';
 const year=SCHEDULE_YEAR_ORDER[Math.floor((turn-1)/24)];
 const i=(turn-1)%24;
 return SCHEDULE_YEAR_KO[year]+' '+(Math.floor(i/2)+1)+'월 '+(i%2===0?'전반':'후반')+' · '+turn+'/72턴';
}
function renderScheduleTrainingLevels(){
 const panel=$('schedule-training-levels');
 if(!panel)return;
 panel.hidden=Boolean(scheduleEditingPlan);
 if(scheduleEditingPlan)return;
 const current=scheduleCurrentTurn(),completed=current-1;
 $('schedule-current-turn').textContent=scheduleProgressLabel(current);
 const status=TrainingLevels.calculate(scheduleCurrent,completed);
 $('schedule-training-grid').innerHTML=status.levels.map(e=>`<div class="schedule-level-item" aria-label="${e.label} Lv.${e.level}, 일반 훈련 ${e.count}회"><span class="type-icon type-icon-${e.type} schedule-level-type-icon" aria-hidden="true"></span><span class="schedule-level-name">${e.label}</span><strong>Lv.${e.level}</strong><small>${status.summerCamp?'합숙':e.baseLevel===5?'MAX':e.count%4+'/4회'}</small></div>`).join('');
}
// The selected plan is an editable starting snapshot, not a display overlay.
function scheduleInitialRun(){
 const run=normalizeSchedule(scheduleActivePlan()?.schedule||emptySchedule());
 run.year='junior';
 return run;
}
function scheduleHasRunData(run){
 return Object.values(run.turns).some(ts=>ts.some(Boolean))||
  Object.keys(run.scenarioEvents||{}).length>0||
  Object.keys(run.selectedRaces||{}).length>0;
}
// Migrate the previous plan-overlay model once, retaining any existing actual records.
function scheduleMigratePreviousGuide(){
 const plan=scheduleActivePlan()?.schedule;
 if(!plan)return;
 const key=scheduleKey('initial-plan-migrated-v2');
 try{if(devStorage.getItem(key)==='done')return}catch(e){}
 const merged=normalizeSchedule(scheduleCurrent);
 for(const year of SCHEDULE_YEAR_ORDER)for(let i=0;i<24;i++){
  const k=scheduleTurnEventKey(year,i);
  if(merged.turns[year][i]||merged.scenarioEvents[k]?.length)continue;
  const act=plan.turns[year]?.[i];
  if(act)merged.turns[year][i]=act;
  if(act==='race'&&plan.selectedRaces[k])merged.selectedRaces[k]=plan.selectedRaces[k];
  if(plan.scenarioEvents?.[k]?.length)merged.scenarioEvents[k]=[...plan.scenarioEvents[k]];
 }
 merged.character=plan.character||merged.character;
 merged.scenario=plan.scenario;
 scheduleCurrent=normalizeSchedule(merged);
 saveScheduleCurrent();
 try{devStorage.setItem(key,'done')}catch(e){}
}
function scheduleActivePlan(){return schedulePlans.find(p=>p.id===scheduleActivePlanId)||null}
function scheduleSetActivePlan(id){
 scheduleActivePlanId=id;
 try{
  if(id)devStorage.setItem(scheduleKey('active-plan'),id);
  else devStorage.removeItem(scheduleKey('active-plan'));
  // Selection is metadata only. Do not run an old plan-overlay migration on reload.
  devStorage.setItem(scheduleKey('initial-plan-migrated-v2'),'done');
 }catch(e){console.warn(e)}
}
function scheduleBeginPlanEdit(entry){
 if(scheduleEditingPlan)return;
 scheduleRunBeforeEdit=scheduleCurrent;
 scheduleEditingPlan={id:entry?.id||'',name:entry?.name||'',schedule:normalizeSchedule(entry?.schedule||emptySchedule())};
 scheduleCurrent=scheduleEditingPlan.schedule;
 scheduleCurrent.year=scheduleRunBeforeEdit.year;
 $('schedule-plan-name').value=scheduleEditingPlan.name;
 $('plan-info-fields').hidden=true;
 layout.tool='plan';applyLayout();
 closeScheduleDialog();renderSchedule();
}
function scheduleFinishPlanEdit(save=false){
 if(!scheduleEditingPlan)return;
 if(save){
  const name=$('schedule-plan-name').value.trim().slice(0,80);
  if(!name){$('schedule-plan-name').focus();return toast('계획 이름을 입력해 주세요')};
  scheduleEditingPlan.name=name;
  if(scheduleEditingPlan.id){
   const entry=schedulePlans.find(p=>p.id===scheduleEditingPlan.id);
   if(!entry)return toast('저장된 계획을 찾을 수 없습니다');
   const previous={name:entry.name,schedule:entry.schedule};
   entry.name=name;entry.schedule=normalizeSchedule(scheduleCurrent);
   if(!saveSchedulePlans()){Object.assign(entry,previous);return}
  }else{
   if(schedulePlans.length>=50)return toast('계획은 최대 50개까지 저장할 수 있습니다');
   const entry={id:String(Date.now())+'-'+Math.random().toString(36).slice(2),name,schedule:normalizeSchedule(scheduleCurrent)};
   schedulePlans.push(entry);
   if(!saveSchedulePlans()){schedulePlans.pop();return}
  }
 }
 $('plan-info-fields').hidden=true;
 scheduleCurrent=scheduleRunBeforeEdit;
 scheduleRunBeforeEdit=null;scheduleEditingPlan=null;
 closeScheduleDialog();applyLayout();renderSchedule();renderPlanPanel();
 if(save)toast('계획을 저장했습니다');
}
// Reset the working cultivation only. Saved plans are separate and must never be cleared here.
function resetCurrentScheduleOnly(){
 if(scheduleEditingPlan)return;
 scheduleCurrent=scheduleInitialRun();
 scheduleResetRecordedTurns();
 scheduleTurn=null;
 saveScheduleCurrent();
 if($('schedule-action-backdrop')&&!$('schedule-action-backdrop').hidden)closeScheduleDialog();
 renderSchedule();
}
function saveScheduleCurrent(){
 if(scheduleEditingPlan)return; // draft must never overwrite actual records
 try{devStorage.setItem(scheduleKey('current'),JSON.stringify(scheduleCurrent))}
 catch(e){toast('스케줄 저장 실패: 저장 공간을 확인해 주세요')}
}
function saveSchedulePlans(){
 try{devStorage.setItem(scheduleKey('plans'),JSON.stringify(schedulePlans));return true}
 catch(e){toast('계획 저장 실패: 저장 공간을 확인해 주세요');return false}
}
scheduleMigratePreviousGuide();
function scheduleActionIcon(action){
 if(!action)return '<span class="schedule-empty-mark">+</span>';
 if(action.image)return '<img class="schedule-action-image" src="'+escapeHTML(action.image)+'" alt="" aria-hidden="true" loading="lazy">';
 if(action.text)return '<span class="schedule-pr-icon" aria-hidden="true">'+escapeHTML(action.text)+'</span>';
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
 if(layout.tool==='plan'){
  $('plan-panel').hidden=Boolean(scheduleEditingPlan);
  $('schedule-panel').hidden=!scheduleEditingPlan;
 }
 renderPlanPanel();
 const activeYear=scheduleCurrent.year;
 // The global header and common settings always describe the active *recorded*
 // cultivation, never a plan draft being edited.
 const recordedRun=scheduleEditingPlan?scheduleRunBeforeEdit:scheduleCurrent;
 renderScheduleCharacterOptionsFor($('schedule-character'),recordedRun.character);
 $('schedule-scenario').value=recordedRun.scenario;
 $('schedule-header-character').textContent=scheduleCharacterLabel(recordedRun.character);
 $('schedule-header-scenario').textContent=scheduleScenarioLabel(recordedRun.scenario);
 if(scheduleEditingPlan){
  renderScheduleCharacterOptionsFor($('plan-edit-character'),scheduleCurrent.character);
  $('plan-edit-scenario').value=scheduleCurrent.scenario;
 }
 $('schedule-plan-caption').textContent=scheduleEditingPlan?(scheduleEditingPlan.name||'새 계획'):scheduleActivePlan()?'초기 계획: '+scheduleActivePlan().name:'초기 계획 미지정';
 $('schedule-view-heading').textContent=scheduleEditingPlan?'육성 계획':'육성 기록';
 $('schedule-work-title').textContent='현재 육성';
 $('schedule-plan-edit-bar').hidden=!scheduleEditingPlan;
 $('schedule-reset-footer').hidden=!shouldShowScheduleReset();
 $('schedule-panel').classList.toggle('editing-plan',!!scheduleEditingPlan);
 $('schedule-panel').querySelectorAll('[data-schedule-year]').forEach(btn=>{
  const active=btn.dataset.scheduleYear===activeYear;
  btn.classList.toggle('active',active);
  btn.setAttribute('aria-selected',String(active));
 });
 renderScheduleTrainingLevels();
 $('schedule-grid').innerHTML=SCHEDULE_YEAR_ORDER.map(year=>{
  const cells=scheduleCurrent.turns[year].map((action,i)=>{
    const source=scheduleCurrent;
   const month=1+Math.floor(i/2),half=i%2===0?'전반':'후반';
   const globalTurn=scheduleGlobalTurn(year,i);
   const currentTurn=scheduleCurrentTurn();
   const recorded=!scheduleEditingPlan&&scheduleIsRecorded(year,i);
   const current=!scheduleEditingPlan&&globalTurn===currentTurn;
   const future=!scheduleEditingPlan&&!recorded&&globalTurn!==currentTurn;
   const goal=scheduleGoalAt(year,i,source);
   const selection=source.selectedRaces[year+'-'+i];
   const selectedRace=!(year==='junior'&&i<=12)&&action==='race'&&selection?scheduleDb.races.find(r=>r.t===scheduleGlobalTurn(year,i)&&(r.n===selection||r.ko===selection)):null;
   const display=(year==='junior'&&i<=12&&action==='race')?null:(scheduleAvailableActions(source.scenario)[action]||LEGACY_SCHEDULE_ACTIONS[action]||null);
   const seasonal=scheduleIsPrepTurn(year,i);
   const label=display?display.label:'행동 추가';
   const selectedGoal=goal?.o.find(o=>o.rid)||goal?.o[0]||null;
   const mark=goal?'<span class="schedule-goal-marker" aria-hidden="true">'+(goal.c?'선택 목표':'목표')+'</span>':'';
   const icon=goal?scheduleBannerHtml(selectedGoal):(selectedRace?scheduleBannerHtml(selectedRace):(display?scheduleActionIcon(display):scheduleActionIcon(null)));
   const extras=scheduleOnsenBadges(year,i,source);
   const extraTitle=source.scenario==='onsen'?[...scheduleOnsenEvents(year,i,source).map(k=>SCHEDULE_ONSEN_EVENTS[k]?.label).filter(Boolean),...(scheduleOnsenTicketTurn(year,i,source)===2?['온천 효과 2턴째']:[])].join(' · '):'';
   const goalTitle=goal?' · 목표: '+goal.o.map(scheduleGoalName).join(' / '):'';
   const raceTitle=selectedRace?' · 출전: '+scheduleRaceName(selectedRace):'';
   const title=goal?'고정 목표 레이스':label;
    
   return `<button type="button" class="schedule-cell ${action?'filled':''} ${seasonal?'seasonal':''} ${goal?'has-goal locked-goal':''} ${current?'current-turn':''} ${recorded?'recorded-turn':''} ${future?'future-turn':''}" data-schedule-year-cell="${year}" data-schedule-turn="${i}" ${future?'disabled':''} aria-label="${SCHEDULE_YEAR_KO[year]} ${month}월 ${half}: ${escapeHTML(title+goalTitle+raceTitle+(extraTitle?' · '+extraTitle:''))}"><span class="schedule-cell-face">${icon}${mark}${extras}</span><span class="schedule-cell-label">${month}월 ${half}</span></button>`;
  }).join('');
  return `<section class="schedule-year-section ${year===activeYear?'active':''}" aria-label="${SCHEDULE_YEAR_KO[year]} 일정"><h3 class="schedule-year-heading">${SCHEDULE_YEAR_KO[year]}</h3><div class="schedule-year-grid">${cells}</div></section>`;
 }).join('');
}
function closeScheduleDialog(){
 $('schedule-action-backdrop').hidden=true;
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
 const next=e.target.value;
 const previous=findScheduleCharacter()?.id||scheduleCurrent.character;
 if(next===previous)return;
 if(!scheduleEditingPlan&&scheduleCompletedPrefix()>0&&!confirm('육성 캐릭터를 변경하면 현재 스케줄과 진행 기록이 초기화됩니다. 변경할까요?')){
  e.target.value=previous;
  return;
 }
 if(!scheduleEditingPlan&&scheduleActivePlanId&&next!==scheduleActivePlan()?.schedule.character)scheduleSetActivePlan('');
 // Clear only the working schedule. Saved plans and support-event progress remain intact.
 scheduleCurrent.character=next;
 if(!scheduleEditingPlan)scheduleResetRecordedTurns();
 for(const year of Object.keys(SCHEDULE_YEARS))scheduleCurrent.turns[year]=Array(scheduleSlots(year)).fill(null);
 scheduleCurrent.selectedRaces={};
 scheduleCurrent.scenarioEvents={};
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
 if(!scheduleTurnEditable(year,clickedTurn))return toast('현재 턴부터 순서대로 기록해 주세요');
 scheduleCurrent.year=year;
 scheduleTurn=clickedTurn;
 const month=1+Math.floor(scheduleTurn/2);
 $('schedule-action-title').textContent=SCHEDULE_YEAR_KO[year]+' '+month+'월 '+(scheduleTurn%2===0?'전반':'후반');
 const goal=scheduleGoalAt(year,scheduleTurn);
 const detail=$('schedule-goal-detail');
 detail.hidden=!goal;
 if(goal)detail.innerHTML=scheduleGoalDetailHtml(goal);
 const readOnly=!!goal;
 $('schedule-onsen-panel').hidden=scheduleCurrent.scenario!=='onsen'||scheduleGlobalTurn(year,scheduleTurn)<3;
 $('schedule-action-backdrop').querySelector('.schedule-action-modal').classList.toggle('has-scenario',scheduleCurrent.scenario==='onsen'&&scheduleGlobalTurn(year,scheduleTurn)>=3);
 if(scheduleCurrent.scenario==='onsen')renderScheduleOnsenControls(year,scheduleTurn);
 $('schedule-action-title').textContent=(readOnly?'목표 · ':'')+SCHEDULE_YEAR_KO[year]+' '+month+'월 '+(scheduleTurn%2===0?'전반':'후반');
 $('schedule-action-choices').hidden=readOnly;
 $('schedule-race-picker').hidden=readOnly;
 // Goals are fixed, but their turn-free scenario actions must still be resettable.
 $('schedule-action-clear').hidden=!scheduleEditingPlan&&!scheduleIsRecorded(year,scheduleTurn);
 $('schedule-goal-complete').hidden=scheduleEditingPlan||!readOnly||scheduleGlobalTurn(year,scheduleTurn)!==scheduleCurrentTurn();
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
 // Keep training in the first row, followed by scenario-specific training, then rest/outing/race.
 const actionOrder=['speed','stamina','power','guts','wisdom','pr','rest','outing','race'];
 const choices=$('schedule-action-choices');
 choices.classList.toggle('with-sixth-training',Boolean(scheduleAvailableActions(scheduleCurrent.scenario).pr&&scheduleActionUnlocked(scheduleAvailableActions(scheduleCurrent.scenario).pr,year,scheduleTurn)));
 choices.replaceChildren(...Object.entries(scheduleAvailableActions(scheduleCurrent.scenario))
  .filter(([key,action])=>scheduleActionUnlocked(action,year,scheduleTurn)&&!(year==='junior'&&scheduleTurn<=12&&key==='race'))
  .sort(([x],[y])=>(actionOrder.indexOf(x)===-1?99:actionOrder.indexOf(x))-(actionOrder.indexOf(y)===-1?99:actionOrder.indexOf(y)))
  .map(([key,action])=>{
  const b=document.createElement('button');b.type='button';b.dataset.scheduleAction=key;
  b.className='schedule-action-option';
  b.innerHTML=scheduleActionIcon(action);
   b.setAttribute('aria-label',action.label);
   b.title=action.label;
  if(scheduleCurrent.turns[year][scheduleTurn]===key)b.classList.add('selected');
  return b;
 }));
 openScheduleDialog('schedule-action-backdrop');
});
function renderScheduleOnsenControls(year,i){
 const events=scheduleOnsenEvents(year,i);
 $('schedule-onsen-options').innerHTML=Object.entries(SCHEDULE_ONSEN_DIGS).map(([id,entry])=>{
  const selected=events.includes(id);
  if(!scheduleOnsenUnlocked(id,year,i))return '';
  return '<button type="button" class="schedule-onsen-option schedule-onsen-dig-choice '+(selected?'selected':'')+'" data-onsen-event="'+id+'" aria-label="'+entry.label+'" title="'+entry.label+'" aria-pressed="'+selected+'">'+scheduleOnsenIconHtml(id)+'</button>';
 }).join('');
 const blocked=scheduleOnsenTicketBlocked(year,i);
 for(const id of SCHEDULE_ONSEN_TICKET_IDS){
  const button=$(id==='ticket'?'schedule-onsen-ticket':'schedule-onsen-ticket-super');
  const selected=!blocked&&events.includes(id);
  button.disabled=blocked;
  button.classList.toggle('selected',selected);
  button.setAttribute('aria-pressed',String(selected));
  button.title=uiText(id==='ticket'?'onsen.ticketNormal':'onsen.ticketSuper');
 }
}
$('schedule-onsen-panel').addEventListener('click',e=>{
 const button=e.target.closest('[data-onsen-event]');
 if(!button||scheduleTurn===null||!scheduleTurnEditable(scheduleCurrent.year,scheduleTurn)||scheduleCurrent.scenario!=='onsen'||scheduleGlobalTurn(scheduleCurrent.year,scheduleTurn)<3)return;
 const id=button.dataset.onsenEvent;
 if(!SCHEDULE_ONSEN_EVENT_IDS.includes(id))return;
 const year=scheduleCurrent.year;
 if(!scheduleOnsenUnlocked(id,year,scheduleTurn))return;
 if(SCHEDULE_ONSEN_TICKET_IDS.includes(id)&&scheduleOnsenTicketBlocked(year,scheduleTurn))return;
 const key=scheduleTurnEventKey(year,scheduleTurn);
 const current=scheduleOnsenEvents(year,scheduleTurn);
 if(!scheduleCurrent.scenarioEvents||typeof scheduleCurrent.scenarioEvents!=='object')scheduleCurrent.scenarioEvents={};
 // Exactly one excavation type per turn; ticket is independent.
 const next=current.includes(id)?current.filter(x=>x!==id):Object.hasOwn(SCHEDULE_ONSEN_DIGS,id)?[...current.filter(x=>!Object.hasOwn(SCHEDULE_ONSEN_DIGS,x)),id]:SCHEDULE_ONSEN_TICKET_IDS.includes(id)?[...current.filter(x=>!SCHEDULE_ONSEN_TICKET_IDS.includes(x)),id]:[...current,id];
 if(next.length)scheduleCurrent.scenarioEvents[key]=next;
 else delete scheduleCurrent.scenarioEvents[key];
 saveScheduleCurrent();renderSchedule();renderScheduleOnsenControls(year,scheduleTurn);
});
$('schedule-scenario').addEventListener('change',e=>{
 if(!Object.hasOwn(SCHEDULE_SCENARIO_ACTIONS,e.target.value))return;
 if(!scheduleEditingPlan&&scheduleCompletedPrefix()>0&&!confirm('육성 시나리오를 변경하면 현재 육성의 시나리오 설정이 변경됩니다. 계속할까요?')){
  e.target.value=scheduleCurrent.scenario;
  return;
 }
 scheduleCurrent.scenario=e.target.value;
 if(!scheduleEditingPlan&&scheduleActivePlanId&&e.target.value!==scheduleActivePlan()?.schedule.scenario)scheduleSetActivePlan('');
 saveScheduleCurrent();renderSchedule();
});
function updateSelectedRaceDescription(){
 const index=$('schedule-race-select').value;
 const race=scheduleTurn===null?null:scheduleRacesAt(scheduleCurrent.year,scheduleTurn)[Number(index)];
 $('schedule-race-description').textContent=index===''?uiText('race.selectHint'):describeRace(race)+(race?.f?' · 필요 팬 '+race.f.toLocaleString():'');
}
$('schedule-race-select').addEventListener('change',updateSelectedRaceDescription);
$('schedule-race-apply').addEventListener('click',()=>{
 if(scheduleTurn===null||!scheduleTurnEditable(scheduleCurrent.year,scheduleTurn)||scheduleIsLockedGoal(scheduleCurrent.year,scheduleTurn)||(scheduleCurrent.year==='junior'&&scheduleTurn<=12)||$('schedule-race-select').value==='')return toast('레이스를 먼저 선택하세요');
 const race=scheduleRacesAt(scheduleCurrent.year,scheduleTurn)[Number($('schedule-race-select').value)];
 if(!race)return;
 scheduleCurrent.turns[scheduleCurrent.year][scheduleTurn]='race';
 scheduleCurrent.selectedRaces[scheduleCurrent.year+'-'+scheduleTurn]=race.n;
 scheduleCompleteTurn(scheduleCurrent.year,scheduleTurn);
 saveScheduleCurrent();closeScheduleDialog();renderSchedule();
});
$('schedule-action-choices').addEventListener('click',e=>{
 const btn=e.target.closest('[data-schedule-action]');
 if(!btn||scheduleTurn===null||!scheduleTurnEditable(scheduleCurrent.year,scheduleTurn)||scheduleIsLockedGoal(scheduleCurrent.year,scheduleTurn)||(scheduleCurrent.year==='junior'&&scheduleTurn<=12&&btn.dataset.scheduleAction==='race')||!Object.hasOwn(scheduleAvailableActions(scheduleCurrent.scenario),btn.dataset.scheduleAction)||!scheduleActionUnlocked(scheduleAvailableActions(scheduleCurrent.scenario)[btn.dataset.scheduleAction],scheduleCurrent.year,scheduleTurn))return;
 if(btn.dataset.scheduleAction==='race')return toast('레이스 목록에서 출전할 레이스를 선택해 주세요');
 scheduleCurrent.turns[scheduleCurrent.year][scheduleTurn]=btn.dataset.scheduleAction;
 delete scheduleCurrent.selectedRaces[scheduleCurrent.year+'-'+scheduleTurn];
 scheduleCompleteTurn(scheduleCurrent.year,scheduleTurn);
 saveScheduleCurrent();closeScheduleDialog();renderSchedule();
});
$('schedule-goal-complete').addEventListener('click',()=>{
 if(scheduleTurn===null||scheduleEditingPlan||!scheduleIsLockedGoal(scheduleCurrent.year,scheduleTurn))return;
 if(scheduleGlobalTurn(scheduleCurrent.year,scheduleTurn)!==scheduleCurrentTurn())return;
 scheduleCompleteTurn(scheduleCurrent.year,scheduleTurn);
 closeScheduleDialog();renderSchedule();
});
$('schedule-action-clear').addEventListener('click',()=>{
 if(scheduleTurn===null)return;
 const year=scheduleCurrent.year;
 const turn=scheduleGlobalTurn(year,scheduleTurn);
 if(!scheduleTurnEditable(year,scheduleTurn))return;
 if(!scheduleEditingPlan){
  if(!scheduleRecordedTurns[turn-1])return;
  // Keep later completed actions intact when undoing an earlier turn.
  scheduleRecordedTurns[turn-1]=false;
  scheduleSaveRecordedTurns();
 }
 const key=scheduleTurnEventKey(year,scheduleTurn);
 // Keep the character's fixed goal. Clear all editable main and scenario actions.
 if(!scheduleIsLockedGoal(year,scheduleTurn)){
  const baseline=scheduleActivePlan()?.schedule;
  scheduleCurrent.turns[year][scheduleTurn]=baseline?.turns[year]?.[scheduleTurn]||null;
  if(baseline?.selectedRaces?.[key])scheduleCurrent.selectedRaces[key]=baseline.selectedRaces[key];
  else delete scheduleCurrent.selectedRaces[key];
 }
 const initialEvents=scheduleActivePlan()?.schedule.scenarioEvents?.[key];
 if(Array.isArray(initialEvents)&&initialEvents.length)scheduleCurrent.scenarioEvents[key]=[...initialEvents];
 else delete scheduleCurrent.scenarioEvents[key];
 saveScheduleCurrent();closeScheduleDialog();renderSchedule();
});
function renderPlanPanel(){
 const root=$('plan-quick-list');
 if(!root)return;
 $('plan-count').textContent=schedulePlans.length+'개 저장';
 if(!schedulePlans.length){root.innerHTML='<p class="schedule-plans-empty">저장된 계획이 없습니다. 새 계획을 작성해 주세요.</p>';return}
 root.innerHTML=schedulePlans.map((p,i)=>`<div class="plan-library-row ${p.id===scheduleActivePlanId?'selected-plan':''}"><div class="plan-library-details"><strong>${escapeHTML(p.name)}</strong><small>${escapeHTML(scheduleCharacterLabel(p.schedule.character))} · ${escapeHTML(scheduleScenarioLabel(p.schedule.scenario))}${p.id===scheduleActivePlanId?' · 선택됨':''}</small></div><div class="schedule-plan-actions"><button type="button" data-plan-use="${i}" aria-pressed="${p.id===scheduleActivePlanId}">${p.id===scheduleActivePlanId?'선택 해제':'선택'}</button><button type="button" data-plan-edit="${i}">편집</button><button type="button" data-plan-delete="${i}">삭제</button></div></div>`).join('');
}
$('plan-create-new').addEventListener('click',()=>scheduleBeginPlanEdit(null));
$('schedule-plan-name').addEventListener('input',e=>{
 if(!scheduleEditingPlan)return;
 scheduleEditingPlan.name=e.target.value;
 $('schedule-plan-caption').textContent=e.target.value.trim()||'새 계획';
});
$('schedule-plan-edit-save').addEventListener('click',()=>scheduleFinishPlanEdit(true));
$('schedule-plan-edit-cancel').addEventListener('click',()=>scheduleFinishPlanEdit(false));
$('plan-quick-list').addEventListener('click',e=>{
 const btn=e.target.closest('button');
 if(!btn)return;
 const match=Object.keys(btn.dataset).find(k=>k.startsWith('plan'));
 if(!match)return;
 const index=Number(btn.dataset[match]),entry=schedulePlans[index];
 if(!entry)return;
 if(match==='planUse'){
  if(entry.id===scheduleActivePlanId){
   scheduleSetActivePlan('');renderPlanPanel();renderSchedule();toast('계획 선택을 해제했습니다. 현재 기록은 유지됩니다.');return;
  }
  // Choosing a plan only marks it. Existing recording turns and actions stay intact.
  scheduleSetActivePlan(entry.id);
  renderPlanPanel();renderSchedule();
  toast('계획을 선택했습니다. 현재 육성 기록은 유지됩니다.');
 }else if(match==='planEdit'){
  scheduleBeginPlanEdit(entry);
 }else if(match==='planDelete'){
  if(!confirm(entry.name+' 계획을 삭제할까요?'))return;
  const removed=schedulePlans.splice(index,1);
  if(!saveSchedulePlans()){schedulePlans.splice(index,0,removed[0]);return}
  if(entry.id===scheduleActivePlanId)scheduleSetActivePlan('');
  renderPlanPanel();renderSchedule();toast('계획을 삭제했습니다');
 }
});
document.querySelectorAll('[data-schedule-close]').forEach(btn=>btn.addEventListener('click',closeScheduleDialog));
['schedule-action-backdrop'].forEach(id=>{
 $(id).addEventListener('click',e=>{if(e.target===$(id))closeScheduleDialog()});
});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&!$('schedule-action-backdrop').hidden){
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
 try{devStorage.setItem(SERVER_KEY,next)}catch(err){console.warn('서버 선택 저장 실패',err)}
 state=readState();
 scheduleCurrent=readScheduleCurrent();
 scheduleRecordedTurns=scheduleReadRecordedTurns();
 schedulePlans=readSchedulePlans();
 scheduleEditingPlan=null;scheduleRunBeforeEdit=null;
 try{scheduleActivePlanId=devStorage.getItem(scheduleKey('active-plan'))||''}catch(e){scheduleActivePlanId=''}
 scheduleMigratePreviousGuide();
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
initSettings();
initWorkspace();
applyUiTexts();
renderSchedule();
loadScheduleDatabase();
fetch('./data/support_cards.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('DB HTTP '+r.status);return r.json()}).then(d=>{cards=d;render()}).catch(err=>{toast('DB를 읽지 못했습니다. 웹 서버에서 실행하세요.');console.error(err)});
