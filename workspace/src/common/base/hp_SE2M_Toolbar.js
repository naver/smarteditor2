/*
Copyright (C) NAVER corp.  

This library is free software; you can redistribute it and/or  
modify it under the terms of the GNU Lesser General Public  
License as published by the Free Software Foundation; either  
version 2.1 of the License, or (at your option) any later version.  

This library is distributed in the hope that it will be useful,  
but WITHOUT ANY WARRANTY; without even the implied warranty of  
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU  
Lesser General Public License for more details.  

You should have received a copy of the GNU Lesser General Public  
License along with this library; if not, write to the Free Software  
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA  
*/
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
	elFirstToolbarItem : null,

	/**
	 * 얼럿 레이어를 닫을 때 사용할 이벤트 핸들러
	 * @param {Function} fCallback 레이어를 닫을때 실행할 콜백함수
	 * @returns {Boolean} 무조건 false 를 리턴한다. onclick 이벤트에 바로 할당하기 때문에 이벤트 전파를 막기 위해 무조건 false를 리턴
	 */
	_hideAlert : function(fCallback){
		if(typeof fCallback == "function"){
			fCallback();
		}
		this._elAlertLayer.style.display = "none";
		this.oApp.exec("HIDE_EDITING_AREA_COVER");
		return false;
	},

	/**
	 * 시스템 alert/confirm 대신 얼럿 레이어를 띄우기 위한 허스키 메시지
	 * 얼럿 레이어는 UI 기능버튼이 동작하지 않도록 에디터 전체를 투명 커버로 씌우고 
	 * 에디터 전체를 기준으로 중앙에 위치한다. (편집영역은 딤드처리)
	 * 취소콜백함수(fCancelCallback)를 등록여부에 따라 "취소"버튼을 보여줄지 여부를 결정하기 때문에 alert/confirm 두가지 형태의 레이어를 모두 표현해줄 수 있다.
	 * (주의) 
	 * 특정 UI가 동작한 상태에서 띄워질 수 있기 때문에 DISABLE_ALL_UI / ENABLE_ALL_UI 메시지를 수행하지 않는다. 
	 * 또한 같은 이유로 포커스 역시 편집영역으로 자동 포커싱하지 않기 때문에 얼럿 레이어가 닫힌 후 편집영역으로 포커스가 필요한 경우 callback 함수에서 실행되도록 해야한다.
	 *  
	 * @param {String}		sMsgHTML					얼럿 레이어에 보여줄 문구 (HTML형태로 표현가능하다)
	 * @param {HashTable}	htOption					얼럿 레이어 옵션 객체
	 * @param {Function}	htOption.fOkCallback		"확인" 버튼 클릭시 콜백함수
	 * @param {Function}	htOption.fCloseCallback		"X" 버튼 클릭시 콜백함수
	 * @param {Function}	htOption.fCancelCallback	"취소" 버튼 클릭시 콜백함수, 등록되지 않으면 "취소"버튼이 나오지 않는다.
	 */
	$ON_ALERT : function(sMsgHTML, htOption){
		if(this._elAlertLayer){
			htOption = htOption || {};
			this._elAlertTxts.innerHTML = sMsgHTML || "";

			// 각 버튼에 클릭이벤트 핸들러를 달아준다.
			this._elAlertOk.onclick = jindo.$Fn(this._hideAlert, this).bind(htOption.fOkCallback);
			this._elAlertClose.onclick = jindo.$Fn(this._hideAlert, this).bind(htOption.fCloseCallback);
			// 취소 콜백함수가 없는 경우는 버튼을 보여주지 않는다.
			if(htOption.fCancelCallback){
				this._elAlertCancel.onclick = jindo.$Fn(this._hideAlert, this).bind(htOption.fCancelCallback);
				this._elAlertCancel.style.display = "";
			}else{
				this._elAlertCancel.style.display = "none";
			}

			this.oApp.exec("SHOW_EDITING_AREA_COVER", [true]);
			this._elAlertLayer.style.zIndex = 100;
			this._elAlertLayer.style.display = "block";
			this._elAlertOk.focus();
		}
	},

	_assignHTMLElements : function(oAppContainer){
		oAppContainer = jindo.$(oAppContainer) || document;
		this.rxUI = new RegExp(this.sUIClassPrefix+"([^ ]+)");

		this.toolbarArea = jindo.$$.getSingle(".se2_tool", oAppContainer);
		this.aAllUI = jindo.$$("[class*=" + this.sUIClassPrefix + "]", this.toolbarArea);
		this.elTextTool = jindo.$$.getSingle("div.husky_seditor_text_tool", this.toolbarArea);	// [SMARTEDITORSUS-1124] 텍스트 툴바 버튼의 라운드 처리

		// alert 레이어 할당
		this._elAlertLayer = jindo.$$.getSingle(".se2_alert_wrap", oAppContainer);
		if(this._elAlertLayer){
			this._elAlertTxts = jindo.$$.getSingle(".se2_alert_txts", this._elAlertLayer);
			this._elAlertOk = jindo.$$.getSingle(".se2_confirm", this._elAlertLayer);
			this._elAlertCancel = jindo.$$.getSingle(".se2_cancel", this._elAlertLayer);
			this._elAlertClose = jindo.$$.getSingle(".btn_close", this._elAlertLayer);
		}

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
 
		if (jindo.$$.getSingle("DIV.se2_icon_tool") != null) {
			this.elFirstToolbarItem = jindo.$$.getSingle("DIV.se2_icon_tool UL.se2_itool1>li>button");
		}
	},

	_registerNavigateToolbar : function() {
		var aToolItems = jindo.$$(">ul>li[class*=" + this.sUIClassPrefix + "]>button", this.elTextTool);
		var nItemLength = aToolItems.length;

		this.elFirstToolbarItem = this.elFirstToolbarItem || aToolItems[0];
		this.elLastToolbarItem = aToolItems[nItemLength-1];

		this.oApp.registerBrowserEvent(this.toolbarArea, "keydown", "NAVIGATE_TOOLBAR", []);
	},
 
	/**
	 * @param {Element} oAppContainer
	 * @param {Object} htOptions
	 * @param {Array} htOptions.aDisabled 비활성화할 버튼명 배열
	 */
	$init : function(oAppContainer, htOptions){
		this._htOptions = htOptions || {};
		this.htUIList = {};
		this.htWrappedUIList = {};

		this.aUICmdMap = {};
		this._assignHTMLElements(oAppContainer);
	},

	$ON_MSG_APP_READY : function(){
		if(this.oApp.bMobile){
			this.oApp.registerBrowserEvent(this.toolbarArea, "touchstart", "EVENT_TOOLBAR_TOUCHSTART");
		}else{
			this.oApp.registerBrowserEvent(this.toolbarArea, "mouseover", "EVENT_TOOLBAR_MOUSEOVER");
			this.oApp.registerBrowserEvent(this.toolbarArea, "mouseout", "EVENT_TOOLBAR_MOUSEOUT");
		}
		this.oApp.registerBrowserEvent(this.toolbarArea, "mousedown", "EVENT_TOOLBAR_MOUSEDOWN");
		
		this.oApp.exec("ADD_APP_PROPERTY", ["getToolbarButtonByUIName", jindo.$Fn(this.getToolbarButtonByUIName, this).bind()]);
		
		// [SMARTEDITORSUS-1679] 초기 disabled 처리가 필요한 버튼은 비활성화
		if(this._htOptions.aDisabled){
			this._htOptions._sDisabled = "," + this._htOptions.aDisabled.toString() + ",";	// 버튼을 활성화할때 비교하기 위한 문자열구성 
			this.oApp.exec("DISABLE_UI", [this._htOptions.aDisabled]);
		}

		this._registerNavigateToolbar();
	},
	

	$ON_NAVIGATE_TOOLBAR : function(weEvent) {

		var TAB_KEY_CODE = 9;
		//이벤트가 발생한 엘리먼트가 마지막 아이템이고 TAB 키가 눌려졌다면   
		if ((weEvent.element == this.elLastToolbarItem) && (weEvent.key().keyCode == TAB_KEY_CODE) ) {
			

			if (weEvent.key().shift) {
				//do nothing
			} else {
				this.elFirstToolbarItem.focus();
				weEvent.stopDefault();
			}
		}


		//이벤트가 발생한 엘리먼트가 첫번째 아이템이고 TAB 키가 눌려졌다면 		
		if (weEvent.element == this.elFirstToolbarItem && (weEvent.key().keyCode == TAB_KEY_CODE)) {
			if (weEvent.key().shift) {
				weEvent.stopDefault();
				this.elLastToolbarItem.focus();
			}
		}	
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

	/**
	 * [SMARTEDITORSUS-1679] 여러개의 버튼을 동시에 비활성화 할 수 있도록 수정
	 * @param {String|Array} vUIName 비활성화할 버튼명, 배열일 경우 여러개 동시 적용 
	 */
	$ON_DISABLE_UI : function(sUIName){
		if(sUIName instanceof Array){
			for(var i = 0, sName; (sName = sUIName[i]); i++){
				this._disableUI(sName);
			}
		}else{
			this._disableUI(sUIName);
		}
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

	/**
	 * [SMARTEDITORSUS-1646] 툴바버튼 선택상태를 토글링한다.
	 * @param {String} sUIName 토글링할 툴바버튼 이름
	 */
	$ON_TOGGLE_UI_SELECTED : function(sUIName){
		var welUI = this.htWrappedUIList[sUIName];
		if(!welUI){
			return;
		}
		if(welUI.hasClass("active")){
			welUI.removeClass("active");
		}else{
			welUI.removeClass("hover");
			welUI.addClass("active");
		}
	},

	$ON_ENABLE_ALL_UI : function(htOptions){
		if(this.nUIStatus === 1){
			return;
		}
	
		var sUIName;
		htOptions = htOptions || {};
		var waExceptions = jindo.$A(htOptions.aExceptions || []);

		for(sUIName in this.htUIList){
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
			this.oApp.exec("HIDE_ACTIVE_LAYER");
		}

		for(sUIName in this.htUIList){
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
		var nLayerLeft, nLayerRight, nToolbarLeft, nToolbarRight;
	
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

			nLayerLeft = welLayer.offset().left;
			nLayerRight = nLayerLeft + elLayer.offsetWidth;
			
			nToolbarLeft = this.welToolbarArea.offset().left;
			nToolbarRight = nToolbarLeft + this.toolbarArea.offsetWidth;

			if(nLayerRight > nToolbarRight){
				welLayer.css("left", (nToolbarRight-nLayerRight-nMargin)+"px");
			}
			
			if(nLayerLeft < nToolbarLeft){
				welLayer.css("left", (nToolbarLeft-nLayerLeft+nMargin)+"px");
			}
		}else{
			elLayer.style.right = "0";

			nLayerLeft = welLayer.offset().left;
			nLayerRight = nLayerLeft + elLayer.offsetWidth;
			
			nToolbarLeft = this.welToolbarArea.offset().left;
			nToolbarRight = nToolbarLeft + this.toolbarArea.offsetWidth;

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
		// [SMARTEDITORSUS-1679] 초기 disabled 설정된 버튼은 skip
		if(this._htOptions._sDisabled && this._htOptions._sDisabled.indexOf(","+sUIName+",") > -1){
			return;
		}
		var i, nLen;
		
		this.nUIStatus = 0;

		var welUI = this.htWrappedUIList[sUIName];
		var elUI = this.htUIList[sUIName];
		if(!welUI){
			return;
		}
		welUI.removeClass("off");
		
		var aAllBtns = elUI.getElementsByTagName("BUTTON");
		for(i=0, nLen=aAllBtns.length; i<nLen; i++){
			aAllBtns[i].disabled = false;
		}

		// enable related commands
		var sCmd = "";
		if(this.aUICmdMap[sUIName]){
			for(i=0; i<this.aUICmdMap[sUIName].length;i++){
				sCmd = this.aUICmdMap[sUIName][i];
				this.oApp.exec("ENABLE_MESSAGE", [sCmd]);
			}
		}
	},
	
	_disableUI : function(sUIName){
		var i, nLen;
		
		this.nUIStatus = 0;
		
		var welUI = this.htWrappedUIList[sUIName];
		var elUI = this.htUIList[sUIName];
		if(!welUI){
			return;
		}
		welUI.addClass("off");
		welUI.removeClass("hover");
		
		var aAllBtns = elUI.getElementsByTagName("BUTTON");
		for(i=0, nLen=aAllBtns.length; i<nLen; i++){
			aAllBtns[i].disabled = true;
		}

		// disable related commands
		var sCmd = "";
		if(this.aUICmdMap[sUIName]){
			for(i=0; i<this.aUICmdMap[sUIName].length;i++){
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
				aBtns[i].onmousedown = function(){return false;};
			}
		}

		if(!el || !el.tagName){ return []; }

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