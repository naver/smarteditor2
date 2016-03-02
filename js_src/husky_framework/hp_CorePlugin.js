/*[
 * ADD_APP_PROPERTY
 *
 * 주요 오브젝트를 모든 플러그인에서 this.oApp를 통해서 직접 접근 가능 하도록 등록한다.
 *
 * sPropertyName string 등록명
 * oProperty object 등록시킬 오브젝트
 *
---------------------------------------------------------------------------]*/
/*[
 * REGISTER_BROWSER_EVENT
 *
 * 특정 브라우저 이벤트가 발생 했을때 Husky 메시지를 발생 시킨다.
 *
 * obj HTMLElement 브라우저 이벤트를 발생 시킬 HTML 엘리먼트
 * sEvent string 발생 대기 할 브라우저 이벤트
 * sMsg string 발생 할 Husky 메시지
 * aParams array 메시지에 넘길 파라미터
 * nDelay number 브라우저 이벤트 발생 후 Husky 메시지 발생 사이에 딜레이를 주고 싶을 경우 설정. (1/1000초 단위)
 *
---------------------------------------------------------------------------]*/
/*[
 * DISABLE_MESSAGE
 *
 * 특정 메시지를 코어에서 무시하고 라우팅 하지 않도록 비활성화 한다.
 *
 * sMsg string 비활성화 시킬 메시지
 *
---------------------------------------------------------------------------]*/
/*[
 * ENABLE_MESSAGE
 *
 * 무시하도록 설정된 메시지를 무시하지 않도록 활성화 한다.
 *
 * sMsg string 활성화 시킬 메시지
 *
---------------------------------------------------------------------------]*/
/*[
 * EXEC_ON_READY_FUNCTION
 *
 * oApp.run({fnOnAppReady:fnOnAppReady})와 같이 run 호출 시점에 지정된 함수가 있을 경우 이를 MSG_APP_READY 시점에 실행 시킨다.
 * 코어에서 자동으로 발생시키는 메시지로 직접 발생시키지는 않도록 한다.
 *
 * none
 *
---------------------------------------------------------------------------]*/
/**
 * @pluginDesc Husky Framework에서 자주 사용되는 메시지를 처리하는 플러그인
 */
