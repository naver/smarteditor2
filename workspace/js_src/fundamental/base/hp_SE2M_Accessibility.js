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
 * @fileOverview This file contains Husky plugin that takes care of Accessibility about SmartEditor2.
 * @name hp_SE2M_Accessibility.js
 */
nhn.husky.SE2M_Accessibility = jindo.$Class({
	name : "SE2M_Accessibility",
	
	/*
	 * elAppContainer : mandatory
	 * sLocale, sEditorType : optional
	 */
	$init: function(elAppContainer, sLocale, sEditorType) {
		this._assignHTMLElements(elAppContainer);
		
        if(!!sLocale){
           this.sLang = sLocale;
        }   
            
        if(!!sEditorType){
            this.sType = sEditorType;
        }
	},          

	_assignHTMLElements : function(elAppContainer){
		this.elHelpPopupLayer = jindo.$$.getSingle("DIV.se2_accessibility", elAppContainer);
		this.welHelpPopupLayer = jindo.$Element(this.elHelpPopupLayer);	

		//close buttons
		this.oCloseButton = jindo.$$.getSingle("BUTTON.se2_close", this.elHelpPopupLayer);
		this.oCloseButton2 = jindo.$$.getSingle("BUTTON.se2_close2", this.elHelpPopupLayer);
		
		this.nDefaultTop = 150;
		
		// [SMARTEDITORSUS-1594] 포커스 탐색에 사용하기 위해 할당
		this.elAppContainer = elAppContainer;
		// --[SMARTEDITORSUS-1594]
	},
	
	$ON_MSG_APP_READY : function(){
		this.htAccessOption = nhn.husky.SE2M_Configuration.SE2M_Accessibility || {};
		this.oApp.exec("REGISTER_HOTKEY", ["alt+F10", "FOCUS_TOOLBAR_AREA", []]); 
        this.oApp.exec("REGISTER_HOTKEY", ["alt+COMMA", "FOCUS_BEFORE_ELEMENT", []]);
        this.oApp.exec("REGISTER_HOTKEY", ["alt+PERIOD", "FOCUS_NEXT_ELEMENT", []]);

        if (this.sLang && this.sLang !== 'ko_KR')  {
        	 	//do nothing
                return;
        } else {
                this.oApp.exec("REGISTER_HOTKEY", ["alt+0", "OPEN_HELP_POPUP", []]);  
                
                //[SMARTEDITORSUS-1327] IE 7/8에서 ALT+0으로 팝업 띄우고 esc클릭시 팝업창 닫히게 하려면 아래 부분 꼭 필요함. (target은 document가 되어야 함!)
                this.oApp.exec("REGISTER_HOTKEY", ["esc", "CLOSE_HELP_POPUP", [], document]);  
        }   

		//[SMARTEDITORSUS-1353]
		if (this.htAccessOption.sTitleElementId) {
			this.oApp.registerBrowserEvent(document.getElementById(this.htAccessOption.sTitleElementId), "keydown", "MOVE_TO_EDITAREA", []);
		}
	},
	
	$ON_MOVE_TO_EDITAREA : function(weEvent) {
		var TAB_KEY_CODE = 9;
		if (weEvent.key().keyCode == TAB_KEY_CODE) {
			if(weEvent.key().shift) {return;}
			this.oApp.delayedExec("FOCUS", [], 0);
		}
	},
	
	$LOCAL_BEFORE_FIRST : function(sMsg){
		jindo.$Fn(jindo.$Fn(this.oApp.exec, this.oApp).bind("CLOSE_HELP_POPUP", [this.oCloseButton]), this).attach(this.oCloseButton, "click");
		jindo.$Fn(jindo.$Fn(this.oApp.exec, this.oApp).bind("CLOSE_HELP_POPUP", [this.oCloseButton2]), this).attach(this.oCloseButton2, "click");
	
		//레이어의 이동 범위 설정.
		var elIframe = this.oApp.getWYSIWYGWindow().frameElement;
        this.htOffsetPos = jindo.$Element(elIframe).offset();
        this.nEditorWidth = elIframe.offsetWidth;

        this.htInitialPos = this.welHelpPopupLayer.offset();
        var htScrollXY = this.oApp.oUtils.getScrollXY();

        this.nLayerWidth = 590;   
        this.nLayerHeight = 480;   		

        this.htTopLeftCorner = {x:parseInt(this.htOffsetPos.left, 10), y:parseInt(this.htOffsetPos.top, 10)};
        //[css markup] left:11 top:74로 되어 있음
	},

	/**
	 * [SMARTEDITORSUS-1594]
	 * SE2M_Configuration_General에서 포커스를 이동할 에디터 영역 이후의 엘레먼트를 지정해 두었다면, 설정값을 따른다.
	 * 지정하지 않았거나 빈 String이라면, elAppContainer를 기준으로 자동 탐색한다.
	 * */
	$ON_FOCUS_NEXT_ELEMENT : function() {
		// 포커스 캐싱
		this._currentNextFocusElement = null; // 새로운 포커스 이동이 발생할 때마다 캐싱 초기화
		
		if(this.htAccessOption.sNextElementId){
			this._currentNextFocusElement = document.getElementById(this.htAccessOption.sNextElementId); 
		}else{
			this._currentNextFocusElement = this._findNextFocusElement(this.elAppContainer);
		}
		
		if(this._currentNextFocusElement){
			window.focus(); // [SMARTEDITORSUS-1360] IE7에서는 element에 대한 focus를 주기 위해 선행되어야 한다.
			this._currentNextFocusElement.focus();
		}else if(parent && parent.nhn && parent.nhn.husky && parent.nhn.husky.EZCreator && parent.nhn.husky.EZCreator.elIFrame){
			parent.focus();
			if(this._currentNextFocusElement = this._findNextFocusElement(parent.nhn.husky.EZCreator.elIFrame)){
				this._currentNextFocusElement.focus();
			}
		}
	},

	/**
	 * [SMARTEDITORSUS-1594] DIV#smart_editor2 다음 요소에서 가장 가까운 포커스용 태그를 탐색 
	 * */
	_findNextFocusElement : function(targetElement){
		var target = null;
		
		var el = targetElement.nextSibling;

		while(el){
			if(el.nodeType !== 1){ // Element Node만을 대상으로 한다.
				// 대상 노드 대신 nextSibling을 찾되, 부모를 거슬러 올라갈 수도 있다.
				// document.body까지 거슬러 올라가게 되면 탐색 종료
				el = this._switchToSiblingOrNothing(el);
				if(!el){
					break;
				}else{
					continue;
				}
			}
			
			// 대상 노드를 기준으로, 전위순회로 조건에 부합하는 노드 탐색
			this._recursivePreorderTraversalFilter(el, this._isFocusTag);	
			
			if(this._nextFocusElement){
				target = this._nextFocusElement;
				
				// 탐색에 사용했던 변수 초기화
				this._bStopFindingNextElement = false;
				this._nextFocusElement = null;
				
				break;
			}else{
				// 대상 노드 대신 nextSibling을 찾되, 부모를 거슬러 올라갈 수도 있다.
				// document.body까지 거슬러 올라가게 되면 탐색 종료
				el = this._switchToSiblingOrNothing(el);
				if(!el){
					break;
				}
			}
		}
	
		// target이 존재하지 않으면 null 반환
		return target;
	},
	
	/**
	 * [SMARTEDITORSUS-1594] 대상 노드를 기준으로 하여, nextSibling 또는 previousSibling을 찾는다.
	 * nextSibling 또는 previousSibling이 없다면,
	 * 부모를 거슬러 올라가면서 첫 nextSibling 또는 previousSibling을 찾는다.
	 * document의 body까지 올라가도 nextSibling 또는 previousSibling이 나타나지 않는다면
	 * 탐색 대상으로 null을 반환한다.
	 * @param {NodeElement} 대상 노드 (주의:NodeElement에 대한 null 체크 안함)
	 * @param {Boolean} 생략하거나 false이면 nextSibling을 찾고, true이면 previousSibling을 찾는다. 
	 * */
	_switchToSiblingOrNothing : function(targetElement, isPreviousOrdered){
		var el = targetElement;
		
		if(isPreviousOrdered){
			if(el.previousSibling){
				el = el.previousSibling;
			}else{
				// 형제가 없다면 부모를 거슬러 올라가면서 탐색
				
				// 이 루프의 종료 조건
				// 1. 부모를 거슬러 올라가다가 el이 document.body가 되는 시점
				// - 더 이상 previousSibling을 탐색할 수 없음
				// 2. el이 부모로 대체된 뒤 previousSibling이 존재하는 경우
				while(el.nodeName.toUpperCase() != "BODY" && !el.previousSibling){
					el = el.parentNode;
				}

				if(el.nodeName.toUpperCase() == "BODY"){
					el = null;
				}else{
					el = el.previousSibling;
				}
			}
		}else{
			if(el.nextSibling){
				el = el.nextSibling;
			}else{
				// 형제가 없다면 부모를 거슬러 올라가면서 탐색
				
				// 이 루프의 종료 조건
				// 1. 부모를 거슬러 올라가다가 el이 document.body가 되는 시점
				// - 더 이상 nextSibling을 탐색할 수 없음
				// 2. el이 부모로 대체된 뒤 nextSibling이 존재하는 경우
				while(el.nodeName.toUpperCase() != "BODY" && !el.nextSibling){
					el = el.parentNode;
				}

				if(el.nodeName.toUpperCase() == "BODY"){
					el = null;
				}else{
					el = el.nextSibling;
				}
			}
		}
		
		return el;
	},
	
	/**
	 * [SMARTEDITORSUS-1594] 대상 노드를 기준으로 하는 트리를 전위순회를 거쳐, 필터 조건에 부합하는 첫 노드를 찾는다.
	 * @param {NodeElement} 탐색하려는 트리의 루트 노드
	 * @param {Function} 필터 조건으로 사용할 함수
	 * @param {Boolean} 생략하거나 false이면 순수 전위순회(루트 - 좌측 - 우측 순)로 탐색하고, true이면 반대 방향의 전위순회(루트 - 우측 - 좌측)로 탐색한다.
	 * */
	_recursivePreorderTraversalFilter : function(node, filterFunction, isReversed){
		var self = this;
		
		// 현재 노드를 기준으로 필터링
		var _bStopFindingNextElement = filterFunction.apply(node);
		
		if(_bStopFindingNextElement){
			// 최초로 포커스 태그를 찾는다면 탐색 중단용 flag 변경
			self._bStopFindingNextElement = true;
			
			if(isReversed){
				self._previousFocusElement = node;
			}else{
				self._nextFocusElement = node;
			}

			return;
		}else{
			// 필터링 조건에 부합하지 않는다면, 자식들을 기준으로 반복하게 된다.
			if(isReversed){
				for(var len = node.childNodes.length, i = len - 1; i >= 0; i--){
					self._recursivePreorderTraversalFilter(node.childNodes[i], filterFunction, true);
					if(!!this._bStopFindingNextElement){
						break;
					}
				}
			}else{
				for(var i=0, len = node.childNodes.length; i < len; i++){
					self._recursivePreorderTraversalFilter(node.childNodes[i], filterFunction);
					if(!!this._bStopFindingNextElement){
						break;
					}
				}
			}
		}
	},
	
	/**
	 * [SMARTEDITORSUS-1594] 필터 함수로, 이 노드가 tab 키로 포커스를 이동하는 태그에 해당하는지 확인한다.
	 * */
	_isFocusTag : function(){
		var self = this;
		
		// tab 키로 포커스를 잡아주는 태그 목록
		var aFocusTagViaTabKey = ["A", "BUTTON", "INPUT", "TEXTAREA"];
		
		// 포커스 태그가 현재 노드에 존재하는지 확인하기 위한 flag
		var bFocusTagExists = false;
		
		for(var i = 0, len = aFocusTagViaTabKey.length; i < len; i++){
			if(self.nodeType === 1 && self.nodeName && self.nodeName.toUpperCase() == aFocusTagViaTabKey[i] && !self.disabled && jindo.$Element(self).visible()){
				bFocusTagExists = true;
				break;
			}
		}
		
		return bFocusTagExists;
	},
	
	/**
	 * [SMARTEDITORSUS-1594]
	 * SE2M_Configuration_General에서 포커스를 이동할 에디터 영역 이전의 엘레먼트를 지정해 두었다면, 설정값을 따른다.
	 * 지정하지 않았거나 빈 String이라면, elAppContainer를 기준으로 자동 탐색한다.
	 * */
	$ON_FOCUS_BEFORE_ELEMENT : function() {
		// 포커스 캐싱
		this._currentPreviousFocusElement = null; // 새로운 포커스 이동이 발생할 때마다 캐싱 초기화
		
		if(this.htAccessOption.sBeforeElementId){
			this._currentPreviousFocusElement = document.getElementById(this.htAccessOption.sBeforeElementId);
		}else{
			this._currentPreviousFocusElement = this._findPreviousFocusElement(this.elAppContainer); // 삽입될 대상
		}
		
		if(this._currentPreviousFocusElement){
			window.focus(); // [SMARTEDITORSUS-1360] IE7에서는 element에 대한 focus를 주기 위해 선행되어야 한다.
			this._currentPreviousFocusElement.focus();
		}else if(parent && parent.nhn && parent.nhn.husky && parent.nhn.husky.EZCreator && parent.nhn.husky.EZCreator.elIFrame){
			parent.focus();
			if(this._currentPreviousFocusElement = this._findPreviousFocusElement(parent.nhn.husky.EZCreator.elIFrame)){
				this._currentPreviousFocusElement.focus();
			}
		}
	},
	
	/**
	 * [SMARTEDITORSUS-1594] DIV#smart_editor2 이전 요소에서 가장 가까운 포커스용 태그를 탐색
	 * */
	_findPreviousFocusElement : function(targetElement){
		var target = null;
		
		var el = targetElement.previousSibling;
		
		while(el){
			if(el.nodeType !== 1){  // Element Node만을 대상으로 한다. 
				// 대상 노드 대신 previousSibling을 찾되, 부모를 거슬러 올라갈 수도 있다.
				// document.body까지 거슬러 올라가게 되면 탐색 종료
				el = this._switchToSiblingOrNothing(el, /*isReversed*/true);
				if(!el){
					break;
				}else{
					continue;
				}
			}
			
			// 대상 노드를 기준으로, 역 전위순회로 조건에 부합하는 노드 탐색
			this._recursivePreorderTraversalFilter(el, this._isFocusTag, true);
			
			if(this._previousFocusElement){
				target = this._previousFocusElement;
				
				// 탐색에 사용했던 변수 초기화
				this._bStopFindingNextElement = false;
				this._previousFocusElement = null;
				
				break;
			}else{
				// 대상 노드 대신 previousSibling을 찾되, 부모를 거슬러 올라갈 수도 있다.
				// document.body까지 거슬러 올라가게 되면 탐색 종료
				el = this._switchToSiblingOrNothing(el, /*isReversed*/true);
				if(!el){
					break;
				}
			}
		}
		
		// target이 존재하지 않으면 null 반환
		return target;
	},
	
	$ON_FOCUS_TOOLBAR_AREA : function(){
		this.oButton = jindo.$$.getSingle("BUTTON.se2_font_family", this.elAppContainer);
		if(this.oButton && !this.oButton.disabled){	// [SMARTEDITORSUS-1369] IE9이하에서 disabled 요소에 포커스를 주면 오류 발생
			window.focus();
			this.oButton.focus();
		}
	},
	
	$ON_OPEN_HELP_POPUP : function() {
        this.oApp.exec("DISABLE_ALL_UI", [{aExceptions: ["se2_accessibility"]}]);
        this.oApp.exec("SHOW_EDITING_AREA_COVER");
        this.oApp.exec("SELECT_UI", ["se2_accessibility"]);

        //아래 코드 없어야 블로그에서도 동일한 위치에 팝업 뜸..
        //this.elHelpPopupLayer.style.top = this.nDefaultTop+"px";
        
        this.nCalcX = this.htTopLeftCorner.x + this.oApp.getEditingAreaWidth() - this.nLayerWidth;
        this.nCalcY = this.htTopLeftCorner.y - 30;	// 블로그버전이 아닌 경우 에디터영역을 벗어나는 문제가 있기 때문에 기본툴바(30px) 크기만큼 올려줌 

        this.oApp.exec("SHOW_DIALOG_LAYER", [this.elHelpPopupLayer, {
                elHandle: this.elTitle,
                nMinX : this.htTopLeftCorner.x + 0,
                nMinY : this.nDefaultTop + 77,
                nMaxX : this.nCalcX,
                nMaxY : this.nCalcY
        }]);
	
        // offset (nTop:Numeric,  nLeft:Numeric)
        this.welHelpPopupLayer.offset(this.nCalcY, (this.nCalcX)/2); 
       
        //[SMARTEDITORSUS-1327] IE에서 포커스 이슈로 IE에 대해서만 window.focus실행함. 
        if(jindo.$Agent().navigator().ie) {
        	window.focus();
        }
        
		var self = this;
		setTimeout(function(){
			try{
				self.oCloseButton2.focus();
			}catch(e){
			}
		},200);
	},
	
	$ON_CLOSE_HELP_POPUP : function() {
		this.oApp.exec("ENABLE_ALL_UI");		// 모든 UI 활성화.
		this.oApp.exec("DESELECT_UI", ["helpPopup"]);  
		this.oApp.exec("HIDE_ALL_DIALOG_LAYER", []);
		this.oApp.exec("HIDE_EDITING_AREA_COVER");		// 편집 영역 활성화.
		
		this.oApp.exec("FOCUS");
	}
});
//}
