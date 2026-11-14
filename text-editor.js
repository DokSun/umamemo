'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const items = UI_TEXT_ITEMS;
  const byKey = Object.fromEntries(items.map(x => [x.key, x]));
  const draft = uiTextDraft();
  let selected = items[0].key;
  let expanded = new Set(['공통','공통/상단','공통/기능 메뉴']);
  const paths = [...new Set(items.flatMap(item => item.path.split('/').map((_, i, xs) => xs.slice(0, i + 1).join('/'))))];
  const currentValue = item => typeof draft[item.key] === 'string' ? draft[item.key] : item.value;
  const altered = () => items.filter(item => currentValue(item) !== item.value);
  const persist = () => { localStorage.setItem(UI_TEXT_STORAGE_KEY, JSON.stringify(draft)); };
  function notify(message){$('status').textContent=message;}
  function tree(){
    const q = $('search').value.trim().toLocaleLowerCase();
    const list = $('tree'); list.replaceChildren();
    if(q){
      items.filter(x=>[x.path,x.label,x.key,x.value].some(v=>v.toLocaleLowerCase().includes(q))).forEach(x => addItem(x,0));
    }else{
      function branch(parent, level){
        const childPaths=paths.filter(p=>p.split('/').length===level+1 && (!parent || p.startsWith(parent+'/')));
        for(const path of childPaths){
          const btn=document.createElement('button');
          btn.className='node group'; btn.style.paddingLeft=(8+level*18)+'px';
          btn.type='button';btn.textContent=(expanded.has(path)?'▾ ':'▸ ')+path.split('/').at(-1);
          btn.setAttribute('aria-expanded',String(expanded.has(path)));
          btn.onclick=()=>{if(expanded.has(path))expanded.delete(path);else expanded.add(path);tree();};list.append(btn);
          if(expanded.has(path)){
            items.filter(x=>x.path===path).forEach(x=>addItem(x,level+1));
            branch(path,level+1);
          }
        }
      }
      branch('',0);
    }
    $('count').textContent=items.length+'개 문구 · '+altered().length+'개 수정됨';
  }
  function addItem(item,level){
    const btn=document.createElement('button');btn.type='button';
    btn.className='node'+(selected===item.key?' active':'');
    btn.style.paddingLeft=(8+level*18)+'px';
    const label=document.createElement('span');label.textContent='• '+item.label;btn.append(label);
    if(currentValue(item)!==item.value){const mark=document.createElement('span');mark.className='changed';mark.textContent='수정';btn.append(mark);}
    btn.onclick=()=>{selected=item.key;show();tree();};$('tree').append(btn);
  }
  function show(){
    const item=byKey[selected];$('crumb').textContent=item.path+' / '+item.label;
    $('text-key').value=item.key;$('original').textContent=item.value;
    $('edited').value=currentValue(item);$('edited').disabled=false;
    changes();
  }
  function changes(){
    $('changes-count').textContent=altered().length;
    $('changes').replaceChildren();
    for(const x of altered()){
      const li=document.createElement('li');li.textContent=x.path+' / '+x.label+' : '+currentValue(x);
      $('changes').append(li);
    }
  }
  function download(filename, content, type){
    const blob=new Blob([content],{type});const a=document.createElement('a');
    const url=URL.createObjectURL(blob);a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
  }
  $('search').addEventListener('input',tree);
  $('expand').onclick=()=>{expanded=new Set(paths);tree();};
  $('collapse').onclick=()=>{expanded.clear();tree();};
  $('edited').oninput=e=>{
    const value=e.target.value,item=byKey[selected];
    if(value===item.value)delete draft[selected]; else draft[selected]=value;
    try{persist();notify('이 브라우저에 자동 저장되었습니다.');}catch(err){notify('저장 공간 오류: '+err.message);}
    tree();changes();
  };
  $('restore').onclick=()=>{delete draft[selected];persist();show();tree();notify('원본 문구로 복원했습니다.');};
  $('reset-all').onclick=()=>{
    if(!confirm('모든 텍스트 수정 내역을 초기화할까요?'))return;
    for(const key of Object.keys(draft))delete draft[key];
    persist();show();tree();notify('전체 수정 내역을 초기화했습니다.');
  };
  $('view-site').onclick=()=>window.open('./','_blank','noopener');
  $('download-json').onclick=()=>download('umamemo-ui-text-changes.json',JSON.stringify(Object.fromEntries(altered().map(x=>[x.key,currentValue(x)])),null,2)+'\n','application/json;charset=utf-8');
  $('download-js').onclick=()=>{
    const published=items.map(x=>({...x,value:currentValue(x)}));
    const source='/* Published interface strings. Edit in text-editor.html or GitHub. */\n'
      +'const UI_TEXT_ITEMS = '+JSON.stringify(published,null,2)+';\n'
      +'const UI_TEXT = Object.freeze(Object.fromEntries(UI_TEXT_ITEMS.map(item => [item.key,item.value])));\n'
      +'const UI_TEXT_STORAGE_KEY = '+JSON.stringify(UI_TEXT_STORAGE_KEY)+';\n'
      +'function uiTextDraft(){try{const raw=JSON.parse(localStorage.getItem(UI_TEXT_STORAGE_KEY)||"{}");return raw&&typeof raw==="object"&&!Array.isArray(raw)?raw:{};}catch{return {};}}\n'
      +'function uiText(key){const drafts=uiTextDraft();return Object.hasOwn(UI_TEXT,key)&&typeof drafts[key]==="string"?drafts[key]:UI_TEXT[key]??"";}\n';
    download('ui-text.js',source,'text/javascript;charset=utf-8');
    notify('배포용 파일을 다운로드했습니다. GitHub에 반영한 후 이 브라우저의 초안 수정 내역을 초기화하면 게시된 값을 확인할 수 있습니다.');
  };
  show();tree();
})();
