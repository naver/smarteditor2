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
 * @name nhn.husky.PopUpManager
 * @namespace
 * @description 팝업 매니저 클래스.
 * <dt><strong>Spec Code</strong></dt>
 * <dd><a href="http://ajaxui.nhndesign.com/svnview/SmartEditor2_Official/tags/SE2M_popupManager/0.1/test/spec/hp_popupManager_spec.html" target="_new">Spec</a></dd>
 * <dt><strong>wiki</strong></dt>
 * <dd><a href="http://wikin.nhncorp.com/pages/viewpage.action?pageId=63501152" target="_new">wiki</a></dd>
 * @author NHN AjaxUI Lab - sung jong min
 * @version 0.1
 * @since 2009.07.06
 */
nhn.husky.PopUpManager = {};

/** * @ignore */
nhn.husky.PopUpManager._instance = null;
/** * @ignore */
nhn.husky.PopUpManager._pluginKeyCnt = 0;

/**
 * @description 팝업 매니저 인스턴스 호출 메소드, nhn.husky js framework 기반 코드
 * @public
 * @param {Object} oApp 허스키 코어 객체를 넘겨준다.(this.oApp)
 * @return {Object} nhn.husky.PopUpManager Instance
 * @example 팝업관련 플러그인 제작 예제
 * nhn.husky.NewPlugin = function(){
 * 	this.$ON_APP_READY = function(){
 * 		// 팝업 매니저 getInstance 메소드를 호출한다.
 * 		// 허스키 코어의 참조값을 넘겨준다(this.oApp)
 * 		this.oPopupMgr = nhn.husky.PopUpMaganer.getInstance(this.oApp);
 * 	};
 * 
 * 	// 팝업을 요청하는 메시지 메소드는 아래와 같음
 * 	this.$ON_NEWPLUGIN_OPEN_WINDOW = function(){
 * 		var oWinOp = {
 * 			oApp : this.oApp,	// oApp this.oApp 허스키 참조값
 * 			sUrl : "", // sUrl : 페이지 URL
 * 			sName : "", // sName : 페이지 name
 * 			nWidth : 400,
 * 			nHeight : 400,
 * 			bScroll : true
 * 		}
 * 		this.oPopUpMgr.openWindow(oWinOp);
 * 	};
 * 
 * 	// 팝업페이지 응답데이타 반환 메시지 메소드를 정의함.
 * 	// 각 플러그인 팝업페이지에서 해당 메시지와 데이타를 넘기게 됨.
 * 	this.@ON_NEWPLUGIN_WINDOW_CALLBACK = function(){
 * 		// 팝업페이지별로 정의된 형태의 아규먼트 데이타가 넘어오면 처리한다.
 * 	}
 * }
 * @example 팝업 페이지와 opener 호출 인터페이스 예제
 * onclick시
 * "nhn.husky.PopUpManager.setCallback(window, "NEWPLUGIN_WINDOW_CALLBACK", oData);"
 * 형태로 호출함.
 * 
 * 
 */
nhn.husky.PopUpManager.getInstance = function(oApp) {
	if (this._instance==null) {
		
		this._instance = new (function(){
			
			this._whtPluginWin = new jindo.$H();
			this._whtPlugin = new jindo.$H();
			this.addPlugin = function(sKey, vValue){
				this._whtPlugin.add(sKey, vValue);
			};
			
			this.getPlugin = function() {
				return this._whtPlugin;
			};
			this.getPluginWin = function() {
				return this._whtPluginWin;
			};
			
			this.openWindow = function(oWinOpt) {
				var op= {
					oApp : null, 
					sUrl : "", 
					sName : "popup", 
					sLeft : null,
					sTop : null,
					nWidth : 400,
					nHeight : 400,
					sProperties : null,
					bScroll : true
				};
				for(var i in oWinOpt) op[i] = oWinOpt[i];

				if(op.oApp == null) {
					alert("팝업 요청시 옵션으로 oApp(허스키 reference) 값을 설정하셔야 합니다.");
				}
				
				var left = op.sLeft || (screen.availWidth-op.nWidth)/2;
				var top  = op.sTop ||(screen.availHeight-op.nHeight)/2;

				var sProperties = op.sProperties != null ? op.sProperties : 
					"top="+ top +",left="+ left +",width="+op.nWidth+",height="+op.nHeight+",scrollbars="+(op.bScroll?"yes":"no")+",status=yes";
				var win = window.open(op.sUrl, op.sName,sProperties);
				if (!!win) {
					setTimeout( function(){ 
						try{win.focus();}catch(e){} 
					}, 100);
				}
				
				this.removePluginWin(win);
				this._whtPluginWin.add(this.getCorrectKey(this._whtPlugin, op.oApp), win);

				return win;
			};
			this.getCorrectKey = function(whtData, oCompare) {
				var key = null;
				whtData.forEach(function(v,k){
					if (v == oCompare) { 
						key = k; 
						return; 
					}
				});
				return key;
			};
			this.removePluginWin = function(vValue) {
				var list = this._whtPluginWin.search(vValue);
				if (list) {
					this._whtPluginWin.remove(list);
					this.removePluginWin(vValue);
				}
			}
		})();
	}
	
	this._instance.addPlugin("plugin_" + (this._pluginKeyCnt++), oApp);
	return nhn.husky.PopUpManager._instance;
};

/**
* @description opener 연동 interface
 * @public
 * @param {Object} oOpenWin 팝업 페이지의 window 객체
 * @param {Object} sMsg	플러그인 메시지명
 * @param {Object} oData	응답 데이타
 */
nhn.husky.PopUpManager.setCallback = function(oOpenWin, sMsg, oData) {
	if (this._instance.getPluginWin().hasValue(oOpenWin)) {
		var key = this._instance.getCorrectKey(this._instance.getPluginWin(), oOpenWin);
		if (key) {
			this._instance.getPlugin().$(key).exec(sMsg, oData);
		}
	}
};

/**
 * @description opener에 허스키 함수를 실행시키고 데이터 값을 리턴 받음.
 * @param 
 */
nhn.husky.PopUpManager.getFunc = function(oOpenWin, sFunc) {
	if (this._instance.getPluginWin().hasValue(oOpenWin)) {
		var key = this._instance.getCorrectKey(this._instance.getPluginWin(), oOpenWin);
		if (key) {
			return this._instance.getPlugin().$(key)[sFunc]();
		}
	}
};

