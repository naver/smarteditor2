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
	_bUseConfig : false,
	
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
		this.waHotkeys = new jindo.$A([]);
		this.waHotkeyLayers = new jindo.$A([]);
	},
	
	$ON_MSG_APP_READY : function() {
		var htConfiguration = nhn.husky.SE2M_Configuration.QuickEditor;

		if(htConfiguration){
			this._bUseConfig = (!!htConfiguration.common && typeof htConfiguration.common.bUseConfig !== "undefined") ? htConfiguration.common.bUseConfig : true;	
		}

    	if(!this._bUseConfig){	
			this.setData("{table:'full',img:'full',review:'full'}");
		} else {
			this._sBaseAjaxUrl = htConfiguration.common.sBaseAjaxUrl;
			this._sAddTextAjaxUrl = htConfiguration.common.sAddTextAjaxUrl;
		
			this.getData();
		}
    	this.oApp.registerLazyMessage(["OPEN_QE_LAYER"], ["hp_SE2M_QuickEditor_Common$Lazy.js"]);
	},
	
	//삭제 시에 qe layer close
	$ON_EVENT_EDITING_AREA_KEYDOWN : function(oEvent){
		var oKeyInfo = oEvent.key();
		//Backspace : 8, Delete :46
		if (oKeyInfo.keyCode == 8 || oKeyInfo.keyCode == 46 ) {
			// [SMARTEDITORSUS-1213][IE9, 10] 사진 삭제 후 zindex 1000인 div가 잔존하는데, 그 위로 썸네일 drag를 시도하다 보니 drop이 불가능.
			var htBrowser = jindo.$Agent().navigator();
			if(htBrowser.ie && htBrowser.nativeVersion > 8){ 
				var elFirstChild = jindo.$$.getSingle("DIV.husky_seditor_editing_area_container").childNodes[0];
				if((elFirstChild.tagName == "DIV") && (elFirstChild.style.zIndex == 1000)){
					elFirstChild.parentNode.removeChild(elFirstChild);
				}
			}
			// --[SMARTEDITORSUS-1213]
			this.oApp.exec("CLOSE_QE_LAYER", [oEvent]);
		}
	},
	
	getData : function() {
		var self = this;
		jindo.$Ajax(self._sBaseAjaxUrl, {
			type : "jsonp",
			timeout : 1,
			onload: function(rp) {
				var result = rp.json().result;
				// [SMARTEDITORSUS-1028][SMARTEDITORSUS-1517] QuickEditor 설정 API 개선
				//if (!!result && !!result.length) {
				if (!!result && !!result.text_data) {
					//self.setData(result[result.length - 1]);
					self.setData(result.text_data);
				} else {
					self.setData("{table:'full',img:'full',review:'full'}");
				}
				// --[SMARTEDITORSUS-1028][SMARTEDITORSUS-1517]
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
	}
});