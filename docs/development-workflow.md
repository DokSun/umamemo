# 우마 메모 개발·배포 분리

## 두 버전
- **정식:** https://doksun.github.io/umamemo/ — main 브랜치 루트.
- **개발:** https://doksun.github.io/umamemo/dev/ — dev 브랜치에서 검증된 파일만 main의 dev/ 하위 경로로 복사.
- **복원:** backup/stable-before-dev-workflow-2026-11-14 브랜치에 원래 정식 버전 보존.

## 작업 절차
1. 새로운 기능과 UI는 반드시 dev 브랜치에서 수정.
2. 'Verify site and publish development preview' GitHub Actions가 JavaScript, HTML, 데이터와 Chromium 실제 실행 검사를 수행.
3. 검사가 통과해야 개발용 /dev/ 폴더가 자동으로 게시됨. 실패하면 정식 사이트와 이전 개발용 미리보기 모두 유지.
4. 개발용 사이트에서 사람이 확인한 다음 dev → main PR 생성, 테스트 통과 후 병합. 코드의 직접 main 수정은 피할 것.
5. 안정 버전은 별도 backup/ 브랜치 또는 버전 태그에 고정. 복구는 안전 커밋을 main으로 다시 반영.

## 개발용 로컬 데이터 분리
정식/개발 주소는 동일 origin이므로 원래 localStorage를 공유합니다. scripts/build-preview.mjs가 개발 app.js의 저장 접근을 devStorage로 바꾸고 umamemo-dev-v1: 접두사를 적용하므로 실제 육성 데이터와 섞이지 않습니다. 브라우저 사이트 데이터 전체 삭제는 양쪽에 영향을 줄 수 있습니다.

## 주의 사항
GitHub Pages가 main의 루트를 게시하는 설정이어야 /dev/ 경로가 제공됩니다. 배포 Workflow의 GITHUB_TOKEN Contents write 권한을 저장소 정책이 허용해야 자동 복사가 가능합니다. repo의 branch protection/ruleset에서 main 직접 push를 별도로 제한할 수 있지만, GitHub Actions의 dev 하위 경로 업데이트 정책과 함께 검토해야 합니다.