<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="ko" xml:lang="ko">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>Smart Editor&#8482; WYSIWYG Mode</title>
<link href="../../css/smart_editor2_in.css" rel="stylesheet" type="text/css">
</head>
<body class="smartOutput se2_inputarea">
	<p>
		<b><u>에디터 내용:</u></b>
	</p>

	<div style="width:736px;">
	<?php
		require_once 'htmlpurifier/HTMLPurifier.standalone.php';
		class HTMLPurifier_Filter_EscapeTextContent extends HTMLPurifier_Filter
		{
			/**
			 * Name of the filter for identification purposes.
			 * @type string
			 */
			public $name = 'EscapeTextContent';
		
			/**
			 * Post-processor function, handles HTML after HTML Purifier
			 * @param string $html
			 * @param HTMLPurifier_Config $config
			 * @param HTMLPurifier_Context $context
			 * @return string
			 */
			public function postFilter($html, HTMLPurifier_Config $config, HTMLPurifier_Context $context)
			{
				return preg_replace_callback('#(?<=^|>)[^><]+?(?=<|$)#', array($this, 'postFilterCallback'), $html);
			}

			protected function postFilterCallback($matches)
			{
				// @see https://www.owasp.org/index.php/XSS_(Cross_Site_Scripting)_Prevention_Cheat_Sheet#RULE_.231_-_HTML_Escape_Before_Inserting_Untrusted_Data_into_HTML_Element_Content
				$content = html_entity_decode($matches[0]);
				return str_replace(
						array('&', '"', "'", '<', '>', '(', ')', '/'), 
						array('&amp;', '&quot;', '&#39;', '&lt;', '&gt;', '&#40;', '&#41;', '&#47;'), 
						$content
				);
			}
		}
		$config = HTMLPurifier_Config::createDefault();
		$config->set('Filter.Custom', array(new HTMLPurifier_Filter_EscapeTextContent) );
		$purifier = new HTMLPurifier($config);
		$clean_html = $purifier->purify($_POST["ir1"]);
		echo $clean_html;
	?>
	</div>
	
	<hr>
	<p>
		<b><span style="color:#FF0000">주의: </span>sample.php는 샘플 파일로 정상 동작하지 않을 수 있습니다. 이 점 주의바랍니다.</b>
	</p>
	
	<?php echo(htmlspecialchars_decode('&lt;img id="test" width="0" height="0"&gt;'))?>
	
<script>
	if(!document.getElementById("test")) {
		alert("PHP가 실행되지 않았습니다. 내용을 로컬 파일로 전송한 것이 아니라 서버로 전송했는지 확인 해 주십시오.");
	}
</script>
</body>
</html>