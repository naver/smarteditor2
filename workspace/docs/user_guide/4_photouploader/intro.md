## 소개

사진 퀵 업로더는 SmartEditor2을 이용하여 글을 작성할 때 사진을 쉽고 빠르게 업로드할 수 있는 팝업 UI와 에디터 플러그인을 제공한다. 에디터의 팝업 관련 코드뿐만 아니라 파일을 업로드하는 서버 작업도 구현해야 한다. 팝업 UI에서 서비스와 연결되는 방법은 이 문서에서 다루지 않는다.

사용자 브라우저의 HTML5 지원 여부에 따라 다음 두 가지의 UI가 사용된다.

#### HTML5 지원 브라우저 {#html5}

HTML5를 지원하는 브라우저에서는 한 장 이상의 사진을 끌어다 지정된 영역에 놓으면 사진이 첨부된다.

![image086.jpg](/assets/image086.jpg)

그림 42 HTML5 지원 브라우저의 사진 퀵 업로더

HTML5 지원 브라우저의 사진 퀵 업로더는 HTML5의 드래그 앤드 드롭과 File API를 사용한다. 2012년 12월을 기준으로 Internet Explorer 10 이상 버전, Firefox 15 이상 버전, Chrome 22 이상 버전, Safari 5.1 이상 버전이 HTML5의 드래그 앤드 드롭과 File API를 지원한다. 드래그 앤드 드롭과 File API를 지원하는 브라우저에 대한 자세한 정보는 다음 주소를 참고한다.

* 드래그 앤드 드롭: http://caniuse.com/#search=file%20api
* File API: http://caniuse.com/#search=drag%20and%20drop

#### HTML5 미지원 브라우저 {#html5-0}

HTML5를 지원하지 않는 브라우저에서는 한 번에 한 장의 사진만 업로드할 수 있다. 페이지를 전환하지 않고 사진을 업로드할 수 있으며, 바로 성공 여부를 알려준다.

![image088.jpg](/assets/image088.jpg)

그림 43 HTML5 미지원 브라우저의 사진 퀵 업로더

HTML5 미지원 브라우저의 사진 퀵 업로더는 NAVER에서 제작된 JavaScript 라이브러리인 Jindo의 FileUploader를 이용하여 제작한 컴포넌트이다. Jindo FileUploader에 대한 자세한 내용은 &quot;[부록. jindo.FileUploader](../5_fileuploader/README.md)&quot;을 참고한다. 그 외에 Jindo에 대한 자세한 내용은 [https://github.com/naver/jindojs-jindo](https://github.com/naver/jindojs-jindo)에서 확인할 수 있다.
