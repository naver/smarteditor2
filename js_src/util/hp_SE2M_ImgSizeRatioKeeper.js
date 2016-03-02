nhn.husky.SE2M_ImgSizeRatioKeeper = jindo.$Class({
	name : "SE2M_ImgSizeRatioKeeper",
	
	$LOCAL_BEFORE_FIRST : function(){
		this.wfnResizeEnd = jindo.$Fn(this._onResizeEnd, this);
	},

	$ON_EVENT_EDITING_AREA_KEYDOWN : function(){
		this._detachResizeEnd();
	},
	
	$ON_EVENT_EDITING_AREA_MOUSEUP : function(wev){
		this._detachResizeEnd();
		if(!wev.element || wev.element.tagName != "IMG"){return;}
		this.oApp.exec("SET_RESIZE_TARGET_IMG", [wev.element]);
	},
	
	$ON_SET_RESIZE_TARGET_IMG : function(elImg){
		if(elImg == this.elImg){return;}
		
		this._detachResizeEnd();
		this._attachResizeEnd(elImg);
	},
	
	_attachResizeEnd : function(elImg){
		this.elImg = elImg;
		this.wfnResizeEnd.attach(this.elImg, "resizeend");
		this.elBorderSize = (elImg.border || 0);
		
		this.nWidth = this.elImg.clientWidth ;
		this.nHeight = this.elImg.clientHeight ;
	},
	
	_detachResizeEnd : function(){
		if(!this.elImg){return;}
		this.wfnResizeEnd.detach(this.elImg, "resizeend");
		this.elImg = null;
	},
	
	_onResizeEnd : function(wev){
		if(wev.element != this.elImg){return;}
		var nRatio, nAfterWidth, nAfterheight, nWidthDiff, nHeightDiff, nborder;
		
		nborder = this.elImg.border || 0;
		nAfterWidth = this.elImg.clientWidth - (nborder*2);
		nAfterheight = this.elImg.clientHeight - (nborder*2);
		
		nWidthDiff = nAfterWidth -  this.nWidth;
		
		//미세한 차이에 크기 변화는 무시. 
		if( -1 <= nWidthDiff && nWidthDiff <= 1){
			nRatio = this.nWidth/this.nHeight;
			nAfterWidth = nRatio * nAfterheight;
		}else{
			nRatio = this.nHeight/this.nWidth;
			nAfterheight = nRatio * nAfterWidth;
		}
		
		this.elImg.style.width = nAfterWidth + "px";
		this.elImg.style.height = nAfterheight + "px";
		this.elImg.setAttribute("width", nAfterWidth );
		this.elImg.setAttribute("height", nAfterheight);
		
		// [SMARTEDITORSUS-299] 마우스 Drag로 이미지 크기 리사이즈 시, 삽입할 때의 저장 사이즈(rwidth/rheight)도 변경해 줌
		this.elImg.style.rwidth = this.elImg.style.width;
		this.elImg.style.rheight = this.elImg.style.height;
		this.elImg.setAttribute("rwidth", this.elImg.getAttribute("width"));
		this.elImg.setAttribute("rheight", this.elImg.getAttribute("height"));
		
		// 아래의 부분은 추후 hp_SE2M_ImgSizeAdjustUtil.js 를 생성하여 분리한다.
		var bAdjustpossible = this._isAdjustPossible(this.elImg.offsetWidth);
		if(!bAdjustpossible){
			this.elImg.style.width = this.nWidth;
			this.elImg.style.height = this.nHeight;
			this.elImg.style.rwidth = this.elImg.style.width;
			this.elImg.style.rheight = this.elImg.style.height;
			
			this.elImg.setAttribute("width", this.nWidth);
			this.elImg.setAttribute("height", this.nHeight);
			this.elImg.setAttribute("rwidth", this.elImg.getAttribute("width"));
			this.elImg.setAttribute("rheight", this.elImg.getAttribute("height"));	
		}
		
		this.oApp.delayedExec("SET_RESIZE_TARGET_IMG", [this.elImg], 0);
	},
	
	
	_isAdjustPossible : function(width){
		var bPossible = true;
		
		// 가로폭 적용하는 경우에만 에디터 본문 안에 보이는 이미지 사이즈를 조절함
		var bRulerUse = (this.oApp.htOptions['SE2M_EditingAreaRuler']) ? this.oApp.htOptions['SE2M_EditingAreaRuler'].bUse : false;
		if(bRulerUse){
			var welWysiwygBody = jindo.$Element(this.oApp.getWYSIWYGDocument().body);
			if(welWysiwygBody){
				var nEditorWidth = welWysiwygBody.width();
				if(width > nEditorWidth){
					bPossible = false;
					alert(this.oApp.$MSG("SE2M_ImgSizeRatioKeeper.exceedMaxWidth").replace("#EditorWidth#", nEditorWidth));
				}
			}
		}
		return bPossible;
	}
});