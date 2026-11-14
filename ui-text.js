/* GitHub-managed interface strings and navigation paths.
 * The editor stores drafts locally. Publishing requires a GitHub commit.
 * Do not put user data or credentials in this file.
 */
const UI_TEXT_ITEMS = [
  {
    "key": "site.title",
    "path": "공통/상단",
    "label": "사이트 제목",
    "value": "우마 메모",
    "selector": "header h1"
  },
  {
    "key": "menu.open",
    "path": "공통/기능 메뉴",
    "label": "기능 버튼",
    "value": "기능",
    "selector": "#tool-menu-toggle span"
  },
  {
    "key": "menu.title",
    "path": "공통/기능 메뉴",
    "label": "메뉴 제목",
    "value": "기능 선택",
    "selector": "#tool-menu-title"
  },
  {
    "key": "menu.server",
    "path": "공통/기능 메뉴/서버",
    "label": "서버 항목",
    "value": "서버",
    "selector": ".server-label"
  },
  {
    "key": "menu.ko",
    "path": "공통/기능 메뉴/서버",
    "label": "한국",
    "value": "한국",
    "selector": "#server-mode option[value=ko]"
  },
  {
    "key": "menu.jp",
    "path": "공통/기능 메뉴/서버",
    "label": "일본",
    "value": "일본",
    "selector": "#server-mode option[value=jp]"
  },
  {
    "key": "menu.split",
    "path": "공통/기능 메뉴/화면 설정",
    "label": "동시 사용",
    "value": "동시 사용",
    "selector": ".mode-switch-row strong"
  },
  {
    "key": "menu.splitHint",
    "path": "공통/기능 메뉴/화면 설정",
    "label": "동시 사용 설명",
    "value": "OFF: 단독 / ON: 카운팅 + 선택 도구",
    "selector": ".mode-switch-row small"
  },
  {
    "key": "menu.ratio",
    "path": "공통/기능 메뉴/화면 설정",
    "label": "화면 비율",
    "value": "화면 비율",
    "selector": "#split-ratio legend"
  },
  {
    "key": "menu.ratio55",
    "path": "공통/기능 메뉴/화면 설정",
    "label": "5:5",
    "value": "5:5",
    "selector": "#split-ratio input[value='50'] + span"
  },
  {
    "key": "menu.ratio64",
    "path": "공통/기능 메뉴/화면 설정",
    "label": "6:4",
    "value": "6:4",
    "selector": "#split-ratio input[value='60'] + span"
  },
  {
    "key": "menu.ratio73",
    "path": "공통/기능 메뉴/화면 설정",
    "label": "7:3",
    "value": "7:3",
    "selector": "#split-ratio input[value='70'] + span"
  },
  {
    "key": "menu.swap",
    "path": "공통/기능 메뉴/화면 설정",
    "label": "좌우 전환",
    "value": "⇄ 좌우 전환",
    "selector": "#swap-panels"
  },
  {
    "key": "counter.title",
    "path": "서포트 이벤트 카운팅/기본 화면",
    "label": "제목",
    "value": "서포트 이벤트 카운팅",
    "selector": "#counter-panel .panel-title h2"
  },
  {
    "key": "counter.reset",
    "path": "서포트 이벤트 카운팅/기본 화면",
    "label": "초기화 버튼",
    "value": "이벤트 카운팅 초기화",
    "selector": ""
  },
  {
    "key": "counter.resetPopup",
    "path": "서포트 이벤트 카운팅/기본 화면",
    "label": "초기화 팝업",
    "value": "초기화 팝업",
    "selector": ".reset-popup-option > span:first-child"
  },
  {
    "key": "counter.unifiedReset",
    "path": "서포트 이벤트 카운팅/기본 화면",
    "label": "통합 초기화",
    "value": "육성 기록 통합 초기화",
    "selector": ""
  },
  {
    "key": "counter.pickerTitle",
    "path": "서포트 이벤트 카운팅/카드 선택",
    "label": "창 제목",
    "value": "서포트 카드 선택",
    "selector": "#picker-title"
  },
  {
    "key": "counter.pickerClear",
    "path": "서포트 이벤트 카운팅/카드 선택",
    "label": "비우기",
    "value": "비우기",
    "selector": "#picker-clear"
  },
  {
    "key": "counter.empty",
    "path": "서포트 이벤트 카운팅/카드 선택",
    "label": "결과 없음",
    "value": "검색 조건에 맞는 카드가 없습니다.",
    "selector": ""
  },
  {
    "key": "counter.noImage",
    "path": "서포트 이벤트 카운팅/카드 선택",
    "label": "이미지 없음",
    "value": "이미지 없음",
    "selector": ""
  },
  {
    "key": "counter.prev",
    "path": "서포트 이벤트 카운팅/카드 선택",
    "label": "이전",
    "value": "◀ 이전",
    "selector": ""
  },
  {
    "key": "counter.next",
    "path": "서포트 이벤트 카운팅/카드 선택",
    "label": "다음",
    "value": "다음 ▶",
    "selector": ""
  },
  {
    "key": "memo.title",
    "path": "메모장/기본 화면",
    "label": "제목",
    "value": "메모장",
    "selector": "#memo-panel h2"
  },
  {
    "key": "memo.reset",
    "path": "메모장/기본 화면",
    "label": "초기화",
    "value": "메모장 초기화",
    "selector": "#secondary-reset"
  },
  {
    "key": "schedule.title",
    "path": "스케줄표/육성 기록",
    "label": "제목",
    "value": "스케줄표",
    "selector": "#schedule-panel .panel-title h2"
  },
  {
    "key": "schedule.current",
    "path": "스케줄표/육성 기록",
    "label": "현재 육성",
    "value": "현재 육성",
    "selector": ""
  },
  {
    "key": "schedule.noPlan",
    "path": "스케줄표/육성 기록",
    "label": "계획 미선택",
    "value": "계획 미선택",
    "selector": "#schedule-plan-caption"
  },
  {
    "key": "schedule.planManage",
    "path": "스케줄표/육성 기록",
    "label": "계획 관리",
    "value": "계획 관리",
    "selector": "#schedule-plans-open"
  },
  {
    "key": "schedule.character",
    "path": "스케줄표/육성 기록",
    "label": "육성 캐릭터",
    "value": "육성 캐릭터",
    "selector": "label[for='schedule-character']"
  },
  {
    "key": "schedule.characterSelect",
    "path": "스케줄표/육성 기록",
    "label": "캐릭터 선택 안내",
    "value": "캐릭터 선택 (목표 레이스 표시)",
    "selector": ""
  },
  {
    "key": "schedule.scenario",
    "path": "스케줄표/육성 기록",
    "label": "육성 시나리오",
    "value": "육성 시나리오",
    "selector": "label[for='schedule-scenario']"
  },
  {
    "key": "schedule.basic",
    "path": "스케줄표/육성 기록",
    "label": "기본 시나리오",
    "value": "기본",
    "selector": "#schedule-scenario option[value=basic]"
  },
  {
    "key": "schedule.onsenOption",
    "path": "스케줄표/육성 기록",
    "label": "온천 시나리오",
    "value": "극락♪ 유코마 온천향",
    "selector": "#schedule-scenario option[value=onsen]"
  },
  {
    "key": "schedule.junior",
    "path": "스케줄표/육성 기록/연도",
    "label": "주니어",
    "value": "주니어",
    "selector": "button[data-schedule-year=junior]"
  },
  {
    "key": "schedule.classic",
    "path": "스케줄표/육성 기록/연도",
    "label": "클래식",
    "value": "클래식",
    "selector": "button[data-schedule-year=classic]"
  },
  {
    "key": "schedule.senior",
    "path": "스케줄표/육성 기록/연도",
    "label": "시니어",
    "value": "시니어",
    "selector": "button[data-schedule-year=senior]"
  },
  {
    "key": "schedule.reset",
    "path": "스케줄표/육성 기록",
    "label": "현재 육성 초기화",
    "value": "현재 육성 초기화",
    "selector": "#schedule-reset"
  },
  {
    "key": "action.title",
    "path": "스케줄표/행동 선택",
    "label": "행동 선택 창",
    "value": "행동 선택",
    "selector": "#schedule-action-title"
  },
  {
    "key": "action.raceHeading",
    "path": "스케줄표/행동 선택/레이스",
    "label": "레이스 선택 제목",
    "value": "이번 턴 레이스 선택",
    "selector": "label[for='schedule-race-select']"
  },
  {
    "key": "action.raceSelect",
    "path": "스케줄표/행동 선택/레이스",
    "label": "레이스 선택 버튼",
    "value": "레이스 선택",
    "selector": "#schedule-race-apply"
  },
  {
    "key": "race.selectHint",
    "path": "스케줄표/행동 선택/레이스",
    "label": "레이스 안내",
    "value": "레이스를 선택하면 상세 정보가 표시됩니다.",
    "selector": ""
  },
  {
    "key": "action.racePlaceholder",
    "path": "스케줄표/행동 선택/레이스",
    "label": "레이스 선택 기본 항목",
    "value": "출전할 레이스 선택",
    "selector": ""
  },
  {
    "key": "action.clear",
    "path": "스케줄표/행동 선택",
    "label": "턴 초기화",
    "value": "턴 초기화",
    "selector": "#schedule-action-clear"
  },
  {
    "key": "onsen.heading",
    "path": "스케줄표/행동 선택/온천 시나리오",
    "label": "시나리오 제목",
    "value": "온천 시나리오",
    "selector": "#schedule-onsen-panel h4"
  },
  {
    "key": "onsen.ticketLabel",
    "path": "스케줄표/행동 선택/온천 시나리오",
    "label": "온천권 제목",
    "value": "온천권 사용",
    "selector": "#schedule-onsen-ticket-label"
  },
  {
    "key": "onsen.ticketNormal",
    "path": "스케줄표/행동 선택/온천 시나리오",
    "label": "회복",
    "value": "회복",
    "selector": "#schedule-onsen-ticket"
  },
  {
    "key": "onsen.ticketSuper",
    "path": "스케줄표/행동 선택/온천 시나리오",
    "label": "초회복",
    "value": "초회복",
    "selector": "#schedule-onsen-ticket-super"
  },
  {
    "key": "onsen.digHint",
    "path": "스케줄표/행동 선택/온천 시나리오",
    "label": "굴착 안내",
    "value": "굴착할 온천 선택 (하나만 선택)",
    "selector": ".schedule-onsen-dig-area .schedule-onsen-subheading"
  },
  {
    "key": "plans.title",
    "path": "스케줄표/육성 계획/계획 관리",
    "label": "관리 창 제목",
    "value": "육성 계획 관리",
    "selector": "#schedule-plans-title"
  },
  {
    "key": "plans.help",
    "path": "스케줄표/육성 계획/계획 관리",
    "label": "계획 안내",
    "value": "계획을 육성 기록의 초기 상태로 지정합니다. 이후 실제 행동으로 수정할 수 있으며 육성 초기화 시 지정한 계획으로 돌아갑니다.",
    "selector": ".schedule-plans-help"
  },
  {
    "key": "plans.new",
    "path": "스케줄표/육성 계획/계획 관리",
    "label": "새 계획 작성",
    "value": "새 계획 작성",
    "selector": "#schedule-plan-new"
  },
  {
    "key": "plans.saveCurrent",
    "path": "스케줄표/육성 계획/계획 관리",
    "label": "현재 육성 기록을 계획으로 저장",
    "value": "현재 육성 기록을 계획으로 저장",
    "selector": "#schedule-plan-save"
  },
  {
    "key": "plans.empty",
    "path": "스케줄표/육성 계획/계획 관리",
    "label": "계획 없음",
    "value": "저장된 계획이 없습니다.",
    "selector": ""
  },
  {
    "key": "plans.editNotice",
    "path": "스케줄표/육성 계획/계획 편집",
    "label": "계획 편집 안내",
    "value": "계획 편집 중 · 실제 육성 기록은 변경되지 않습니다.",
    "selector": "#schedule-plan-edit-bar > span"
  },
  {
    "key": "plans.editSave",
    "path": "스케줄표/육성 계획/계획 편집",
    "label": "계획 저장",
    "value": "계획 저장",
    "selector": "#schedule-plan-edit-save"
  },
  {
    "key": "plans.editCancel",
    "path": "스케줄표/육성 계획/계획 편집",
    "label": "취소",
    "value": "취소",
    "selector": "#schedule-plan-edit-cancel"
  },
  {
    "key": "plans.namePrompt",
    "path": "스케줄표/육성 계획/계획 편집",
    "label": "계획 이름",
    "value": "계획 이름",
    "selector": ""
  },
  {
    "key": "plans.newName",
    "path": "스케줄표/육성 계획/계획 편집",
    "label": "새 계획 기본 이름",
    "value": "새 육성 계획",
    "selector": ""
  },
  {
    "key": "plans.nameRequired",
    "path": "스케줄표/육성 계획/계획 편집",
    "label": "계획 이름 누락",
    "value": "계획 이름을 입력해 주세요",
    "selector": ""
  },
  {
    "key": "plans.saveSuccess",
    "path": "스케줄표/육성 계획/계획 편집",
    "label": "저장 완료",
    "value": "계획을 저장했습니다",
    "selector": ""
  }
];
const UI_TEXT = Object.freeze(Object.fromEntries(UI_TEXT_ITEMS.map(item => [item.key,item.value])));
const UI_TEXT_STORAGE_KEY = 'umamemo-ui-text-draft-v1';
function uiTextDraft(){
  try {
    const raw = JSON.parse(localStorage.getItem(UI_TEXT_STORAGE_KEY)||'{}');
    return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  } catch { return {}; }
}
function uiText(key){
  const drafts = uiTextDraft();
  return Object.hasOwn(UI_TEXT,key) && typeof drafts[key] === 'string' ? drafts[key] : UI_TEXT[key] ?? '';
}
