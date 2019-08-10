## 기본 클래스 함수 추가 및 변경

기존 클래스에 prototype을 이용하여 함수를 추가하거나 변경하는 방법은 다음과 같다.

#### 마크업 변경 {#-0}

마크업이 변경되어서 HTML 요소들을 선언하고 초기화하는 부분을 수정해야 하는 경우에는 다음과 같이 코드를 작성한다.
```
nhn.husky.SE_TimeStamper.prototype._assignHTMLElements = function () {
    this.elInputButton = …
    this.elInputButton2 = …
};
```

#### 핸들러 추가/변경 {#-1}

특정 클래스에서 동작하는 핸들러를 추가하거나 변경하려면 다음과 같이 코드를 작성한다.
```
nhn.husky.SE2M_AttachFile.prototype.$ON_ATTACHFILE_OPEN_WINDOW = function () {
    var url = …;
    …
    window.open(url, …);
};
```

#### 핸들러 제거 {#-2}

특정 클래스의 핸들러가 동작하지 않게 하려면 다음과 같이 코드를 작성한다.
```
nhn.husky.SE2M_AttachFile.prototype.$ON_SET_ATTACH_FILE = function () {};
```
