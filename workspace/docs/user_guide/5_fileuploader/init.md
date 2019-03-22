## 초기화

jindo.FileUploader를 사용하려면 HTML 파일을 다음과 같이 작성한다.
```
<form method="POST" enctype="multipart/form-data">
    <input type="file" id="file_select">
</form>
```

*   전송할 input[type=file]은 반드시 form 요소를 부모 요소로 가져야 한다.
*   form의 method 속성 값은 &quot;post&quot;, enctype 속성 값은 &quot;multipart/form-data&quot;이어야 한다.

JavaScript 파일은 다음과 같이 작성한다.
```
var oFileUploader = new jindo.FileUploader(jindo.$("file_select"), {
    //업로드할 서버의 URL(Form 전송 대상)
    sUrl : '/samples/response/FileUpload.php',
    //업로드 이후에 IFRMAME이 리다이렉트될 콜백 페이지 주소
    sCallback : '/Jindo_Component/FileUploader/callback.html',
    //post할 데이터 셋. 예: { blogId : "testid" }
    htData : {}
});
```
