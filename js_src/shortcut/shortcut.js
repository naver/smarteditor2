/**
 * @classDescription shortcut
 * @author AjaxUI Lab - mixed
 */

function Shortcut(sKey,sId){
	var sKey = sKey.replace(/\s+/g,"");
	var store = Shortcut.Store;
	var action = Shortcut.Action;
	if(typeof sId === "undefined"&&sKey.constructor == String){
		store.set("document",sKey,document);
		return action.init(store.get("document"),sKey);
	}else if(sId.constructor == String&&sKey.constructor == String){
		store.set(sId,sKey,jindo.$(sId));
		return action.init(store.get(sId),sKey);
	}else if(sId.constructor != String&&sKey.constructor == String){
		var fakeId = "nonID"+new Date().getTime();
		fakeId = Shortcut.Store.searchId(fakeId,sId);
		store.set(fakeId,sKey,sId);
		return action.init(store.get(fakeId),sKey);
	}
	alert(sId+"는 반드시 string이거나  없어야 됩니다.");
};


Shortcut.Store = {
	anthorKeyHash:{},
	datas:{},
	currentId:"",
	currentKey:"",
	searchId:function(sId,oElement){
		jindo.$H(this.datas).forEach(function(oValue,sKey){
			if(oElement == oValue.element){
				sId = sKey;
				jindo.$H.Break();
			}
		});
		return sId;
	},
	set:function(sId,sKey,oElement){
		this.currentId = sId;
		this.currentKey = sKey;
		var idData = this.get(sId);
		this.datas[sId] =  idData?idData.createKey(sKey):new Shortcut.Data(sId,sKey,oElement);
	},
	get:function(sId,sKey){
		if(sKey){
			return this.datas[sId].keys[sKey];
		}else{
			return this.datas[sId];
		}
	},              
	reset:function(sId){
		var data = this.datas[sId];
		Shortcut.Helper.bind(data.func,data.element,"detach");
		
		delete this.datas[sId];		       
	},
	allReset: function(){
		jindo.$H(this.datas).forEach(jindo.$Fn(function(value,key) {
			this.reset(key); 
		},this).bind());
	}
};

Shortcut.Data = jindo.$Class({
	$init:function(sId,sKey,oElement){
		this.id = sId;
		this.element = oElement;
		this.func = jindo.$Fn(this.fire,this).bind();
		
		Shortcut.Helper.bind(this.func,oElement,"attach");
		this.keys = {};
		this.keyStemp = {};
		this.createKey(sKey);		
	},
	createKey:function(sKey){
		this.keyStemp[Shortcut.Helper.keyInterpretor(sKey)] = sKey;
		this.keys[sKey] = {};
		var data = this.keys[sKey];
		data.key = sKey;
		data.events = [];
		data.commonExceptions = [];
//		data.keyAnalysis = Shortcut.Helper.keyInterpretor(sKey);
		data.stopDefalutBehavior = true;
		
		return this;
	},
	getKeyStamp : function(eEvent){
		
		
		var sKey     = eEvent.keyCode || eEvent.charCode;
		var returnVal = "";
		
		returnVal += eEvent.altKey?"1":"0";
		returnVal += eEvent.ctrlKey?"1":"0";
		returnVal += eEvent.metaKey?"1":"0";
		returnVal += eEvent.shiftKey?"1":"0";
		returnVal += sKey;
		return returnVal;
	},
	fire:function(eEvent){
		eEvent = eEvent||window.eEvent;
		
		var oMatchKeyData = this.keyStemp[this.getKeyStamp(eEvent)];
		
		if(oMatchKeyData){
			this.excute(new jindo.$Event(eEvent),oMatchKeyData);
		}
		
	},
	excute:function(weEvent,sRawKey){
		var isExcute = true;
		var staticFun = Shortcut.Helper;
		var data = this.keys[sRawKey];
		
		if(staticFun.notCommonException(weEvent,data.commonExceptions)){
			jindo.$A(data.events).forEach(function(v){
				if(data.stopDefalutBehavior){
					var leng = v.exceptions.length;
					if(leng){
						for(var i=0;i<leng;i++){
							if(!v.exception[i](weEvent)){
								isExcute = false;
								break;
							}
						}
						if(isExcute){
							v.event(weEvent);
							if(jindo.$Agent().navigator().ie){
								var e = weEvent._event;
								e.keyCode = "";
								e.charCode = "";
							}
							weEvent.stop();
						}else{
							jindo.$A.Break();
						}
					}else{
						v.event(weEvent);
						if(jindo.$Agent().navigator().ie){
							var e = weEvent._event;
							e.keyCode = "";
							e.charCode = "";
						}
						weEvent.stop();
					}
				}
			});
		}
	},
	addEvent:function(fpEvent,sRawKey){
		var events = this.keys[sRawKey].events;
		if(!Shortcut.Helper.hasEvent(fpEvent,events)){
			events.push({
				event:fpEvent,
				exceptions:[]
			});
		};
	},
	addException:function(fpException,sRawKey){
		var commonExceptions = this.keys[sRawKey].commonExceptions;
		if(!Shortcut.Helper.hasException(fpException,commonExceptions)){
			commonExceptions.push(fpException);
		};
	},
	removeException:function(fpException,sRawKey){
		var commonExceptions = this.keys[sRawKey].commonExceptions;
		commonExceptions = jindo.$A(commonExceptions).filter(function(exception){
								 return exception!=fpException;
						   }).$value();
	},
	removeEvent:function(fpEvent,sRawKey){
		var events = this.keys[sRawKey].events;
		events = jindo.$A(events).filter(function(event) {
					 return event!=fpEvent;
				 }).$value();
		this.unRegister(sRawKey);
	},
	unRegister:function(sRawKey){
		var aEvents = this.keys[sRawKey].events;
		
		if(aEvents.length)
			delete this.keys[sRawKey];
			
		var hasNotKey = true;
		for(var i in this.keys){
			hasNotKey  =false;
			break;
		}
		
		if(hasNotKey){
			Shortcut.Helper.bind(this.func,this.element,"detach");
			delete Shortcut.Store.datas[this.id];
		}
		
	},
	startDefalutBehavior: function(sRawKey){
		 this._setDefalutBehavior(sRawKey,false);
	},
	stopDefalutBehavior: function(sRawKey){
		 this._setDefalutBehavior(sRawKey,true);
	},
	_setDefalutBehavior: function(sRawKey,bType){
		this.keys[sRawKey].stopDefalutBehavior = bType;
	}
});

