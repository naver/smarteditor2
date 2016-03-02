	//변수 선언 및 초기화
	var nGrowNum = 0;
	var htImageInfo = {};		//image file정보 저장
	var bUploadStart = false;	//image
	var rFilter = /^(image\/bmp|image\/gif|image\/jpg|image\/jpeg|image\/png)$/i;  
	var rFilter2 = /^(bmp|gif|jpg|jpeg|png)$/i; 
	var nTotalSize = 0;
	var nMaxImageSize = 10*1024*1024;
	var nMaxTotalImageSize = 50*1024*1024;
	var nMaxImageCount = 10;
	var nImageFileCount = 0;
	var bSupportDragAndDropAPI = false;
	var oNavi = jindo.$Agent().navigator();
	var oFileUploader;
	var bAttachEvent = false;
	
	//마크업에 따른 할당
	var elContent= $("pop_content");  
	var elDropArea = jindo.$$.getSingle(".drag_area",elContent);
	var elDropAreaUL = jindo.$$.getSingle(".lst_type",elContent);
	var elCountTxtTxt = jindo.$$.getSingle("#imageCountTxt",elContent);
	var elTotalSizeTxt = jindo.$$.getSingle("#totalSizeTxt",elContent);
	var elTextGuide = $("guide_text");
	var welUploadInputBox = $Element("uploadInputBox");
	var oNavigator = jindo.$Agent().navigator();
	
	//마크업-공통 
	var welBtnConfirm = $Element("btn_confirm");				//확인 버튼
	var welBtnCancel= $Element("btn_cancel");				//취소 버튼
	
	//진도로 랩핑된 element
	var welTextGuide = $Element(elTextGuide);
	var welDropArea = $Element(elDropArea);
	var welDropAreaUL = $Element(elDropAreaUL); 
	var fnUploadImage = null;
	
	//File API 지원 여부로 결정
	function checkDragAndDropAPI(){
		try{
			if( !oNavigator.ie ){
				if(!!oNavigator.safari && oNavigator.version <= 5){
					bSupportDragAndDropAPI = false;
				}else{
					bSupportDragAndDropAPI = true;
				}
			} else {
				bSupportDragAndDropAPI = false;
			}
		}catch(e){
			bSupportDragAndDropAPI = false;
		}
	}
	
	//--------------- html5 미지원 브라우저에서 (IE9 이하) ---------------
	/** 
	 * 이미지를 첨부 후 활성화된 버튼 상태
	 */
     function goStartMode(){
    	 var sSrc = welBtnConfirm.attr("src")|| "";
    	 if(sSrc.indexOf("btn_confirm2.png") < 0 ){
    		 welBtnConfirm.attr("src","../../img/photoQuickPopup/btn_confirm2.png");
    		 fnUploadImage.attach(welBtnConfirm.$value(), "click");
    	 }
     } 
     /**
      * 이미지를 첨부 전 비활성화된 버튼 상태
      * @return
      */
     function goReadyMode(){
    	 var sSrc = welBtnConfirm.attr("src")|| "";
    	 if(sSrc.indexOf("btn_confirm2.png") >= 0 ){
    		 fnUploadImage.detach(welBtnConfirm.$value(), "click");
	    	 welBtnConfirm.attr("src","../../img/photoQuickPopup/btn_confirm.png");
    	 }
     }   
	
	/**
	 * 일반 업로드 
	 * @desc oFileUploader의 upload함수를 호출함. 
	 */
	function generalUpload(){
		oFileUploader.upload();
// 		아래 두줄은 test용 코드 입니다. 
// 		setPhotoToEditor();
//		window.close();
	}
	//--------------- 공통  -------------------
	
    /** 
     * 이미지 첨부 전 안내 텍스트가 나오는 배경으로 '설정'하는 함수.
     * @return
     */
 	function readyModeBG (){
 		var sClass = welTextGuide.className();
 		if(sClass.indexOf('nobg') >= 0){
 			welTextGuide.removeClass('nobg');
 			welTextGuide.className('bg');
 		}
 	}
 	
 	/**
 	 * 이미지 첨부 전 안내 텍스트가 나오는 배경을 '제거'하는 함수. 
 	 * @return
 	 */
 	function startModeBG (){
 		var sClass = welTextGuide.className();
 		if(sClass.indexOf('nobg') < 0){
	 		welTextGuide.removeClass('bg');
	 		welTextGuide.className('nobg');
 		}
 	}

	//--------------------- html5  지원되는 브라우저에서 사용하는 함수  --------------------------
 	/**
 	 * 팝업에 노출될 업로드 예정 사진의 수.
 	 * @param {Object} nCount 현재 업로드 예정인 사진 장수
 	 * @param {Object} nVariable 삭제되는 수
 	 */
 	function updateViewCount (nCount, nVariable){
 		var nCnt = nCount + nVariable;
 		elCountTxtTxt.innerHTML = nCnt +"장";
 		nImageFileCount = nCnt;
 		return nCnt;
 	}
 	
 	/**
 	 * 팝업에 노출될 업로드될 사진 총 용량
 	 */
 	function updateViewTotalSize(){
 		var nViewTotalSize = Number(parseInt((nTotalSize || 0), 10) / (1024*1024));
 		elTotalSizeTxt.innerHTML = nViewTotalSize.toFixed(2) +"MB";
 	}
 	
 	/**
 	 * 이미지 전체 용량 재계산.
 	 * @param {Object} sParentId
 	 */
 	function refreshTotalImageSize(sParentId){
 		var nDelImgSize = htImageInfo[sParentId].size;
 		if(nTotalSize - nDelImgSize > -1 ){
 			nTotalSize = nTotalSize - nDelImgSize;
 		} 
 	}
	
 	/**
 	 * hash table에서 이미지 정보 초기화.
 	 * @param {Object} sParentId
 	 */
 	function removeImageInfo (sParentId){
 		//삭제된 이미지의 공간을 초기화 한다.
 		htImageInfo[sParentId] = null;
 	}
 	
 	
 	/**
 	 * byte로 받은 이미지 용량을 화면에 표시를 위해 포맷팅
 	 * @param {Object} nByte
 	 */
 	function setUnitString (nByte) {
 		var nImageSize;
 		var sUnit;
 		
 		if(nByte < 0 ){
 			nByte = 0;
 		}
 		
 		if( nByte < 1024) {
 			nImageSize = Number(nByte);
 			sUnit = 'B';
 			return nImageSize + sUnit;
 		} else if( nByte > (1024*1024)) {
 			nImageSize = Number(parseInt((nByte || 0), 10) / (1024*1024));
 			sUnit = 'MB';
 			return nImageSize.toFixed(2) + sUnit;
 		} else {
 			nImageSize = Number(parseInt((nByte || 0), 10) / 1024);
 			sUnit = 'KB';
 			return nImageSize.toFixed(0) + sUnit;
 		}
     }
 	
 	/**
 	 * 화면 목록에 적당하게 이름을 잘라서 표시.
 	 * @param {Object} sName 파일명
 	 * @param {Object} nMaxLng 최대 길이
 	 */
 	function cuttingNameByLength (sName, nMaxLng) {
 		var sTemp, nIndex;
 		if(sName.length > nMaxLng){
 			nIndex = sName.indexOf(".");
 			sTemp = sName.substring(0,nMaxLng) + "..." + sName.substring(nIndex,sName.length) ;
 		} else {
 			sTemp = sName;
 		}
 		return sTemp;
 	}
 	
 	/**
 	 * Total Image Size를 체크해서 추가로 이미지를 넣을지 말지를 결정함.
 	 * @param {Object} nByte
 	 */
 	function checkTotalImageSize(nByte){
 		if( nTotalSize + nByte < nMaxTotalImageSize){
 			nTotalSize = nTotalSize + nByte;
 			return false;
 		} else {
 			return true;
 		}
 	}
	
 	// 이벤트 핸들러 할당
 	function dragEnter(ev) {
 		ev.stopPropagation();
 		ev.preventDefault();
     }
 	
     function dragExit(ev) {
     	ev.stopPropagation();
     	ev.preventDefault();
     }
     
 	function dragOver(ev) {
 		ev.stopPropagation();
 		ev.preventDefault();
     }
 	
	/**
	 * 드랍 영역에 사진을 떨구는 순간 발생하는 이벤트
	 * @param {Object} ev
	 */
    function drop(ev) {
		ev.stopPropagation();
		ev.preventDefault();
		
		if (nImageFileCount >= 10){
			alert("최대 10장까지만 등록할 수 있습니다.");
			return;
		}
		
		if(typeof ev.dataTransfer.files == 'undefined'){
			alert("HTML5 지원이 정상적으로 이루어지지 않는 브라우저입니다.");
		}else{
			//변수 선언
			var files,
				nCount,
				aFileList,
				bExceedLimitTotalSize,
				nViewTotalSize;
			//초기화	
			files = ev.dataTransfer.files;
			nCount = files.length;
			aFileList = [];
			bExceedLimitTotalSize = true;
			nViewTotalSize = 0;
			
			if (!!files && nCount === 0){
				//파일이 아닌, 웹페이지에서 이미지를 드래서 놓는 경우.
				alert("정상적인 첨부방식이 아닙니다.");
				return ;
			}
			
			//배경 이미지 변경
			startModeBG();
			
			for (var i = 0, j = nImageFileCount ; i < nCount ; i++){
				if (!rFilter.test(files[i].type)) {
					alert("이미지파일 (jpg,gif,png,bmp)만 업로드 가능합니다.");
				} else if(files[i].size > nMaxImageSize){
					alert("이미지 용량이 10MB를 초과하여 등록할 수 없습니다.");
				} else {
					//제한된 수만 업로드 가능.
					if ( j < nMaxImageCount ){
						//파일 사이즈
						sFileSize = setUnitString(files[i].size);
						sFileName = cuttingNameByLength(files[i].name, 15);
						bExceedLimitTotalSize = checkTotalImageSize(files[i].size);
			
						if( !!bExceedLimitTotalSize ){
							alert("전체 이미지 용량이 50MB를 초과하여 등록할 수 없습니다. \n\n (파일명 : "+sFileName+", 사이즈 : "+sFileSize+")");
						} else {
							//drop되는 순간 파일의 네임들을 File List영역에 보여준다.
							aFileList.push('	<li id="img'+nGrowNum+'"><span>'+ sFileName +'</span>');
							aFileList.push('	<em>'+ sFileSize +'</em>');
					        aFileList.push('	<a onclick="delImage(\'img'+nGrowNum+'\')"><img class="del_button" src="../../img/photoQuickPopup/btn_del.png"  width="14" height="13" alt="첨부 사진 삭제"></a>');
							aFileList.push('	</li>');   
							
							//이미지 정보 저장
							htImageInfo['img'+nGrowNum] = files[i];
							//생성한 마크업 보여주기.
							welDropAreaUL.prependHTML(aFileList.join(" "));
							aFileList = [];
							//다음 사진을위한 셋팅
							j = j+1;
							nGrowNum = nGrowNum+1;
						}
					} else {
						alert("최대 10장까지만 등록할 수 있습니다.");
						break;					
					}
				}
			}
			
			if(j > 0){
				//이미지 총사이즈 view update 
				updateViewTotalSize();
				//이미치 총 수 view update
				nImageFileCount = j;
				updateViewCount(nImageFileCount, 0);
				// 저장 버튼 활성화
				goStartMode();
			}else{
				readyModeBG();
			}
		}
    }
    
 	/**
 	 * 사진 삭제 시에 호출되는 함수
 	 * @param {Object} sParentId 
 	 */
 	function delImage (sParentId){
 		var elLi = jindo.$$.getSingle("#"+sParentId);
 		
 		refreshTotalImageSize(sParentId);
 		
 		updateViewTotalSize();
 		updateViewCount(nImageFileCount,-1);
 		//사진 file array에서 정보 삭제.
 		removeImageInfo(sParentId);
 		//해당 li삭제
 		$Element(elLi).leave();
 		
 		//마지막 이미지인경우.
 		if(nImageFileCount === 0){
 			readyModeBG();
 			//사진 추가 버튼 비활성화
 			goReadyMode();
 		}
 		
 		// drop 영역 이벤트 다시 활성화.
 		if(!bAttachEvent){
 			addEvent();
 		}
 	}
	
 	/**
     * 이벤트 할당
     */
	function addEvent() {
		bAttachEvent = true;
		elDropArea.addEventListener("dragenter", dragEnter, false);
		elDropArea.addEventListener("dragexit", dragExit, false);
		elDropArea.addEventListener("dragover", dragOver, false);
		elDropArea.addEventListener("drop", drop, false);
	}
	
	function removeEvent(){
		bAttachEvent = false;
		elDropArea.removeEventListener("dragenter", dragEnter, false);
	    elDropArea.removeEventListener("dragexit", dragExit, false);
	    elDropArea.removeEventListener("dragover", dragOver, false);
	    elDropArea.removeEventListener("drop", drop, false);	
	}
 	
	/**
	 * Ajax 통신 시 error가 발생할 때 처리하는 함수입니다.
	 * @return
	 */
	function onAjaxError (){
		alert("[가이드]사진 업로더할 서버URL셋팅이 필요합니다."); //설치 가이드 안내 문구임. 실 서비스에서는 삭제. 
		//alert("error"); 
	}
	
    function html5Upload() {	
		//업로드할 URL을 넣어주세요.
		var sUploadURL= "uploadURL"; 	//upload URL
		var oAjax = jindo.$Ajax(sUploadURL, {  
			sendheader : false,
			method : "post",
			onload : function(res){ // 요청이 완료되면 실행될 콜백 함수   
				setPhotoToEditor(res);
			},			 
			onerror :  jindo.$Fn(onAjaxError, this).bind()
		});
		
		oAjax.request(htImageInfo);
	}

 	/**
      * 이미지 업로드 시작
      * 확인 버튼 클릭하면 호출되는 msg
      */
     function uploadImage (e){
    	 bUploadStart = false;
    	 if(!bSupportDragAndDropAPI){
    		 generalUpload();
    	 }else{
    		 html5Upload();
    	 }
    	 alert("[가이드]사진 업로더할 서버URL셋팅이 필요합니다."); //설치 가이드 안내 문구임. 실 서비스에서는 삭제. 
     }
     
 	/**
 	 * jindo에 파일 업로드 사용.(iframe에 Form을 Submit하여 리프레시없이 파일을 업로드하는 컴포넌트)
 	 */
 	function callFileUploader (){
 		oFileUploader = new jindo.FileUploader(jindo.$("uploadInputBox"),{
 			sUrl  : 'http://www.sampleUploaderServer.com/FileUpload.php',	//샘플 URL입니다.
 	        sCallback : location.href.replace(/\/[^\/]*$/, '') + '/callback.html',	//업로드 이후에 iframe이 redirect될 콜백페이지의 주소
 	    	sFiletype : "*.jpg;*.png;*.bmp;*.gif",						//허용할 파일의 형식. ex) "*", "*.*", "*.jpg", 구분자(;)	
 	    	sMsgNotAllowedExt : 'JPG, GIF, PNG, BMP 확장자만 가능합니다',	//허용할 파일의 형식이 아닌경우에 띄워주는 경고창의 문구
 	    	bAutoUpload : false,									 	//파일이 선택됨과 동시에 자동으로 업로드를 수행할지 여부 (upload 메소드 수행)
 	    	bAutoReset : true 											// 업로드한 직후에 파일폼을 리셋 시킬지 여부 (reset 메소드 수행)
 	    }).attach({
 	    	select : function(oCustomEvent) {
 	    		//파일 선택이 완료되었을 때 발생
// 		    	 oCustomEvent (이벤트 객체) = {
// 	    			sValue (String) 선택된 File Input의 값
// 	    			bAllowed (Boolean) 선택된 파일의 형식이 허용되는 형식인지 여부
// 	    			sMsgNotAllowedExt (String) 허용되지 않는 파일 형식인 경우 띄워줄 경고메세지
// 	    		}
//  				선택된 파일의 형식이 허용되는 경우만 처리 
 	    		if(oCustomEvent.bAllowed === true){
 		    		goStartMode();
 		    	}else{
 		    		goReadyMode();
 		    		oFileUploader.reset();
 		    	}
// 	    		bAllowed 값이 false인 경우 경고문구와 함께 alert 수행 
// 	    		oCustomEvent.stop(); 수행시 bAllowed 가 false이더라도 alert이 수행되지 않음
 	    	},
 	    	success : function(oCustomEvent) {
 	    		//업로드가 성공적으로 완료되었을 때 발생
 	    		// oCustomEvent(이벤트 객체) = {
 	    		//	htResult (Object) 서버에서 전달해주는 결과 객체 (서버 설정에 따라 유동적으로 선택가능)
 	    		//}
 	    		setPhotoToEditor(oCustomEvent);
 	    	},
 	    	error : function(oCustomEvent) {
 	    		//업로드가 실패했을 때 발생
 	    		//oCustomEvent(이벤트 객체) = {
 	    		//	htResult : { (Object) 서버에서 전달해주는 결과 객체. 에러발생시 errstr 프로퍼티를 반드시 포함하도록 서버 응답을 설정하여야한다.
 	    		//		errstr : (String) 에러메시지
 	    		// 	}
 	    		//}
 	    		var wel = jindo.$Element("info");
 	    		wel.html(oCustomEvent.htResult.errstr);
 	    	}
 	    });
 	}
	
    /**
     * 페이지 닫기 버튼 클릭
     */
    function closeWindow(){
	   	if(bSupportDragAndDropAPI){
	   		removeEvent();
	   	}
	   	window.close();
    }
    
	window.onload = function(){
  		checkDragAndDropAPI();
  		
  		if(bSupportDragAndDropAPI){
  			$Element("pop_container2").hide();
  			$Element("pop_container").show();
  			
  			welTextGuide.removeClass("nobg");
  			welTextGuide.className("bg");
  			
  			addEvent();
  		} else {
  			$Element("pop_container").hide();
  			$Element("pop_container2").show();
  			callFileUploader();
  		}
  		fnUploadImage = $Fn(uploadImage,this);
  		$Fn(closeWindow,this).attach(welBtnCancel.$value(), "click");
	};

	/**
	 *  서버로부터 받은 데이타를 에디터에 전달하고 창을 닫음.
	 * @parameter aFileInfo [{},{},...] 
	 * @ex aFileInfo = [
	 * 	{
			sFileName : "nmms_215646753.gif",
			sFileURL :"http://static.naver.net/www/u/2010/0611/nmms_215646753.gif",
			bNewLine : true
		},
		{
			sFileName : "btn_sch_over.gif",
			sFileURL :"http://static1.naver.net/w9/btn_sch_over.gif",
			bNewLine : true
		}
	 * ]
	 */
 	function setPhotoToEditor(aFileInfo){		
		if (!!opener && !!opener.nhn && !!opener.nhn.husky && !!opener.nhn.husky.PopUpManager) {
			opener.nhn.husky.PopUpManager.setCallback(window, 'SET_PHOTO', [aFileInfo]);
		}
		window.close();
	}
	