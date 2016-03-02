/**
 * @pluginDesc 스트링 변환 함수를 규칙명으로 등록 해 두고 이후 등록된 규칙 명으로 변환 함수를 일괄 적용한다.
 */
nhn.husky.StringConverterManager = $Class({
	name : "StringConverterManager",

	oConverters : null,

	$init : function(){
		this.oConverters = {};
	},
	
	$BEFORE_MSG_APP_READY : function(){
		this.oApp.exec("ADD_APP_PROPERTY", ["applyConverter", $Fn(this.applyConverter, this).bind()]);
		this.oApp.exec("ADD_APP_PROPERTY", ["addConverter", $Fn(this.addConverter, this).bind()]);
	},

	applyConverter : function(sRuleName, sContent){
		var aConverters = this.oConverters[sRuleName];
		if(!aConverters) return sContent;

		for(var i=0; i<aConverters.length; i++) sContent = aConverters[i](sContent);

		return sContent;
	},

	addConverter : function(sRuleName, funcConverter){
		var aConverters = this.oConverters[sRuleName];
		if(!aConverters) this.oConverters[sRuleName] = [];

		this.oConverters[sRuleName][this.oConverters[sRuleName].length] = funcConverter;
	}
});