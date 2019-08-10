## 0.3.x 버전에서 업그레이드 {#0-3-x}

SmartEditor Basic 0.3.x 버전에서 SmartEditor2으로 업그레이드하는 방법을 설명한다.

1. SmartEditor Basic 0.3.x 버전이 설치된 서비스의 파일 구조가 다음과 같다고 가정한다.
```
/pages
    sample.php   -- 에디터의 내용을 저장
    write.html   -- 에디터가 설치된 html
/se
    /css              -- 에디터 관련 CSS 파일들
    /img              -- 에디터 관련 이미지 파일들
    /js               -- 에디터 관련 JavaScript 파일들
        Husky.SE_Basic.js
        HuskyEZCreator.js
        jindo.min.js
        SE_CustomPlugins.js
    se_blank.html
    SEditorSkin.html
```
2. 새 폴더를 생성해 SmartEditor2 배포 파일에서 다음과 같은 파일과 폴더를 복사해 해당 폴더에 붙여 넣는다. 여기에서 생성할 폴더를 se2라고 하자.
```
/css
/img
/js
smart_editor2_inputarea.html
smart_editor2_inputarea_ie8.html
SmartEditor2Skin.html
```
3. 기존 write.html 파일을 복사하여 write_se2.html 파일을 생성한다. 그러면 폴더/파일 구조는 다음과 같다.
```
/pages
    sample.php
    write.html
    write_se2.html            -- write.html 을 복사한 파일
/se
    /css
    /img
    /js
        Husky.SE_Basic.js
        HuskyEZCreator.js
        jindo.min.js
        SE_CustomPlugins.js
    se_blank.html
    SEditorSkin.html
/se2                          -- 새로 추가된 폴더
    /css                      -- 에디터 관련 CSS들
    /img                      -- 에디터 관련 이미지들
    /js                       -- 에디터 관련 JavaScript 파일들
    smart_editor2_inputarea.html
    smart_editor2_inputarea_ie8.html
    SmartEditor2Skin.html
```
4. write_se2.html 파일에서 다음과 같은 CSS 링크를 제거한다.
```
<link href="css/default.css" rel="stylesheet" type="text/css" />
```
5. write_se2.html 파일에서 HuskyEZCreator.js 파일의 경로를 새 경로로 변경한다.
```
<script type="text/javascript" src="../se2/js/HuskyEZCreator.js" charset="utf-8"></script>
```
6. write_se2.html 파일에서 에디터를 추가할 위치에 다음과 같이 textarea가 있는지 확인한다.
```
<textarea name="ir1" id="ir1" rows="10" cols="100"></textarea>
```
7. write_se2.html 파일에서 에디터를 생성하는 코드의 아래 부분을 다음과 같이 변경한다.  
  a. sSkinURI의 경로를 SEditorSkin.html 파일 경로에서 SmartEditor2Skin.html 파일 경로로 변경한다.  
  b. fCreator의 함수명을 createSEditorInIFrame에서 createSEditor2로 변경한다.  
```
<script type="text/javascript">
var oEditors = [];
nhn.husky.EZCreator.createInIFrame({
    oAppRef: oEditors,
    elPlaceHolder: "ir1",
    sSkinURI: "../se2/SmartEditor2Skin.html",
    fCreator: "createSEditor2"
});
</script>
```
8. write.html 파일을 저장하고 에디터가 다음 그림처럼 정상적으로 로드되는지 확인한다.
![image072.png](/assets/image072.png)
9. 에디터에서 편집한 내용을 저장하기 위해 textarea에 에디터 편집 영역의 내용을 넣는 코드를 찾아 매개변수를 UPDATE_IR_FIELD에서 UPDATE_CONTENTS_FIELD로 변경한다.
```
oEditors[0].exec("UPDATE_CONTENTS_FIELD", []);   // 에디터의 내용이 textarea에 적용된다.

 // document.getElementById("ir1").value 값을 이용해서 에디터에 입력된 내용을 검증한다.
try{
    // 이 라인은 현재 사용 중인 폼에 따라 달라질 수 있다.
    elClicked.form.submit();
}catch(e){}
```
