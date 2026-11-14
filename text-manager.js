/* Editable UI text inventory organized by actual navigation paths. */
const TEXT_MANAGER_CATALOG = [["공통 > 상단","우마 메모","화면"],["공통 > 상단","기능","화면"],["공통 > 상단","현재 육성","화면"],["공통 > 상단","캐릭터 미지정","화면"],["공통 > 상단","기본","화면"],["공통 > 기능 메뉴","계획 · 기록 · 설정","화면"],["기록 > 서포트 이벤트 카운팅","서포트 이벤트 카운팅","화면"],["기록 > 서포트 이벤트 카운팅","이벤트 카운팅 초기화","화면"],["기록 > 메모장","메모장","화면"],["기록 > 메모장","메모장 초기화","화면"],["계획 > 육성 계획 > 편집","육성 기록","화면"],["계획 > 육성 계획 > 편집","초기 계획 미지정","화면"],["계획 > 육성 계획 > 편집","계획 이름","화면"],["계획 > 육성 계획 > 편집","실제 육성 기록과 별도로 편집됩니다.","화면"],["계획 > 육성 계획 > 편집","계획 정보 수정","화면"],["계획 > 육성 계획 > 편집","계획 저장","화면"],["계획 > 육성 계획 > 편집","취소","화면"],["계획 > 육성 계획 > 편집","계획 기본 정보","화면"],["계획 > 육성 계획 > 편집","육성 우마무스메","화면"],["계획 > 육성 계획 > 편집","캐릭터 선택","화면"],["계획 > 육성 계획 > 편집","육성 시나리오","화면"],["계획 > 육성 계획 > 편집","기본","화면"],["계획 > 육성 계획 > 편집","극락♪ 유코마 온천향","화면"],["기록 > 육성 기록","훈련 레벨 현황","화면"],["기록 > 육성 기록","현재 주니어 1월 전반 · 1/72턴","화면"],["기록 > 육성 기록","주니어","화면"],["기록 > 육성 기록","클래식","화면"],["기록 > 육성 기록","시니어","화면"],["기록 > 육성 기록","현재 육성 초기화","화면"],["계획 > 육성 계획","육성 계획","화면"],["계획 > 육성 계획","0개 저장","화면"],["계획 > 육성 계획","72턴을 자유롭게 계획하는 기능입니다. 실제 기록과 현재 턴은 변경되지 않습니다.","화면"],["계획 > 육성 계획","새 계획 작성","화면"],["설정 > 카운팅 설정","서포트 이벤트 카운팅","화면"],["설정 > 카운팅 설정","초기화 팝업","화면"],["설정 > 카운팅 설정","OFF로 설정하면 카운팅 초기화 시 확인창을 표시하지 않습니다.","화면"],["설정 > 화면·서버 설정","서버 및 화면 구성","화면"],["설정 > 화면·서버 설정","서버","화면"],["설정 > 화면·서버 설정","한국","화면"],["설정 > 화면·서버 설정","일본","화면"],["설정 > 화면·서버 설정","동시 사용","화면"],["설정 > 화면·서버 설정","OFF: 단독 / ON: 카운팅 + 선택 도구","화면"],["설정 > 화면·서버 설정","화면 비율","화면"],["설정 > 화면·서버 설정","⇄ 좌우 전환","화면"],["설정 > 화면·서버 설정","메모장은 별도의 설정 없이 기록 내용만 자동 저장됩니다.","화면"],["기록 > 육성 기록","육성 캐릭터","화면"],["기록 > 육성 기록","캐릭터 선택 (목표 레이스 표시)","화면"],["기록 > 육성 기록","육성 시나리오","화면"],["기록 > 육성 기록","기본","화면"],["기록 > 육성 기록","극락♪ 유코마 온천향","화면"],["기록 > 서포트 이벤트 카운팅 > 카드 선택","서포트 카드 선택","화면"],["기록 > 서포트 이벤트 카운팅 > 카드 선택","비우기","화면"],["기록 > 육성 기록 > 턴 선택","행동 선택","화면"],["기록 > 육성 기록 > 턴 선택","이번 턴 레이스 선택","화면"],["기록 > 육성 기록 > 턴 선택","레이스 선택","화면"],["기록 > 육성 기록 > 턴 선택","온천 시나리오","화면"],["기록 > 육성 기록 > 턴 선택","온천권 사용","화면"],["기록 > 육성 기록 > 턴 선택","회복","화면"],["기록 > 육성 기록 > 턴 선택","초회복","화면"],["기록 > 육성 기록 > 턴 선택","굴착할 온천 선택 (하나만 선택)","화면"],["기록 > 육성 기록 > 턴 선택","목표 턴 완료 · 다음 턴","화면"],["기록 > 육성 기록 > 턴 선택","턴 초기화","화면"],["공통 > 상단","기능 메뉴 열기","접근성·입력"],["공통 > 상단","기능 메뉴","접근성·입력"],["공통 > 상단","현재 육성 정보","접근성·입력"],["공통 > 기능 메뉴","기능 선택","접근성·입력"],["공통 > 기능 메뉴","기능 메뉴 닫기","접근성·입력"],["계획 > 육성 계획 > 편집","계획 이름을 입력하세요","접근성·입력"],["계획 > 육성 계획 > 편집","육성 계획 이름","접근성·입력"],["계획 > 육성 계획 > 편집","계획 육성 우마무스메","접근성·입력"],["계획 > 육성 계획 > 편집","계획 육성 시나리오","접근성·입력"],["기록 > 육성 기록","현재 훈련 레벨","접근성·입력"],["기록 > 육성 기록","육성 시기","접근성·입력"],["기록 > 육성 기록","주니어·클래식·시니어 스케줄","접근성·입력"],["계획 > 육성 계획","저장한 육성 계획","접근성·입력"],["설정 > 카운팅 설정","이벤트 초기화 확인 팝업","접근성·입력"],["설정 > 화면·서버 설정","서버 선택","접근성·입력"],["설정 > 화면·서버 설정","동시 사용 켜기","접근성·입력"],["설정 > 화면·서버 설정","카운팅 영역 비율","접근성·입력"],["기록 > 육성 기록","육성 캐릭터 선택","접근성·입력"],["기록 > 서포트 이벤트 카운팅 > 카드 선택","닫기","접근성·입력"],["기록 > 서포트 이벤트 카운팅 > 카드 선택","속성 선택","접근성·입력"],["기록 > 서포트 이벤트 카운팅 > 카드 선택","등급 선택","접근성·입력"],["기록 > 육성 기록 > 턴 선택","닫기","접근성·입력"],["공통 > 알림·초기화","서포트 이벤트 카운팅","동적 문구"],["공통 > 알림·초기화","메모장","동적 문구"],["공통 > 알림·초기화","육성 기록","동적 문구"],["공통 > 알림·초기화","육성 계획","동적 문구"],["공통 > 알림·초기화","육성 기록 통합 초기화","동적 문구"],["공통 > 알림·초기화","초기화","동적 문구"],["공통 > 알림·초기화","계획 편집을 저장하거나 취소한 후 초기화해 주세요","동적 문구"],["공통 > 알림·초기화","현재 육성 스케줄을","동적 문구"],["공통 > 알림·초기화","의 기록을","동적 문구"],["공통 > 알림·초기화","현재 표시된 육성 기록을 모두","동적 문구"],["공통 > 알림·초기화","저장된 계획은 유지되고 지정한 초기 계획이 육성 기록에 다시 적용됩니다.","동적 문구"],["공통 > 알림·초기화","초기화할까요?","동적 문구"],["공통 > 알림·초기화","이벤트 카운팅을 초기화하고 육성 기록을 초기 계획으로 복원했습니다.","동적 문구"],["공통 > 알림·초기화","육성 기록을 초기 계획으로 복원했습니다.","동적 문구"],["공통 > 알림·초기화","육성 기록을 함께 초기화했습니다","동적 문구"],["공통 > 알림·초기화","초기화했습니다","동적 문구"],["기록 > 육성 기록","온천","동적 문구"],["기록 > 육성 기록","온천권 회복","동적 문구"],["기록 > 육성 기록","온천권 초회복","동적 문구"],["기록 > 육성 기록","온천권 사용 · 효과 1턴째","동적 문구"],["기록 > 육성 기록","온천 효과 2턴째","동적 문구"],["기록 > 육성 기록","· 초회복","동적 문구"],["기록 > 육성 기록","훈련 (이전 기록)","동적 문구"],["기록 > 육성 기록","보건실 (이전 기록)","동적 문구"],["기록 > 육성 기록","기타 (이전 기록)","동적 문구"],["기록 > 육성 기록","육성 완료 · 72/72턴","동적 문구"],["기록 > 육성 기록","현재","동적 문구"],["기록 > 육성 기록","전반","동적 문구"],["기록 > 육성 기록","후반","동적 문구"],["기록 > 육성 기록","/72턴","동적 문구"],["기록 > 육성 기록","합숙","동적 문구"],["기록 > 육성 기록","/4회","동적 문구"],["기록 > 육성 기록","계획 이름을 입력해 주세요","동적 문구"],["기록 > 육성 기록","저장된 계획을 찾을 수 없습니다","동적 문구"],["기록 > 육성 기록","계획은 최대 50개까지 저장할 수 있습니다","동적 문구"],["기록 > 육성 기록","계획을 저장했습니다","동적 문구"],["기록 > 육성 기록","스케줄 저장 실패: 저장 공간을 확인해 주세요","동적 문구"],["기록 > 육성 기록","계획 저장 실패: 저장 공간을 확인해 주세요","동적 문구"],["기록 > 육성 기록","목표 레이스","동적 문구"],["기록 > 육성 기록","목표","동적 문구"],["기록 > 육성 기록","새 계획","동적 문구"],["기록 > 육성 기록","초기 계획:","동적 문구"],["기록 > 육성 기록","초기 계획 미지정","동적 문구"],["기록 > 육성 기록","육성 계획","동적 문구"],["기록 > 육성 기록","육성 기록","동적 문구"],["기록 > 육성 기록","현재 육성","동적 문구"],["기록 > 육성 기록","행동 추가","동적 문구"],["기록 > 육성 기록","선택 목표","동적 문구"],["기록 > 육성 기록","· 목표:","동적 문구"],["기록 > 육성 기록","· 출전:","동적 문구"],["기록 > 육성 기록","고정 목표 레이스","동적 문구"],["기록 > 육성 기록","육성 캐릭터를 변경하면 현재 스케줄과 진행 기록이 초기화됩니다. 변경할까요?","동적 문구"],["기록 > 육성 기록","현재 턴부터 순서대로 기록해 주세요","동적 문구"],["기록 > 육성 기록","목표 ·","동적 문구"],["기록 > 육성 기록","출전할 레이스 선택","동적 문구"],["기록 > 육성 기록","육성 시나리오를 변경하면 현재 육성의 시나리오 설정이 변경됩니다. 계속할까요?","동적 문구"],["기록 > 육성 기록","· 필요 팬","동적 문구"],["기록 > 육성 기록","레이스를 먼저 선택하세요","동적 문구"],["기록 > 육성 기록","레이스 목록에서 출전할 레이스를 선택해 주세요","동적 문구"],["기록 > 서포트 이벤트 카운팅","한국 서버 모드","동적 문구"],["기록 > 서포트 이벤트 카운팅","일본 서버 모드","동적 문구"],["기록 > 서포트 이벤트 카운팅","친구","동적 문구"],["기록 > 서포트 이벤트 카운팅","그룹","동적 문구"],["기록 > 서포트 이벤트 카운팅","카드를 선택하세요","동적 문구"],["기록 > 서포트 이벤트 카운팅","이미지 없음","동적 문구"],["기록 > 서포트 이벤트 카운팅","전체","동적 문구"],["기록 > 서포트 이벤트 카운팅","스피드","동적 문구"],["기록 > 서포트 이벤트 카운팅","스태미나","동적 문구"],["기록 > 서포트 이벤트 카운팅","파워","동적 문구"],["기록 > 서포트 이벤트 카운팅","근성","동적 문구"],["기록 > 서포트 이벤트 카운팅","지능","동적 문구"],["기록 > 서포트 이벤트 카운팅","카드 DB를 불러오는 중입니다","동적 문구"],["기록 > 서포트 이벤트 카운팅 > 카드 선택","전체","동적 문구"],["기록 > 서포트 이벤트 카운팅 > 카드 선택","DB를 읽지 못했습니다. 웹 서버에서 실행하세요.","동적 문구"],["기록 > 육성 기록","'+(goal.c?'선택 목표':'육성 목표')+'","동적 버튼"],["기록 > 육성 기록","'+escapeHTML(grade||'목표')+'","동적 버튼"],["기록 > 육성 기록","'+(goal.c?'선택 목표':'목표')+'","동적 버튼"],["계획 > 육성 계획","저장된 계획이 없습니다. 새 계획을 작성해 주세요.","동적 버튼"],["계획 > 육성 계획","편집","동적 버튼"],["계획 > 육성 계획","삭제","동적 버튼"],["기록 > 서포트 이벤트 카운팅","카드 선택","동적 버튼"],["기록 > 서포트 이벤트 카운팅","단계 수","동적 버튼"],["기록 > 서포트 이벤트 카운팅 > 카드 선택","`:'전체'}","동적 버튼"],["기록 > 서포트 이벤트 카운팅 > 카드 선택","이미지 없음","동적 버튼"],["기록 > 서포트 이벤트 카운팅 > 카드 선택","검색 조건에 맞는 카드가 없습니다.","동적 버튼"],["기록 > 서포트 이벤트 카운팅 > 카드 선택","◀ 이전","동적 버튼"],["기록 > 서포트 이벤트 카운팅 > 카드 선택","다음 ▶","동적 버튼"],["기록 > 육성 기록 > 온천 시나리오","온천 시나리오","공통 문구"],["기록 > 육성 기록 > 온천 시나리오","굴착할 온천 선택 (하나만 선택)","공통 문구"],["기록 > 육성 기록 > 온천 시나리오","온천권 사용","공통 문구"],["기록 > 육성 기록 > 온천 시나리오","회복","공통 문구"],["기록 > 육성 기록 > 온천 시나리오","초회복","공통 문구"],["기록 > 육성 기록 > 레이스","레이스를 선택하면 상세 정보가 표시됩니다.","공통 문구"],["기록 > 육성 기록 > 레이스","이번 턴 레이스 선택","공통 문구"],["계획 > 육성 계획","계획을 육성 기록의 초기 상태로 지정합니다. 이후 실제 행동으로 수정할 수 있으며 육성 초기화 시 지정한 계획으로 돌아갑니다.","공통 문구"],["계획 > 육성 계획","저장된 계획이 없습니다.","공통 문구"],["공통 > 기능 메뉴","계획","메뉴·버튼"],["공통 > 기능 메뉴","기록","메뉴·버튼"],["공통 > 기능 메뉴","설정","메뉴·버튼"],["공통 > 기능 메뉴","육성 계획","메뉴·버튼"],["공통 > 기능 메뉴","육성 기록","메뉴·버튼"],["공통 > 기능 메뉴","서포트 이벤트 카운팅","메뉴·버튼"],["공통 > 기능 메뉴","메모장","메뉴·버튼"],["공통 > 기능 메뉴","카운팅 설정","메뉴·버튼"],["공통 > 기능 메뉴","화면·서버 설정","메뉴·버튼"],["공통 > 기능 메뉴","텍스트 관리","메뉴·버튼"],["공통 > 기능 메뉴","기능","메뉴·버튼"],["계획 > 육성 계획","선택","메뉴·버튼"],["계획 > 육성 계획","선택 해제","메뉴·버튼"],["계획 > 육성 계획","선택됨","메뉴·버튼"],["계획 > 육성 계획","계획을 선택했습니다. 현재 육성 기록은 유지됩니다.","메뉴·버튼"],["기록 > 육성 기록 > 턴 선택","스피드 훈련","메뉴·버튼"],["기록 > 육성 기록 > 턴 선택","스태미나 훈련","메뉴·버튼"],["기록 > 육성 기록 > 턴 선택","파워 훈련","메뉴·버튼"],["기록 > 육성 기록 > 턴 선택","근성 훈련","메뉴·버튼"],["기록 > 육성 기록 > 턴 선택","지능 훈련","메뉴·버튼"],["기록 > 육성 기록 > 턴 선택","휴식","메뉴·버튼"],["기록 > 육성 기록 > 턴 선택","외출","메뉴·버튼"],["기록 > 육성 기록 > 턴 선택","레이스","메뉴·버튼"],["기록 > 육성 기록 > 턴 선택","PR 활동","메뉴·버튼"],["기록 > 서포트 이벤트 카운팅 > 카드 선택","SSR","메뉴·버튼"],["기록 > 서포트 이벤트 카운팅 > 카드 선택","SR","메뉴·버튼"],["설정 > 화면·서버 설정","좌우 전환","메뉴·버튼"],["설정 > 텍스트 관리","텍스트 관리","메뉴·버튼"],["설정 > 텍스트 관리","메뉴 경로","메뉴·버튼"],["설정 > 텍스트 관리","문구 검색","메뉴·버튼"],["설정 > 텍스트 관리","원래대로","메뉴·버튼"],["설정 > 텍스트 관리","전체 초기화","메뉴·버튼"],["설정 > 텍스트 관리","JSON 내보내기","메뉴·버튼"],["설정 > 텍스트 관리","JSON 가져오기","메뉴·버튼"]];

