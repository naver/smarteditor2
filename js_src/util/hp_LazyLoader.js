//{
/**
 * @fileOverview This file contains 
 * @name hp_LazyLoader.js
 */
nhn.husky.LazyLoader = jindo.$Class({
	name : "LazyLoader",

	// sMsg : KEY
	// contains htLoadingInfo : {}
	htMsgInfo : null,
	
	// contains objects
	//	sURL : HTML to be loaded
	//	elTarget : where to append the HTML
	//	sSuccessCallback : message name
	//	sFailureCallback : message name
	//	nLoadingStatus : 
	//		0 : loading not started
	//		1 : loading started
	//		2 : loading ended
	aLoadingInfo : null,

	// aToDo : [{aMsgs: ["EXECCOMMAND"], sURL: "http://127.0.0.1/html_snippet.txt", elTarget: elPlaceHolder}, ...]
	$init : function(aToDo){
		this.htMsgInfo = {};
		this.aLoadingInfo = [];
		this.aToDo = aToDo;
	},
	
	$ON_MSG_APP_READY : function(){
		for(var i=0; i<this.aToDo.length; i++){
			var htToDoDetail = this.aToDo[i];
			this._createBeforeHandlersAndSaveURLInfo(htToDoDetail.oMsgs, htToDoDetail.sURL, htToDoDetail.elTarget, htToDoDetail.htOptions);
		}
	},

	$LOCAL_BEFORE_ALL : function(sMsgHandler, aParams){
		var sMsg = sMsgHandler.replace("$BEFORE_", "");

		var htCurMsgInfo = this.htMsgInfo[sMsg];

		// ignore current message
		if(htCurMsgInfo.nLoadingStatus == 1){return true;}
		
		// the HTML was loaded before(probably by another message), remove the loading handler and re-send the message
		if(htCurMsgInfo.nLoadingStatus == 2){
			this[sMsgHandler] = function(){
				this._removeHandler(sMsgHandler);
				this.oApp.delayedExec(sMsg, aParams, 0);
				return false;
			};
			return true;
		}

		htCurMsgInfo.bLoadingStatus = 1;
		(new jindo.$Ajax(htCurMsgInfo.sURL, {
			onload : jindo.$Fn(this._onload, this).bind(sMsg, aParams)
		})).request();

		return true;
	},

	_onload : function(sMsg, aParams, oResponse){
		if(oResponse._response.readyState == 4) {
			this.htMsgInfo[sMsg].elTarget.innerHTML = oResponse.text();
			this.htMsgInfo[sMsg].nLoadingStatus = 2;
			this._removeHandler("$BEFORE_"+sMsg);
			this.oApp.exec("sMsg", aParams);
		}else{
			this.oApp.exec(this.htMsgInfo[sMsg].sFailureCallback, []);
		}
	},

	_removeHandler : function(sMsgHandler){
		delete this[sMsgHandler];
		this.oApp.createMessageMap(sMsgHandler);
	},
	
	_createBeforeHandlersAndSaveURLInfo : function(oMsgs, sURL, elTarget, htOptions){
		htOptions = htOptions || {};

		var htNewInfo = {
			sURL : sURL,
			elTarget : elTarget,
			sSuccessCallback : htOptions.sSuccessCallback,
			sFailureCallback : htOptions.sFailureCallback,
			nLoadingStatus : 0
		};
		this.aLoadingInfo[this.aLoadingInfo.legnth] = htNewInfo;

		// extract msgs if plugin is given
		if(!(oMsgs instanceof Array)){
			var oPlugin = oMsgs;

			oMsgs = [];
			var htMsgAdded = {};
			for(var sFunctionName in oPlugin){
				if(sFunctionName.match(/^\$(BEFORE|ON|AFTER)_(.+)$/)){
					var sMsg = RegExp.$2;
					if(sMsg == "MSG_APP_READY"){continue;}

					if(!htMsgAdded[sMsg]){
						oMsgs[oMsgs.length] = RegExp.$2;
						htMsgAdded[sMsg] = true;
					}
				}
			}
		}

		for(var i=0; i<oMsgs.length; i++){
			// create HTML loading handler
			var sTmpMsg = "$BEFORE_"+oMsgs[i];
			this[sTmpMsg] = function(){return false;};
			this.oApp.createMessageMap(sTmpMsg);

			// add loading info
			this.htMsgInfo[oMsgs[i]] = htNewInfo;
		}
	}
});
//}