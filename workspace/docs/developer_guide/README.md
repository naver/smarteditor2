# SmartEditor2 개발자 가이드

## 개발환경 세팅하기

`smarteditor2 repo` 를 클론받아 개발환경을 세팅합니다.
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

소스파일 수정 후 빌드를 통해 머지 및 최적화된 `smarteditor2.js` 파일을 생성할 수 있습니다.
```bash
npm run build
```
- `workspace/static` 폴더의 리소스 파일들은 모두 `dist` 폴더로 복사됩니다.
- `workspace/src` 폴더의 소스파일들은 모두 머지 및 최적화되어 `dist/js/smarteditor2.js` 단일 파일로 생성됩니다.
- 최적화는 `uglifyjs` 를 통해 이루어집니다.


## 정적코드분석 및 테스트코드 작성하기

정적코드분석을 실행할 수 있습니다.
```bash
npm run lint
```
- `eslint` 를 통한 분석결과가 리스팅됩니다. 


테스트코드를 실행할 수 있습니다.
```bash
npm test
```
- `jest` 를 통한 테스트가 실행됩니다.
- 테스트코드는 `workspace/test` 에 `{소스파일명}.test.js` 으로 작성하길 권장합니다.


테스트코드를 실행하고 커버리지를 측정할 수 있습니다.
```bash
npm run coverage
```
- `report/coverage` 에 축정결과 리포트파일이 생성됩니다.
- `report/coverage/lcov-report/index.html` 파일을 브라우저에서 열면 자세한 내용을 확인할 수 있습니다.


## 사용자가이드 작성하기
사용자가이드는 마크다운으로 작성합니다.

마크다운으로 작성된 사용자가이드는 `gitbook` 을 통해 `HTML` 로 변환되어 배포되기 때문에 `gitbook` 로컬서버를 띄워서 확인합니다.
```bash
npm run docs:serve
```
- http://localhost:3000/ 로 서버가 실행됩니다. 
- `workspace/docs/user_guide` 이하 마크다운 파일들을 수정하면 서버에 수정사항이 반영됩니다.


----
**!!! MAINTAINER ONLY !!!**

이하 작업들은 권한이 필요하므로 프로젝트 관리자만 사용합니다.

## 릴리즈 배포하기
다음버전 릴리즈를 배포하기 위해 다음 스크립트를 실행합니다.
```bash
npm run deploy
```
- `predeploy` 가 `deploy` 이전에 자동으로 실행됩니다.
- `postdeploy` 가 `deploy` 이후에 자동으로 실행됩니다.
- `github` 및 `npm` 에 대한 권한이 모두 필요합니다.

각각의 단계에서 다음과 같은 작업이 수행되며 중간에 실패하면 이후 작업은 중단됩니다.

1. `predeploy`
  - 테스트 : `npm test` 가 실행됩니다.
  - 빌드 : `npm run build` 가 실행됩니다.
2. deploy
  - [버전업](https://docs.npmjs.com/cli/version) : `package.json` 의 `version` 이 자동으로 갱신되어 커밋된 후 버전태그가 생성됩니다.
  - [npm 게시](https://docs.npmjs.com/cli/publish) : 이때 `npm` 권한이 있어야 합니다.
3. postdeploy
  - `github` 푸시 : 현재 브랜치와 버전태그를 모두 리모트에 푸시하므로 이때 `github` 권한이 있어야 합니다.
  - [패키지파일 생성](https://docs.npmjs.com/cli/pack) : `smarteditor2-<version>.tgz` 파일이 생성됩니다.

이후 [릴리즈태그페이지](https://github.com/naver/smarteditor2/tags) 에서 릴리즈노트를 작성합니다. 이때 앞서 생성된 패키지파일을 첨부합니다.

## 사용자가이드 배포하기
사용자가이드는 현재 따로 버전관리를 하지 않고 서버에 적시에 배포합니다.

사용자가이드를 배포하기 위해 다음 스크립트를 실행합니다.
```bash
npm run docs:deploy
```
- `gitbook` 을 통해 빌드된 결과는 `build/docs` 에 생성됩니다.
- `gh-pages` 브랜치에 빌드결과가 자동커밋됩니다. (이때 `github` 권한이 없으면 실패합니다.)
- 수분이내에 http://naver.github.io/smarteditor2/user_guide/ 에 자동반영됩니다.