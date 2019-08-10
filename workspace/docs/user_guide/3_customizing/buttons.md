## 툴바 버튼의 위치 변경과 버튼 제거

2.2.1 이상 버전에서는 툴바의 UI를 변경할 수 있다. 2.2.1 미만 버전에서는 툴바에서 버튼의 위치에 따라 버튼이 라운드형이나 사각형으로 표시되어, 버튼의 위치를 변경하거나 버튼을 제거하려면 버튼 이미지를 수정해야 했다. 2.2.1 이상 버전에서는 이런 경우에 이미지를 수정할 필요가 없도록 개선했다.

여기에서는 툴바의 버튼 구조와 툴바 버튼 라운딩 처리 규칙을 설명하고, 툴바 버튼의 위치를 변경하거나 버튼을 제거하는 방법을 설명한다. 툴바에 새로운 UI를 추가하려면 &quot;[새로운 기능 추가](plugins/README.md)&quot;를 참고한다.

#### 툴바 버튼 구조 {#-0}

툴바 버튼의 기본 HTML 구조는 다음과 같다.
```
<ul>
    <li><button type="button"><span class="_buttonRound">버튼이름</span></button></li>
</ul>
```

툴바는 하나 이상의 버튼이 포함된 버튼 그룹으로 구성된다. HTML 코드에서 버튼 그룹은 ul 요소로 구현하고 그룹 내의 각 버튼은 ul 요소 내의 li 요소로 구현한다. 다음 그림에서 각각의 빨간색 사각형이 버튼 그룹을 나타낸다.

![image074.png](/assets/image074.png)

