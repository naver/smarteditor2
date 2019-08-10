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
- `npm version patch` 를 실행시킵니다.
- npm 스크립트 라이프사이클을 이용해 릴리즈 배포 시나리오가 순서대로 실행됩니다.
  - https://docs.npmjs.com/misc/scripts
  - https://blog.npmjs.org/post/184553141742/easy-automatic-npm-publishes
- 스크립트 실행 과정중에 `github` 및 `npm` 에 대한 권한이 모두 필요합니다.

릴리즈 배포 시나리오는 다음과 같으며 중간에 실패하면 이후 작업은 중단됩니다.

1. 테스트
  - `"preversion": "npm test"` 를 통해 실행됩니다.
  - 버전업전에 자동으로 테스트를 수행합니다.
2. [버전업](https://docs.npmjs.com/cli/version)
  - `"deploy": "npm version patch"` 를 통해 실행됩니다.
  - `package.json` 의 `version` 이 자동으로 갱신되어 커밋된 후 버전태그가 생성됩니다.
3.  원격저장소싱크
  - `"postversion": "git push --follow-tags && npm publish"` 를 통해 실행됩니다.
  - 버전업시 커밋된 브랜치와 버전태그가 github 으로 푸시됩니다.
4. 빌드/발행
  - `"prepublishOnly": "npm run build"` 를 통해 실행됩니다.
  - `postversion` 에서 `npm publish` 가 실행되면 `prepublishOnly` 에 의해 빌드가 먼저 수행됩니다.
  - 빌드결과물(`dist`)이 npm 으로 발행됩니다.
5. [패키지파일 생성](https://docs.npmjs.com/cli/pack)
  - `"postpublish": "npm pack"` 를 통해 실행됩니다.
  - 발행 후 릴리즈노트 작성을 위한 패키지파일(`smarteditor2-<version>.tgz`)을 생성합니다.
6. 데모 발행
  - `"postdeploy": "gh-pages -d ./dist -e ./demo -m 'update demo'"` 를 통해 실행됩니다.
  - 릴리즈 배포의 모든 과정이 끝나면 마지막에 [데모페이지](http://naver.github.io/smarteditor2/demo/)도 발행하여 반영해줍니다.

모든 릴리즈 배포 시나리오가 정상적으로 수행되면 [릴리즈태그페이지](https://github.com/naver/smarteditor2/tags) 에서 릴리즈노트를 작성합니다. 
이때 앞서 생성된 패키지파일을 첨부합니다.

## 사용자가이드 배포하기
사용자가이드는 현재 따로 버전관리를 하지 않고 서버에 적시에 배포합니다.

사용자가이드를 배포하기 위해 다음 스크립트를 실행합니다.
```bash
npm run docs:deploy
```
- `gitbook` 을 통해 빌드된 결과는 `build/docs` 에 생성됩니다.
- `gh-pages` 브랜치에 빌드결과가 자동커밋됩니다. (이때 `github` 권한이 없으면 실패합니다.)
- 수분이내에 http://naver.github.io/smarteditor2/user_guide/ 에 자동반영됩니다.