nhn.husky.CorePlugin = jindo.$Class({
	name : "CorePlugin",

	// nStatus = 0(request not sent), 1(request sent), 2(response received)
	// sContents = response
	htLazyLoadRequest_plugins : {},
	htLazyLoadRequest_allFiles : {},
	
	htHTMLLoaded : {},
	
	$AFTER_MSG_APP_READY : function(){
		this.oApp.exec("EXEC_ON_READY_FUNCTION", []);
	},

	$ON_ADD_APP_PROPERTY : function(sPropertyName, oProperty){
		this.oApp[sPropertyName] = oProperty;
	},

	$ON_REGISTER_BROWSER_EVENT : function(obj, sEvent, sMsg, aParams, nDelay){
		this.oApp.registerBrowserEvent(obj, sEvent, sMsg, aParams, nDelay);
	},
	
	$ON_DISABLE_MESSAGE : function(sMsg){
		this.oApp.disableMessage(sMsg, true);
	},

	$ON_ENABLE_MESSAGE : function(sMsg){
		this.oApp.disableMessage(sMsg, false);
	},
	
	$ON_LOAD_FULL_PLUGIN : function(aFilenames, sClassName, sMsgName, oThisRef, oArguments){
		var oPluginRef = oThisRef.$this || oThisRef;
//		var nIdx = _nIdx||0;
		
		var sFilename = aFilenames[0];
		
		if(!this.htLazyLoadRequest_plugins[sFilename]){
			this.htLazyLoadRequest_plugins[sFilename] = {nStatus:1, sContents:""};
		}
		
		if(this.htLazyLoadRequest_plugins[sFilename].nStatus === 2){
			//this.oApp.delayedExec("MSG_FULL_PLUGIN_LOADED", [sFilename, sClassName, sMsgName, oThisRef, oArguments, false], 0);
			this.oApp.exec("MSG_FULL_PLUGIN_LOADED", [sFilename, sClassName, sMsgName, oThisRef, oArguments, false]);
		}else{
			this._loadFullPlugin(aFilenames, sClassName, sMsgName, oThisRef, oArguments, 0);
		}
	},
	
	_loadFullPlugin : function(aFilenames, sClassName, sMsgName, oThisRef, oArguments, nIdx){
		jindo.LazyLoading.load(nhn.husky.SE2M_Configuration.LazyLoad.sJsBaseURI+"/"+aFilenames[nIdx], 
			jindo.$Fn(function(aFilenames, sClassName, sMsgName, oThisRef, oArguments, nIdx){
				var sCurFilename = aFilenames[nIdx];

				// plugin filename
				var sFilename = aFilenames[0];
				if(nIdx == aFilenames.length-1){
					this.htLazyLoadRequest_plugins[sFilename].nStatus=2;
					this.oApp.exec("MSG_FULL_PLUGIN_LOADED", [aFilenames, sClassName, sMsgName, oThisRef, oArguments]);
					return;
				}
				//this.oApp.exec("LOAD_FULL_PLUGIN", [aFilenames, sClassName, sMsgName, oThisRef, oArguments, nIdx+1]);
				this._loadFullPlugin(aFilenames, sClassName, sMsgName, oThisRef, oArguments, nIdx+1);
			}, this).bind(aFilenames, sClassName, sMsgName, oThisRef, oArguments, nIdx),
			
			"utf-8"
		);
	},
	
	$ON_MSG_FULL_PLUGIN_LOADED : function(aFilenames, sClassName, sMsgName, oThisRef, oArguments, oRes){
		// oThisRef.$this는 현재 로드되는 플러그인이 parent 인스턴스일 경우 존재 함. oThisRef.$this는 현재 플러그인(oThisRef)를 parent로 삼고 있는 인스턴스
		// oThisRef에 $this 속성이 없다면 parent가 아닌 일반 인스턴스
		// oPluginRef는 결과적으로 상속 관계가 있다면 자식 인스턴스를 아니라면 일반적인 인스턴스를 가짐
		var oPluginRef = oThisRef.$this || oThisRef;
		
		var sFilename = aFilenames;

		// now the source code is loaded, remove the loader handlers
		for(var i=0, nLen=oThisRef._huskyFLT.length; i<nLen; i++){
			var sLoaderHandlerName = "$BEFORE_"+oThisRef._huskyFLT[i];
			
			// if child class has its own loader function, remove the loader from current instance(parent) only
			var oRemoveFrom = (oThisRef.$this && oThisRef[sLoaderHandlerName])?oThisRef:oPluginRef;
			oRemoveFrom[sLoaderHandlerName] = null;
			this.oApp.createMessageMap(sLoaderHandlerName);
		}

		var oPlugin = eval(sClassName+".prototype");
		//var oPlugin = eval("new "+sClassName+"()");

		var bAcceptLocalBeforeFirstAgain = false;
		// if there were no $LOCAL_BEFORE_FIRST in already-loaded script, set to accept $LOCAL_BEFORE_FIRST next time as the function could be included in the lazy-loaded script.
		if(typeof oPluginRef["$LOCAL_BEFORE_FIRST"] !== "function"){
			this.oApp.acceptLocalBeforeFirstAgain(oPluginRef, true);
		}
		
		for(var x in oPlugin){
			// 자식 인스턴스에 parent를 override하는 함수가 없다면 parent 인스턴스에 함수 복사 해 줌. 이때 함수만 복사하고, 나머지 속성들은 현재 인스턴스에 존재 하지 않을 경우에만 복사.
			if(oThisRef.$this && (!oThisRef[x] || (typeof oPlugin[x] === "function" && x != "constructor"))){
				oThisRef[x] = jindo.$Fn(oPlugin[x], oPluginRef).bind();
			}

			// 현재 인스턴스에 함수 복사 해 줌. 이때 함수만 복사하고, 나머지 속성들은 현재 인스턴스에 존재 하지 않을 경우에만 복사
			if(oPlugin[x] && (!oPluginRef[x] || (typeof oPlugin[x] === "function" && x != "constructor"))){
				oPluginRef[x] = oPlugin[x];

				// 새로 추가되는 함수가 메시지 핸들러라면 메시지 매핑에 추가 해 줌
				if(x.match(/^\$(LOCAL|BEFORE|ON|AFTER)_/)){
					this.oApp.addToMessageMap(x, oPluginRef);
				}
			}
		}
		
		if(bAcceptLocalBeforeFirstAgain){
			this.oApp.acceptLocalBeforeFirstAgain(oPluginRef, true);
		}
		
		// re-send the message after all the jindo.$super handlers are executed
		if(!oThisRef.$this){
			this.oApp.exec(sMsgName, oArguments);
		}
	},
	
	$ON_LOAD_HTML : function(sId){
		if(this.htHTMLLoaded[sId]) return;
		
		var elTextarea = jindo.$("_llh_"+sId);
		if(!elTextarea) return;

		this.htHTMLLoaded[sId] = true;
		
		var elTmp = document.createElement("DIV");
		elTmp.innerHTML = elTextarea.value;

		while(elTmp.firstChild){
			elTextarea.parentNode.insertBefore(elTmp.firstChild, elTextarea);
		}
	},

	$ON_EXEC_ON_READY_FUNCTION : function(){
		if(typeof this.oApp.htRunOptions.fnOnAppReady == "function"){this.oApp.htRunOptions.fnOnAppReady();}
	}
});