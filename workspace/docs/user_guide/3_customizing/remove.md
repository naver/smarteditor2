## 기본 기능 삭제

SmartEditor2에서는 사용하지 않는 기능을 삭제하여 코드를 간소화할 수 있다. 여기에서는 툴바에 기본으로 추가되어 있는 인용구 스타일, 하이퍼링크, 특수 기호, 표, 찾기/바꾸기 기능을 삭제하는 예제를 작성한다.

#### SE2BasicCreator.js 파일 수정 {#se2basiccreator-js}

제거된 기능을 에디터에서 찾지 않도록 삭제할 기능이 등록된 부분을 제거해야 한다. /js/SE2BasicCreator.js 파일에서 다음과 같이 삭제할 기능이 명시된 줄을 삭제한다.
```
oEditor.registerPlugin(new nhn.husky.SE2M_Quote(elAppContainer));                      // 인용구 스타일
oEditor.registerPlugin(new nhn.husky.SE2M_Hyperlink(elAppContainer));   // 하이퍼링크
oEditor.registerPlugin(new nhn.husky.SE2M_SCharacter(elAppContainer));  // 특수 문자
oEditor.registerPlugin(new nhn.husky.SE2M_FindReplacePlugin(elAppContainer));//찾기/바꾸기
oEditor.registerPlugin(new nhn.husky.SE2M_TableCreator(elAppContainer));             // 테이블 생성
oEditor.registerPlugin(new nhn.husky.SE2M_TableEditor(elAppContainer));  // 테이블 편집
oEditor.registerPlugin(new nhn.husky.SE2M_TableBlockStyler(elAppContainer));// 테이블 스타일
```

#### SmartEditor2Skin.html 파일 수정 {#smarteditor2skin-html}

SmartEditor2Skin.html 파일에서 사용하지 않는 버튼에 해당하는 마크업을 지운다. 각각의 기능들은 다음 예처럼 li 태그로 구성되어 있다. li 태그 내부의 태그도 모두 삭제한다.
```
<li class="husky_seditor_ui_quote">
    <button type="button" title="인용구" class="se2_blockquote"><span>인용구</span></button>
    <!-- 인용구 -->
    <div class="se2_layer husky_seditor_blockquote_layer" …>
        …
    </div>
    <!-- //인용구 -->
</li>
```

같은 방법으로 하이퍼링크, 특수 기호, 표, 찾기/바꾸기 기능의 마크업을 모두 삭제하면 &lt;ul class=&quot;extra&quot;&gt;...&lt;/ul&gt; 안의 모든 기능이 삭제되므로 ul 태그를 남길 필요가 없다. 따라서 ul 태그까지 삭제한다.
