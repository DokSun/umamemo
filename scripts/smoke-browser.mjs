import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium} from 'playwright';
const root=resolve(process.argv[2]||'.'),port=4173;
const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1','--directory',root],{stdio:'ignore'});
let browser;
try{
 let ready=false;
 for(let i=0;i<40;i++){
  try{if((await fetch('http://127.0.0.1:'+port+'/')).ok){ready=true;break}}catch(e){}
  await delay(150);
 }
 if(!ready)throw new Error('Local server failed');
 browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1366,height:900}});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
 await page.locator('#slots > *').first().waitFor({timeout:20000});
 if((await page.locator('#slots > *').count())!==6)throw new Error('Expected 6 support slots');
 await page.locator('#tool-menu-toggle').click();
 await page.locator('#tool-menu-list [data-tool="schedule"]').click();
 await page.locator('#schedule-grid .schedule-cell').first().waitFor({timeout:20000});
 // renderSchedule runs asynchronously during DB load and must not resurrect the footer.
 await page.waitForTimeout(300);
 if(await page.locator('#schedule-reset-footer').isVisible())throw new Error('Schedule render resurrected duplicate reset footer');
 if((await page.locator('#schedule-grid .schedule-cell').count())!==72)throw new Error('Expected 72 turns');
 if(await page.locator('#schedule-reset').isVisible())throw new Error('Duplicate schedule reset should be hidden during simultaneous use');
 if((await page.locator('#reset').innerText())!=='육성 기록 통합 초기화')throw new Error('Unified reset label missing in simultaneous use');
 if((await page.locator('#reset').getAttribute('data-targets'))!=='counter,schedule')throw new Error('Unified reset must target counter and schedule');
 const prompt=[];
 page.once('dialog',async d=>{prompt.push(d.message());await d.dismiss();});
 await page.locator('#reset').click();
 if(!prompt[0]?.includes('≡ 기능 > 설정 > 카운팅 설정 > 초기화 팝업'))throw new Error('Counter reset help missing');
 await page.locator('#tool-menu-toggle').click();
 await page.locator('#split-toggle').evaluate(el=>{el.checked=false;el.dispatchEvent(new Event('change',{bubbles:true}));});
 if(!(await page.locator('#schedule-reset').isVisible()))throw new Error('Schedule reset must remain visible in single mode');
 await page.locator('#split-toggle').evaluate(el=>{el.checked=true;el.dispatchEvent(new Event('change',{bubbles:true}));});
 if(await page.locator('#schedule-reset').isVisible())throw new Error('Duplicate schedule reset returned in split mode');
 await page.locator('#tool-menu-close').click();
 if((await page.locator('#schedule-training-grid .schedule-level-item').count())!==5)throw new Error('Expected five training levels');
 const current=page.locator('#schedule-current-turn');
 if((await current.innerText()).startsWith('현재 '))throw new Error('Current turn label must not have 현재 prefix');
 if(await page.getByText('실제 육성 기록과 별도로 편집됩니다.').count())throw new Error('Redundant plan editing help remains');
 if(!(await current.innerText()).includes('1/72턴'))throw new Error('First current turn must be 1');
 if(!(await page.locator('#schedule-grid [data-schedule-year-cell="junior"][data-schedule-turn="1"]').isDisabled()))throw new Error('Future turns must be disabled');
 await page.locator('#schedule-grid [data-schedule-year-cell="junior"][data-schedule-turn="0"]').click();
 await page.locator('#schedule-action-choices [data-schedule-action="speed"]').click();
 if(!(await current.innerText()).includes('2/72턴'))throw new Error('Recording turn 1 did not advance to turn 2');
 if(!(await page.locator('#schedule-grid [data-schedule-year-cell="junior"][data-schedule-turn="2"]').isDisabled()))throw new Error('Turn 3 must stay locked');
 await page.locator('#schedule-grid [data-schedule-year-cell="junior"][data-schedule-turn="1"]').click();
 await page.locator('#schedule-action-choices [data-schedule-action="speed"]').click();
 if(!(await current.innerText()).includes('3/72턴'))throw new Error('Sequential progress failed');
 await page.locator('#schedule-grid [data-schedule-year-cell="junior"][data-schedule-turn="0"]').click();
 await page.locator('#schedule-action-choices [data-schedule-action="stamina"]').click();
 if(!(await current.innerText()).includes('3/72턴'))throw new Error('Revising an earlier recorded turn must not change the current turn');
 await page.locator('#schedule-grid [data-schedule-year-cell="junior"][data-schedule-turn="0"]').click();
 await page.locator('#schedule-action-clear').click();
 if(!(await current.innerText()).includes('1/72턴'))throw new Error('Clearing earlier record should expose first missing turn');
 if(await page.locator('#schedule-grid [data-schedule-year-cell="junior"][data-schedule-turn="1"]').isDisabled())throw new Error('Later completed turn should stay editable');
 await page.locator('#schedule-grid [data-schedule-year-cell="junior"][data-schedule-turn="1"]').click();
 await page.locator('#schedule-action-choices [data-schedule-action="power"]').click();
 if(!(await current.innerText()).includes('1/72턴'))throw new Error('Editing later completed record must not advance past the gap');
 await page.locator('#schedule-grid [data-schedule-year-cell="junior"][data-schedule-turn="0"]').click();
 await page.locator('#schedule-action-choices [data-schedule-action="speed"]').click();
 if(!(await current.innerText()).includes('3/72턴'))throw new Error('Filling the first missing record must advance to next gap');
 // A senior plan icon must not determine the current turn.
 await page.evaluate(()=>{
  const base={character:'',year:'junior',scenario:'basic',turns:{junior:Array(24).fill(null),classic:Array(24).fill(null),senior:Array(24).fill(null)},selectedRaces:{},scenarioEvents:{}};
  base.turns.senior[17]='speed';
  localStorage.setItem('uma-schedule-plans-v1-ko',JSON.stringify([{id:'smoke-plan',name:'Senior planned action',schedule:base}]));
  localStorage.setItem('uma-schedule-active-plan-v1-ko','smoke-plan');
  localStorage.setItem('uma-schedule-current-v1-ko',JSON.stringify(base));
  localStorage.setItem('uma-schedule-recorded-turns-v2-v1-ko',JSON.stringify(Array(72).fill(false)));
 });
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('#slots > *').first().waitFor({state:'attached',timeout:20000});
 await page.locator('#tool-menu-toggle').click();
 await page.locator('#tool-menu-list [data-tool="schedule"]').click();
 if(!(await page.locator('#schedule-current-turn').innerText()).includes('1/72턴'))throw new Error('Senior plan action must not change current junior turn');
 if(!(await page.locator('#schedule-grid [data-schedule-year-cell="senior"][data-schedule-turn="17"]').isDisabled()))throw new Error('Future senior planned action must remain unrecordable');
 // Cultivation information is summarized in the global header, not editable inline.
 if(await page.locator('#schedule-panel #schedule-character').count())throw new Error('Character selector must be outside schedule');
 if(!(await page.locator('#schedule-header-character').isVisible()))throw new Error('Header cultivation summary missing');
 if((await page.locator('header .header-brand > h1').count())!==1)throw new Error('Site title should be adjacent to function menu');
 if((await page.locator('#schedule-panel .schedule-title-row #schedule-plan-caption').count())!==1)throw new Error('Initial plan should sit beside scheduler title');
 if(await page.locator('header #schedule-plan-caption').count())throw new Error('Initial plan must not be in site header');
 if(await page.locator('#schedule-training-note').count())throw new Error('Training explanation should be removed');
 if(await page.locator('#settings-open, #tool-settings-open').count())throw new Error('Standalone settings buttons must be removed');
 if(await page.locator('#settings-backdrop').count())throw new Error('Settings modal backdrop must not exist');
 await page.locator('#tool-menu-toggle').click();
 if((await page.locator('#tool-menu-title').innerText())!=='우마 메모')throw new Error('Drawer title must be 우마 메모');
 if((await page.locator('#tool-menu-list [data-tool-category="record"] + [data-tool]').getAttribute('data-tool'))!=='counter')throw new Error('Counter must come first');
 if(!(await page.locator('[data-tool-category="settings"]').isVisible()))throw new Error('Settings group missing from feature drawer');
 const settingLinks=page.locator('#tool-menu-list [data-settings-open]');
 if((await settingLinks.allTextContents()).join('|')!=='카운팅 설정')throw new Error('Only counter settings should be collapsible');
 if((await page.locator('#tool-menu-list').evaluate(el=>el.lastElementChild?.id))!=='settings-inline-general')throw new Error('Screen/server settings must be last');
 if(await page.locator('#tool-menu-list .general-settings-heading, #settings-inline-general h3').count())throw new Error('Redundant screen/server titles should be removed');
 if(await page.getByText('메모장은 별도의 설정 없이 기록 내용만 자동 저장됩니다.').count())throw new Error('Memo help should be removed');
 if(await page.locator('[data-settings-open="general"]').count())throw new Error('Screen/server settings must not be collapsible');
 if(!(await page.locator('#settings-inline-general').isVisible()))throw new Error('Screen/server settings must always be expanded');
 const borderless=await page.locator('#settings-inline-general').evaluate(el=>{const st=getComputedStyle(el);return st.borderTopWidth==='0px'&&st.borderLeftWidth==='0px'&&st.backgroundColor==='rgba(0, 0, 0, 0)';});
 if(!borderless)throw new Error('Permanent settings outer frame must be removed');
 if(await page.locator('[data-tool="texts"], #text-panel, script[src*="text-manager"]').count())throw new Error('Text manager must be removed');
 if(await page.locator('[data-settings-open="cultivation"], #settings-inline-cultivation').count())throw new Error('Cultivation settings must be removed from the function drawer');
 if(await page.locator('#schedule-character').isVisible())throw new Error('Internal record fields must not appear as user settings');
 if(await page.locator('#settings-inline-counter').isVisible())throw new Error('Counter settings should start collapsed');
 await page.locator('[data-settings-open="counter"]').click();
 if(!(await page.locator('#settings-inline-counter').isVisible()))throw new Error('Counter section did not expand inline');
 if(!(await page.locator('#reset-popup-toggle').isVisible()))throw new Error('Counter toggle missing from inline settings');
 if(!(await page.locator('#tool-menu').isVisible()))throw new Error('Function drawer must remain open after expanding settings');
 if((await page.locator('[data-settings-open="counter"]').getAttribute('aria-expanded'))!=='true')throw new Error('Counter accordion accessible state missing');
 await page.locator('[data-settings-open="counter"]').click();
 if(await page.locator('#settings-inline-counter').isVisible())throw new Error('Counter settings did not collapse on second click');
 if(!(await page.locator('#settings-inline-general').isVisible()))throw new Error('Screen/server settings should remain expanded');
 if(!(await page.locator('#server-mode').isVisible()))throw new Error('Inline server selector missing');
 if(!(await page.locator('#split-toggle').isVisible()))throw new Error('Inline display mode selector missing');
 const fixedSettings=page.locator('#settings-inline-general');
 const beforeMode=await fixedSettings.boundingBox();
 const ratioBefore=await page.locator('#split-ratio').boundingBox();
 await page.locator('#split-toggle').check({force:true});
 if(!(await page.locator('#split-ratio').isVisible()))throw new Error('Ratio controls should remain in place');
 const afterMode=await fixedSettings.boundingBox();
 const ratioAfter=await page.locator('#split-ratio').boundingBox();
 if(Math.abs(beforeMode.y-afterMode.y)>2 || Math.abs(ratioBefore.y-ratioAfter.y)>2)throw new Error('Settings shift when toggling simultaneous use');
 await page.locator('#split-toggle').uncheck({force:true});
 if(!(await page.locator('#split-ratio').isVisible()))throw new Error('Mode OFF must reserve space for ratio controls');
 if(!(await page.locator('#split-ratio').isDisabled()))throw new Error('Ratio controls must be disabled in single mode');
 if(await page.locator('#schedule-plans-open').count())throw new Error('Plan management shortcut must stay removed');
 // Use the retained nonvisual record field for legacy onsen regression tests.
 await page.evaluate(()=>{
  const field=document.getElementById('schedule-scenario');
  field.value='onsen';field.dispatchEvent(new Event('change',{bubbles:true}));
 });
 if(!(await page.locator('#schedule-header-scenario').innerText()).includes('온천향'))throw new Error('Internal scenario state no longer works');
 await page.setViewportSize({width:390,height:844});
 if(!(await page.locator('#split-ratio').isVisible()))throw new Error('Ratio options must be available in the drawer');
 const geometry=await page.locator('#settings-inline-general').evaluate(panel=>{
  const drawer=document.getElementById('tool-menu').getBoundingClientRect();
  const switches=[...panel.querySelectorAll('.ratio-segments label')].map(el=>el.getBoundingClientRect());
  const swap=panel.querySelector('#swap-panels').getBoundingClientRect();
  const parent=panel.getBoundingClientRect();
  const select=panel.querySelector('#server-mode').getBoundingClientRect();
  const segmented=panel.querySelector('.ratio-segments').getBoundingClientRect();
  const fieldset=panel.querySelector('#split-ratio').getBoundingClientRect();
  return {drawerRight:drawer.right, parentRight:parent.right, parentLeft:parent.left,
   labels:switches.map(r=>({left:r.left,right:r.right,top:r.top,width:r.width})),
   segmented:{left:segmented.left,right:segmented.right,width:segmented.width},
   fieldset:{left:fieldset.left,right:fieldset.right,top:fieldset.top,bottom:fieldset.bottom},
   swap:{left:swap.left,right:swap.right,width:swap.width},
   select:{left:select.left,right:select.right}};
 });
 if(geometry.labels.length!==3||geometry.labels.some(r=>r.width<44))throw new Error('Compact ratio buttons are too narrow');
 if(geometry.segmented.width>230)throw new Error('Screen ratio control should use its previous compact width');
 if(Math.max(...geometry.labels.map(r=>r.top))-Math.min(...geometry.labels.map(r=>r.top))>3)throw new Error('Ratio buttons must occupy one row');
 if(Math.max(...geometry.labels.map(r=>r.width))-Math.min(...geometry.labels.map(r=>r.width))>4)throw new Error('Ratio button widths must match');
 if(geometry.labels.some(r=>r.right>geometry.parentRight+2)||geometry.swap.right>geometry.parentRight+2||geometry.select.right>geometry.parentRight+2)throw new Error('Settings controls overflow drawer panel');
 if(geometry.swap.width>180||geometry.swap.width<65)throw new Error('Swap button should use the original compact width');
 if(Math.abs(geometry.swap.left-geometry.fieldset.right)>16)throw new Error('Swap and screen ratio must be adjacent');
 const sameRow=await page.locator('#settings-inline-general').evaluate(panel=>{
  const ratio=panel.querySelector('#split-ratio').getBoundingClientRect();
  const swap=panel.querySelector('#swap-panels').getBoundingClientRect();
  return Math.abs((ratio.top+ratio.bottom)/2-(swap.top+swap.bottom)/2)<5;
 });
 if(!sameRow)throw new Error('Screen ratio and swap must share the original horizontal row');
 await page.setViewportSize({width:1366,height:995});
 const footerLayout=await page.locator('#schedule-reset-footer').evaluate(el=>{
  const rect=el.getBoundingClientRect(), btn=el.querySelector('button').getBoundingClientRect();
  return {footerTop:rect.top,buttonBottom:btn.bottom,panelBottom:el.closest('.tool-panel').getBoundingClientRect().bottom};
 });
 if(footerLayout.buttonBottom>footerLayout.panelBottom)throw new Error('Reset button overflows schedule panel');
 await page.setViewportSize({width:1366,height:900});
 await page.locator('#tool-menu-close').click();
 if(await page.locator('#tool-menu').isVisible())throw new Error('Function drawer did not close normally');
 await page.locator('#tool-menu-toggle').click();
 await page.locator('#tool-menu-list [data-tool="plan"]').click();
 if(!(await page.locator('#plan-panel').isVisible()))throw new Error('Plan management not visible on plan page');
 if(await page.locator('#schedule-plans-backdrop').count())throw new Error('Plan manager popup should be removed');
 if(await page.locator('#plan-quick-list [data-plan-rename]').count())throw new Error('Standalone rename must be removed');
 if((await page.locator('#plan-quick-list [data-plan-delete]').count())<1)throw new Error('Inline delete missing');
 const previewRow=page.locator('#plan-quick-list .plan-library-row[data-plan-preview]').first();
 await previewRow.locator('.plan-library-details').click();
 if((await previewRow.locator('button').count())!==3)throw new Error('A plan should keep only three action buttons');
 if(!(await page.locator('#plan-preview .plan-preview-years').isVisible()))throw new Error('Plan preview not shown');
 if((await page.locator('#plan-preview .plan-preview-cell').count())!==72)throw new Error('Plan preview must show 72 turns');
 const planOrder=await page.locator('#plan-panel .plan-browser-layout').evaluate(el=>{
  const list=el.querySelector('#plan-quick-list').getBoundingClientRect(),preview=el.querySelector('#plan-preview').getBoundingClientRect();
  return {listBottom:list.bottom,previewTop:preview.top};
 });
 if(planOrder.previewTop<planOrder.listBottom)throw new Error('Plan preview must be below the plan list');
 await page.setViewportSize({width:720,height:900});
 const yearTabs=page.locator('#plan-preview .plan-preview-year-tabs');
 if(!(await yearTabs.isVisible()))throw new Error('Year tabs must appear when preview has insufficient width');
 await yearTabs.locator('[data-plan-preview-year="classic"]').click();
 if((await page.locator('#plan-preview .plan-preview-year:visible').count())!==1)throw new Error('Only one preview year should appear in narrow mode');
 if(!(await page.locator('#plan-preview .plan-preview-year:nth-child(2)').isVisible()))throw new Error('Classic tab should show classic preview');
 await page.setViewportSize({width:1366,height:900});
 if((await page.locator('#plan-preview .plan-preview-face.schedule-cell-face').count())!==72)throw new Error('Plan preview must share native schedule icon layout');
 if((await page.locator('#plan-quick-list [data-plan-use]').count())<1)throw new Error('Inline select missing');
 if((await page.locator('#plan-quick-list [data-plan-edit]').count())<1)throw new Error('Inline edit missing');
 if(await page.locator('#schedule-plan-save').count())throw new Error('Saving actual records as a plan must be removed');
 // Actions stay to the right of the text, bottom-aligned in every card width.
 for(const width of [1366,980,760,520,390]){
  await page.setViewportSize({width,height:900});
  const result=await page.locator('#plan-quick-list .plan-library-row').first().evaluate(card=>{
   const rect=card.getBoundingClientRect();
   const details=card.querySelector('.plan-library-details').getBoundingClientRect();
   const actions=card.querySelector('.schedule-plan-actions').getBoundingClientRect();
   const buttons=[...card.querySelectorAll('.schedule-plan-actions button')].map(b=>b.getBoundingClientRect());
   return {cardRight:rect.right,cardBottom:rect.bottom,detailsRight:details.right,
    detailsTop:details.top,detailsBottom:details.bottom,
    actionsLeft:actions.left,actionsRight:actions.right,actionsTop:actions.top,actionsBottom:actions.bottom,
    buttonsOneRow:buttons.every(b=>Math.abs(b.top-buttons[0].top)<2),
    cardPosition:getComputedStyle(card).position,actionPosition:getComputedStyle(card.querySelector('.schedule-plan-actions')).position};
  });
  if(result.cardPosition!=='relative'||result.actionPosition!=='absolute'||!result.buttonsOneRow||result.actionsLeft<result.detailsRight-2||
     result.actionsTop>result.detailsBottom+1||result.cardRight-result.actionsRight>18||
     result.cardBottom-result.actionsBottom>18)
   throw new Error('Plan actions not right-aligned beside text at '+width+'px: '+JSON.stringify(result));
 }
 await page.setViewportSize({width:1366,height:900});
 const firstPlan=page.locator('#plan-quick-list .plan-library-row').first();
 if((await firstPlan.innerText()).includes('/72턴'))throw new Error('Action count must not be shown');
 // A plan selection must never reset or replace the actual recording.
 const beforeRun=await page.evaluate(()=>({
  current:localStorage.getItem('uma-schedule-current-v1-ko'),
  recorded:localStorage.getItem('uma-schedule-recorded-turns-v2-v1-ko')
 }));
 const selectDialogs=[];
 page.on('dialog',dialog=>{selectDialogs.push(dialog.message());dialog.dismiss()});
 if((await firstPlan.locator('[data-plan-use]').innerText())==='선택 해제'){
  await firstPlan.locator('[data-plan-use]').click();
 }
 if((await firstPlan.locator('[data-plan-use]').innerText())!=='선택')throw new Error('Unselected plan must show 선택');
 await firstPlan.locator('[data-plan-use]').click();
 if(selectDialogs.length)throw new Error('Selecting a plan must not display a reset confirmation');
 const afterRun=await page.evaluate(()=>({
  current:localStorage.getItem('uma-schedule-current-v1-ko'),
  recorded:localStorage.getItem('uma-schedule-recorded-turns-v2-v1-ko')
 }));
 if(JSON.stringify(beforeRun)!==JSON.stringify(afterRun))throw new Error('Selecting a plan changed actual recorded cultivation');
 if((await firstPlan.locator('[data-plan-use]').innerText())!=='선택 해제')throw new Error('Selected plan must show 선택 해제');
 if((await firstPlan.locator('.plan-library-details small').count())!==2)throw new Error('Character and scenario must appear on separate lines');
 if((await firstPlan.locator('.plan-library-details').innerText()).includes('선택됨'))throw new Error('Selected label must not appear in plan details');
 if(!(await firstPlan.evaluate(el=>el.classList.contains('selected-plan'))))throw new Error('Selected plan visual emphasis is missing');
 const controls=firstPlan.locator('.schedule-plan-actions button');
 if((await controls.count())!==3)throw new Error('A plan must have exactly three buttons');
 if((await controls.allTextContents()).join('|')!=='선택 해제|편집|삭제')throw new Error('Plan buttons are not selection, edit and delete');
 const bounding=await controls.evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().top));
 if(Math.max(...bounding)-Math.min(...bounding)>4)throw new Error('Plan buttons must align horizontally');
 if(!(await firstPlan.locator('small').innerText()).includes('기본'))throw new Error('Plan scenario missing from summary');
 await firstPlan.locator('[data-plan-edit]').click();
 if(!(await page.locator('#schedule-plan-edit-cancel').isVisible()))throw new Error('Inline plan edit did not open');
 if((await page.locator('#schedule-view-heading').innerText())!=='육성 계획')throw new Error('Plan editor must not be titled 육성 기록');
 if(!(await page.locator('#schedule-plan-caption').innerText()).includes('Senior planned action'))throw new Error('Plan editor title should show plan name');
 if(!(await page.locator('#schedule-plan-name').isVisible()))throw new Error('Plan name field missing from editor');
 const oldName=await page.locator('#schedule-plan-name').inputValue();
 await page.locator('#schedule-edit-settings-open').click();
 if(!(await page.locator('#plan-info-fields').isVisible()))throw new Error('Plan information must open inline');
 if(await page.locator('#settings-backdrop').isVisible())throw new Error('Plan editor must not open common settings');
 if(!(await page.locator('#plan-edit-character').isVisible()))throw new Error('Plan character selector missing');
 await page.locator('#plan-edit-scenario').selectOption('onsen');
 // The global header must continue to describe the actual recording.
 if(!(await page.locator('#schedule-header-scenario').innerText()).includes('온천향'))throw new Error('Plan draft changed the recording header');
 await page.locator('#schedule-plan-name').fill('수정한 계획명');
 await page.locator('#schedule-plan-edit-save').click();
 if(!(await page.locator('#plan-quick-list .plan-library-row').first().innerText()).includes('수정한 계획명'))throw new Error('Plan name was not saved through editor');
 if(!(await page.locator('#plan-quick-list .plan-library-row').first().innerText()).includes('온천향'))throw new Error('Plan scenario was not saved through editor');
 await page.locator('#plan-quick-list .plan-library-row').first().locator('[data-plan-edit]').click();
 await page.locator('#schedule-plan-name').fill(oldName);
 await page.locator('#schedule-edit-settings-open').click();
 await page.locator('#plan-edit-scenario').selectOption('basic');
 await page.locator('#schedule-plan-edit-save').click();
 // The plan and record tools have distinct navigation and browsing surfaces.
 if(!(await page.locator('#plan-panel').isVisible()))throw new Error('Plan workspace not visible after exiting plan editor');
 if(await page.locator('#schedule-panel').isVisible())throw new Error('Record workspace should not be shown while browsing plans');
 if((await page.locator('#plan-quick-list [data-plan-edit]').count())<1)throw new Error('Stored plans not shown inline');
 await page.evaluate(()=>{layout.mode='split';applyLayout();});
 if(!(await page.locator('#workspace').evaluate(el=>el.classList.contains('single'))))throw new Error('Plan must be single mode even when preference is split');
 const savedBefore=await page.evaluate(()=>JSON.parse(localStorage.getItem('uma-tracker-layout-v1')).mode);
 await page.locator('#tool-menu-toggle').click();
 if(!(await page.locator('#split-toggle').isDisabled()))throw new Error('Plan must disable split toggle');
 if(!(await page.locator('#split-toggle').isChecked()))throw new Error('Plan must preserve ON preference');
 const savedAfter=await page.evaluate(()=>JSON.parse(localStorage.getItem('uma-tracker-layout-v1')).mode);
 if(savedBefore!==savedAfter)throw new Error('Plan must not change split preference');
 if(!(await page.locator('[data-tool-category="plan"]').isVisible()))throw new Error('Plan menu group missing');
 if(!(await page.locator('[data-tool-category="record"]').isVisible()))throw new Error('Record menu group missing');
 await page.locator('#tool-menu-list [data-tool="schedule"]').click();
 if(!(await page.locator('#workspace').evaluate(el=>el.classList.contains('split'))))throw new Error('Returning to records must restore split preference');
 if(!(await page.locator('#schedule-panel').isVisible()))throw new Error('Record scheduler not restored');
 if(!(await page.locator('#schedule-current-turn').innerText()).includes('1/72턴'))throw new Error('Switching tools altered actual record progress');
 await page.locator('#tool-menu-toggle').click();
 await page.locator('#tool-menu-list [data-tool="plan"]').click();
 await page.locator('#plan-create-new').click();
 if(!(await page.locator('#schedule-plan-edit-save').isVisible()))throw new Error('New plan editor did not open');
 await page.locator('#schedule-panel [data-schedule-year="senior"]').click();
 await page.locator('#schedule-grid [data-schedule-year-cell="senior"][data-schedule-turn="17"]').click();
 await page.locator('#schedule-action-choices [data-schedule-action="power"]').click();
 await page.locator('#schedule-plan-edit-cancel').click();
 await page.locator('#tool-menu-toggle').click();
 await page.locator('#tool-menu-list [data-tool="schedule"]').click();
 if(!(await page.locator('#schedule-current-turn').innerText()).includes('1/72턴'))throw new Error('Editing plan mutated current record progress');
 // Text management must not be exposed in the developer or published preview.
 await page.locator('#tool-menu-toggle').click();
 if(await page.locator('[data-tool="texts"], #text-panel').count())throw new Error('Text management UI remains');
 if(!(await page.locator('#settings-inline-general').isVisible()))throw new Error('Permanent settings disappeared');
 if(errors.length)throw new Error('Browser JavaScript errors: '+errors.join('; '));
 console.log('PASS: browser startup, counters, schedule and plans');
}finally{if(browser)await browser.close();server.kill()}