//{
/**
 * @fileOverview This file contains Husky plugin that takes care of the operations related to the tool bar UI
 * @name hp_SE2M_Toolbar.js
 */
nhn.husky.SE2M_Toolbar = jindo.$Class({
	name : "SE2M_Toolbar",

	toolbarArea : null,
	toolbarButton : null,
	uiNameTag : "uiName",
	
	// 0: unknown
	// 1: all enabled
	// 2: all disabled
	nUIStatus : 1,
	
	sUIClassPrefix : "husky_seditor_ui_",

	aUICmdMap : null,

	_assignHTMLElements : function(oAppContainer){
		oAppContainer = jindo.$(oAppContainer) || document;
		this.rxUI = new RegExp(this.sUIClassPrefix+"([^ ]+)");

		//@ec[
		this.toolbarArea = jindo.$$.getSingle(".se2_tool", oAppContainer);
		this.aAllUI = jindo.$$("[class*=" + this.sUIClassPrefix + "]", this.toolbarArea);
		//@ec]
		
		this.welToolbarArea = jindo.$Element(this.toolbarArea);		
		for (var i = 0, nCount = this.aAllUI.length; i < nCount; i++) {
			if (this.rxUI.test(this.aAllUI[i].className)) {
				var sUIName = RegExp.$1;
				if(this.htUIList[sUIName] !== undefined){
					continue;
				}
				
				this.htUIList[sUIName] = this.aAllUI[i];
				this.htWrappedUIList[sUIName] = jindo.$Element(this.htUIList[sUIName]);
			}
		}
	},

	$init : function(oAppContainer){
		this.htUIList = {};
		this.htWrappedUIList = {};

		this.aUICmdMap = {};
		this._assignHTMLElements(oAppContainer);
	},

	$ON_MSG_APP_READY : function(){
		this.oApp.registerBrowserEvent(this.toolbarArea, "mouseover", "EVENT_TOOLBAR_MOUSEOVER", []);
		this.oApp.registerBrowserEvent(this.toolbarArea, "mouseout", "EVENT_TOOLBAR_MOUSEOUT", []);
		this.oApp.registerBrowserEvent(this.toolbarArea, "mousedown", "EVENT_TOOLBAR_MOUSEDOWN", []);
		
/*
		var aBtns = jindo.$$("BUTTON", this.toolbarArea);
		for(var i=0; i<aBtns.length; i++){
			this.oApp.registerBrowserEvent(aBtns[i], "focus", "EVENT_TOOLBAR_MOUSEOVER", []);
			this.oApp.registerBrowserEvent(aBtns[i], "blur", "EVENT_TOOLBAR_MOUSEOUT", []);
		}
*/
		this.oApp.exec("ADD_APP_PROPERTY", ["getToolbarButtonByUIName", jindo.$Fn(this.getToolbarButtonByUIName, this).bind()]);
	},

	$ON_TOGGLE_TOOLBAR_ACTIVE_LAYER : function(elLayer, elBtn, sOpenCmd, aOpenArgs, sCloseCmd, aCloseArgs){
		this.oApp.exec("TOGGLE_ACTIVE_LAYER", [elLayer, "MSG_TOOLBAR_LAYER_SHOWN", [elLayer, elBtn, sOpenCmd, aOpenArgs], sCloseCmd, aCloseArgs]);
	},

	$ON_MSG_TOOLBAR_LAYER_SHOWN : function(elLayer, elBtn, aOpenCmd, aOpenArgs){
		this.oApp.exec("POSITION_TOOLBAR_LAYER", [elLayer, elBtn]);
		if(aOpenCmd){
			this.oApp.exec(aOpenCmd, aOpenArgs);
		}
	},
	
	$ON_SHOW_TOOLBAR_ACTIVE_LAYER : function(elLayer, sCmd, aArgs, elBtn){
		this.oApp.exec("SHOW_ACTIVE_LAYER", [elLayer, sCmd, aArgs]);
		this.oApp.exec("POSITION_TOOLBAR_LAYER", [elLayer, elBtn]);
	},

	$ON_ENABLE_UI : function(sUIName){
		this._enableUI(sUIName);
	},

	$ON_DISABLE_UI : function(sUIName){
		this._disableUI(sUIName);
	},

	$ON_SELECT_UI : function(sUIName){
		var welUI = this.htWrappedUIList[sUIName];
		if(!welUI){
			return;
		}
		welUI.removeClass("hover");
		welUI.addClass("active");
	},

	$ON_DESELECT_UI : function(sUIName){
		var welUI = this.htWrappedUIList[sUIName];
		if(!welUI){
			return;
		}
		welUI.removeClass("active");
	},

	$ON_ENABLE_ALL_UI : function(htOptions){
		if(this.nUIStatus === 1){
			return;
		}
	
		var sUIName, className;
		htOptions = htOptions || {};
		var waExceptions = jindo.$A(htOptions.aExceptions || []);

		for(var sUIName in this.htUIList){
			if(sUIName && !waExceptions.has(sUIName)){
				this._enableUI(sUIName);
			}
//			if(sUIName) this.oApp.exec("ENABLE_UI", [sUIName]);
		}
//		jindo.$Element(this.toolbarArea).removeClass("off");

		this.nUIStatus = 1;
	},

	$ON_DISABLE_ALL_UI : function(htOptions){
		if(this.nUIStatus === 2){
			return;
		}
		
		var sUIName;
		htOptions = htOptions || {};
		var waExceptions = jindo.$A(htOptions.aExceptions || []);
		var bLeavlActiveLayer = htOptions.bLeaveActiveLayer || false;

		if(!bLeavlActiveLayer){
			this.oApp.exec("HIDE_ACTIVE_LAYER",[]);
		}

		for(var sUIName in this.htUIList){
			if(sUIName && !waExceptions.has(sUIName)){
				this._disableUI(sUIName);
			}
//			if(sUIName) this.oApp.exec("DISABLE_UI", [sUIName]);
		}
//		jindo.$Element(this.toolbarArea).addClass("off");

		this.nUIStatus = 2;
	},
	
	$ON_MSG_STYLE_CHANGED : function(sAttributeName, attributeValue){
		if(attributeValue === "@^"){
			this.oApp.exec("SELECT_UI", [sAttributeName]);
		}else{
			this.oApp.exec("DESELECT_UI", [sAttributeName]);
		}
	},
	
	$ON_POSITION_TOOLBAR_LAYER : function(elLayer, htOption){
		elLayer = jindo.$(elLayer);
		htOption = htOption || {};
		var elBtn = jindo.$(htOption.elBtn);
		var sAlign = htOption.sAlign;

		var nMargin = -1;
		if(!elLayer){
			return;
		}
		if(elBtn && elBtn.tagName && elBtn.tagName == "BUTTON"){
			elBtn.parentNode.appendChild(elLayer);
		}

		var welLayer = jindo.$Element(elLayer);

		if(sAlign != "right"){
			elLayer.style.left = "0";

			var nLayerLeft = welLayer.offset().left;
			var nLayerRight = nLayerLeft + elLayer.offsetWidth;
			
			var nToolbarLeft = this.welToolbarArea.offset().left;
			var nToolbarRight = nToolbarLeft + this.toolbarArea.offsetWidth;

			if(nLayerRight > nToolbarRight){
				welLayer.css("left", (nToolbarRight-nLayerRight-nMargin)+"px");
			}
			
			if(nLayerLeft < nToolbarLeft){
				welLayer.css("left", (nToolbarLeft-nLayerLeft+nMargin)+"px");
			}
		}else{
			elLayer.style.right = "0";

			var nLayerLeft = welLayer.offset().left;
			var nLayerRight = nLayerLeft + elLayer.offsetWidth;
			
			var nToolbarLeft = this.welToolbarArea.offset().left;
			var nToolbarRight = nToolbarLeft + this.toolbarArea.offsetWidth;

			if(nLayerRight > nToolbarRight){
				welLayer.css("right", -1*(nToolbarRight-nLayerRight-nMargin)+"px");
			}
			
			if(nLayerLeft < nToolbarLeft){
				welLayer.css("right", -1*(nToolbarLeft-nLayerLeft+nMargin)+"px");
			}
		}
	},
	
	$ON_EVENT_TOOLBAR_MOUSEOVER : function(weEvent){
		if(this.nUIStatus === 2){
			return;
		}

		var aAffectedElements = this._getAffectedElements(weEvent.element);
		for(var i=0; i<aAffectedElements.length; i++){
			if(!aAffectedElements[i].hasClass("active")){
				aAffectedElements[i].addClass("hover");
			}
		}
	},
	
	$ON_EVENT_TOOLBAR_MOUSEOUT : function(weEvent){
		if(this.nUIStatus === 2){
			return;
		}
		var aAffectedElements = this._getAffectedElements(weEvent.element);
		for(var i=0; i<aAffectedElements.length; i++){
			aAffectedElements[i].removeClass("hover");
		}
	},

	$ON_EVENT_TOOLBAR_MOUSEDOWN : function(weEvent){
		var elTmp = weEvent.element;
		// Check if the button pressed is in active status and has a visible layer i.e. the button had been clicked and its layer is open already. (buttons like font styles-bold, underline-got no sub layer -> childNodes.length<=2)
		// -> In this case, do not close here(mousedown). The layer will be closed on "click". If we close the layer here, the click event will open it again because it toggles the visibility.
		while(elTmp){
			if(elTmp.className && elTmp.className.match(/active/) && (elTmp.childNodes.length>2 || elTmp.parentNode.className.match(/se2_pair/))){
				return;
			}
			elTmp = elTmp.parentNode;
		}
		this.oApp.exec("HIDE_ACTIVE_LAYER_IF_NOT_CHILD", [weEvent.element]);
	},

	_enableUI : function(sUIName){
		this.nUIStatus = 0;

		var welUI = this.htWrappedUIList[sUIName];
		var elUI = this.htUIList[sUIName];
		if(!welUI){
			return;
		}
		welUI.removeClass("off");
		
		var aAllBtns = elUI.getElementsByTagName("BUTTON");
		for(var i=0, nLen=aAllBtns.length; i<nLen; i++){
			aAllBtns[i].disabled = false;
		}

		// enable related commands
		var sCmd = "";
		if(this.aUICmdMap[sUIName]){
			for(var i=0; i<this.aUICmdMap[sUIName].length;i++){
				sCmd = this.aUICmdMap[sUIName][i];
				this.oApp.exec("ENABLE_MESSAGE", [sCmd]);
			}
		}
	},
	
	_disableUI : function(sUIName){
		this.nUIStatus = 0;
		
		var welUI = this.htWrappedUIList[sUIName];
		var elUI = this.htUIList[sUIName];
		if(!welUI){
			return;
		}
		welUI.addClass("off");
		welUI.removeClass("hover");
		
		var aAllBtns = elUI.getElementsByTagName("BUTTON");
		for(var i=0, nLen=aAllBtns.length; i<nLen; i++){
			aAllBtns[i].disabled = true;
		}

		// disable related commands
		var sCmd = "";
		if(this.aUICmdMap[sUIName]){
			for(var i=0; i<this.aUICmdMap[sUIName].length;i++){
				sCmd = this.aUICmdMap[sUIName][i];
				this.oApp.exec("DISABLE_MESSAGE", [sCmd]);
			}
		}
	},
	
	_getAffectedElements : function(el){
		var elLi, welLi;
		
		// 버튼 클릭시에 return false를 해 주지 않으면 chrome에서 버튼이 포커스 가져가 버림.
		// 에디터 로딩 시에 일괄처리 할 경우 로딩 속도가 느려짐으로 hover시에 하나씩 처리
		if(!el.bSE2_MDCancelled){
			el.bSE2_MDCancelled = true;
			var aBtns = el.getElementsByTagName("BUTTON");
			
			for(var i=0, nLen=aBtns.length; i<nLen; i++){
				aBtns[i].onmousedown = function(){return false};
			}
		}

		if(!el || !el.tagName) return [];

		if((elLi = el).tagName == "BUTTON"){
			// typical button
			// <LI>
			//   <BUTTON>
			if((elLi = elLi.parentNode) && elLi.tagName == "LI" && this.rxUI.test(elLi.className)){
				return [jindo.$Element(elLi)];
			}

			// button pair
			// <LI>
			//   <SPAN>
			//     <BUTTON>
			//   <SPAN>
			//     <BUTTON>
			elLi = el;
			if((elLi = elLi.parentNode.parentNode) && elLi.tagName == "LI" && (welLi = jindo.$Element(elLi)).hasClass("se2_pair")){
				return [welLi, jindo.$Element(el.parentNode)];
			}

			return [];
		}

		// span in a button
		if((elLi = el).tagName == "SPAN"){
			// <LI>
			//   <BUTTON>
			//     <SPAN>
			if((elLi = elLi.parentNode.parentNode) && elLi.tagName == "LI" && this.rxUI.test(elLi.className)){
				return [jindo.$Element(elLi)];
			}

			// <LI>
			//     <SPAN>
			//글감과 글양식
			if((elLi = elLi.parentNode) && elLi.tagName == "LI" && this.rxUI.test(elLi.className)){
				return [jindo.$Element(elLi)];
			}
		}

		return [];
	},
	
	$ON_REGISTER_UI_EVENT : function(sUIName, sEvent, sCmd, aParams){
		//[SMARTEDITORSUS-966][IE8 표준/IE 10] 호환 모드를 제거하고 사진 첨부 시 에디팅 영역의 
		//						커서 주위에 <sub><sup> 태그가 붙어서 글자가 매우 작게 되는 현상
		//원인 : 아래의 [SMARTEDITORSUS-901] 수정 내용에서 윗첨자 아랫첨자 이벤트 등록 시 
		//해당 플러그인이 마크업에 없으면 this.htUIList에 존재하지 않아 getsingle 사용시 사진첨부에 이벤트가 걸렸음
		//해결 : this.htUIList에 존재하지 않으면 이벤트를 등록하지 않음
		if(!this.htUIList[sUIName]){
			return;
		}
		// map cmd & ui
		var elButton;
		if(!this.aUICmdMap[sUIName]){this.aUICmdMap[sUIName] = [];}
		this.aUICmdMap[sUIName][this.aUICmdMap[sUIName].length] = sCmd;
		//[SMARTEDITORSUS-901]플러그인 태그 코드 추가 시 <li>태그와<button>태그 사이에 개행이 있으면 이벤트가 등록되지 않는 현상
		//원인 : IE9, Chrome, FF, Safari 에서는 태그를 개행 시 그 개행을 text node로 인식하여 firstchild가 text 노드가 되어 버튼 이벤트가 할당되지 않음 
		//해결 : firstchild에 이벤트를 거는 것이 아니라, child 중 button 인 것에 이벤트를 걸도록 변경
		elButton = jindo.$$.getSingle('button', this.htUIList[sUIName]);
	
		if(!elButton){return;}
		this.oApp.registerBrowserEvent(elButton, sEvent, sCmd, aParams);
	},

	getToolbarButtonByUIName : function(sUIName){
		return jindo.$$.getSingle("BUTTON", this.htUIList[sUIName]);
	}
});
//}