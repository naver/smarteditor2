/*[
 * EVENT_TOOLBAR_MOUSEOVER
 *
 * 툴바에 마우스 커서가 올라간 상태
 *
 * weEvent object Jindo2 브라우저 이벤트 객체
 *
---------------------------------------------------------------------------]*/
/*[
 * EVENT_TOOLBAR_MOUSEOUT
 *
 * 툴바에서 마우스 커서가 내려간 상태
 *
 * weEvent object Jindo2 브라우저 이벤트 객체
 *
---------------------------------------------------------------------------]*/
/*[
 * TOGGLE_TOOLBAR_ACTIVE_LAYER
 *
 * 액티브 레이어를 툴바 위치에 맞춰서 보여주거나 숨긴다.
 *
 * oLayer HTMLElement 레이어로 사용할 HTML Element
 * sOnOpenCmd string 화면에 보이는 경우 발생 할 메시지(옵션)
 * aOnOpenParam array sOnOpenCmd와 함께 넘겨줄 파라미터(옵션)
 * sOnCloseCmd string 해당 레이어가 화면에서 숨겨질 때 발생 할 메시지(옵션)
 * aOnCloseParam array sOnCloseCmd와 함께 넘겨줄 파라미터(옵션)
 *
---------------------------------------------------------------------------]*/
/*[
 * MSG_TOOLBAR_LAYER_SHOWN
 *
 * 툴바 레이어가 표시 됐음을 알림
 *
 * oLayer HTMLElement 레이어로 사용된 HTML Element
 * oBtn HTMLElement 레이어의 기준 위치가 되는 버튼 element
 * aOpenCmd string 화면에 보이면서 발생시킨 메시지
 * aOpenArgs array sOpenCmd에 넘어온 파라미터
 *
---------------------------------------------------------------------------]*/
/*[
 * SHOW_TOOLBAR_ACTIVE_LAYER
 *
 * 액티브 레이어를 툴바 위치에 맞춰서 보여준다.
 *
 * oLayer HTMLElement 레이어로 사용할 HTML Element
 * sOnCloseCmd string 해당 레이어가 화면에서 숨겨질 때 발생 할 메시지(옵션)
 * aOnCloseParam array sOnCloseCmd와 함께 넘겨줄 파라미터(옵션)
 * oBtn HTMLElement 레이어 위치 기준이 될 버튼 element
 *
---------------------------------------------------------------------------]*/
/*[
 * DISABLE_UI
 *
 * 툴바의 특정 버튼을 비활성화 시킨다.
 *
 * sUIName string 버튼에 할당 되어 있는 UI명
 *
---------------------------------------------------------------------------]*/
/*[
 * ENABLE_UI
 *
 * 비활성화 된 툴바 버튼을 활성화 시킨다.
 *
 * sUIName string 버튼에 할당 되어 있는 UI명
 *
---------------------------------------------------------------------------]*/
/*[
 * ENABLE_ALL_UI
 *
 * UI명이 할당 되어 있는 모든 버튼을 활성화 시킨다.
 *
 * none
 *
---------------------------------------------------------------------------]*/
/*[
 * DISABLE_UI
 *
 * UI명이 할당 되어 있는 모든 버튼을 비활성화 시킨다.
 *
 * none
 *
---------------------------------------------------------------------------]*/
/*[
 * SELECT_UI
 *
 * 버튼 element에 "선택 상태" class를 추가한다.
 *
 * sUIName string 버튼에 할당 되어 있는 UI명
 *
---------------------------------------------------------------------------]*/
/*[
 * DESELECT_UI
 *
 * 버튼 element에 "선택 상태" class를 제거한다.
 *
 * sUIName string 버튼에 할당 되어 있는 UI명
 *
---------------------------------------------------------------------------]*/
/*[
 * REGISTER_UI_EVENT
 *
 * 툴바 버튼에 특정 브라우저 이벤트가 발생 할 때, Husky 메시지를 발생한다.
 *
 * sUIName string 툴바 버튼의 UI명
 * sEvent string 브라우저 이벤트명
 * sCmd string 발생시킬 Husky 메시지
 * aParams array 메시지에 넘겨줄 파라미터
 *
---------------------------------------------------------------------------]*/
/*[
 * POSITION_TOOLBAR_LAYER
 *
 * 레이어를 버튼 기준으로 위치를 잡아 준다.
 *
 * oLayer HTMLElement 레이어
 * oBtn HTMLElement 위치 기준이 될 툴바 버튼
 *
---------------------------------------------------------------------------]*/
/**
 * @pluginDesc Husky Framework에서 자주 사용되는 메시지를 처리하는 플러그인
 */
