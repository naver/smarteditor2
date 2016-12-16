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
if(typeof window.nhn=='undefined'){window.nhn = {};}
if (!nhn.husky){nhn.husky = {};}
/**
 * @fileOverview This file contains Husky framework core
 * @name HuskyCore.js
 */
(function(){
	var _rxMsgHandler = /^\$(LOCAL|BEFORE|ON|AFTER)_/,
		_rxMsgAppReady = /^\$(BEFORE|ON|AFTER)_MSG_APP_READY$/,
		_aHuskyCores = [],	// HuskyCore instance list
		_htLoadedFile = {};	// lazy-loaded file list

	nhn.husky.HuskyCore = jindo.$Class({
		name : "HuskyCore",
		aCallerStack : null,
		bMobile : jindo.$Agent().navigator().mobile || jindo.$Agent().navigator().msafari, 

		$init : function(htOptions){
			this.htOptions = htOptions||{};
	
			_aHuskyCores.push(this);
			if( this.htOptions.oDebugger ){
				nhn.husky.HuskyCore.getCore = function() { 
					return _aHuskyCores; 
				};
				this.htOptions.oDebugger.setApp(this);
			}
	
			// To prevent processing a Husky message before all the plugins are registered and ready,
			// Queue up all the messages here until the application's status is changed to READY
			this.messageQueue = [];
	
			this.oMessageMap = {};
			this.oDisabledMessage = {};
			this.oLazyMessage = {};
			this.aPlugins = [];
	
			this.appStatus = nhn.husky.APP_STATUS.NOT_READY;
			
			this.aCallerStack = [];
			
			this._fnWaitForPluginReady = jindo.$Fn(this._waitForPluginReady, this).bind();
			
			// Register the core as a plugin so it can receive messages
			this.registerPlugin(this);
		},
		
		setDebugger: function(oDebugger) {
			this.htOptions.oDebugger = oDebugger;
			oDebugger.setApp(this);
		},
		
		exec : function(msg, args, oEvent){
			// If the application is not yet ready just queue the message
			if(this.appStatus == nhn.husky.APP_STATUS.NOT_READY){
				this.messageQueue[this.messageQueue.length] = {'msg':msg, 'args':args, 'event':oEvent};
				return true;
			}
	
			this.exec = this._exec;
			this.exec(msg, args, oEvent);
		},
	
		delayedExec : function(msg, args, nDelay, oEvent){
			var fExec = jindo.$Fn(this.exec, this).bind(msg, args, oEvent);
			setTimeout(fExec, nDelay);
		},
	
		_exec : function(msg, args, oEvent){
			return (this._exec = this.htOptions.oDebugger?this._execWithDebugger:this._execWithoutDebugger).call(this, msg, args, oEvent);
		},
		_execWithDebugger : function(msg, args, oEvent){
			this.htOptions.oDebugger.log_MessageStart(msg, args);
			var bResult = this._doExec(msg, args, oEvent);
			this.htOptions.oDebugger.log_MessageEnd(msg, args);
			return bResult;
		},
		_execWithoutDebugger : function(msg, args, oEvent){
			return this._doExec(msg, args, oEvent);
		},
		_doExec : function(msg, args, oEvent){
			var bContinue = false;
	
			// Lazy메시지가 있으면 파일을 로딩한다.
			if(this.oLazyMessage[msg]){
				var htLazyInfo = this.oLazyMessage[msg]; 
				this._loadLazyFiles(msg, args, oEvent, htLazyInfo.aFilenames, 0);
				return false;
			}
	
			if(!this.oDisabledMessage[msg]){
				var allArgs = [];
				if(args && args.length){
					var iLen = args.length;
					for(var i=0; i<iLen; i++){allArgs[i] = args[i];}
				}
				if(oEvent){allArgs[allArgs.length] = oEvent;}
	
				bContinue = this._execMsgStep("BEFORE", msg, allArgs);
				if(bContinue){bContinue = this._execMsgStep("ON", msg, allArgs);}
				if(bContinue){bContinue = this._execMsgStep("AFTER", msg, allArgs);}
			}
	
			return bContinue;
		},
	
		
		registerPlugin : function(oPlugin){
			if(!oPlugin){throw("An error occured in registerPlugin(): invalid plug-in");}
	
			oPlugin.nIdx = this.aPlugins.length;
			oPlugin.oApp = this;
			this.aPlugins[oPlugin.nIdx] = oPlugin;
	
			// If the plugin does not specify that it takes time to be ready, change the stauts to READY right away
			if(oPlugin.status != nhn.husky.PLUGIN_STATUS.NOT_READY){oPlugin.status = nhn.husky.PLUGIN_STATUS.READY;}
	
			// If run() function had been called already, need to recreate the message map
			if(this.appStatus != nhn.husky.APP_STATUS.NOT_READY){
				for(var funcName in oPlugin){
					if(_rxMsgHandler.test(funcName)){
						this.addToMessageMap(funcName, oPlugin);
					}
				}
			}
	
			this.exec("MSG_PLUGIN_REGISTERED", [oPlugin]);
	
			return oPlugin.nIdx;
		},
	
		disableMessage : function(sMessage, bDisable){this.oDisabledMessage[sMessage] = bDisable;},
	
		registerBrowserEvent : function(obj, sEvent, sMessage, aParams, nDelay){
			aParams = aParams || [];
			var func = (nDelay)?jindo.$Fn(this.delayedExec, this).bind(sMessage, aParams, nDelay):jindo.$Fn(this.exec, this).bind(sMessage, aParams);
			return jindo.$Fn(func, this).attach(obj, sEvent);
		},
	
		run : function(htOptions){
			this.htRunOptions = htOptions || {};
	
			// Change the status from NOT_READY to let exec to process all the way
			this._changeAppStatus(nhn.husky.APP_STATUS.WAITING_FOR_PLUGINS_READY);
	
			// Process all the messages in the queue
			var iQueueLength = this.messageQueue.length;
			for(var i=0; i<iQueueLength; i++){
				var curMsgAndArgs = this.messageQueue[i];
				this.exec(curMsgAndArgs.msg, curMsgAndArgs.args, curMsgAndArgs.event);
			}
	
			this._fnWaitForPluginReady();
		},
	
		acceptLocalBeforeFirstAgain : function(oPlugin, bAccept){
			// LOCAL_BEFORE_FIRST will be fired again if oPlugin._husky_bRun == false
			oPlugin._husky_bRun = !bAccept;
		},
		
		// Use this also to update the mapping
		createMessageMap : function(sMsgHandler){
			this.oMessageMap[sMsgHandler] = [];
	
			var nLen = this.aPlugins.length;
			for(var i=0; i<nLen; i++){this._doAddToMessageMap(sMsgHandler, this.aPlugins[i]);}
		},
		
		addToMessageMap : function(sMsgHandler, oPlugin){
			// cannot "ADD" unless the map is already created.
			// the message will be added automatically to the mapping when it is first passed anyways, so do not add now
			if(!this.oMessageMap[sMsgHandler]){return;}
	
			this._doAddToMessageMap(sMsgHandler, oPlugin);
		},
	
		_changeAppStatus : function(appStatus){
			this.appStatus = appStatus;
	
			// Initiate MSG_APP_READY if the application's status is being switched to READY
			if(this.appStatus == nhn.husky.APP_STATUS.READY){this.exec("MSG_APP_READY");}
		},
	
		
		_execMsgStep : function(sMsgStep, sMsg, args){
			return (this._execMsgStep = this.htOptions.oDebugger?this._execMsgStepWithDebugger:this._execMsgStepWithoutDebugger).call(this, sMsgStep, sMsg, args);
		},
		_execMsgStepWithDebugger : function(sMsgStep, sMsg, args){
			this.htOptions.oDebugger.log_MessageStepStart(sMsgStep, sMsg, args);
			var bStatus = this._execMsgHandler("$"+sMsgStep+"_"+sMsg, args);
			this.htOptions.oDebugger.log_MessageStepEnd(sMsgStep, sMsg, args);
			return bStatus;
		},
		_execMsgStepWithoutDebugger : function(sMsgStep, sMsg, args){
			return this._execMsgHandler ("$"+sMsgStep+"_"+sMsg, args);
		},
		_execMsgHandler : function(sMsgHandler, args){
			var i;
			if(!this.oMessageMap[sMsgHandler]){
				this.createMessageMap(sMsgHandler);
			}
	
			var aPlugins = this.oMessageMap[sMsgHandler];
			var iNumOfPlugins = aPlugins.length;
			
			if(iNumOfPlugins === 0){return true;}
	
			var bResult = true;
	
			// two similar codes were written twice due to the performace.
			if(_rxMsgAppReady.test(sMsgHandler)){
				for(i=0; i<iNumOfPlugins; i++){
					if(this._execHandler(aPlugins[i], sMsgHandler, args) === false){
						bResult = false;
						break;
					}
				}
			}else{
				for(i=0; i<iNumOfPlugins; i++){
					if(!aPlugins[i]._husky_bRun){
						aPlugins[i]._husky_bRun = true;
						if(typeof aPlugins[i].$LOCAL_BEFORE_FIRST == "function" && this._execHandler(aPlugins[i], "$LOCAL_BEFORE_FIRST", [sMsgHandler, args]) === false){continue;}
					}
	
					if(typeof aPlugins[i].$LOCAL_BEFORE_ALL == "function"){
						if(this._execHandler(aPlugins[i], "$LOCAL_BEFORE_ALL", [sMsgHandler, args]) === false){continue;}
					}
	
					if(this._execHandler(aPlugins[i], sMsgHandler, args) === false){
						bResult = false;
						break;
					}
				}
			}
			
			return bResult;
		},
	
		
		_execHandler : function(oPlugin, sHandler, args){
			return	(this._execHandler = this.htOptions.oDebugger?this._execHandlerWithDebugger:this._execHandlerWithoutDebugger).call(this, oPlugin, sHandler, args);
		},
		_execHandlerWithDebugger : function(oPlugin, sHandler, args){
			this.htOptions.oDebugger.log_CallHandlerStart(oPlugin, sHandler, args);
			var bResult;
			try{
				this.aCallerStack.push(oPlugin);
				bResult = oPlugin[sHandler].apply(oPlugin, args);
				this.aCallerStack.pop();
			}catch(e){
				this.htOptions.oDebugger.handleException(e);
				bResult = false;
			}
			this.htOptions.oDebugger.log_CallHandlerEnd(oPlugin, sHandler, args);
			return bResult;
		},
		_execHandlerWithoutDebugger : function(oPlugin, sHandler, args){
			this.aCallerStack.push(oPlugin);
			var bResult = oPlugin[sHandler].apply(oPlugin, args);
			this.aCallerStack.pop();
	
			return bResult;
		},
	
	
		_doAddToMessageMap : function(sMsgHandler, oPlugin){
			if(typeof oPlugin[sMsgHandler] != "function"){return;}
	
			var aMap = this.oMessageMap[sMsgHandler];
			// do not add if the plugin is already in the mapping
			for(var i=0, iLen=aMap.length; i<iLen; i++){
				if(this.oMessageMap[sMsgHandler][i] == oPlugin){return;}
			}
			this.oMessageMap[sMsgHandler][i] = oPlugin;
		},
	
		_waitForPluginReady : function(){
			var bAllReady = true;
			for(var i=0; i<this.aPlugins.length; i++){
				if(this.aPlugins[i].status == nhn.husky.PLUGIN_STATUS.NOT_READY){
					bAllReady = false;
					break;
				}
			}
			if(bAllReady){
				this._changeAppStatus(nhn.husky.APP_STATUS.READY);
			}else{
				setTimeout(this._fnWaitForPluginReady, 100);
			}
		},
	
		/**
		 * Lazy로딩을 실행한다.
		 * @param {Object} oPlugin  플러그인 인스턴스
		 * @param {String} sMsg 메시지명
		 * @param {Array} aArgs 메시지에 전달되는 매개변수
		 * @param {Event} oEvent 메시지에 전달되는 이벤트
		 * @param {Array} aFilenames Lazy로딩할 파일명
		 * @param {Integer} nIdx 로딩할 파일인덱스
		 */
		_loadLazyFiles : function(sMsg, aArgs, oEvent, aFilenames, nIdx){
			var nLen = aFilenames.length;
			if(nLen <= nIdx){
				// 파일이 모두 로딩된 상태라면 oLazyMessage 에서 정보를 제거하고 메시지를 실행한다.
				this.oLazyMessage[sMsg] = null;
				this.oApp.exec(sMsg, aArgs, oEvent);
				return;
			}
	
			var sFilename = aFilenames[nIdx];
	
			if(_htLoadedFile[sFilename]){
				// 파일이 이미 로딩된 경우 다음 파일을 로딩한다.
				this._loadLazyFiles(sMsg, aArgs, oEvent, aFilenames, nIdx+1);
			}else{
				// 파일을 Lazy로딩한다.
				// TODO: 진도컴포넌트 디펜던시 제거?
				// TODO: 응답결과가 정상적이지 않을 경우에 대한 처리?
				jindo.LazyLoading.load(nhn.husky.SE2M_Configuration.LazyLoad.sJsBaseURI+"/"+sFilename, 
					jindo.$Fn(function(sMsg, aArgs, oEvent, aFilenames, nIdx){
						// 로딩완료된 파일은 상태를 변경하고
						var sFilename = aFilenames[nIdx];
						_htLoadedFile[sFilename] = 1;
						// 다음 파일을 로딩한다.
						this._loadLazyFiles(sMsg, aArgs, oEvent, aFilenames, nIdx+1);
					}, this).bind(sMsg, aArgs, oEvent, aFilenames, nIdx),
					"utf-8"
				);
			}
		},
	
		/**
		 * Lazy로딩으로 처리할 메시지를 등록한다.
		 * @param {Array} aMsgs 메시지명
		 * @param {Array} aFilenames Lazy로딩할 파일명
		 */
		registerLazyMessage : function(aMsgs, aFilenames){
			aMsgs = aMsgs || [];
			aFilenames = aFilenames || [];
			
			for(var i = 0, sMsg, htLazyInfo; (sMsg = aMsgs[i]); i++){
				htLazyInfo = this.oLazyMessage[sMsg];
				if(htLazyInfo){
					htLazyInfo.aFilenames = htLazyInfo.aFilenames.concat(aFilenames);
				}else{
					this.oLazyMessage[sMsg] = {
						sMsg : sMsg,
						aFilenames : aFilenames
					};
				}
			}
		}
	});
	
	/**
	 * Lazy로딩완료된 파일목록
	 */
	nhn.husky.HuskyCore._htLoadedFile = {};
	/**
	 * Lazy로딩완료된 파일목록에 파일명을 추가한다.
	 * @param {String} sFilename Lazy로딩완료될 경우 마킹할 파일명
	 */
	nhn.husky.HuskyCore.addLoadedFile = function(sFilename){
		_htLoadedFile[sFilename] = 1;
	};
	/**
	 * 플러그인 일부분을 Lazy로딩하여 쉽게 확장할 수 있도록 믹스인 기능을 제공한다. 
	 * @param {Class} oClass 믹스인을 적용할 클래스
	 * @param {Object} htMixin 덧붙일 프로토타입 데이터
	 * @param {Boolean} bOverride 원본 클래스에 프로토타입을 덮어씌울지 여부
	 */
	nhn.husky.HuskyCore.mixin = function(oClass, htMixin, bOverride, sFilename){
		//TODO: error handling?
	//	if(typeof oClass != "function"){
	//		throw new Error("SmartEditor: can't mixin (oClass is invalid)");
	//	}
		var aPlugins = [];
		// 믹스인을 적용할 클래스가 이미 플러그인으로 등록된 상태라면 
		for(var i = 0, oHuskyCore; (oHuskyCore = _aHuskyCores[i]); i++){
			for(var j = 0, oPlugin; (oPlugin = oHuskyCore.aPlugins[j]); j++){
				if(oPlugin instanceof oClass){
					// 1. 메시지 추가등록을 위해 해당 플러그인 인스턴스를 담아두고
					aPlugins.push(oPlugin);
					// 2. 해당 플러그인 인스턴스에 $LOCAL_BEFORE_FIRST 핸들러가 없으면 핸들러처리를 위한 플래그를 리셋한다. 
					// if there were no $LOCAL_BEFORE_FIRST in already-loaded script, set to accept $LOCAL_BEFORE_FIRST next time as the function could be included in the lazy-loaded script.
					if(typeof oPlugin["$LOCAL_BEFORE_FIRST"] !== "function"){
						oPlugin.oApp.acceptLocalBeforeFirstAgain(oPlugin, true);
					}
				}else if(oPlugin._$superClass === oClass){	
					// [SMARTEDITORSUS-1697] 
					// jindo 클래스를 상속받아 확장된 클래스의 경우, 
					// 1. instanceof 로 확인이 안되며
					// 2. super 클래스에 mixin 처리한 것이 반영이 안된다.
					// 따라서 상속된 jindo 클래스의 인스턴스는 인스턴스에 직접 mixin 처리한다.
					if(typeof oPlugin["$LOCAL_BEFORE_FIRST"] !== "function"){
						oPlugin.oApp.acceptLocalBeforeFirstAgain(oPlugin, true);
					}
					for(var k in htMixin){
						if(bOverride || !oPlugin.hasOwnProperty(k)){
							oPlugin[k] = htMixin[k];
							if(_rxMsgHandler.test(k)){
								oPlugin.oApp.addToMessageMap(k, oPlugin);
							}
						}
					}
				}
			}
		}

		// mixin 처리
		for(var k in htMixin){
			if(bOverride || !oClass.prototype.hasOwnProperty(k)){
				oClass.prototype[k] = htMixin[k];
				// 새로 추가되는 함수가 메시지 핸들러라면 메시지 매핑에 추가 해준다.
				if(_rxMsgHandler.test(k)){
					for(var j = 0, oPlugin; (oPlugin = aPlugins[j]); j++){
						oPlugin.oApp.addToMessageMap(k, oPlugin);
					}
				}
			}
		}
	};
	
	nhn.husky.APP_STATUS = {
		'NOT_READY' : 0,
		'WAITING_FOR_PLUGINS_READY' : 1,
		'READY' : 2
	};
	
	nhn.husky.PLUGIN_STATUS = {
		'NOT_READY' : 0,
		'READY' : 1
	};
})();