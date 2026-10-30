# 우마무스메 서포트 이벤트 트래커

## GitHub Pages 배포
1. GitHub에서 공개 저장소(예: `uma-support-tracker`)를 만듭니다.
2. 이 ZIP의 **내용물** (`index.html`, `app.js`, `style.css`, `data/` 폴더)을 저장소 최상위에 업로드합니다.
3. Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)` → Save.
4. 몇 분 뒤 `https://<사용자명>.github.io/uma-support-tracker/`에서 접속합니다. 실제 주소는 GitHub에서 확인하세요.

## 기능
- 2026년 8월 보유 DB 기반 547장 한국어 이름 검색
- 일반 카드: 연속 1~3 / 랜덤 A,B; 친구 카드: 연속 1~5; 그룹 카드: 연속 1~5 중 단계 수 설정
- 6개 슬롯 진행 기록 및 시나리오 메모는 localStorage에 저장
- 이용자가 등록한 이미지 파일은 IndexedDB에 카드 ID별 저장. 웹서버나 GitHub로 업로드하지 않음
- 진행 데이터 JSON 백업/복원 (이미지 제외)

## 주의
- 실제 이벤트 이름과 개수는 DB에 없으므로 숫자 버튼은 진행 기록용입니다. 그룹 카드 단계 수는 이용자가 지정합니다.
- 카드 이미지의 저작권은 각 권리자에게 있습니다. 이미지 파일은 프로젝트에 포함하지 않았습니다.
- 브라우저 데이터 삭제/시크릿 모드/다른 기기에서는 이미지와 진행 기록이 유지되지 않을 수 있습니다.
- ZIP의 index.html을 파일로 직접 열면 fetch 제한으로 DB가 로드되지 않을 수 있습니다. GitHub Pages 또는 로컬 HTTP 서버에서 실행하세요.
