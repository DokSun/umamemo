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
 if((await page.locator('#schedule-grid .schedule-cell').count())!==72)throw new Error('Expected 72 turns');
 if(!(await page.locator('#schedule-reset').isVisible()))throw new Error('Schedule reset is hidden');
 if((await page.locator('#schedule-training-grid .schedule-level-item').count())!==5)throw new Error('Expected five training levels');
 const current=page.locator('#schedule-current-turn');
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
 await page.locator('#slots > *').first().waitFor({timeout:20000});
 await page.locator('#tool-menu-toggle').click();
 await page.locator('#tool-menu-list [data-tool="schedule"]').click();
 if(!(await page.locator('#schedule-current-turn').innerText()).includes('1/72턴'))throw new Error('Senior plan action must not change current junior turn');
 if(!(await page.locator('#schedule-grid [data-schedule-year-cell="senior"][data-schedule-turn="17"]').isDisabled()))throw new Error('Future senior planned action must remain unrecordable');
 await page.locator('#schedule-plans-open').click();
 await page.locator('#schedule-plan-new').click();
 if(!(await page.locator('#schedule-plan-edit-cancel').isVisible()))throw new Error('Plan editing did not open');
 await page.locator('#schedule-plan-edit-cancel').click();
 if(errors.length)throw new Error('Browser JavaScript errors: '+errors.join('; '));
 console.log('PASS: browser startup, counters, schedule and plans');
}finally{if(browser)await browser.close();server.kill()}