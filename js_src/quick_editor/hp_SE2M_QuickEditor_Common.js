/**
 * @name SE2M_QuickEditor_Common
 * @class
 * @description Quick Editor Common function Class
 * @author NHN AjaxUI Lab - mixed 
 * @version 1.0
 * @since 2009.09.29
 * */
nhn.husky.SE2M_QuickEditor_Common = jindo.$Class({
	/**
	 * class 이름
	 * @type {String}
	 */
	name : "SE2M_QuickEditor_Common",
	/**
	 * 환경 정보.
	 * @type {Object}
	 */
	_environmentData : "",
	/**
	 * 현재 타입 (table|img)
	 * @type {String}
	 */
	_currentType :"",
	/**
	 * 이벤트가 레이어 안에서 호출되었는지 알기 위한 변수
	 * @type {Boolean}
	 */
	_in_event : false,
	/**
	 * Ajax처리를 하지 않음
	 * @type {Boolean}
	 */
	_bUseFlashModule : true,
	
	/**
	 * 공통 서버에서 개인 설정 받아오는 AjaxUrl 
	 * @See SE2M_Configuration.js
	 */
	_sBaseAjaxUrl : "",
	_sAddTextAjaxUrl : "",
	
	/**
	 * 초기 인스턴스 생성 실행되는 함수.
	 */
	$init : function() {
		this.waHotkeys = new jindo.$A();
		this.waHotkeyLayers = new jindo.$A();
	},
	
	$ON_MSG_APP_READY : function() {
		var htConfiguration = nhn.husky.SE2M_Configuration.QuickEditor;
		
		if(htConfiguration){
			this._bUseFlashModule = (!!htConfiguration.common && typeof htConfiguration.common.bUseFlashModule !== "undefined") ? htConfiguration.common.bUseFlashModule : true;	
		}

    	if(!this._bUseFlashModule || !jindo.$Ajax.SWFRequest.activeFlash){	
    		// AUSE-970  Flash 모듈을 브라우저에서 block할 경우 대처
			this.setData("{table:'full',img:'full',review:'full'}");
		} else {
			this._sBaseAjaxUrl = htConfiguration.common.sBaseAjaxUrl;
			this._sAddTextAjaxUrl = htConfiguration.common.sAddTextAjaxUrl;
		
			this.getData();
		}
	},
	
	//삭제 시에 qe layer close
	$ON_EVENT_EDITING_AREA_KEYDOWN : function(oEvent){
		var oKeyInfo = oEvent.key();
		//Backspace : 8, Delete :46
		if (oKeyInfo.keyCode == 8 || oKeyInfo.keyCode == 46 ) {
			this.oApp.exec("CLOSE_QE_LAYER", [oEvent]);
		}
	},
	
	getData : function() {
		var self = this;
		jindo.$Ajax(self._sBaseAjaxUrl, {
			type : "flash",
			timeout : 1,
			sendheader : false,
			onload: function(rp) {
				var result = rp.json().result;
				if (!!result && !!result.length) {
					self.setData(result[result.length - 1]);
				} else {
					self.setData("{table:'full',img:'full',review:'full'}");
				}
			},
			
			onerror : function() {
				self.setData("{table:'full',img:'full',review:'full'}");
			},
			
			ontimeout : function() {
				self.setData("{table:'full',img:'full',review:'full'}");
			}	
		}).request({ text_key : "qeditor_fold" });
	},
	
	setData : function(sResult){
		var oResult = {
			table : "full",
			img : "full",
			review : "full"
		};
		
		if(sResult){
			oResult = eval("("+sResult+")");	
		}
		
		this._environmentData = {
			table : {
				isOpen   : false,
				type     : oResult["table"],//full,fold,
				isFixed  : false,
				position : []
			},
			img : {
				isOpen   : false,
				type     : oResult["img"],//full,fold
				isFixed  : false
			},
			review : {
				isOpen   : false,
				type     : oResult["review"],//full,fold
				isFixed  : false,
				position : []
			}
		};
		
		
		this.waTableTagNames =jindo.$A(["table","tbody","td","tfoot","th","thead","tr"]);
	},
	
	/**
	 * 위지윅 영역에 단축키가 등록될 때, 
	 * tab 과 shift+tab (들여쓰기 / 내어쓰기 ) 를 제외한 단축키 리스트를 저장한다.
	 */
	$ON_REGISTER_HOTKEY : function(sHotkey, sCMD, aArgs){
		if(sHotkey != "tab" && sHotkey != "shift+tab"){
			this.waHotkeys.push([sHotkey, sCMD, aArgs]);
		}
	},
	
	//@lazyload_js OPEN_QE_LAYER[
	$ON_MSG_BEFOREUNLOAD_FIRED : function(){
		if (!this._environmentData || !this._bUseFlashModule || !jindo.$Ajax.SWFRequest.activeFlash) {
			return;
		}
		
		jindo.$Ajax(this._sAddTextAjaxUrl,{
			type : "jsonp",
			onload: function(){}
		}).request({
			text_key :"qeditor_fold",
			text_data : "{table:'"+this._environmentData["table"]["type"]+"',img:'"+this._environmentData["img"]["type"]+"',review:'"+this._environmentData["review"]["type"]+"'}" 
		});
	},
	/**
	 * openType을 저장하는 함수.
	 * @param {String} sType
	 * @param {Boolean} bBol
	 */
	setOpenType : function(sType,bBol){
		this._environmentData[sType].isOpen = bBol;
	},
	/**
	 * 레이어가 오픈 할 때 실행되는 이벤트.
	 * 레이어가 처음 뜰 때,
	 * 		저장된 단축키 리스트를 레이어에 등록하고 (레이어가 떠 있을때도 단축키가 먹도록 하기 위해)
	 * 		레이어에 대한 키보드/마우스 이벤트를 등록한다.
	 * @param {Element} oEle
	 * @param {Element} oLayer
	 * @param {String} sType(img|table|review)
	 */
	$ON_OPEN_QE_LAYER : function(oEle,oLayer,sType){
		if(this.waHotkeys.length() > 0 && !this.waHotkeyLayers.has(oLayer)){
			this.waHotkeyLayers.push(oLayer);
			
			var aParam;
			for(var i=0, nLen=this.waHotkeys.length(); i<nLen; i++){
				aParam = this.waHotkeys.get(i);
				this.oApp.exec("ADD_HOTKEY", [aParam[0], aParam[1], aParam[2], oLayer]);
			}
		}
		
		var  type = sType;//?sType:"table";//this.get_type(oEle);
		if(type){
			this.targetEle = oEle;
			this.currentEle = oLayer;
			this.layer_show(type,oEle);	
		}
	},
	/**
	 * 레이어가 닫혔을때 실행되는 이벤트.
	 * @param {jindo.$Event} weEvent
	 */
	$ON_CLOSE_QE_LAYER : function(weEvent){
		if(!this.currentEle){return;} 
//		this.oApp.exec("HIDE_EDITING_AREA_COVER");
//		this.oApp.exec("ENABLE_ALL_UI");
		this.oApp.exec("CLOSE_SUB_LAYER_QE");

		this.layer_hide(weEvent);
	},
		
	/**
	 * 어플리케이션이 준비단계일때 실행되는 이벤트
	 */
	$LOCAL_BEFORE_FIRST : function(sMsg) {
		if (!sMsg.match(/OPEN_QE_LAYER/)) { // (sMsg == "$ON_CLOSE_QE_LAYER" && !this.currentEle)
			this.oApp.acceptLocalBeforeFirstAgain(this, true);
			if(sMsg.match(/REGISTER_HOTKEY/)){
				return true;
			}
			
			return false;
		}
		
		this.woEditor = jindo.$Element(this.oApp.elEditingAreaContainer);
		this.woStandard = jindo.$Element(this.oApp.htOptions.elAppContainer).offset();
		this._qe_wrap = jindo.$$.getSingle("DIV.quick_wrap", this.oApp.htOptions.elAppContainer);
		
		var that = this;
		
		new jindo.DragArea(this._qe_wrap, {
			sClassName : 'q_dragable',   
			bFlowOut : false,
			nThreshold : 1
		}).attach({
			beforeDrag : function(oCustomEvent) {
				oCustomEvent.elFlowOut = oCustomEvent.elArea.parentNode;
			},
			dragStart: function(oCustomEvent){
				if(!jindo.$Element(oCustomEvent.elDrag).hasClass('se2_qmax')){
					oCustomEvent.elDrag = oCustomEvent.elDrag.parentNode;
				}
				that.oApp.exec("SHOW_EDITING_AREA_COVER");
			},
			dragEnd : function(oCustomEvent){
				that.changeFixedMode();
				that._in_event = false;
				//if(that._currentType=="review"||that._currentType=="table"){	// [SMARTEDITORSUS-153] 이미지 퀵 에디터도 같은 로직으로 처리하도록 수정
					var richEle = jindo.$Element(oCustomEvent.elDrag);
					that._environmentData[that._currentType].position = [richEle.css("top"),richEle.css("left")];
				//}
				that.oApp.exec("HIDE_EDITING_AREA_COVER");
			}
		});
		
		var imgFn = jindo.$Fn(this.toggle,this).bind("img");
		var tableFn = jindo.$Fn(this.toggle,this).bind("table");
		
		jindo.$Fn(imgFn,this).attach(jindo.$$.getSingle(".q_open_img_fold", this.oApp.htOptions.elAppContainer),"click");
		jindo.$Fn(imgFn,this).attach(jindo.$$.getSingle(".q_open_img_full", this.oApp.htOptions.elAppContainer),"click");
		
		jindo.$Fn(tableFn,this).attach(jindo.$$.getSingle(".q_open_table_fold", this.oApp.htOptions.elAppContainer),"click");
		jindo.$Fn(tableFn,this).attach(jindo.$$.getSingle(".q_open_table_full", this.oApp.htOptions.elAppContainer),"click");  
	},
	/**
	 * 레이어의 최대화/최소화를 토글링 하는 함수.
	 * @param {String} sType(table|img)
	 * @param {jindo.$Event} weEvent
	 */
	toggle : function(sType,weEvent){
		sType = this._currentType;
//		var oBefore = jindo.$Element(jindo.$$.getSingle("._"+this._environmentData[sType].type,this.currentEle));
//		var beforeX = oBefore.css("left");
//		var beforeY = oBefore.css("top");
		
		this.oApp.exec("CLOSE_QE_LAYER", [weEvent]);
		
		if(this._environmentData[sType].type=="full"){
			this._environmentData[sType].type = "fold";
		}else{
			this._environmentData[sType].type = "full";
		}
		
//		this.positionCopy(beforeX,beforeY,this._environmentData[sType].type);
				
		this.oApp.exec("OPEN_QE_LAYER", [this.targetEle,this.currentEle,sType]);
		this._in_event = false;
		weEvent.stop(jindo.$Event.CANCEL_DEFAULT);
	},
	/**
	 * 토글링시 전에 엘리먼트에 위치를 카피하는 함수.
	 * @param {Number} beforeX
	 * @param {Number} beforeY
	 * @param {Element} sAfterEle
	 */
	positionCopy:function(beforeX, beforeY, sAfterEle){
		jindo.$Element(jindo.$$.getSingle("._"+sAfterEle,this.currentEle)).css({
			top : beforeY,
			left : beforeX
		});
	},
	/**
	 * 레이어를 고정으로 할때 실행되는 함수.
	 */
	changeFixedMode : function(){
		this._environmentData[this._currentType].isFixed = true;
	},
	/**
	 * 에디팅 영역에서 keyup할때 실행되는 함수.
	 * @param {jindo.$Event} weEvent
	 */
/*
	$ON_EVENT_EDITING_AREA_KEYUP:function(weEvent){
		if(this._currentType&&(!this._in_event)&&this._environmentData[this._currentType].isOpen){
			this.oApp.exec("CLOSE_QE_LAYER", [weEvent]);
		}
		this._in_event = false;
	},
*/
	$ON_HIDE_ACTIVE_LAYER : function(){
		this.oApp.exec("CLOSE_QE_LAYER");
	},

	/**
	 * 에디팅 영역에서 mousedown할때 실행되는 함수.
	 * @param {jindo.$Event} weEvent
	 */
	$ON_EVENT_EDITING_AREA_MOUSEDOWN:function(weEvent){
		if(this._currentType&&(!this._in_event)&&this._environmentData[this._currentType].isOpen){
			this.oApp.exec("CLOSE_QE_LAYER", [weEvent]);
		}
		this._in_event = false;
	},
	/**
	 * 에디팅 영역에서 mousewheel할때 실행되는 함수.
	 * @param {jindo.$Event} weEvent
	 */
	$ON_EVENT_EDITING_AREA_MOUSEWHEEL:function(weEvent){
		if(this._currentType&&(!this._in_event)&&this._environmentData[this._currentType].isOpen){
			this.oApp.exec("CLOSE_QE_LAYER", [weEvent]);
		}
		this._in_event = false;
	},
	/**
	 * 레이어를 띄우는데 레이어가 table(템플릿),img인지를 확인하여 id를 반환하는 함수.
	 * @param {Element} oEle
	 * @return {String} layer id
	 */
	get_type : function(oEle){
		var tagName = oEle.tagName.toLowerCase();
		
		if(this.waTableTagNames.has(tagName)){
			return "table";
		}else if(tagName=="img"){
			return "img";
		}
	},
	/**
	 * 퀵에디터에서 keyup시 실행되는 이벤트
	 */
	$ON_QE_IN_KEYUP : function(){
		this._in_event = true;
	},
	/**
	 * 퀵에디터에서 mousedown시 실행되는 이벤트
	 */
	$ON_QE_IN_MOUSEDOWN : function(){
		this._in_event = true;
	},
	/**
	 * 퀵에디터에서 mousewheel시 실행되는 이벤트
	 */
	$ON_QE_IN_MOUSEWHEEL : function(){
		this._in_event = true;
	},
	/**
	 * 레이어를 숨기는 함수.
	 * @param {jindo.$Event} weEvent
	 */
	layer_hide : function(weEvent){
		this.setOpenType(this._currentType,false);
		
		jindo.$Element(jindo.$$.getSingle("._"+this._environmentData[this._currentType].type,this.currentEle)).hide();
	},
	/**
	 * 늦게 이벤트 바인딩 하는 함수.
	 * 레이어가 처음 뜰 때 이벤트를 등록한다.
	 */
	lazy_common : function(){
		this.oApp.registerBrowserEvent(jindo.$(this._qe_wrap), "keyup", "QE_IN_KEYUP");
		this.oApp.registerBrowserEvent(jindo.$(this._qe_wrap), "mousedown", "QE_IN_MOUSEDOWN");
		this.oApp.registerBrowserEvent(jindo.$(this._qe_wrap), "mousewheel", "QE_IN_MOUSEWHEEL");
		this.lazy_common = function(){};
	},
	/**
	 * 레이어를 보여주는 함수.
	 * @param {String} sType
	 * @param {Element} oEle
	 */
	layer_show : function(sType,oEle){
		this._currentType = sType;
		this.setOpenType(this._currentType,true);
		var  layer = jindo.$$.getSingle("._"+this._environmentData[this._currentType].type,this.currentEle);
		jindo.$Element(layer)
			.show()
			.css( this.get_position_layer(oEle , layer) );
			
			
		this.lazy_common();
	},
	/**
	 * 레이어의 위치를 반환 하는 함수
	 *		고정 상태가 아니거나 최소화 상태이면 엘리먼트 위치에 퀵에디터를 띄우고
	 *		고정 상태이고 최대화 상태이면 표나 글 양식은 저장된 위치에 띄워주고, 이미지는...?
	 * @param {Element} oEle
	 * @param {Element} oLayer
	 */
	get_position_layer : function(oEle , oLayer){
		if(!this.isCurrentFixed() || this._environmentData[this._currentType].type == "fold"){
			return this.calculateLayer(oEle , oLayer);
		}
		
		//if(this._currentType == "review" || this._currentType == "table"){	// [SMARTEDITORSUS-153] 이미지 퀵 에디터도 같은 로직으로 처리하도록 수정
			var position = this._environmentData[this._currentType].position;
			var nTop = parseInt(position[0], 10);
			var nAppHeight = this.getAppPosition().h;
			var nLayerHeight = jindo.$Element(oLayer).height();
		
			// [SMARTEDITORSUS-129] 편집 영역 높이를 줄였을 때 퀵에디터가 영역을 벗어나지 않도록 처리
			if((nTop + nLayerHeight + this.nYGap) > nAppHeight){
				nTop = nAppHeight - nLayerHeight;
				this._environmentData[this._currentType].position[0] = nTop;
			}
			
			return {
				top : nTop + "px",
				left :position[1]
			};	
		//}
		//return this.calculateLayer(null , oLayer);
	},
	/**
	 * 현재 레이어가 고정형태인지 반환하는 함수.
	 */
	isCurrentFixed : function(){
		return this._environmentData[this._currentType].isFixed;
	},
	/**
	 * 레이어를 띄울 위치를 계산하는 함수.
	 * @param {Element} oEle
	 * @param {Element} oLayer
	 */
	calculateLayer : function(oEle, oLayer){
		/*
		 * 기준을 한군데로 만들어야 함.
		 * 1. 에디터는 페이지
		 * 2. 엘리먼트는 안에 에디팅 영역
		 * 3. 레이어는 에디팅 영역
		 * 
		 * 기준은 페이지로 함.
		 */
		var positionInfo = this.getPositionInfo(oEle, oLayer);
		
		return {
			top  : positionInfo.y + "px",
			left : positionInfo.x + "px"
		};
	},
	/**
	 * 위치를 반환 하는 함수.
	 * @param {Element} oEle
	 * @param {Element} oLayer
	 */
	getPositionInfo : function(oEle, oLayer){
		this.nYGap = jindo.$Agent().navigator().ie? -16 : -18;
		this.nXGap = 1;
		
		var oRevisePosition = {};

		var eleInfo = this.getElementPosition(oEle, oLayer);
		var appInfo = this.getAppPosition();
		var layerInfo = {
			w : jindo.$Element(oLayer).width(),
			h : jindo.$Element(oLayer).height()
		};

		if((eleInfo.x + layerInfo.w + this.nXGap) > appInfo.w){
			oRevisePosition.x = appInfo.w - layerInfo.w ; 
		}else{
			oRevisePosition.x = eleInfo.x + this.nXGap;
		}
		
		if((eleInfo.y + layerInfo.h + this.nYGap) > appInfo.h){
			oRevisePosition.y = appInfo.h - layerInfo.h - 2;
		}else{
			oRevisePosition.y = eleInfo.y + this.nYGap;
		}
		
		return {
			x : oRevisePosition.x ,
			y : oRevisePosition.y 
		};
	},
	/**
	 * 기준 엘리먼트의 위치를 반환하는 함수
	 *		엘리먼트가 있는 경우
	 * @param {Element} eEle
	 */
	getElementPosition : function(eEle, oLayer){
		var wEle, oOffset, nEleWidth, nEleHeight, nScrollX, nScrollY;
		
		if(eEle){
			wEle = jindo.$Element(eEle);
			oOffset = wEle.offset();
			nEleWidth = wEle.width();
			nEleHeight = wEle.height();
		}else{
			oOffset = {
				top : parseInt(oLayer.style.top) - this.nYGap,
				left : parseInt(oLayer.style.left) - this.nXGap
			};
			nEleWidth = 0;
			nEleHeight = 0;
		}

		var oAppWindow = this.oApp.getWYSIWYGWindow();
		
		if(typeof oAppWindow.scrollX == "undefined"){
			nScrollX = oAppWindow.document.documentElement.scrollLeft;
			nScrollY = oAppWindow.document.documentElement.scrollTop;
		}else{
			nScrollX = oAppWindow.scrollX;
			nScrollY = oAppWindow.scrollY;
		}

		var oEditotOffset = this.woEditor.offset();
		return {
			x : oOffset.left - nScrollX + nEleWidth,
			y : oOffset.top  - nScrollY + nEleHeight
		};
	},
	/**
	 * 에디터의 크기 계산하는 함수.
	 */
	getAppPosition : function(){
		return {
			w : this.woEditor.width(),
			h : this.woEditor.height() 
		};
	}
	//@lazyload_js]
});