nhn.husky.SE_Toolbar = $Class({
	name : "SE_Toolbar",
	toolbarArea : null,
	toolbarButton : null,
	uiNameTag : "uiName",
	
	sUIClassPrefix : "husky_seditor_ui_",

	aUICmdMap : null,

	$init : function(oAppContainer){
		this.htUIList = {};
		this.htWrappedUIList = {};

		this.aUICmdMap = {};
		this._assignHTMLObjects(oAppContainer);
	},

	_assignHTMLObjects : function(oAppContainer){
		oAppContainer = $(oAppContainer) || document;
		this.toolbarArea = cssquery.getSingle(".tool", oAppContainer);
		this.welToolbarArea = $Element(this.toolbarArea);

		this.aAllButtons = cssquery("BUTTON", this.toolbarArea);
		
		var aAllLi = this.toolbarArea.getElementsByTagName("LI");
		var nCount = aAllLi.length;
		var rxUI = new RegExp(this.sUIClassPrefix+"([^ ]+)");
		for(var i=0; i<nCount; i++){
			if(rxUI.test(aAllLi[i].className)){
				var sUIName = RegExp.$1;
				if(this.htUIList[sUIName] != null) continue;

				this.htUIList[sUIName] = cssquery.getSingle(">*:first-child", aAllLi[i]);
				this.htWrappedUIList[sUIName] = $Element(this.htUIList[sUIName]);
			}
		}
	},
	
	$ON_MSG_APP_READY : function(){
		this.oApp.registerBrowserEvent(this.toolbarArea, "mouseover", "EVENT_TOOLBAR_MOUSEOVER", []);
		this.oApp.registerBrowserEvent(this.toolbarArea, "mouseout", "EVENT_TOOLBAR_MOUSEOUT", []);

		this.oApp.exec("ADD_APP_PROPERTY", ["getToolbarButtonByUIName", $Fn(this.getToolbarButtonByUIName, this).bind()]);
	},

	$ON_EVENT_TOOLBAR_MOUSEOVER : function(weEvent){
		if(weEvent.element.tagName == "BUTTON") $Element(weEvent.element).addClass("hover");
	},

	$ON_EVENT_TOOLBAR_MOUSEOUT : function(weEvent){
		if(weEvent.element.tagName == "BUTTON") $Element(weEvent.element).removeClass("hover");
	},
	
	$ON_TOGGLE_TOOLBAR_ACTIVE_LAYER : function(oLayer, oBtn, sOpenCmd, aOpenArgs, sCloseCmd, aCloseArgs){
		this.oApp.exec("TOGGLE_ACTIVE_LAYER", [oLayer, "MSG_TOOLBAR_LAYER_SHOWN", [oLayer, oBtn, sOpenCmd, aOpenArgs], sCloseCmd, aCloseArgs]);
	},

	$ON_MSG_TOOLBAR_LAYER_SHOWN : function(oLayer, oBtn, aOpenCmd, aOpenArgs){
		this.oApp.exec("POSITION_TOOLBAR_LAYER", [oLayer, oBtn]);
		if(aOpenCmd) this.oApp.exec(aOpenCmd, aOpenArgs);
	},
	
	$ON_SHOW_TOOLBAR_ACTIVE_LAYER : function(oLayer, sCmd, aArgs, oBtn){
		this.oApp.exec("SHOW_ACTIVE_LAYER", [oLayer, sCmd, aArgs]);
		this.oApp.exec("POSITION_TOOLBAR_LAYER", [oLayer, oBtn]);
	},

	$ON_ENABLE_UI : function(sUIName){
		this._enableUI(sUIName);
	},

	$ON_DISABLE_UI : function(sUIName){
		this._disableUI(sUIName);
	},

	$ON_SELECT_UI : function(sUIName){
		var welUI = this.htWrappedUIList[sUIName];
		if(!welUI) return;
		welUI.addClass("active");
	},

	$ON_DESELECT_UI : function(sUIName){
		var welUI = this.htWrappedUIList[sUIName];
		if(!welUI) return;
		welUI.removeClass("active");
	},

	$ON_ENABLE_ALL_UI : function(){
		var sUIName, className;

		for(var sUIName in this.htUIList){
			if(sUIName){
				this._enableUI(sUIName);
			}
//			if(sUIName) this.oApp.exec("ENABLE_UI", [sUIName]);
		}
		$Element(this.toolbarArea).removeClass("off");
	},

	$ON_DISABLE_ALL_UI : function(){
		var sUIName;

		for(var sUIName in this.htUIList){
			if(sUIName){
				this._disableUI(sUIName);
			}
//			if(sUIName) this.oApp.exec("DISABLE_UI", [sUIName]);
		}
		$Element(this.toolbarArea).addClass("off");
		this.oApp.exec("HIDE_ACTIVE_LAYER",[]);
	},
	
	$ON_MSG_STYLE_CHANGED : function(sAttributeName, attributeValue){
		if(attributeValue == 1)
			this.oApp.exec("SELECT_UI", [sAttributeName]);
		else
			this.oApp.exec("DESELECT_UI", [sAttributeName]);
	},
	
	$ON_REGISTER_UI_EVENT : function(sUIName, sEvent, sCmd, aParams){
		// map cmd & ui
		if(!this.aUICmdMap[sUIName]){this.aUICmdMap[sUIName] = [];}
		this.aUICmdMap[sUIName][this.aUICmdMap[sUIName].length] = sCmd;
		var elUI = this.htUIList[sUIName];
		if(!elUI) return;
		this.oApp.registerBrowserEvent(elUI, sEvent, sCmd, aParams);
	},

	$ON_POSITION_TOOLBAR_LAYER : function(oLayer, oBtn){
		oLayer = $(oLayer);
		oBtn = $(oBtn);

		if(!oLayer) return;
		if(oBtn && oBtn.tagName && oBtn.tagName == "BUTTON") oBtn.parentNode.appendChild(oLayer);
		
		oLayer.style.left = "0";
		
		var welLayer = $Element(oLayer);
		var nLayerLeft = welLayer.offset().left;
		nLayerLeft += oLayer.offsetWidth;
		
		var nToolbarLeft = this.welToolbarArea.offset().left;
		nToolbarLeft += this.toolbarArea.offsetWidth;

		if(nLayerLeft > nToolbarLeft) oLayer.style.left = (nToolbarLeft-nLayerLeft-5)+"px";
	},
	
	_enableUI : function(sUIName){
		var welUI = this.htWrappedUIList[sUIName];
		var elUI = this.htUIList[sUIName];
		if(!welUI) return;
		welUI.removeClass("off");
		elUI.disabled = false;

		// enable related commands
		var sCmd = "";
		if(this.aUICmdMap[sUIName]){
			for(var i=0; i<this.aUICmdMap[sUIName].length;i++){
				sCmd = this.aUICmdMap[sUIName][i];
				this.oApp.exec("ENABLE_COMMAND", [sCmd]);
			}
		}
	},
	
	_disableUI : function(sUIName){
		var welUI = this.htWrappedUIList[sUIName];
		var elUI = this.htUIList[sUIName];
		if(!welUI) return;
		welUI.addClass("off");
		welUI.removeClass("hover");
		elUI.disabled = true;

		// disable related commands
		var sCmd = "";
		if(this.aUICmdMap[sUIName]){
			for(var i=0; i<this.aUICmdMap[sUIName].length;i++){
				sCmd = this.aUICmdMap[sUIName][i];
				this.oApp.exec("DISABLE_COMMAND", [sCmd]);
			}
		}
	},
	
	getToolbarButtonByUIName : function(sUIName){
		return this.htUIList[sUIName];
	}
});
//}