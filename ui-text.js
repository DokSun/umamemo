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
  'plans.help':'참고 계획은 실제 육성 기록을 덮어쓰지 않습니다. 실제 행동을 기록하면 계획 대신 실제 행동이 표시됩니다.',
  'plans.empty':'저장된 계획이 없습니다.'
});
function uiText(key){return UI_TEXT[key]??'';}