Shortcut.Helper = {
	keyInterpretor:function(sKey){
		var keyArray = sKey.split("+");
		var wKeyArray = jindo.$A(keyArray);
		
		var returnVal = "";
		
		returnVal += wKeyArray.has("alt")?"1":"0";
		returnVal += wKeyArray.has("ctrl")?"1":"0";
		returnVal += wKeyArray.has("meta")?"1":"0";
		returnVal += wKeyArray.has("shift")?"1":"0";
		
		var wKeyArray = wKeyArray.filter(function(v){
			return !(v=="alt"||v=="ctrl"||v=="meta"||v=="shift")
		});
		var key = wKeyArray.$value()[0];
		
		if(key){
			
			var sKey  = Shortcut.Store.anthorKeyHash[key.toUpperCase()]||key.toUpperCase().charCodeAt(0);
			returnVal += sKey;
		}
		
		return returnVal;
	},
	notCommonException:function(e,exceptions){
		var leng = exceptions.length;
		for(var i=0;i<leng ;i++){
			if(!exceptions[i](e))
				return false;
		}
		return true;
	},
	hasEvent:function(fpEvent,aEvents){
		var nLength = aEvents.length;
		for(var i=0; i<nLength; ++i){
			if(aEvents.event==fpEvent){
				return true;
			}
		};
		return false;
	},
	hasException:function(fpException,commonExceptions){
		var nLength = commonExceptions.length;
		for(var i=0; i<nLength; ++i){
			if(commonExceptions[i]==fpException){
				return true;
			}
		};
		return false;
	},
	bind:function(wfFunc,oElement,sType){
	   if(sType=="attach"){
	   	 domAttach(oElement,"keydown",wfFunc);
	   }else{
	   	 domDetach(oElement,"keydown",wfFunc);
	   }
	}
	
};

(function domAttach (){
	if(document.addEventListener){
		window.domAttach = function(dom,ev,fn){
			dom.addEventListener(ev, fn, false);		
		}
	}else{
		window.domAttach = function(dom,ev,fn){
			dom.attachEvent("on"+ev, fn);		
		}
	}
})();

(function domDetach (){
	if(document.removeEventListener){
		window.domDetach = function(dom,ev,fn){
			dom.removeEventListener(ev, fn, false);		
		}
	}else{
		window.domDetach = function(dom,ev,fn){
			dom.detachEvent("on"+ev, fn);		
		}
	}
})();



Shortcut.Action ={
	init:function(oData,sRawKey){
		this.dataInstance = oData;
		this.rawKey = sRawKey;
		return this;
	},
	addEvent:function(fpEvent){
		this.dataInstance.addEvent(fpEvent,this.rawKey);		                                        
		return this;
	},
	removeEvent:function(fpEvent){
		this.dataInstance.removeEvent(fpEvent,this.rawKey);
		return this;
	},
	addException : function(fpException){
		this.dataInstance.addException(fpException,this.rawKey);
		return this;
	},
	removeException : function(fpException){
		this.dataInstance.removeException(fpException,this.rawKey);
		return this;
	},
//	addCommonException : function(fpException){
//		return this;
//	},
//	removeCommonEexception : function(fpException){
//		return this;
//	},
	startDefalutBehavior: function(){ 
		this.dataInstance.startDefalutBehavior(this.rawKey);
		return this;
	},
	stopDefalutBehavior: function(){ 
		this.dataInstance.stopDefalutBehavior(this.rawKey);
		return this;
	},
	resetElement: function(){ 
		Shortcut.Store.reset(this.dataInstance.id);
		return this;
	},
	resetAll: function(){
		Shortcut.Store.allReset();
		return this;
	}
};

(function (){
	Shortcut.Store.anthorKeyHash = {
		BACKSPACE : 8,
		TAB		  : 9,
		ENTER	  : 13,
		ESC		  : 27,
		SPACE	  : 32,
		PAGEUP	  : 33,
		PAGEDOWN  : 34,
		END		  : 35,
		HOME	  : 36,
		LEFT	  : 37,
		UP		  : 38,
		RIGHT	  : 39,
		DOWN	  : 40,
		DEL	  	  : 46,
		COMMA	  : 188,//(,)
		PERIOD	  : 190,//(.)
		SLASH	  : 191//(/),
	};
	var hash = Shortcut.Store.anthorKeyHash;
	for(var i=1 ; i < 13 ; i++){
		Shortcut.Store.anthorKeyHash["F"+i] = i+111;
	}
	var agent = jindo.$Agent().navigator();
	if(agent.ie||agent.safari||agent.chrome){
		hash.HYPHEN = 189;//(-)
		hash.EQUAL  = 187;//(=)
	}else{
		hash.HYPHEN = 109;
		hash.EQUAL  = 61;
	}
})();
var shortcut = Shortcut;