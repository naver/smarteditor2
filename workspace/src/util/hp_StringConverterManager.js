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
 * @fileOverview This file contains Husky plugin that takes care of the operations related to string conversion. Ususally used to convert the IR value.
 * @name hp_StringConverterManager.js
 */
nhn.husky.StringConverterManager = jindo.$Class({
	name : "StringConverterManager",

	oConverters : null,

	$init : function(){
		this.oConverters = {};
		this.oConverters_DOM = {};
		this.oAgent = jindo.$Agent().navigator(); 
	},
	
	$BEFORE_MSG_APP_READY : function(){
		this.oApp.exec("ADD_APP_PROPERTY", ["applyConverter", jindo.$Fn(this.applyConverter, this).bind()]);
		this.oApp.exec("ADD_APP_PROPERTY", ["addConverter", jindo.$Fn(this.addConverter, this).bind()]);
		this.oApp.exec("ADD_APP_PROPERTY", ["addConverter_DOM", jindo.$Fn(this.addConverter_DOM, this).bind()]);
	},
	
	applyConverter : function(sRuleName, sContents, oDocument){
		//string을 넣는 이유:IE의 경우,본문 앞에 있는 html 주석이 삭제되는 경우가 있기때문에 임시 string을 추가해준것임.
		var sTmpStr =  "@"+(new Date()).getTime()+"@";
		var rxTmpStr = new RegExp(sTmpStr, "g");
		
		var oRes = {sContents:sTmpStr+sContents};
		
		oDocument = oDocument || document;
		
		this.oApp.exec("MSG_STRING_CONVERTER_STARTED", [sRuleName, oRes]);
//		this.oApp.exec("MSG_STRING_CONVERTER_STARTED_"+sRuleName, [oRes]);

		var aConverters;
		sContents = oRes.sContents;
		aConverters = this.oConverters_DOM[sRuleName];
		if(aConverters){
			var elContentsHolder = oDocument.createElement("DIV");
			elContentsHolder.innerHTML = sContents;
			
			for(var i=0; i<aConverters.length; i++){
				aConverters[i](elContentsHolder);
			}
			sContents = elContentsHolder.innerHTML; 
			// 내용물에 EMBED등이 있을 경우 IE에서 페이지 나갈 때 권한 오류 발생 할 수 있어 명시적으로 노드 삭제.
			
			if(!!elContentsHolder.parentNode){
				elContentsHolder.parentNode.removeChild(elContentsHolder);
			}
			elContentsHolder = null;
			
			
			//IE의 경우, sContents를 innerHTML로 넣는 경우 string과 <p>tag 사이에 '\n\'개행문자를 넣어준다. 
			if( jindo.$Agent().navigator().ie ){
				sTmpStr = sTmpStr +'(\r\n)?'; //ie+win에서는 개행이 \r\n로 들어감.
				rxTmpStr = new RegExp(sTmpStr , "g");
			}
		}
		
		aConverters = this.oConverters[sRuleName];
		if(aConverters){
			for(var i=0; i<aConverters.length; i++){
				var sTmpContents = aConverters[i](sContents);
				if(typeof sTmpContents != "undefined"){
					sContents = sTmpContents;
				}
			}
		}

		oRes = {sContents:sContents};
		this.oApp.exec("MSG_STRING_CONVERTER_ENDED", [sRuleName, oRes]);
		
		oRes.sContents = oRes.sContents.replace(rxTmpStr, "");
		return oRes.sContents;
	},

	$ON_ADD_CONVERTER : function(sRuleName, funcConverter){
		var aCallerStack = this.oApp.aCallerStack;
		funcConverter.sPluginName = aCallerStack[aCallerStack.length-2].name;
		this.addConverter(sRuleName, funcConverter);
	},

	$ON_ADD_CONVERTER_DOM : function(sRuleName, funcConverter){
		var aCallerStack = this.oApp.aCallerStack;
		funcConverter.sPluginName = aCallerStack[aCallerStack.length-2].name;
		this.addConverter_DOM(sRuleName, funcConverter);
	},

	addConverter : function(sRuleName, funcConverter){
		var aConverters = this.oConverters[sRuleName];
		if(!aConverters){
			this.oConverters[sRuleName] = [];
		}

		this.oConverters[sRuleName][this.oConverters[sRuleName].length] = funcConverter;
	},

	addConverter_DOM : function(sRuleName, funcConverter){
		var aConverters = this.oConverters_DOM[sRuleName];
		if(!aConverters){
			this.oConverters_DOM[sRuleName] = [];
		}

		this.oConverters_DOM[sRuleName][this.oConverters_DOM[sRuleName].length] = funcConverter;
	}
});
//}