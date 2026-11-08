/* Shared site-wide interface copy.
 * Change a value here, commit it to GitHub, and deploy to update the wording for everyone.
 * No per-browser overrides or editing interface.
 */
const UI_TEXT=Object.freeze({
  'onsen.heading':'온천 시나리오',
  'onsen.digHint':'굴착할 온천 선택 (하나만 선택)',
  'onsen.ticketLabel':'♨ 온천권 사용',
  'onsen.ticketBlocked':'이미 온천권 효과가 적용 중입니다.',
  'onsen.ticketActive':'온천권 사용: 이 턴과 다음 턴에 효과 적용',
  'onsen.ticketBlockedTitle':'이전 턴의 온천권 효과가 지속 중이므로 이 턴에는 사용할 수 없습니다.',
  'race.selectHint':'레이스를 선택하면 상세 정보가 표시됩니다.',
  'race.selectHeading':'이번 턴 레이스 선택',
  'plans.help':'계획은 현재 스케줄과 별도로 보관됩니다. 불러오면 현재 스케줄만 교체됩니다.',
  'plans.empty':'저장된 계획이 없습니다.'
});
function uiText(key){return UI_TEXT[key]??'';}
