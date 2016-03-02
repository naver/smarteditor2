/*[
 * SET_WYSIWYG_STYLE
 *
 * 선택된 영역에 지정된 style을 입힌다.
 *
 * oStyle object 설정 할 스타일. 에) {"color":"#AABBCC", "backgroundColor":"#443322"}
 *
---------------------------------------------------------------------------]*/
/**
 * @pluginDesc 선택된 영역에 지정된 style을 입힌다.
 */
nhn.husky.SE_WYSIWYGStyler = $Class({
	name : "SE_WYSIWYGStyler",

	$LOCAL_BEFORE_ALL : function(sFullCommand, aArgs){
		return (this.oApp.getEditingMode() == "WYSIWYG");
	},
	
	$ON_SET_WYSIWYG_STYLE : function(oStyles){
		var oSelection = this.oApp.getSelection();
		
		// style cursor
		if(oSelection.collapsed){
			var oSpan = this.oApp.getWYSIWYGDocument().createElement("SPAN");
			oSpan.innerHTML = unescape("%uFEFF");

			var sValue;
			for(var sName in oStyles){
				sValue = oStyles[sName];

				if(typeof sValue != "string") continue;

				oSpan.style[sName] = sValue;
			}

			if(oSelection.startContainer.tagName == "BODY" && oSelection.startOffset == 0){
				var oVeryFirstNode = oSelection._getVeryFirstRealChild(this.oApp.getWYSIWYGDocument().body);

				if(typeof oVeryFirstNode.innerHTML == "string"){
					oVeryFirstNode.appendChild(oSpan);
				}else{
					oSelection.selectNode(oVeryFirstNode);
					oSelection.collapseToStart();
					oSelection.insertNode(oSpan);
				}
			}else{
				oSelection.collapseToStart();
				oSelection.insertNode(oSpan);
			}

			oSelection.selectNodeContents(oSpan);
			oSelection.collapseToEnd();
			oSelection._window.focus();
			oSelection._window.document.body.focus();
			oSelection.select();

			// FF3 will actually display %uFEFF when it is followed by a number AND certain font-family is used(like Gulim), so remove the chcaracter for FF3
			if($Agent().navigator().firefox && $Agent().navigator().version == 3)
				oSpan.innerHTML = "";

			return;
		}

		this.oApp.exec("RECORD_UNDO_BEFORE_ACTION", ["FONT STYLE"]);

		oSelection.styleRange(oStyles);
		oSelection._window.focus();
		oSelection.select();

		this.oApp.exec("RECORD_UNDO_AFTER_ACTION", ["FONT STYLE"]);
	}
});
//}
