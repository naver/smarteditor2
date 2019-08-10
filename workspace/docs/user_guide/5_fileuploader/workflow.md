## 요청 수행 과정

jindo.FileUploader가 요청을 수행하는 과정은 다음과 같다.

1. 요청을 받으면 Form 내부에 보이지 않는 IFRAME을 생성한다. 생성된 IFRAME은 지정된 URL로 업로드할 파일을 전송하며, 콜백 페이지 주소(callback)와 콜백 함수의 이름(callback_func)을 서버에 전달한다.  
예: FileUpload.php?callback=callback.html&amp;callback_func=tmpFrame_84101_func
2. 파일을 전송받은 서버에서는 파일과 콜백 함수의 이름을 콜백 페이지 주소로 리다이렉트한다. 파일 전송에 실패하면 쿼리 스트링으로 errstr=error를 추가한다. 콜백 함수에 추가로 전달할 정보가 있으면 쿼리 스트링으로 추가한다.
3. 콜백 페이지 주소로 리다이렉트된 IFRAME은 부모 요소의 FileUploader 객체에 콜백 함수를 실행시키고 자신을 제거한다.

서버 측 FileUploader.php 파일의 예는 다음과 같다.
```
//기본 리다이렉트
$url = $_REQUEST["callback"] .'?callback_func='. $_REQUEST["callback_func"];

if (is_uploaded_file($_FILES['Filedata']['tmp_name'])) { //성공 시 파일 사이즈와 URL 전송
    $tmp_name = $_FILES['Filedata']['tmp_name'];
    $name = $_FILES['Filedata']['name'];
    $new_path = "upload/".urlencode($name);
    @move_uploaded_file($tmp_name, $new_path);
    $url .= "&size=". $_FILES['Filedata']['size'];
    $url .= "&url=http://test.naver.com/components/upload/".urlencode(urlencode($name));
} else { //실패시 errstr=error 전송
    $url .= '&errstr=error';
}

header('Location: '. $url);
```

콜백 페이지 HTML 파일의 내용의 예는 다음과 같다.
```
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html lang="ko">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>FileUploader Callback</title>
</head>
<body>
<script type="text/javascript">
    // document.domain 설정
    document.domain = "nhncorp.com";
    // execute callback script
    var sUrl = document.location.search.substr(1);
    if (sUrl != "blank") {
        var oParameter = {}; // query array
        sUrl.replace(/([^=]+)=([^&]*)(&|$)/g, function(){
            oParameter[arguments[1]] = arguments[2];
            return "";
        });
        if ((oParameter.errstr || '').length) { // on error
            (parent.jindo.FileUploader._oCallback[oParameter.callback_func+'_error'])(oParameter);
        } else {
            (parent.jindo.FileUploader._oCallback[oParameter.callback_func+'_success'])(oParameter);
        }
    }
</script>
</body>
```
