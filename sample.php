<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="ko" xml:lang="ko">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>Smart Editor&#8482; WYSIWYG Mode</title>
<link href="css/style.css" rel="stylesheet" type="text/css" />
</head>
<body class="smartOutput">
<p><b><u>에디터 내용:</u></b></p>
<?=$_POST["ir1"]?>
<hr>
<p><b><span style="color:#FF0000">주의: </span>실제 적용시 뷰단에 style.css가 없거나 디폴트 스타일을 변경 시키는 다른 css가 있을 경우 올바르게 나타나지 않을수 있음으로 주의 바랍니다.</b></p>
<?php echo(htmlspecialchars_decode('&lt;img id="test" width="0" height="0"&gt;'))?>
<script>if(!document.getElementById("test"))alert("PHP가 실행되지 않았습니다. 내용을 로컬 파일로 전송한 것이 아니라 서버로 전송했는지 확인 해 주십시오.");</script>
</body>
</html>