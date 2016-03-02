/**
 * @pluginDesc 찾기 바꾸기 플러그인
 */
nhn.husky.SE_FindReplacePlugin = $Class({
	name : "SE_FindReplacePlugin",
	oEditingWindow : null,
	oFindReplace :  null,
	oUILayer : null,
	bFindMode : true,

	$init : function(oAppContainer){
		this._assignHTMLObjects(oAppContainer);
	},

	_assignHTMLObjects : function(oAppContainer){
		oAppContainer = $(oAppContainer) || document;

		this.oUILayer = cssquery.getSingle("DIV.husky_seditor_findAndReplace_layer", oAppContainer);

		var oTmp = cssquery("LI", this.oUILayer);
		
		this.oFindTab = oTmp[0];
		this.oReplaceTab = oTmp[1];

		oTmp = cssquery(".container > .bx", this.oUILayer);
		
		this.oFindInputSet = oTmp[0];
		this.oReplaceInputSet = oTmp[1];
		
		this.oFindInput_Keyword = cssquery.getSingle("INPUT", this.oFindInputSet);
		
		oTmp = cssquery("INPUT", this.oReplaceInputSet);
		this.oReplaceInput_Original = oTmp[0];
		this.oReplaceInput_Replacement = oTmp[1];

		this.oFindNextButton = cssquery.getSingle("BUTTON.find_next", this.oUILayer);
		this.oCancelButton = cssquery.getSingle("BUTTON.cancel", this.oUILayer);
		
		this.oReplaceButton = cssquery.getSingle("BUTTON.replace", this.oUILayer);
		this.oReplaceAllButton = cssquery.getSingle("BUTTON.replace_all", this.oUILayer);
		
		this.aCloseButtons = cssquery("BUTTON.close", this.oUILayer);
		this.aCloseButtons[this.aCloseButtons.length] = this.oCancelButton;
	},

	$ON_MSG_APP_READY : function(){
		this.oEditingWindow = this.oApp.getWYSIWYGWindow();
		this.oFindReplace = new nhn.FindReplace(this.oEditingWindow);
		if(!this.oFindReplace.bBrowserSupported){
			this.oApp.exec("DISABLE_UI", ["find_replace"]);
			return;
		}

		for(var i=0; i<this.aCloseButtons.length; i++){
			var func = $Fn(this.oApp.exec, this.oApp).bind("HIDE_FIND_REPLACE_LAYER", [this.oUILayer]);
			$Fn(func, this).attach(this.aCloseButtons[i], "click");
		}
		
		$Fn($Fn(this.oApp.exec, this.oApp).bind("SHOW_FIND", []), this).attach(this.oFindTab, "mousedown");
		$Fn($Fn(this.oApp.exec, this.oApp).bind("SHOW_REPLACE", []), this).attach(this.oReplaceTab, "mousedown");
		
		$Fn($Fn(this.oApp.exec, this.oApp).bind("FIND", []), this).attach(this.oFindNextButton, "click");
		$Fn($Fn(this.oApp.exec, this.oApp).bind("REPLACE", []), this).attach(this.oReplaceButton, "click");
		$Fn($Fn(this.oApp.exec, this.oApp).bind("REPLACE_ALL", []), this).attach(this.oReplaceAllButton, "click");
		
		this.oApp.exec("REGISTER_UI_EVENT", ["findAndReplace", "click", "SHOW_FIND_REPLACE_LAYER"]);
	},
	
	$ON_SHOW_ACTIVE_LAYER : function(){
		this.oApp.exec("HIDE_FIND_REPLACE_LAYER", []);
	},
	
	$ON_HIDE_FIND_REPLACE_LAYER : function(){
		this.oApp.exec("DESELECT_UI", ["findAndReplace"]);
		this.oApp.exec("HIDE_DIALOG_LAYER", [this.oUILayer]);
	},
	
	$ON_SHOW_FIND_REPLACE_LAYER : function(){
		this.oApp.exec("SELECT_UI", ["findAndReplace"]);
		this.oApp.exec("HIDE_ALL_DIALOG_LAYER", []);
		this.oApp.exec("SHOW_DIALOG_LAYER", [this.oUILayer]);
		this.oApp.exec("POSITION_TOOLBAR_LAYER", [this.oUILayer]);
		this.oApp.exec("HIDE_CURRENT_ACTIVE_LAYER", []);
	},
	
	$ON_SHOW_FIND : function(){
		this.bFindMode = true;
		
		$Element(this.oFindTab).addClass("on");
		$Element(this.oReplaceTab).removeClass("on");
		
		$Element(this.oFindNextButton).removeClass("normal");
		$Element(this.oFindNextButton).addClass("strong");

		this.oFindInputSet.style.display = "block";
		this.oReplaceInputSet.style.display = "none";
		
		this.oReplaceButton.style.display = "none";
		this.oReplaceAllButton.style.display = "none";
		
		$Element(this.oUILayer).removeClass("replace");
		$Element(this.oUILayer).addClass("find");

		this.oFindInput_Keyword.value = this.oReplaceInput_Original.value;
	},
	
	$ON_SHOW_REPLACE : function(){
		this.bFindMode = false;

		$Element(this.oFindTab).removeClass("on");
		$Element(this.oReplaceTab).addClass("on");
		
		$Element(this.oFindNextButton).removeClass("strong");
		$Element(this.oFindNextButton).addClass("normal");
		
		this.oFindInputSet.style.display = "none";
		this.oReplaceInputSet.style.display = "block";
		
		this.oReplaceButton.style.display = "inline";
		this.oReplaceAllButton.style.display = "inline";
		
		$Element(this.oUILayer).removeClass("find");
		$Element(this.oUILayer).addClass("replace");

		this.oReplaceInput_Original.value = this.oFindInput_Keyword.value;
	},

	$ON_FIND : function(){
		var sKeyword;
		if(this.bFindMode)
			sKeyword = this.oFindInput_Keyword.value;
		else
			sKeyword = this.oReplaceInput_Original.value;
			
		switch(this.oFindReplace.find(sKeyword, false)){
			case 1:
				alert(this.oApp.$MSG("SE_FindReplace.keywordNotFound"));
				break;
			case 2:
				alert(this.oApp.$MSG("SE_FindReplace.keywordMissing"));
				break;
		}
	},
	
	$ON_REPLACE : function(){
		var sOriginal = this.oReplaceInput_Original.value;
		var sReplacement = this.oReplaceInput_Replacement.value;

		this.oApp.exec("RECORD_UNDO_BEFORE_ACTION", ["REPLACE"]);
		var iReplaceResult = this.oFindReplace.replace(sOriginal, sReplacement, false);
		this.oApp.exec("RECORD_UNDO_AFTER_ACTION", ["REPLACE"]);

		switch(iReplaceResult){
			case 1:
			case 3:
				alert(this.oApp.$MSG("SE_FindReplace.keywordNotFound"));
				break;
			case 4:
				alert(this.oApp.$MSG("SE_FindReplace.keywordMissing"));
				break;
		}
	},
	
	$ON_REPLACE_ALL : function(){
		var sOriginal = this.oReplaceInput_Original.value;
		var sReplacement = this.oReplaceInput_Replacement.value;

		this.oApp.exec("RECORD_UNDO_BEFORE_ACTION", ["REPLACE ALL"]);
		var iReplaceAllResult = this.oFindReplace.replaceAll(sOriginal, sReplacement, false);
		this.oApp.exec("RECORD_UNDO_AFTER_ACTION", ["REPLACE ALL"]);

		if(iReplaceAllResult<0){
			alert(this.oApp.$MSG("SE_FindReplace.keywordMissing"));
		}else{
			alert(this.oApp.$MSG("SE_FindReplace.replaceAllResultP1")+iReplaceAllResult+this.oApp.$MSG("SE_FindReplace.replaceAllResultP2"));
		}
	}
});