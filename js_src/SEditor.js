/**
 * @fileOverview This file contains Smart Editor Basic creation function
 * @name SEditor.js
 */
function createSEditorInIFrame(elIFrame, elIRField, htParams){
	if(!window.$Jindo){
		parent.document.body.innerHTML="진도 프레임웍이 필요합니다.<br>\n<a href='http://dev.naver.com/projects/jindo/download'>http://dev.naver.com/projects/jindo/download</a>에서 jindo.min.js를 다운로드 받아 /js 폴더에 복사 해 주세요.";
		return;
	}

	nEditingAreaHeight = elIRField.style.height||elIRField.offsetHeight+"px";
	nEditingAreaWidth = elIRField.style.width||elIRField.offsetWidth+"px";
	elIRField.style.display = "none";

	elIFrame.style.width = nEditingAreaWidth;
	
	elAppContainer = elIFrame.contentWindow.document.body;
	var oWYSIWYGIFrame = cssquery.getSingle(".input_area IFRAME.input_wysiwyg", elAppContainer);
	var oHTMLSrcTextarea = cssquery.getSingle(".input_area TEXTAREA.input_syntax", elAppContainer);
	var oIRTextarea = elIRField?elIRField:cssquery.getSingle(".input_area TEXTAREA.blind", elAppContainer);
	
	var oEditor = new nhn.husky.HuskyCore();

	oEditor.registerPlugin(new nhn.husky.CorePlugin());
	
	oEditor.registerPlugin(new nhn.husky.StringConverterManager());
	oEditor.registerPlugin(new nhn.husky.SE_EditingAreaManager("WYSIWYG", oIRTextarea, {nHeight:nEditingAreaHeight, nMinHeight:205}, function(){}, elAppContainer));
	oEditor.registerPlugin(new nhn.husky.SE_EditingArea_WYSIWYG(oWYSIWYGIFrame));

	oEditor.registerPlugin(new nhn.husky.SE_EditingArea_HTMLSrc(oHTMLSrcTextarea));

	oEditor.registerPlugin(new nhn.husky.Utils());
	oEditor.registerPlugin(new nhn.husky.DialogLayerManager());
	oEditor.registerPlugin(new nhn.husky.ActiveLayerManager());
	oEditor.registerPlugin(new nhn.husky.HuskyRangeManager(oWYSIWYGIFrame));

	oEditor.registerPlugin(new nhn.husky.Hotkey());

	oEditor.registerPlugin(new nhn.husky.SE_WYSIWYGStyler());
	oEditor.registerPlugin(new nhn.husky.SE_WYSIWYGStyleGetter());
	oEditor.registerPlugin(new nhn.husky.SE_Toolbar(elAppContainer));

	oEditor.registerPlugin(new nhn.husky.SE_ExecCommand(oWYSIWYGIFrame));

	oEditor.registerPlugin(new nhn.husky.SE_WYSIWYGEnterKey("P"));

	oEditor.registerPlugin(new nhn.husky.SE_ColorPalette(elAppContainer));
	oEditor.registerPlugin(new nhn.husky.SE_FontColor(elAppContainer));
	oEditor.registerPlugin(new nhn.husky.SE_BGColor(elAppContainer));
	
	oEditor.registerPlugin(new nhn.husky.SE_Quote(elAppContainer));

	oEditor.registerPlugin(new nhn.husky.SE_FontNameWithSelectUI(elAppContainer));
	oEditor.registerPlugin(new nhn.husky.SE_FontSizeWithSelectUI(elAppContainer));
	oEditor.registerPlugin(new nhn.husky.SE_LineHeightWithSelectUI(elAppContainer));

	oEditor.registerPlugin(new nhn.husky.SE_UndoRedo());

	oEditor.registerPlugin(new nhn.husky.SE_Table(elAppContainer));
	
	oEditor.registerPlugin(new nhn.husky.SE_Hyperlink(elAppContainer));
	
	oEditor.registerPlugin(new nhn.husky.SE_EditingModeToggler(elAppContainer));

	oEditor.registerPlugin(new nhn.husky.MessageManager(oMessageMap));
	oEditor.registerPlugin(new nhn.husky.SE_SCharacter(elAppContainer));

	oEditor.registerPlugin(new nhn.husky.SE_FindReplacePlugin(elAppContainer));
	
	oEditor.registerPlugin(new nhn.husky.SE_OuterIFrameControl(elAppContainer, 100));
	
	SE_RegisterCustomPlugins(oEditor, elAppContainer);
	
	return oEditor;
}
