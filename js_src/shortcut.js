/**
 * @classDescription shortcut
 * @author AjaxUI Lab - mixed
 */

function Shortcut(sKey,sId){
	var store = Shortcut.Store;
	var action = Shortcut.Action;
	if(typeof sId === "undefined"&&sKey.constructor == String){
		store.set("document",sKey,document);
		return action.init(store.get("document"),sKey);
	}else if(sId.constructor == String&&sKey.constructor == String){
		store.set(sId,sKey,$(sId));
		return action.init(store.get(sId),sKey);
	}else if(sId.constructor != String&&sKey.constructor == String){
		var fakeId = "nonID"+new Date().getTime();
		fakeId = Shortcut.Store.searchId(fakeId,sId);
		store.set(fakeId,sKey,sId);
		return action.init(store.get(fakeId),sKey);
	}
	alert(sId+unescape(" must be a String or null"));
};


Shortcut.Store = {
	anthorKeyHash:{},
	datas:{},
	currentId:"",
	currentKey:"",
	searchId:function(sId,oElement){
		$H(this.datas).forEach(function(oValue,sKey){
			if(oElement == oValue.element){
				sId = sKey;
				$H.Break();
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
		$H(this.datas).forEach($Fn(function(value,key) {
			this.reset(key); 
		},this).bind());
	}
};

Shortcut.Data = $Class({
	$init:function(sId,sKey,oElement){
		this.id = sId;
		this.element = oElement;
		this.func = $Fn(this.fire,this);
		Shortcut.Helper.bind(this.func,oElement,"attach");
		this.keys = {};
		this.createKey(sKey);		
	},
	createKey:function(sKey){
		this.keys[sKey] = {};
		var data = this.keys[sKey];
		data.key = sKey;
		data.events = [];
		data.commonExceptions = [];
		data.keyAnalysis = Shortcut.Helper.keyInterpretor(sKey);
		data.stopDefalutBehavior = true;
		
		return this;
	},
	fire:function(weEvent){
		$H(this.keys).forEach($Fn(function(value,key){
			this.excute(weEvent,key);
		},this).bind());
	},
	excute:function(weEvent,sRawKey){
		var isExcute = true;
		var staticFun = Shortcut.Helper;
		var data = this.keys[sRawKey];
		
		if(staticFun.isCorrect(weEvent.key(),data.keyAnalysis)&&
		   staticFun.notCommonException(weEvent,data.commonExceptions)){
			$A(data.events).forEach(function(v){
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
							weEvent.stop();
						}else{
							$A.Break();
						}
					}else{
						v.event(weEvent);
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
		commonExceptions = $A(commonExceptions).filter(function(exception){
								 return exception!=fpException;
						   }).$value();
	},
	removeEvent:function(fpEvent,sRawKey){
		var events = this.keys[sRawKey].events;
		events = $A(events).filter(function(event) {
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
		var wKeyArray = $A(keyArray);
		var returnVal = {};

		var specialKeys = {ctrl :false,
						   shift:false,
						   meta :false,
						   alt  :false};
						
		wKeyArray = wKeyArray.filter(function(v){
						if(v=="ctrl"||v=="shift"||v=="meta"||v=="alt"){
							specialKeys[v] = true;
							return false;
						}else{
							return true;
						}
					});
		
					
		returnVal.specialKeys = specialKeys;
		
		var key = wKeyArray.$value()[0];
		if(key){
			returnVal.keyCode = Shortcut.Store.anthorKeyHash[key]||key.toLowerCase().charCodeAt(0);
		}else{
			returnVal.keyCode = false;
		}
		return returnVal;
	},
	isCorrect:function(oKey,keyAnalysis){
		
		var specialKeys = keyAnalysis.specialKeys;
		var compareKeyCode = String.fromCharCode(oKey.keyCode).toLowerCase().charCodeAt(0);                     
		
		if(oKey.shift     == specialKeys.shift&&
		   oKey.ctrl      == specialKeys.ctrl&&
		   oKey.alt       == specialKeys.alt&&
		   !!oKey.meta    == specialKeys.meta&&
		   compareKeyCode == keyAnalysis.keyCode){
			  return true;
		}            
		
		return false;
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
			if(this.aEvents.event==fpEvent){
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
	   wfFunc[sType](oElement,"keydown");
	}
};



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
		backspace : 8,
		tab		  : 9,
		enter	  : 13,
		esc		  : 27,
		space	  : 32,
		pageup	  : 33,
		pagedown  : 34,
		end		  : 35,
		home	  : 36,
		left	  : 37,
		up		  : 38,
		right	  : 39,
		down	  : 40,
		del	  	  : 46,
		comma	  : 188,//(,)
		period	  : 190,//(.)
		slash	  : 191//(/),
	};
	var hash = Shortcut.Store.anthorKeyHash;
	var agent = $Agent().navigator();
	if(agent.ie||agent.safari){
		hash.hyphen = 189;//(-)
		hash.equal  = 187;//(=)
	}else{
		hash.hyphen = 109;
		hash.equal  = 61;
	}
})();
var shortcut = Shortcut;