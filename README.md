# e편한세상 분당 퍼스트빌리지 옵션 계산기

정정공고 옵션표 데이터를 기반으로 만든 정적 웹 계산기입니다.  
주택형을 선택하고 옵션을 체크하면 총 선택금액, 구분별 합계, 선택 내역, 조건 점검사항이 자동 계산됩니다.

## 파일 구성

- `index.html` : 웹페이지 구조
- `styles.css` : 화면 디자인
- `app.js` : 계산 로직, 필터, 공유/복사/CSV 기능
- `option-data.js` : 옵션 데이터
- `.nojekyll` : GitHub Pages 정적 배포용 파일
- `AGENTS.md` : Codex가 작업할 때 따라야 할 개발 지침
- `codex-prompt.txt` : Codex에 그대로 붙여 넣을 수 있는 작업 지시문

## 로컬에서 확인하는 방법

가장 간단한 방법은 `index.html` 파일을 브라우저로 여는 것입니다.

조금 더 정확하게 확인하려면 이 폴더에서 아래 명령어 중 하나로 로컬 서버를 실행합니다.

```bash
python -m http.server 8000
```

Windows에서 `python` 명령이 Microsoft Store로 연결되면 아래 명령어를 사용합니다.

```bash
py -m http.server 8000
```

그 다음 브라우저에서 아래 주소를 엽니다.

```text
http://localhost:8000
```

## GitHub Pages 배포 방법

1. GitHub에서 새 저장소를 생성합니다.
2. 이 폴더의 파일들을 저장소 루트에 업로드합니다.
3. 저장소의 `Settings` → `Pages`로 이동합니다.
4. `Build and deployment`에서 `Deploy from a branch`를 선택합니다.
5. Branch는 `main`, 폴더는 `/root`로 선택한 뒤 저장합니다.
6. 배포가 완료되면 `https://계정명.github.io/저장소명/` 형태의 주소가 생성됩니다.

현재 저장소 이름이 `ebundangfirst`라면 예상 주소는 아래와 같습니다.

```text
https://JOY-PAPA.github.io/ebundangfirst/
```

GitHub Desktop으로 배포할 때는 `ebundangfirst` 저장소 폴더 안에 `index.html`, `styles.css`, `app.js`, `option-data.js`, `.nojekyll`, `README.md`를 넣은 뒤 커밋하고 `Push origin`을 누릅니다.

배포 후 확인할 항목:

- 첫 화면과 옵션 목록이 정상 표시되는지 확인
- 주택형 변경 시 가격과 선택 가능 여부가 바뀌는지 확인
- 택1 옵션이 하나만 선택되는지 확인
- 공유 링크를 새 창에서 열었을 때 선택값이 복원되는지 확인
- 모바일 화면에서 하단 총액 요약바가 표시되는지 확인

## 데이터 수정 방법

옵션 금액 또는 항목을 수정하려면 `option-data.js` 파일의 `window.OPTION_DATA` 안에 있는 옵션 데이터를 수정하면 됩니다.

가격이 없는 주택형은 `null`로 유지합니다.

배포 후 브라우저 캐시 때문에 변경 내용이 바로 보이지 않을 수 있습니다. `styles.css`, `option-data.js`, `app.js`를 수정해 배포할 때는 `index.html`의 `?v=20260706` 값을 새 날짜나 버전으로 함께 바꾸면 안전합니다.

예시:

```js
"prices": {
  "51A": 3600000,
  "55A": 3600000,
  "55B": 3600000,
  "59A": 3800000,
  "59T": null
}
```

## 운영 시 주의사항

- 본 계산기는 입주예정자 편의용 참고 계산기입니다.
- 실제 계약 금액과 선택 가능 여부는 공식 공고문, 계약서, 견본주택 안내를 최종 기준으로 확인해야 합니다.
- 개인정보 입력 기능은 없습니다.
- 별도 서버로 데이터를 전송하지 않는 정적 웹사이트 구조입니다.
