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
 * @fileOverview This file contains Husky plugin that maps a message code to the actual message
 * @name hp_MessageManager.js
 */
nhn.husky.MessageManager = jindo.$Class({
	name : "MessageManager",

	_oMessageMapSet : {},
	_sDefaultLocale : "ko_KR",
	
	$init : function(oMessageMap, sLocale){
		// 하위호환을 위해 기존 코드 유지
		var oTmpMessageMap;
		switch(sLocale) {
			case "ja_JP" :
				oTmpMessageMap = window.oMessageMap_ja_JP;
				break;
			case "en_US" :
				oTmpMessageMap = window.oMessageMap_en_US;
				break;
			case "zh_CN" :
				oTmpMessageMap = window.oMessageMap_zh_CN;
				break;
			default :  // Korean
				oTmpMessageMap = oMessageMap;
				break;
		}
		oTmpMessageMap = oTmpMessageMap || oMessageMap;

		this._sDefaultLocale = sLocale || this._sDefaultLocale;
		this._setMessageMap(oTmpMessageMap, this._sDefaultLocale);
	},

	/**
	 * 로케일에 해당하는 메시지맵을 세팅한다.
	 * @param {Object} oMessageMap 세팅할 메시지맵 객체
	 * @param {String} [sLocale] 메시지맵 객체를 세팅할 로케일 정보
	 */
	_setMessageMap : function(oMessageMap, sLocale){
		sLocale = sLocale || this._sDefaultLocale;
		if(oMessageMap){
			this._oMessageMapSet[sLocale] = oMessageMap;
		}
	},

	/**
	 * 로케일에 해당하는 메시지맵을 가져온다.
	 * @param {String} [sLocale] 가져올 메시지맵 객체의 로케일 정보
	 * @returns {Object} 메시지맵
	 */
	_getMessageMap : function(sLocale){
		return this._oMessageMapSet[sLocale] || this._oMessageMapSet[this._sDefaultLocale] || {};
	},

	$BEFORE_MSG_APP_READY : function(){
		this.oApp.exec("ADD_APP_PROPERTY", ["$MSG", jindo.$Fn(this.getMessage, this).bind()]);
	},

	/**
	 * 메시지문자열을 가져온다.
	 * @param {String} sMsg 메시지키
	 * @param {String} [sLocale] 가져올 메시지의 로케일 정보
	 * @returns {String} 해당로케일의 메시지문자열
	 */
	getMessage : function(sMsg, sLocale){
		var oMessageMap = this._getMessageMap(sLocale);

		if(oMessageMap[sMsg]){return unescape(oMessageMap[sMsg]);}
		return sMsg;
	}
});