const TEXT_MANAGER_STORAGE='umamemo-text-overrides-v1';
const TEXT_MANAGER_DISCOVERY='umamemo-text-discovered-v1';
const TEXT_MANAGER_KEY=(path,source)=>path+'\u0001'+source;
let textManagerOverrides={};
let textManagerObserved={};
const textManagerOriginals=new WeakMap();
const textManagerAttrs=new WeakMap();
const textManagerEntries=new Map();
const textManagerSources=new Map();
let textManagerBusy=false;
let textManagerScheduled=false;
const textManagerPaths=[
 '공통 > 상단','공통 > 기능 메뉴','공통 > 알림·초기화',
 '계획 > 육성 계획','계획 > 육성 계획 > 편집',
 '기록 > 육성 기록','기록 > 육성 기록 > 턴 선택',
 '기록 > 육성 기록 > 레이스','기록 > 육성 기록 > 온천 시나리오',
 '기록 > 서포트 이벤트 카운팅','기록 > 서포트 이벤트 카운팅 > 카드 선택',
 '기록 > 메모장','설정 > 카운팅 설정','설정 > 화면·서버 설정','설정 > 텍스트 관리'
];
for(const [path,source,kind] of TEXT_MANAGER_CATALOG){
 const key=TEXT_MANAGER_KEY(path,source);
 if(!textManagerEntries.has(key))textManagerEntries.set(key,{key,path,source,kind});
 if(!textManagerSources.has(source))textManagerSources.set(source,[]);
 textManagerSources.get(source).push(key);
}
function textManagerLoad(){
 try{
  const value=JSON.parse(localStorage.getItem(TEXT_MANAGER_STORAGE)||'{}');
  if(value&&typeof value==='object'&&!Array.isArray(value))
   textManagerOverrides=Object.fromEntries(Object.entries(value).filter(([k,v])=>typeof v==='string'&&v.length<=1000&&k.length<400));
 }catch(e){console.warn('텍스트 변경값을 읽지 못했습니다',e)}
 try{
  const value=JSON.parse(localStorage.getItem(TEXT_MANAGER_DISCOVERY)||'{}');
  if(value&&typeof value==='object'&&!Array.isArray(value))
   textManagerObserved=value;
 }catch(e){}
 for(const [key,entry] of Object.entries(textManagerObserved)){
  if(!entry||typeof entry.path!=='string'||typeof entry.source!=='string')continue;
  if(!textManagerEntries.has(key))textManagerEntries.set(key,{key,path:entry.path,source:entry.source,kind:'동적 화면'});
 }
}
textManagerLoad();
function textManagerScope(node){
 const el=node.nodeType===1?node:node.parentElement;
 if(!el||el.closest('#text-panel,#schedule-internal-controls'))return '';
 if(el.closest('#settings-inline-counter'))return '설정 > 카운팅 설정';
 if(el.closest('#settings-inline-general'))return '설정 > 화면·서버 설정';
 if(el.closest('#tool-menu'))return '공통 > 기능 메뉴';
 if(el.closest('#plan-panel'))return '계획 > 육성 계획';
 if(el.closest('#schedule-panel'))return document.getElementById('schedule-plan-edit-bar')?.hidden?'기록 > 육성 기록':'계획 > 육성 계획 > 편집';
 if(el.closest('#card-picker'))return '기록 > 서포트 이벤트 카운팅 > 카드 선택';
 if(el.closest('#schedule-action-backdrop'))return document.getElementById('schedule-plan-edit-bar')?.hidden?'기록 > 육성 기록 > 턴 선택':'계획 > 육성 계획 > 편집';
 if(el.closest('#counter-panel'))return '기록 > 서포트 이벤트 카운팅';
 if(el.closest('#memo-panel'))return '기록 > 메모장';
 if(el.closest('#toast'))return '공통 > 알림·초기화';
 if(el.closest('header'))return '공통 > 상단';
 return '';
}
function textManagerSkip(el){
 return !el||!!el.closest('script,style,noscript,#text-panel,#schedule-internal-controls,textarea,[contenteditable],.plan-library-details strong,.picker-card,.schedule-cell,.schedule-goal-entry,.schedule-race-info');
}
function textManagerResolve(source,scope){
 const found=textManagerSources.get(source)||[];
 let key=found.find(x=>textManagerEntries.get(x)?.path===scope);
 if(key)return key;
 if(scope==='계획 > 육성 계획 > 편집')key=found.find(x=>textManagerEntries.get(x)?.path==='기록 > 육성 기록');
 if(key)return key;
 if(scope.startsWith('기록 > 육성 기록')||scope.startsWith('계획 > 육성 계획'))
  key=found.find(x=>textManagerEntries.get(x)?.path.startsWith(scope.split(' > ').slice(0,2).join(' > ')));
 if(key)return key;
 return found[0]||'';
}
function textManagerCanDiscover(el){
 if(textManagerSkip(el)||el.closest('option'))return false;
 return !!el.closest('button,label,legend,h1,h2,h3,h4,.tool-menu-group-heading,.settings-hint,.plan-library-hint,.schedule-onsen-subheading,.schedule-onsen-ticket-label');
}
function textManagerRegister(path,source){
 if(!path||source.length<2||source.length>150||!/[가-힣A-Za-z]/.test(source))return '';
 const key=TEXT_MANAGER_KEY(path,source);
 if(textManagerEntries.has(key))return key;
 textManagerEntries.set(key,{key,path,source,kind:'동적 화면'});
 if(!textManagerSources.has(source))textManagerSources.set(source,[]);
 textManagerSources.get(source).push(key);
 if(Object.keys(textManagerObserved).length<500){
  textManagerObserved[key]={path,source};
  try{localStorage.setItem(TEXT_MANAGER_DISCOVERY,JSON.stringify(textManagerObserved))}catch(e){}
 }
 return key;
}
function textManagerCopyFor(key,source){
 return Object.hasOwn(textManagerOverrides,key)?textManagerOverrides[key]:source;
}
function textManagerApplyNode(node){
 const parent=node.parentElement;
 if(!parent||textManagerSkip(parent))return;
 const scope=textManagerScope(node);
 if(!scope)return;
 const raw=node.nodeValue||'';
 const trimmed=raw.trim();
 if(!trimmed)return;
 let info=textManagerOriginals.get(node);
 if(info&&raw.trim()!==info.display.trim()&&raw.trim()!==info.source){
  info=null;textManagerOriginals.delete(node);
 }
 if(!info){
  let key=textManagerResolve(trimmed,scope);
  if(!key&&textManagerCanDiscover(parent))key=textManagerRegister(scope,trimmed);
  if(!key)return;
  info={key,source:trimmed,display:trimmed};
  textManagerOriginals.set(node,info);
 }
 const replacement=textManagerCopyFor(info.key,info.source);
 info.display=replacement;
 if(raw.trim()!==replacement){
  const left=(raw.match(/^\s*/)||[''])[0],right=(raw.match(/\s*$/)||[''])[0];
  node.nodeValue=left+replacement+right;
 }
}
function textManagerApplyAttributes(el){
 if(textManagerSkip(el))return;
 const scope=textManagerScope(el);
 if(!scope)return;
 let records=textManagerAttrs.get(el);
 if(!records){records={};textManagerAttrs.set(el,records)}
 for(const name of ['aria-label','title','placeholder']){
  const value=el.getAttribute(name);
  if(!value||value.length>160)continue;
  let record=records[name];
  if(record&&record.display!==value&&record.source!==value)record=null;
  if(!record){
   const key=textManagerResolve(value,scope);
   if(!key)continue;
   record={key,source:value,display:value};records[name]=record;
  }
  const replacement=textManagerCopyFor(record.key,record.source);
  record.display=replacement;
  if(value!==replacement)el.setAttribute(name,replacement);
 }
}
function textManagerScan(root=document.body){
 if(textManagerBusy)return;
 textManagerBusy=true;
 try{
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  if(root.nodeType===Node.TEXT_NODE)textManagerApplyNode(root);
  else{
   let node;while((node=walker.nextNode()))textManagerApplyNode(node);
  }
  if(root.nodeType===Node.ELEMENT_NODE){
   textManagerApplyAttributes(root);
   root.querySelectorAll('*').forEach(textManagerApplyAttributes);
  }
 }finally{textManagerBusy=false}
}
let textManagerObserver;
function textManagerStart(){
 textManagerScan();
 textManagerObserver=new MutationObserver(mutations=>{
  if(textManagerScheduled)return;
  textManagerScheduled=true;
  queueMicrotask(()=>{textManagerScheduled=false;textManagerScan()});
 });
 textManagerObserver.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','title','placeholder']});
}
function textManagerStore(){
 try{localStorage.setItem(TEXT_MANAGER_STORAGE,JSON.stringify(textManagerOverrides));return true}
 catch(e){alert('텍스트 저장 공간이 부족합니다. JSON으로 내보내기를 이용해 주세요.');return false}
}
function textManagerRefresh(){
 textManagerScan();
 if(typeof textManagerRender==='function')textManagerRender();
}
function textManagerSet(key,value){
 const entry=textManagerEntries.get(key);if(!entry)return;
 const text=String(value).slice(0,1000);
 if(text===entry.source)delete textManagerOverrides[key];else textManagerOverrides[key]=text;
 if(!textManagerStore())return;
 textManagerRefresh();
}
function textManagerMessage(value){
 const source=String(value);
 const key=textManagerResolve(source,'공통 > 알림·초기화');
 if(key&&Object.hasOwn(textManagerOverrides,key))return textManagerOverrides[key];
 // Messages containing a variable prefix/suffix can use editable stable fragments.
 let result=source;
 for(const entry of textManagerEntries.values()){
  if(entry.kind!=='동적 문구'||entry.source.length<7||!Object.hasOwn(textManagerOverrides,entry.key))continue;
  if(result.includes(entry.source))result=result.replace(entry.source,textManagerOverrides[entry.key]);
 }
 return result;
}
const textManagerNativeConfirm=window.confirm.bind(window);
window.confirm=message=>textManagerNativeConfirm(textManagerMessage(message));
const textManagerNativePrompt=window.prompt.bind(window);
window.prompt=(message,initial)=>textManagerNativePrompt(textManagerMessage(message),initial);
function textManagerEl(tag,cls,text){
 const el=document.createElement(tag);
 if(cls)el.className=cls;
 if(text!==undefined)el.textContent=text;
 return el;
}
let textManagerFilterPath='all',textManagerSearch='';
function textManagerRender(){
 const host=document.getElementById('text-manager-list');
 if(!host)return;
 const items=[...textManagerEntries.values()].filter(entry=>
  (textManagerFilterPath==='all'||entry.path===textManagerFilterPath)&&
  (!textManagerSearch||(entry.path+' '+entry.source+' '+(textManagerOverrides[entry.key]||'')).toLowerCase().includes(textManagerSearch))
 ).sort((x,y)=>textManagerPaths.indexOf(x.path)-textManagerPaths.indexOf(y.path)||x.source.localeCompare(y.source,'ko'));
 host.replaceChildren();
 const count=document.getElementById('text-manager-count');
 count.textContent=items.length+'개 문구 · 변경 '+Object.keys(textManagerOverrides).length+'개';
 if(!items.length){host.appendChild(textManagerEl('p','text-manager-empty','표시할 문구가 없습니다. 다른 경로나 검색어를 선택해 주세요.'));return}
 let current='';
 for(const entry of items){
  if(entry.path!==current){current=entry.path;host.appendChild(textManagerEl('h3','text-manager-group-title',current))}
  const card=textManagerEl('div','text-manager-entry');
  const header=textManagerEl('div','text-manager-entry-head');
  header.appendChild(textManagerEl('span','text-manager-kind',entry.kind));
  if(Object.hasOwn(textManagerOverrides,entry.key))header.appendChild(textManagerEl('span','text-manager-modified','수정됨'));
  const original=textManagerEl('p','text-manager-original',entry.source);
  const field=textManagerEl('textarea','text-manager-edit');
  field.value=textManagerCopyFor(entry.key,entry.source);
  field.rows=entry.source.length>60?3:2;
  field.maxLength=1000;
  field.setAttribute('aria-label',entry.path+' · '+entry.source+' 문구 수정');
  const actions=textManagerEl('div','text-manager-entry-actions');
  const save=textManagerEl('button','','저장');
  save.type='button';save.addEventListener('click',()=>{textManagerSet(entry.key,field.value);});
  const restore=textManagerEl('button','','원래대로');
  restore.type='button';restore.disabled=!Object.hasOwn(textManagerOverrides,entry.key);
  restore.addEventListener('click',()=>textManagerSet(entry.key,entry.source));
  actions.append(save,restore);
  card.append(header,original,field,actions);
  host.appendChild(card);
 }
}
function initTextManager(){
 const path=document.getElementById('text-manager-path');
 for(const value of ['all',...textManagerPaths,...[...textManagerEntries.values()].map(e=>e.path).filter(p=>!textManagerPaths.includes(p))]){
  if([...path.options].some(o=>o.value===value))continue;
  const option=new Option(value==='all'?'전체 경로':value,value);
  path.add(option);
 }
 path.addEventListener('change',e=>{textManagerFilterPath=e.target.value;textManagerRender()});
 document.getElementById('text-manager-search').addEventListener('input',e=>{textManagerSearch=e.target.value.trim().toLowerCase();textManagerRender()});
 document.getElementById('text-manager-export').addEventListener('click',()=>{
  const payload={version:1,changes:textManagerOverrides};
  const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download='umamemo-text-overrides.json';link.click();
  setTimeout(()=>URL.revokeObjectURL(url),250);
 });
 document.getElementById('text-manager-import').addEventListener('change',async e=>{
  const file=e.target.files?.[0];if(!file)return;
  try{
   const content=JSON.parse(await file.text());
   if(content?.version!==1||!content.changes||typeof content.changes!=='object'||Array.isArray(content.changes))throw Error('형식 오류');
   const changes={};
   for(const [key,value] of Object.entries(content.changes)){
    if(textManagerEntries.has(key)&&typeof value==='string'&&value.length<=1000)changes[key]=value;
   }
   if(!confirm(Object.keys(changes).length+'개 텍스트 변경값을 가져올까요? 기존 변경값은 교체됩니다.'))return;
   textManagerOverrides=changes;textManagerStore();location.reload();
  }catch(error){alert('텍스트 JSON 파일을 불러올 수 없습니다: '+error.message)}
  finally{e.target.value=''}
 });
 document.getElementById('text-manager-reset').addEventListener('click',()=>{
  if(!confirm('직접 수정한 모든 UI 문구를 기본값으로 되돌릴까요?'))return;
  textManagerOverrides={};textManagerStore();location.reload();
 });
 textManagerStart();
 textManagerRender();
}
