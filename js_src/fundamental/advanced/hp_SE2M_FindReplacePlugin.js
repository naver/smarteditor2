//{
/**
 * @fileOverview This file contains Husky plugin that takes care of the operations related to Find/Replace
 * @name hp_SE2M_FindReplacePlugin.js
 */
nhn.husky.SE2M_FindReplacePlugin = jindo.$Class({
	name : "SE2M_FindReplacePlugin",
	oEditingWindow : null,
	oFindReplace :  null,
	oUILayer : null,
	bFindMode : true,

	$init : function(){
		this.nDefaultTop = 20;
	},
	
	$ON_MSG_APP_READY : function(){
		// the right document will be available only when the src is completely loaded
		this.oEditingWindow = this.oApp.getWYSIWYGWindow();
		this.oApp.exec("REGISTER_HOTKEY", ["ctrl+f", "SHOW_FIND_LAYER", []]);
		this.oApp.exec("REGISTER_HOTKEY", ["ctrl+h", "SHOW_REPLACE_LAYER", []]);
		
		this.oApp.exec("REGISTER_UI_EVENT", ["findAndReplace", "click", "SHOW_FIND_REPLACE_LAYER"]);
	},
	$ON_SHOW_ACTIVE_LAYER : function(){
		this.oApp.exec( "HIDE_DIALOG_LAYER", [this.elDropdownLayer]);
	},
	//@lazyload_js SHOW_FIND_LAYER,SHOW_REPLACE_LAYER,SHOW_FIND_REPLACE_LAYER:N_FindReplace.js[
	_assignHTMLElements : function(){
		oAppContainer = this.oApp.htOptions.elAppContainer;

		this.oApp.exec("LOAD_HTML", ["find_and_replace"]);
//		this.oEditingWindow = jindo.$$.getSingle("IFRAME", oAppContainer);
		this.elDropdownLayer = jindo.$$.getSingle("DIV.husky_se2m_findAndReplace_layer", oAppContainer);
		this.welDropdownLayer = jindo.$Element(this.elDropdownLayer);
		var oTmp = jindo.$$("LI", this.elDropdownLayer);
		
		this.oFindTab = oTmp[0];
		this.oReplaceTab = oTmp[1];
		
		oTmp = jindo.$$(".container > .bx", this.elDropdownLayer);

		this.oFindInputSet = jindo.$$.getSingle(".husky_se2m_find_ui", this.elDropdownLayer);
		this.oReplaceInputSet = jindo.$$.getSingle(".husky_se2m_replace_ui", this.elDropdownLayer);
		
		this.elTitle = jindo.$$.getSingle("H3", this.elDropdownLayer);

		this.oFindInput_Keyword = jindo.$$.getSingle("INPUT", this.oFindInputSet);

		oTmp = jindo.$$("INPUT", this.oReplaceInputSet);
		this.oReplaceInput_Original = oTmp[0];
		this.oReplaceInput_Replacement = oTmp[1];

		this.oFindNextButton = jindo.$$.getSingle("BUTTON.husky_se2m_find_next", this.elDropdownLayer);

		this.oReplaceFindNextButton = jindo.$$.getSingle("BUTTON.husky_se2m_replace_find_next", this.elDropdownLayer);		

		this.oReplaceButton = jindo.$$.getSingle("BUTTON.husky_se2m_replace", this.elDropdownLayer);
		this.oReplaceAllButton = jindo.$$.getSingle("BUTTON.husky_se2m_replace_all", this.elDropdownLayer);
		
		this.aCloseButtons = jindo.$$("BUTTON.husky_se2m_cancel", this.elDropdownLayer);
		
	},

	$LOCAL_BEFORE_FIRST : function(sMsg){
		this._assignHTMLElements();

		this.oFindReplace = new nhn.FindReplace(this.oEditingWindow);

		for(var i=0; i<this.aCloseButtons.length; i++){
			var func = jindo.$Fn(this.oApp.exec, this.oApp).bind("HIDE_DIALOG_LAYER", [this.elDropdownLayer]);
			jindo.$Fn(func, this).attach(this.aCloseButtons[i], "click");
		}
		
		jindo.$Fn(jindo.$Fn(this.oApp.exec, this.oApp).bind("SHOW_FIND", []), this).attach(this.oFindTab, "click");
		jindo.$Fn(jindo.$Fn(this.oApp.exec, this.oApp).bind("SHOW_REPLACE", []), this).attach(this.oReplaceTab, "click");
		
		jindo.$Fn(jindo.$Fn(this.oApp.exec, this.oApp).bind("FIND", []), this).attach(this.oFindNextButton, "click");
		jindo.$Fn(jindo.$Fn(this.oApp.exec, this.oApp).bind("FIND", []), this).attach(this.oReplaceFindNextButton, "click");
		
		jindo.$Fn(jindo.$Fn(this.oApp.exec, this.oApp).bind("REPLACE", []), this).attach(this.oReplaceButton, "click");
		jindo.$Fn(jindo.$Fn(this.oApp.exec, this.oApp).bind("REPLACE_ALL", []), this).attach(this.oReplaceAllButton, "click");
		
		this.oFindInput_Keyword.value = "";
		this.oReplaceInput_Original.value = "";
		this.oReplaceInput_Replacement.value = "";

		//레이어의 이동 범위 설정.
		var elIframe = this.oApp.getWYSIWYGWindow().frameElement;
		this.htOffsetPos = jindo.$Element(elIframe).offset();
		this.nEditorWidth = elIframe.offsetWidth;

		this.elDropdownLayer.style.display = "block";
		this.htInitialPos = this.welDropdownLayer.offset();
		var htScrollXY = this.oApp.oUtils.getScrollXY();
//		this.welDropdownLayer.offset(this.htOffsetPos.top-htScrollXY.y, this.htOffsetPos.left-htScrollXY.x);
		this.welDropdownLayer.offset(this.htOffsetPos.top, this.htOffsetPos.left);
		this.htTopLeftCorner = {x:parseInt(this.elDropdownLayer.style.left), y:parseInt(this.elDropdownLayer.style.top)};
		
		// offset width가 IE에서 css lazy loading 때문에 제대로 잡히지 않아 상수로 설정
		//this.nLayerWidth = this.elDropdownLayer.offsetWidth;
		this.nLayerWidth = 258;
		this.nLayerHeight = 160;
		
		//this.nLayerWidth = Math.abs(parseInt(this.elDropdownLayer.style.marginLeft))+20;
		this.elDropdownLayer.style.display = "none";

	},
	
	$ON_SHOW_FIND_REPLACE_LAYER : function(){
		this.oApp.exec("HIDE_ALL_DIALOG_LAYER", []);
		this.elDropdownLayer.style.top = this.nDefaultTop+"px";
		
		this.oApp.exec("SHOW_DIALOG_LAYER", [this.elDropdownLayer, {
			elHandle: this.elTitle,
			fnOnDragStart : jindo.$Fn(this.oApp.exec, this.oApp).bind("SHOW_EDITING_AREA_COVER"),
			fnOnDragEnd : jindo.$Fn(this.oApp.exec, this.oApp).bind("HIDE_EDITING_AREA_COVER"),
			nMinX : this.htTopLeftCorner.x,
			nMinY : this.nDefaultTop,
			nMaxX : this.htTopLeftCorner.x + this.oApp.getEditingAreaWidth() - this.nLayerWidth,
			nMaxY : this.htTopLeftCorner.y + this.oApp.getEditingAreaHeight() - this.nLayerHeight,
			sOnShowMsg : "FIND_REPLACE_LAYER_SHOWN"
		}]);
		this.oApp.exec('MSG_NOTIFY_CLICKCR', ['findreplace']);
	},
		
	$ON_FIND_REPLACE_LAYER_SHOWN : function(){
		this.oApp.exec("POSITION_TOOLBAR_LAYER", [this.elDropdownLayer]);
		if(this.bFindMode){
			this.oFindInput_Keyword.value = "_clear_";
			this.oFindInput_Keyword.value = "";
			this.oFindInput_Keyword.focus();
		}else{
			this.oReplaceInput_Original.value = "_clear_";
			this.oReplaceInput_Original.value = "";
			this.oReplaceInput_Original.focus();
		}

		this.oApp.exec("HIDE_CURRENT_ACTIVE_LAYER", []);
	},
	
	$ON_SHOW_FIND_LAYER : function(){
		this.oApp.exec("SHOW_FIND");
		this.oApp.exec("SHOW_FIND_REPLACE_LAYER");
	},
	
	$ON_SHOW_REPLACE_LAYER : function(){
		this.oApp.exec("SHOW_REPLACE");
		this.oApp.exec("SHOW_FIND_REPLACE_LAYER");
	},
	
	$ON_SHOW_FIND : function(){
		this.bFindMode = true;
		this.oFindInput_Keyword.value = this.oReplaceInput_Original.value;
		
		jindo.$Element(this.oFindTab).addClass("active");
		jindo.$Element(this.oReplaceTab).removeClass("active");
		
		jindo.$Element(this.oFindNextButton).removeClass("normal");
		jindo.$Element(this.oFindNextButton).addClass("strong");

		this.oFindInputSet.style.display = "block";
		this.oReplaceInputSet.style.display = "none";
		
		this.oReplaceButton.style.display = "none";
		this.oReplaceAllButton.style.display = "none";
		
		jindo.$Element(this.elDropdownLayer).removeClass("replace");
		jindo.$Element(this.elDropdownLayer).addClass("find");
	},
	
	$ON_SHOW_REPLACE : function(){
		this.bFindMode = false;
		this.oReplaceInput_Original.value = this.oFindInput_Keyword.value;
		
		jindo.$Element(this.oFindTab).removeClass("active");
		jindo.$Element(this.oReplaceTab).addClass("active");
		
		jindo.$Element(this.oFindNextButton).removeClass("strong");
		jindo.$Element(this.oFindNextButton).addClass("normal");
		
		this.oFindInputSet.style.display = "none";
		this.oReplaceInputSet.style.display = "block";
		
		this.oReplaceButton.style.display = "inline";
		this.oReplaceAllButton.style.display = "inline";
		
		jindo.$Element(this.elDropdownLayer).removeClass("find");
		jindo.$Element(this.elDropdownLayer).addClass("replace");
	},

	$ON_FIND : function(){
		var sKeyword;
		if(this.bFindMode){
			sKeyword = this.oFindInput_Keyword.value;
		}else{
			sKeyword = this.oReplaceInput_Original.value;
		}
		
		var oSelection = this.oApp.getSelection();
		oSelection.select();
		
		switch(this.oFindReplace.find(sKeyword, false)){
			case 1:
				alert(this.oApp.$MSG("SE_FindReplace.keywordNotFound"));
				oSelection.select();
				break;
			case 2:
				alert(this.oApp.$MSG("SE_FindReplace.keywordMissing"));
				break;
		}
	},
	
	$ON_REPLACE : function(){
		var sOriginal = this.oReplaceInput_Original.value;
		var sReplacement = this.oReplaceInput_Replacement.value;

		var oSelection = this.oApp.getSelection();

		this.oApp.exec("RECORD_UNDO_BEFORE_ACTION", ["REPLACE"]);
		var iReplaceResult = this.oFindReplace.replace(sOriginal, sReplacement, false);
		this.oApp.exec("RECORD_UNDO_AFTER_ACTION", ["REPLACE"]);
		
		switch(iReplaceResult){
			case 1:
			case 3:
				alert(this.oApp.$MSG("SE_FindReplace.keywordNotFound"));
				oSelection.select();
				break;
			case 4:
				alert(this.oApp.$MSG("SE_FindReplace.keywordMissing"));
				break;
		}
	},
	
	$ON_REPLACE_ALL : function(){
		var sOriginal = this.oReplaceInput_Original.value;
		var sReplacement = this.oReplaceInput_Replacement.value;

		var oSelection = this.oApp.getSelection();
		
		this.oApp.exec("RECORD_UNDO_BEFORE_ACTION", ["REPLACE ALL", {sSaveTarget:"BODY"}]);
		var iReplaceAllResult = this.oFindReplace.replaceAll(sOriginal, sReplacement, false);
		this.oApp.exec("RECORD_UNDO_AFTER_ACTION", ["REPLACE ALL", {sSaveTarget:"BODY"}]);

		if(iReplaceAllResult == 0){
			alert(this.oApp.$MSG("SE_FindReplace.replaceKeywordNotFound"));
			oSelection.select();
			this.oApp.exec("FOCUS");
		}else{
			if(iReplaceAllResult<0){
				alert(this.oApp.$MSG("SE_FindReplace.keywordMissing"));
				oSelection.select();
			}else{
				alert(this.oApp.$MSG("SE_FindReplace.replaceAllResultP1")+iReplaceAllResult+this.oApp.$MSG("SE_FindReplace.replaceAllResultP2"));
				oSelection = this.oApp.getEmptySelection();
				oSelection.select();
				this.oApp.exec("FOCUS");
			}
		}
	}
	//@lazyload_js]
});
//}