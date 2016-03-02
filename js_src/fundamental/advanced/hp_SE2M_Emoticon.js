//{
/**
 * @fileOverview This file contains Husky plugin that takes care of the operations related to inserting special charactersg
 * @name hp_SE2M_SCharacter.js
 * @required HuskyRangeManager
 */
nhn.husky.SE2M_Emoticon = jindo.$Class({
	name : "SE2M_Emoticon",
	
	// URL_DELETE : "http://api.se2.naver.com/1/ImageDelete.nhn?url=",
	// URL_GET_LIST : "http://api.se2.naver.com/1/ImageList.nhn",
	// URL_UPLOAD : "http://api.se2.naver.com/1/ImageUpload.nhn",

	$ON_MSG_APP_READY : function(){
		var htOptions = nhn.husky.SE2M_Configuration.SE2M_Emoticon;
		if(htOptions){
			this.sImgBaseURL = htOptions.sImgBaseURL || "img/emoticon/";
			// this.sUserImgBaseURL = htOptions.sUserImgBaseURL || "http://api.se2.naver.com/1/emoticon-uploader/images/";
			// this.sCallbackURL = htOptions.sCallbackURL || 'http://static.se2.naver.com/static/callback.nhn';
		}

		this.oApp.exec("REGISTER_UI_EVENT", ["emoticon", "click", "TOGGLE_EMOTICON_LAYER"]);
	},
	//@lazyload_js TOGGLE_EMOTICON_LAYER[
	_assignHTMLObjects : function(oAppContainer){
		this.elDropdownLayer = jindo.$$.getSingle("DIV.husky_se2m_emoticon_layer", oAppContainer);
		var elLabelUL = jindo.$$.getSingle("UL.se2_imo_tab", this.elDropdownLayer);
		this.aLabel = jindo.$$(">LI", elLabelUL);
		this.aListUL = jindo.$$("DIV>UL", elLabelUL);
		this.bListDrawn = [];
	},
	
	$LOCAL_BEFORE_FIRST : function(){
		this.bIE = jindo.$Agent().navigator().ie;

		this._assignHTMLObjects(this.oApp.htOptions.elAppContainer);
		
		this.aEmoticonList = [];
		this.aEmoticonList[0] = ('1_01.gif 1_02.gif 1_03.gif 1_04.gif 1_05.gif 1_06.gif 1_07.gif 1_08.gif 1_09.gif 1_10.gif '+
							'1_11.gif 1_12.gif 1_13.gif 1_14.gif 1_15.gif 1_16.gif 1_17.gif 1_18.gif 1_19.gif 1_20.gif '+
							'1_21.gif 1_22.gif 1_23.gif 1_24.gif 1_25.gif 1_26.gif 1_27.gif 1_28.gif 1_29.gif 1_30.gif '+
							'1_31.gif 1_32.gif 1_33.gif 1_34.gif 1_35.gif 1_36.gif 1_37.gif 1_38.gif 1_39.gif 1_40.gif '+
							'1_41.gif 1_42.gif 1_43.gif 1_44.gif 1_45.gif 1_46.gif 1_47.gif 1_48.gif 1_49.gif 1_50.gif').split(' ');

		this.aEmoticonList[1] = ('2_01.gif 2_02.gif 2_03.gif 2_04.gif 2_05.gif 2_06.gif 2_07.gif 2_08.gif 2_09.gif 2_10.gif '+
							'2_11.gif 2_12.gif 2_13.gif 2_14.gif 2_15.gif 2_16.gif 2_17.gif 2_18.gif 2_19.gif 2_20.gif '+
							'2_21.gif 2_22.gif 2_23.gif 2_24.gif 2_25.gif 2_26.gif 2_27.gif 2_28.gif 2_29.gif 2_30.gif '+
							'2_31.gif 2_32.gif 2_33.gif 2_34.gif 2_35.gif 2_36.gif 2_37.gif 2_38.gif 2_39.gif 2_40.gif '+
							'2_41.gif 2_42.gif 2_43.gif 2_44.gif 2_45.gif 2_46.gif 2_47.gif 2_48.gif 2_49.gif 2_50.gif').split(' ');

		this.aEmoticonList[2] = ('3_01.gif 3_02.gif 3_03.gif 3_04.gif 3_05.gif 3_06.gif 3_07.gif 3_08.gif 3_09.gif 3_10.gif '+
							'3_11.gif 3_12.gif 3_13.gif 3_14.gif 3_15.gif 3_16.gif 3_17.gif 3_18.gif 3_19.gif 3_20.gif '+
							'3_21.gif 3_22.gif 3_23.gif 3_24.gif 3_25.gif 3_26.gif 3_27.gif 3_28.gif 3_29.gif 3_30.gif '+
							'3_31.gif 3_32.gif 3_33.gif 3_34.gif 3_35.gif 3_36.gif 3_37.gif 3_38.gif 3_39.gif 3_40.gif '+
							'3_41.gif 3_42.gif 3_43.gif 3_44.gif 3_45.gif 3_46.gif 3_47.gif 3_48.gif').split(' ');

		this.aEmoticonList[3] = ('4_01.gif 4_02.gif 4_03.gif 4_04.gif 4_05.gif 4_06.gif 4_07.gif 4_08.gif 4_09.gif 4_10.gif '+
							'4_11.gif 4_12.gif 4_13.gif 4_14.gif 4_15.gif 4_16.gif 4_17.gif 4_18.gif 4_19.gif 4_20.gif '+
							'4_21.gif 4_22.gif 4_23.gif 4_24.gif 4_25.gif 4_26.gif 4_27.gif 4_28.gif 4_29.gif 4_30.gif '+
							'4_31.gif 4_32.gif 4_33.gif 4_34.gif 4_35.gif 4_36.gif 4_37.gif 4_38.gif 4_39.gif 4_40.gif '+
							'4_41.gif 4_42.gif').split(' ');

		this.aEmoticonList[4] = ('5_01.gif 5_02.gif 5_03.gif 5_04.gif 5_05.gif 5_06.gif 5_07.gif 5_08.gif 5_09.gif 5_10.gif '+
							'5_11.gif 5_12.gif 5_13.gif 5_14.gif 5_15.gif 5_16.gif 5_17.gif 5_18.gif 5_19.gif 5_20.gif '+
							'5_21.gif 5_22.gif 5_23.gif 5_24.gif 5_25.gif 5_26.gif 5_27.gif 5_28.gif 5_29.gif 5_30.gif '+
							'5_31.gif 5_32.gif 5_33.gif 5_34.gif 5_35.gif 5_36.gif 5_37.gif 5_38.gif 5_39.gif 5_40.gif '+
							'5_41.gif 5_42.gif 5_43.gif 5_44.gif 5_45.gif 5_46.gif 5_47.gif 5_48.gif 5_49.gif 5_50.gif').split(' ');

		this.aEmoticonList[5] = ('').split(' ');

		for(var i=0; i<this.aLabel.length; i++){
			var func = jindo.$Fn(this.oApp.exec, this.oApp).bind("CHANGE_EMOTICON_SET", [i]);
			jindo.$Fn(func, this).attach(this.aLabel[i].firstChild, "mousedown");
		}

		this.oApp.registerBrowserEvent(this.elDropdownLayer, "click", "EVENT_EMOTICON_CLICKED", []);

		this._drawEmoticonList(0);

		//this._initEmoticonUploader();
		//this._requestUserEmoticonList();
	},
	
	$ON_TOGGLE_EMOTICON_LAYER : function(){
		this.oSelection = this.oApp.getSelection();
		this.oApp.exec("TOGGLE_TOOLBAR_ACTIVE_LAYER", [this.elDropdownLayer, null, "SELECT_UI", ["emoticon"], "DESELECT_UI", ["emoticon"]]);
		
		this.oApp.exec('MSG_NOTIFY_CLICKCR', ['emoticon']);
	},

	$ON_CHANGE_EMOTICON_SET : function(nEmoticonSet){
		for(var i=0; i<this.aLabel.length; i++){
			if(jindo.$Element(this.aLabel[i]).hasClass("active")){
				if(i == nEmoticonSet){return;}

				jindo.$Element(this.aLabel[i]).removeClass("active");
				this.aListUL[i].parentNode.style.display = "none";
			}
		}

		this._drawEmoticonList(nEmoticonSet);
		jindo.$Element(this.aLabel[nEmoticonSet]).addClass("active");
		this.aListUL[nEmoticonSet].parentNode.style.display = "block";
	},

	$ON_EVENT_EMOTICON_CLICKED : function(weEvent){
		var elButton = nhn.husky.SE2M_Utils.findAncestorByTagName("BUTTON", weEvent.element);
		if(!elButton || elButton.tagName != "BUTTON"){return;}

		if(elButton.parentNode.tagName != "LI"){return;}
		
		if(!elButton.firstChild || elButton.firstChild.firstChild.tagName != "IMG"){
			if(elButton.className == "se2_del2"){
				if(confirm("정말 삭제 하시겠습니까?")){
					this._deleteEmoticon(jindo.$$.getSingle("IMG", elButton.parentNode));
				}
				return;
			}else{
				return;
			}
		}
		
		var elImg = jindo.$$.getSingle("IMG", elButton);

		this.oApp.exec("PASTE_HTML", ["<img src="+elImg.src+">"]);
		this.oApp.exec("TOGGLE_EMOTICON_LAYER", []);
		
		weEvent.stop();
	},
	
	// _requestUserEmoticonList : function(){
		// var sUrl = this.URL_GET_LIST;
		// jindo.$Ajax(sUrl, {
			// type : "flash",
			// sendheader : false,
			// onload : jindo.$Fn(this._onUserEmoticonListReceived, this).bind()
		// }).request();
	// },
	
	// _onUserEmoticonListReceived : function(htResponse){
		// aList = htResponse.json()["result"];
		// this.aEmoticonList[5] = [];
		// for(var i=0, nLen=aList.length; i<nLen; i++){
			// this.aEmoticonList[5][i] = aList[i]["url"].replace(/.+\//,"");
		// }
	// },
	
	// _deleteEmoticon : function(elImg){
		// var nIdx = parseInt(elImg.getAttribute("_se2_emoticon_idx"), 10);
		// var sSrc = elImg.src;

		// if(nIdx !== 0 && !nIdx){return;}

		// this.aEmoticonList[this.nCurEmoticonSet].splice(nIdx, 1);
		
		// this.bListDrawn[this.nCurEmoticonSet] = false;
		// this._drawEmoticonList(this.nCurEmoticonSet);
		
		// var sUrl = this.URL_DELETE+elImg.src;
		// jindo.$Ajax(sUrl,{
			// type : "flash",
			// sendheader : false
		// }).request();
	// },

	// _addEmoticon : function(sImgSrc){
		// this.aEmoticonList[this.nCurEmoticonSet][this.aEmoticonList[this.nCurEmoticonSet].length] = sImgSrc.replace(/.+\//, "");
		
		// this.bListDrawn[this.nCurEmoticonSet] = false;
		// this._drawEmoticonList(this.nCurEmoticonSet);
	// },
	
	_drawEmoticonList : function(i){
		if(this.bListDrawn[i]){return;}
		this.bListDrawn[i] = true;
		
		this.nCurEmoticonSet = i;

		var len = this.aEmoticonList[i].length;
		var aLI = new Array(len);

		this.aListUL[i].innerHTML = '';
		
		// var bUserImg = (i == this.aEmoticonList.length-1)?true:false;
		var sBaseURL;
		// if(bUserImg){
			// sBaseURL = this.sUserImgBaseURL;
		// }else{
			sBaseURL = this.sImgBaseURL;
		// }

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
			span.innerHTML = "<img _se2_emoticon_idx='"+ii+"' src='"+sBaseURL+this.aEmoticonList[i][ii]+"' style='width:19px; height:19px'>";
			button.appendChild(span);

			aLI[ii].onmouseover = function(){this.className='hover'};
			aLI[ii].onmouseout = function(){this.className=''};

			aLI[ii].appendChild(button);
			
			// if(bUserImg){
				// if(this.bIE){
					// button = jindo.$("<BUTTON>");
					// button.setAttribute('type', 'button');
				// }else{
					// button = jindo.$("<BUTTON>");
					// button.type = "button";
				// }
				// button.className = "se2_del2";
				// span = jindo.$("<SPAN>");
				// span.innerHTML = "삭제";
				
				// button.appendChild(span);

				// aLI[ii].appendChild(button);
			// }
			this.aListUL[i].appendChild(aLI[ii]);
		}

		//this.oApp.delayedExec("SE2_ATTACH_HOVER_EVENTS", [aLI]);
	}//,
	
	// _initEmoticonUploader : function(){
		// if(typeof window.SE2EmoticonCallback == 'undefined'){
			// window.SE2EmoticonCallback = [];
		// }
		// this.nEmoticonCallbackIdx = window.SE2EmoticonCallback.length;
		// window.SE2EmoticonCallback[this.nEmoticonCallbackIdx] = {};
		

		// var oFileUploader = new jindo.FileUploader(jindo.$("emoticon_upload"),{
			// sUrl  : this.URL_UPLOAD, //업로드할 서버의 url (Form 전송의 대상)
			// sCallback : this.sCallbackURL, //업로드 이후에 iframe이 redirect될 콜백페이지의 주소
			// sFiletype : "*.*", //허용할 파일의 형식. ex) "*.jpg"
			// sMsgNotAllowedExt : '업로드가 허용되지 않는 파일형식입니다', //허용할 파일의 형식이 아닌경우에 띄워주는 경고창의 문구
			// bAutoUpload : true //파일이 선택됨과 동시에 자동으로 업로드를 수행할지 여부 (upload 메소드 수행)
		// }).attach({
			// success : jindo.$Fn(function(oCustomEvent) {
				// this._addEmoticon(oCustomEvent.htResult.file_uri);
			// }, this).bind(),
			// error : function(oCustomEvent) {
				// alert(oCustomEvent.htResult.errstr);
			// }
		// });

		// new nhn.BrowseButton(jindo.$("browse-button"));
	// }
	//@lazyload_js]
});
//}