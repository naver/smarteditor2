# 기능 추가 및 변경하기

SmartEditor2의 각 기능은 Husky 플러그인을 Husky Core에 등록하여 사용하도록 개발되었다. 따라서 SmartEditor2의 기능을 수정하거나 추가, 삭제하려면 Husky 프레임워크에서 사용하는 용어를 알고 구현 방식을 이해해야 한다.

Husky 프레임워크는 메시지 패싱 방식의 애플리케이션 작성 환경을 제공하는 JavaScript 프레임워크이며, Husky 엔진과 플러그인, 스킨으로 구성되어 있다. 자세한 내용은 &quot;[Husky 프레임워크 프로그래밍 가이드](https://github.com/naver/smarteditor2/wiki/HuskyFramework)&quot;를 참고한다.

#### 파일과 클래스 명명 규칙 {#-0}

다음은 SmartEditor2에 기능을 추가하거나 기능을 변경하기 위해 Husky 플러그인을 개발할 때 반드시 지켜야 하는 명명 규칙이다.

* Husky 플러그인의 파일 이름은 &quot;hp_[Husky플러그인이름].js&quot; 형태여야 한다. 예를 들어 기본 에디터 명령어 처리 플러그인인 SE2_TimeStamper의 파일 이름은 hp_SE2_TimeStamper.js이다.
* Husky 플러그인이 아닌 jindo 클래스 또는 함수로 구성된 파일의 이름은 접두사인 &quot;hp_&quot;를 붙이지 않는다.
* Husky 플러그인 클래스를 생성할 때에는 이름 앞에 nhn.husky를 붙인다.
```
nhn.husky.SE2_TimeStamper = jindo.$Class({
    ...
});
```
* Husky 플러그인의 이름(name)은 중복되지 않는 유일한 값이어야 한다.
```
nhn.husky.SE2_TimeStamper = jindo.$Class({
          name : 'SE2_TimeStamper',
       …
});
```
* Husky 플러그인 내에서 사용하는 메시지와 메시지 호출로 실행되는 함수인 메시지 핸들러 명명 규칙은 &quot;Husky 프레임워크 프로그래밍 가이드&quot;를 참고한다.
