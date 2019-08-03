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
/*[
 * ATTACH_HOVER_EVENTS
 *
 * 주어진 HTML엘리먼트에 Hover 이벤트 발생시 특정 클래스가 할당 되도록 설정
 *
 * aElms array Hover 이벤트를 걸 HTML Element 목록
 * sHoverClass string Hover 시에 할당 할 클래스
 *
---------------------------------------------------------------------------]*/
/**
 * @pluginDesc Husky Framework에서 자주 사용되는 유틸성 메시지를 처리하는 플러그인
 */
 nhn.husky.Utils = jindo.$Class({
	name : "Utils",

	$init : function(){
		var oAgentInfo = jindo.$Agent();
		var oNavigatorInfo = oAgentInfo.navigator();

		if(oNavigatorInfo.ie && oNavigatorInfo.version == 6){
			try{
				document.execCommand('BackgroundImageCache', false, true);
			}catch(e){}
		}
	},
	
	$BEFORE_MSG_APP_READY : function(){
		this.oApp.exec("ADD_APP_PROPERTY", ["htBrowser", jindo.$Agent().navigator()]);
	},
	
	$ON_ATTACH_HOVER_EVENTS : function(aElms, htOptions){
		htOptions = htOptions || [];
		var sHoverClass = htOptions.sHoverClass || "hover";
		var fnElmToSrc = htOptions.fnElmToSrc || function(el){return el};
		var fnElmToTarget = htOptions.fnElmToTarget || function(el){return el};
		
		if(!aElms) return;
		
		var wfAddClass = jindo.$Fn(function(wev){
			jindo.$Element(fnElmToTarget(wev.currentElement)).addClass(sHoverClass);
		}, this);
		
		var wfRemoveClass = jindo.$Fn(function(wev){
			jindo.$Element(fnElmToTarget(wev.currentElement)).removeClass(sHoverClass);
		}, this);
		
		for(var i=0, len = aElms.length; i<len; i++){
			var elSource = fnElmToSrc(aElms[i]);
			
			wfAddClass.attach(elSource, "mouseover");
			wfRemoveClass.attach(elSource, "mouseout");
			
			wfAddClass.attach(elSource, "focus");
			wfRemoveClass.attach(elSource, "blur");
		}
	}
});
