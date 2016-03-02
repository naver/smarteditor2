<?php
echo $_REQUEST["htImageInfo"];

// default redirection
$url = $_REQUEST["callback"].'?callback_func='.$_REQUEST["callback_func"];
$bSuccessUpload = is_uploaded_file($_FILES['Filedata']['tmp_name']);

// SUCCESSFUL
if(bSuccessUpload) {
	$tmp_name = $_FILES['Filedata']['tmp_name'];
	$name = $_FILES['Filedata']['name'];
	
	$uploadDir = '../../upload/';
	if(!is_dir($uploadDir)){
		mkdir($uploadDir, 0777);
	}
	
	$newPath = $uploadDir.urlencode($_FILES['Filedata']['name']);
	
	@move_uploaded_file($tmp_name, $newPath);
	
	$url .= "&bNewLine=true";
	$url .= "&sFileName=".urlencode(urlencode($name));
	$url .= "&sFileURL=/smarteditor/demo/upload/".urlencode(urlencode($name));
}
// FAILED
else {
	$url .= '&errstr=error';
}

header('Location: '. $url);
?>