/* Shared site-wide interface copy.
 * Change a value here, commit it to GitHub, and deploy to update the wording for everyone.
 * No per-browser overrides or editing interface.
 */
const UI_TEXT=Object.freeze({
  'onsen.heading':'온천 시나리오',
  'onsen.digHint':'굴착할 온천 선택 (하나만 선택)',
  'onsen.ticketLabel':'온천권 사용',
  'onsen.ticketNormal':'회복',
  'onsen.ticketSuper':'초회복',
  'race.selectHint':'레이스를 선택하면 상세 정보가 표시됩니다.',
  'race.selectHeading':'이번 턴 레이스 선택',
  'plans.help':'계획을 육성 기록의 초기 상태로 지정합니다. 이후 실제 행동으로 수정할 수 있으며 육성 초기화 시 지정한 계획으로 돌아갑니다.',
  'plans.empty':'저장된 계획이 없습니다.'
});
function uiText(key){return UI_TEXT[key]??'';}
