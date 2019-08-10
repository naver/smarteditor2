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
nhn.husky.HuskyCore.addLoadedFile("hp_SE2M_SCharacter$Lazy.js");
/**
 * @depends nhn.husky.SE2M_SCharacter
 * this.oApp.registerLazyMessage(["TOGGLE_SCHARACTER_LAYER"], ["hp_SE2M_SCharacter$Lazy.js"]);
 */
nhn.husky.HuskyCore.mixin(nhn.husky.SE2M_SCharacter, {
	//@lazyload_js TOGGLE_SCHARACTER_LAYER[
	_assignHTMLObjects : function(oAppContainer){
		oAppContainer = jindo.$(oAppContainer) || document;

		this.elDropdownLayer = jindo.$$.getSingle("DIV.husky_seditor_sCharacter_layer", oAppContainer);

		this.oTextField = jindo.$$.getSingle("INPUT", this.elDropdownLayer);
		this.oInsertButton =  jindo.$$.getSingle("BUTTON.se2_confirm", this.elDropdownLayer);
		this.aCloseButton = jindo.$$("BUTTON.husky_se2m_sCharacter_close", this.elDropdownLayer);
		this.aSCharList = jindo.$$("UL.husky_se2m_sCharacter_list", this.elDropdownLayer);
		var oLabelUL = jindo.$$.getSingle("UL.se2_char_tab", this.elDropdownLayer);
		this.aLabel = jindo.$$(">LI", oLabelUL);
	},
	
	$LOCAL_BEFORE_FIRST : function(/* sFullMsg */){
		this.bIE = jindo.$Agent().navigator().ie;

		this._assignHTMLObjects(this.oApp.htOptions.elAppContainer);

		this.charSet = [];
		this.charSet[0] = unescape('FF5B FF5D 3014 3015 3008 3009 300A 300B 300C 300D 300E 300F 3010 3011 2018 2019 201C 201D 3001 3002 %B7 2025 2026 %A7 203B 2606 2605 25CB 25CF 25CE 25C7 25C6 25A1 25A0 25B3 25B2 25BD 25BC 25C1 25C0 25B7 25B6 2664 2660 2661 2665 2667 2663 2299 25C8 25A3 25D0 25D1 2592 25A4 25A5 25A8 25A7 25A6 25A9 %B1 %D7 %F7 2260 2264 2265 221E 2234 %B0 2032 2033 2220 22A5 2312 2202 2261 2252 226A 226B 221A 223D 221D 2235 222B 222C 2208 220B 2286 2287 2282 2283 222A 2229 2227 2228 FFE2 21D2 21D4 2200 2203 %B4 FF5E 02C7 02D8 02DD 02DA 02D9 %B8 02DB %A1 %BF 02D0 222E 2211 220F 266D 2669 266A 266C 327F 2192 2190 2191 2193 2194 2195 2197 2199 2196 2198 321C 2116 33C7 2122 33C2 33D8 2121 2668 260F 260E 261C 261E %B6 2020 2021 %AE %AA %BA 2642 2640').replace(/(\S{4})/g, function(a){return "%u"+a;}).split(' ');
		this.charSet[1] = unescape('%BD 2153 2154 %BC %BE 215B 215C 215D 215E %B9 %B2 %B3 2074 207F 2081 2082 2083 2084 2160 2161 2162 2163 2164 2165 2166 2167 2168 2169 2170 2171 2172 2173 2174 2175 2176 2177 2178 2179 FFE6 %24 FFE5 FFE1 20AC 2103 212B 2109 FFE0 %A4 2030 3395 3396 3397 2113 3398 33C4 33A3 33A4 33A5 33A6 3399 339A 339B 339C 339D 339E 339F 33A0 33A1 33A2 33CA 338D 338E 338F 33CF 3388 3389 33C8 33A7 33A8 33B0 33B1 33B2 33B3 33B4 33B5 33B6 33B7 33B8 33B9 3380 3381 3382 3383 3384 33BA 33BB 33BC 33BD 33BE 33BF 3390 3391 3392 3393 3394 2126 33C0 33C1 338A 338B 338C 33D6 33C5 33AD 33AE 33AF 33DB 33A9 33AA 33AB 33AC 33DD 33D0 33D3 33C3 33C9 33DC 33C6').replace(/(\S{4})/g, function(a){return "%u"+a;}).split(' ');
		this.charSet[2] = unescape('3260 3261 3262 3263 3264 3265 3266 3267 3268 3269 326A 326B 326C 326D 326E 326F 3270 3271 3272 3273 3274 3275 3276 3277 3278 3279 327A 327B 24D0 24D1 24D2 24D3 24D4 24D5 24D6 24D7 24D8 24D9 24DA 24DB 24DC 24DD 24DE 24DF 24E0 24E1 24E2 24E3 24E4 24E5 24E6 24E7 24E8 24E9 2460 2461 2462 2463 2464 2465 2466 2467 2468 2469 246A 246B 246C 246D 246E 3200 3201 3202 3203 3204 3205 3206 3207 3208 3209 320A 320B 320C 320D 320E 320F 3210 3211 3212 3213 3214 3215 3216 3217 3218 3219 321A 321B 249C 249D 249E 249F 24A0 24A1 24A2 24A3 24A4 24A5 24A6 24A7 24A8 24A9 24AA 24AB 24AC 24AD 24AE 24AF 24B0 24B1 24B2 24B3 24B4 24B5 2474 2475 2476 2477 2478 2479 247A 247B 247C 247D 247E 247F 2480 2481 2482').replace(/(\S{4})/g, function(a){return "%u"+a;}).split(' ');
		this.charSet[3] = unescape('3131 3132 3133 3134 3135 3136 3137 3138 3139 313A 313B 313C 313D 313E 313F 3140 3141 3142 3143 3144 3145 3146 3147 3148 3149 314A 314B 314C 314D 314E 314F 3150 3151 3152 3153 3154 3155 3156 3157 3158 3159 315A 315B 315C 315D 315E 315F 3160 3161 3162 3163 3165 3166 3167 3168 3169 316A 316B 316C 316D 316E 316F 3170 3171 3172 3173 3174 3175 3176 3177 3178 3179 317A 317B 317C 317D 317E 317F 3180 3181 3182 3183 3184 3185 3186 3187 3188 3189 318A 318B 318C 318D 318E').replace(/(\S{4})/g, function(a){return "%u"+a;}).split(' ');
		this.charSet[4] = unescape('0391 0392 0393 0394 0395 0396 0397 0398 0399 039A 039B 039C 039D 039E 039F 03A0 03A1 03A3 03A4 03A5 03A6 03A7 03A8 03A9 03B1 03B2 03B3 03B4 03B5 03B6 03B7 03B8 03B9 03BA 03BB 03BC 03BD 03BE 03BF 03C0 03C1 03C3 03C4 03C5 03C6 03C7 03C8 03C9 %C6 %D0 0126 0132 013F 0141 %D8 0152 %DE 0166 014A %E6 0111 %F0 0127 I 0133 0138 0140 0142 0142 0153 %DF %FE 0167 014B 0149 0411 0413 0414 0401 0416 0417 0418 0419 041B 041F 0426 0427 0428 0429 042A 042B 042C 042D 042E 042F 0431 0432 0433 0434 0451 0436 0437 0438 0439 043B 043F 0444 0446 0447 0448 0449 044A 044B 044C 044D 044E 044F').replace(/(\S{4})/g, function(a){return "%u"+a;}).split(' ');
		this.charSet[5] = unescape('3041 3042 3043 3044 3045 3046 3047 3048 3049 304A 304B 304C 304D 304E 304F 3050 3051 3052 3053 3054 3055 3056 3057 3058 3059 305A 305B 305C 305D 305E 305F 3060 3061 3062 3063 3064 3065 3066 3067 3068 3069 306A 306B 306C 306D 306E 306F 3070 3071 3072 3073 3074 3075 3076 3077 3078 3079 307A 307B 307C 307D 307E 307F 3080 3081 3082 3083 3084 3085 3086 3087 3088 3089 308A 308B 308C 308D 308E 308F 3090 3091 3092 3093 30A1 30A2 30A3 30A4 30A5 30A6 30A7 30A8 30A9 30AA 30AB 30AC 30AD 30AE 30AF 30B0 30B1 30B2 30B3 30B4 30B5 30B6 30B7 30B8 30B9 30BA 30BB 30BC 30BD 30BE 30BF 30C0 30C1 30C2 30C3 30C4 30C5 30C6 30C7 30C8 30C9 30CA 30CB 30CC 30CD 30CE 30CF 30D0 30D1 30D2 30D3 30D4 30D5 30D6 30D7 30D8 30D9 30DA 30DB 30DC 30DD 30DE 30DF 30E0 30E1 30E2 30E3 30E4 30E5 30E6 30E7 30E8 30E9 30EA 30EB 30EC 30ED 30EE 30EF 30F0 30F1 30F2 30F3 30F4 30F5 30F6').replace(/(\S{4})/g, function(a){return "%u"+a;}).split(' ');
		
		var funcInsert = jindo.$Fn(this.oApp.exec, this.oApp).bind("INSERT_SCHARACTERS", [this.oTextField.value]);
		jindo.$Fn(funcInsert, this).attach(this.oInsertButton, "click");

		this.oApp.exec("SET_SCHARACTER_LIST", [this.charSet]);

		for(var i=0; i<this.aLabel.length; i++){
			var func = jindo.$Fn(this.oApp.exec, this.oApp).bind("CHANGE_SCHARACTER_SET", [i]);
			jindo.$Fn(func, this).attach(this.aLabel[i].firstChild, "mousedown");
		}

		for(i=0; i<this.aCloseButton.length; i++){
			this.oApp.registerBrowserEvent(this.aCloseButton[i], "click", "HIDE_ACTIVE_LAYER", []);
		}
		
		this.oApp.registerBrowserEvent(this.elDropdownLayer, "click", "EVENT_SCHARACTER_CLICKED", []);
		
		// [SMARTEDITORSUS-1767]
		this.oApp.registerBrowserEvent(this.oTextField, "keydown", "EVENT_SCHARACTER_KEYDOWN");
		// --[SMARTEDITORSUS-1767]
	},
	
	// [SMARTEDITORSUS-1767]
	$ON_EVENT_SCHARACTER_KEYDOWN : function(oEvent){
		if (oEvent.key().enter){
			this.oApp.exec("INSERT_SCHARACTERS");
			oEvent.stop();
		}
	},
	// --[SMARTEDITORSUS-1767]
	
	$ON_TOGGLE_SCHARACTER_LAYER : function(){
		this.oTextField.value = "";
		this.oSelection = this.oApp.getSelection();

		this.oApp.exec("TOGGLE_TOOLBAR_ACTIVE_LAYER", [this.elDropdownLayer, null, "MSG_SCHARACTER_LAYER_SHOWN", [], "MSG_SCHARACTER_LAYER_HIDDEN", [""]]);
		this.oApp.exec('MSG_NOTIFY_CLICKCR', ['symbol']);
	},
	
	$ON_MSG_SCHARACTER_LAYER_SHOWN : function(){
		this.oTextField.focus();
		this.oApp.exec("SELECT_UI", ["sCharacter"]);
	},

	$ON_MSG_SCHARACTER_LAYER_HIDDEN : function(){
		this.oApp.exec("DESELECT_UI", ["sCharacter"]);
	},

	$ON_EVENT_SCHARACTER_CLICKED : function(weEvent){
		var elButton = nhn.husky.SE2M_Utils.findAncestorByTagName("BUTTON", weEvent.element);
		if(!elButton || elButton.tagName != "BUTTON"){return;}

		if(elButton.parentNode.tagName != "LI"){return;}
		
		var sChar = elButton.firstChild.innerHTML;
		if(sChar.length > 1){return;}

		this.oApp.exec("SELECT_SCHARACTER", [sChar]);
		weEvent.stop();
	},

	$ON_SELECT_SCHARACTER : function(schar){
		this.oTextField.value += schar;

		if(this.oTextField.createTextRange){
			var oTextRange = this.oTextField.createTextRange();
			oTextRange.collapse(false);
			oTextRange.select();
		}else{
			if(this.oTextField.selectionEnd){
				this.oTextField.selectionEnd = this.oTextField.value.length;
				this.oTextField.focus();
			}
		}
	},
	
	$ON_INSERT_SCHARACTERS : function(){
		this.oApp.exec("RECORD_UNDO_BEFORE_ACTION", ["INSERT SCHARACTER"]);
		this.oApp.exec("PASTE_HTML", [this.oTextField.value]);
		this.oApp.exec("FOCUS");
		this.oApp.exec("RECORD_UNDO_AFTER_ACTION", ["INSERT SCHARACTER"]);
		
		this.oApp.exec("HIDE_ACTIVE_LAYER", []);
	},

	$ON_CHANGE_SCHARACTER_SET : function(nSCharSet){
		for(var i=0; i<this.aSCharList.length; i++){
			if(jindo.$Element(this.aLabel[i]).hasClass("active")){
				if(i == nSCharSet){return;}
				
				jindo.$Element(this.aLabel[i]).removeClass("active");
			}
		}
		
		this._drawSCharList(nSCharSet);
		jindo.$Element(this.aLabel[nSCharSet]).addClass("active");
	},

	$ON_SET_SCHARACTER_LIST : function(charSet){
		this.charSet = charSet;
		this.bSCharSetDrawn = new Array(this.charSet.length);
		this._drawSCharList(0);
	},

	_drawSCharList : function(i){
		if(this.bSCharSetDrawn[i]){return;}
		this.bSCharSetDrawn[i] = true;

		var len = this.charSet[i].length;
		var aLI = new Array(len);

		this.aSCharList[i].innerHTML = '';

		var button, span;
		for(var ii=0; ii<len; ii++){
			aLI[ii] = jindo.$("<LI>");

			if(this.bIE){
				button = jindo.$("<BUTTON>");
				button.setAttribute('type', 'button');	
			}else{
				button = jindo.$("<BUTTON>");
				button.type = "button";
			}
			span = jindo.$("<SPAN>");
			span.innerHTML = unescape(this.charSet[i][ii]);
			button.appendChild(span);

			aLI[ii].appendChild(button);
			aLI[ii].onmouseover = function(){this.className='hover'};
			aLI[ii].onmouseout = function(){this.className=''};

			this.aSCharList[i].appendChild(aLI[ii]);
		}

		//this.oApp.delayedExec("SE2_ATTACH_HOVER_EVENTS", [jindo.$$(">LI", this.aSCharList[i]), 0]);
	}
	//@lazyload_js]
});