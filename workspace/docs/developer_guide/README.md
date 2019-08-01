# SmartEditor2 개발자 가이드

## 개발환경 세팅하기

smarteditor2 repo 를 클론받아 개발환경을 세팅합니다.
```bash
git clone https://github.com/naver/smarteditor2.git
cd smarteditor2 && npm install
```


서버를 시작하여 샘플페이지를 실행시킬 수 있습니다.
```bash
npm start
```
- http://localhost:8080/SmartEditor2.html 페이지가 뜹니다.
- 소스코드 수정시 해당 페이지가 `hot reload` 되어 바로 확인이 가능합니다.


## 빌드하기

소스파일 수정 후 빌드를 통해 `smarteditor2.js` 파일을 생성할 수 있습니다.
```bash
npm run build
```
- `dist/js/smarteditor2.js` 파일이 생성됩니다.
- 빌드된 파일은 `uglifyjs` 로 최적화되어 있습니다.


## 정적코드분석 및 테스트코드 작성하기

정적코드분석을 실행할 수 있습니다.
```bash
npm run lint
```
- `eslint` 를 통해 분석결과가 리스팅됩니다. 


테스트코드를 실행할 수 있습니다.
```bash
npm test
```
- `jest` 를 통한 테스트가 실행됩니다.
- 테스트코드는 `workspace/test` 에 `{소스명}.test.js` 으로 작성합니다.


테스트코드를 실행하고 커버리지를 측정할 수 있습니다.
```bash
npm run coverage
```
- `report/coverage` 에 축정결과 리포트파일이 생성됩니다.
- `report/coverage/lcov-report/index.html` 파일을 브라우저에서 열면 자세한 내용을 확인할 수 있습니다.


## 릴리즈 배포하기
릴리즈버전을 배포할 수 있습니다.
```bash
npm run deploy
```
- 빌드가 우선 실행되어 `dist/js/smarteditor2.js` 파일이 생성됩니다.
- `npm publish` 를 통해 새 릴리즈가 배포됩니다. (이때 smarteditor2 npm 에 대한 등록 권한이 있어야 합니다.)


## 사용자가이드 작성하기
사용자가이드는 `gitbook` 형식 마크다운으로 작성하여 `gh-pages` 로 배포합니다.

사용자가이드 수정을 위한 `gitbook` 서버를 띄웁니다.
```bash
npm run docs:serve
```
- http://localhost:3000/ 로 서버가 실행됩니다. 
- `workspace/docs/user_guide` 이하 마크다운 파일들을 수정하면 서버에 수정사항이 반영됩니다.


빌드 후 서버로 자동배포할 수 있습니다.
```bash
npm run docs:deploy
```
- 빌드결과는 `build/docs` 에 생성됩니다.
- `gh-pages` 브랜치에 빌드결과가 자동커밋됩니다. (이때 smarteditor2 repo 에 대한 권한이 없으면 실패합니다.)
- http://naver.github.io/smarteditor2/user_guide/ 에 반영됩니다.