그림 35 툴바의 버튼 그룹 {#pic35}

#### 툴바 버튼 라운딩 처리 규칙 {#-1}

툴바의 버튼을 표시할 때에는 에디터 내에 존재하는 라운딩 처리용 이미지를 배경으로 사각형의 버튼 이미지를 올린다. 툴바에서 버튼을 라운딩 처리하려면 버튼에 클래스가 &quot;_buttonRound&quot;인 span 태그를 적용해야 한다. 툴바에 기본적으로 포함된 모든 버튼에는 이 규칙이 적용되어 있다. 새로운 버튼을 추가하는 경우에도 이 규칙을 지켜야 한다.

툴바 그룹 구성에 따라 툴바 버튼은 기본형, 단독형, 더보기로 구성된다. 각 버튼에 대한 설명은 다음과 같다.

* 기본형: [그림 35](#pic35)에서 2, 3, 6번과 같이 버튼 그룹에 여러 개의 버튼이 있는 경우에 해당한다. 버튼 그룹에서 첫 번째 버튼과 마지막 버튼에는 반드시 클래스가 &quot;_buttonRound&quot;인 span 태그를 적용해야 한다. 예를 들어 [그림 35](#pic35)에서 6번 그룹의 가장 마지막 버튼인 찾기/바꾸기 버튼을 삽입하는 코드는 다음과 같다.
```
<li class="husky_seditor_ui_findAndReplace">
  <button type="button" title="찾기/바꾸기" class="se2_find">
    <spanclass="_buttonRound">찾기/바꾸기</span>
  </button>
  <!-- 찾기/바꾸기 -->
  … 찾기/바꾸기 레이어 HTML 코드 …
  <!-- //찾기/바꾸기 -->
</li>
</ul>
```
* 단독형: [그림 35](#pic35)에서 5번과 같이 버튼 그룹에 버튼이 하나만 있는 경우에 해당한다. 이 경우에도 반드시 클래스가 &quot;_buttonRound&quot;인 span 태그를 적용해야 한다.
```
<ul>
  <li class="husky_seditor_ui_quote">
    <button type="button" title="인용구" class="se2_blockquote">
      <span class="_buttonRound">인용구</span>
    </button>
    <!-- 인용구 -->
    … 인용구 레이어 HTML 코드 …
    <!-- //인용구 -->
  </li>
</ul>
```
* 더보기: [그림 35](#pic35)에서 4번과 같은 경우에 해당한다. 더보기 버튼은 라운딩 처리할 필요가 없으나, 다음과 같이 더보기 버튼을 클릭했을 때 노출되는 레이어 내부의 버튼 그룹은 기본형과 동일하게 라운딩 처리해야 한다.  
![image076.png](/assets/image076.png)  
그림 36 더보기 버튼의 버튼 그룹

**참고**

[그림 35](#pic35)에서 1번(글꼴, 글자 크기)과 7번(사진)은 라운딩 처리 대상이 아니다.

#### 툴바 버튼 위치 변경하기 {#-2}

앞의 &quot;[툴바 버튼 구조](#-0)&quot;와 &quot;[툴바 버튼 라운딩 처리 규칙](#-1)&quot;의 내용을 참고하여 툴바의 마크업을 변경하면 툴바 버튼의 위치를 변경할 수 있다.

예를 들어 위 첨자, 아래 첨자 버튼을 왼쪽 정렬 버튼 앞으로 이동해 보자. 변경 전 코드는 다음과 같다.
```
<!-- 배경 색 버튼 -->
<li class="se2_pair husky_seditor_ui_BGColor"><span class="selected_color husky_se2m_BGColor_lastUsed"></span><span class="husky_seditor_ui_BGColorA"><button type="button" title="배경색" class="se2_bgcolor"><span>배경색</span></button></span><span class="husky_seditor_ui_BGColorB"><button type="button" title="더보기" class="se2_bgcolor_more"><span class="_buttonRound">더보기</span></button></span>
  <!-- 배경 색 -->
  … 배경 색 레이어 HTML 코드 …
  <!-- //배경 색 -->
</li>
<!-- 위 첨자 버튼 -->
<li class="husky_seditor_ui_superscript"><button type="button" title="윗첨자" class="se2_sup"><span class="_buttonRound">윗첨자</span></button></li>
<!-- 아래 첨자 버튼 -->
<li class="husky_seditor_ui_subscript"><button type="button" title="아래첨자" class="se2_sub"><span class="_buttonRound">아래첨자</span></button></li>
</ul>
<ul>
<!-- 왼쪽 정렬 버튼 -->
<li class="husky_seditor_ui_justifyleft"><button type="button" title="왼쪽정렬" class="se2_left"><span class="_buttonRound">왼쪽정렬</span></button></li>
```

위 코드에서 위 첨자 버튼과 아래 첨자 버튼에 해당하는 li 요소를 잘라내어 왼쪽 정렬 버튼에 해당하는 li 요소 앞에 붙여넣는다. 이때 라운딩 처리가 누락되지 않았는지 확인해야 한다. 툴바에 기본적으로 포함된 모든 버튼에는 이 규칙이 적용되어 있다. 이와 같이 수정한 코드는 다음과 같다.
```
<!-- 배경 색 버튼 -->
<li class="se2_pair husky_seditor_ui_BGColor"><span class="selected_color husky_se2m_BGColor_lastUsed"></span><span class="husky_seditor_ui_BGColorA"><button type="button" title="배경색" class="se2_bgcolor"><span>배경색</span></button></span><span class="husky_seditor_ui_BGColorB"><button type="button" title="더보기" class="se2_bgcolor_more"><span class="_buttonRound">더보기</span></button></span>
  <!-- 배경 색 -->
  … 배경 색 레이어 HTML 코드 …
  <!-- //배경 색 -->
</li>
</ul>
<ul>
<!-- 위 첨자 버튼 -->
<li class="husky_seditor_ui_superscript"><button type="button" title="윗첨자" class="se2_sup"><span class="_buttonRound">윗첨자</span></button></li>
<!-- 아래 첨자 버튼 -->
<li class="husky_seditor_ui_subscript"><button type="button" title="아래첨자" class="se2_sub"><span class="_buttonRound">아래첨자</span></button></li>
<!-- 왼쪽 정렬 버튼 -->
<li class="husky_seditor_ui_justifyleft"><button type="button" title="왼쪽정렬" class="se2_left"><span class="_buttonRound">왼쪽정렬</span></button></li>
```

위와 같이 코드를 변경하고 저장하면 다음 그림과 같이 툴바가 변경된다.

![image078.png](/assets/image078.png)

그림 36 툴바 버튼의 위치 변경

**참고**

[그림 35](#pic35)에서 1번(글꼴, 글자 크기) 버튼은 위치를 변경하면 안 된다.

#### 툴바에서 특정 기능 버튼 제거하기 {#-3}

이제 툴바의 버튼을 제거해 보자. 버튼을 제거하려면 제거하려는 버튼에 해당하는 li 요소를 삭제하면 된다. 버튼 그룹을 모두 제거하려면 해당 버튼 그룹에 해당하는 ul 요소 전체를 삭제한다.

예를 들어 링크 버튼을 제거해 보자. 변경 전 코드는 다음과 같다.
```
<ul>
  <!-- 링크 버튼 -->
  <li class="husky_seditor_ui_hyperlink">
    <button type="button" title="링크" class="se2_url">
      <span class="_buttonRound">링크</span></button>
    <!-- 링크 -->
    <div class="se2_layer">
      <div class="se2_in_layer">
        <div class="se2_url2">
          <input type="text" class="input_ty1" value="http://">
          <button type="button" class="se2_apply">
            <span>적용</span></button>
          <button type="button" class="se2_cancel">
            <span>취소</span></button>
        </div>
      </div>
    </div>
    <!-- //링크 -->
  </li>
  <!-- 특수 기호 버튼 -->
  <li class="husky_seditor_ui_sCharacter">
    <button type="button" title="특수기호" class="se2_character">
      <span class="_buttonRound">특수기호</span></button>
    <!-- 특수 기호 -->
```

위 코드에서 링크 버튼에 해당하는 li 요소를 삭제한 코드는 다음과 같다.
```
<ul>
  <!-- 특수 기호 버튼 -->
  <li class="husky_seditor_ui_sCharacter">
    <button type="button" title="특수기호" class="se2_character">
      <span class="_buttonRound">특수기호</span></button>
    <!-- 특수 기호 -->
```

링크 버튼이 버튼 그룹에서 첫 번째 버튼이었으므로, 링크 버튼이 제거되면 특수 기호 버튼이 버튼 그룹의 첫 번째 버튼이 된다. 따라서 특수 기호 버튼의 라운딩 처리가 누락되지 않았는지 확인해야 한다.

위와 같이 코드를 변경하고 저장하면 다음 그림과 같이 툴바가 변경된다.

![image080.png](/assets/image080.png)

그림 37 툴바 버튼의 제거

**참고**

[그림 35](#pic35)에서 1번(글꼴, 글자 크기) 버튼은 제거하면 안 된다.
