//	WebHelp 5.10.005
var gaProj=new Array();
var gnChecked=0;
var gsProjName="";
var gbReady=false;
var goMan=null;
var gbXML=false;
var gsFirstPane="";
var gServerEnabled=false;
var gsPath="";
var gbWhPHost=false;
var goDiv = null;
var gsHTML = "";

if (navigator.currentNavPen)
	gsFirstPane = navigator.currentNavPen;


function delayLoad()
{
	if (goDiv&&gsHTML)
	{
		goDiv.innerHTML=gsHTML;
		goDiv=null;
		gsHTML="";
	}
}

function whCom(sName,sComFile)
{
	this.msName=sName;
	this.msDivId=sName+"Div";
	this.msIFrameId=sName+"IFrame";
	this.msComFile=sComFile;
	this.mbloaded=false;
	this.mbShow=false;
	this.show=function(bShow)
	{
		if(this.mbShow!=bShow)
		{
			if(bShow&&!this.mbloaded)
			{
				this.load();
			}

			var oDiv=getElement(this.msDivId);
			if(oDiv)
			{
				if(gbIE55||(gbIE5&&gbMac))
				{
					var oIframe=getElement(this.msIFrameId);
					if(oIframe)
					{
						if(bShow)
						{
							oDiv.style.zIndex=3;
							if(oIframe!=null)
							{
								oIframe.style.zIndex=3;
								if (!gbIE55)
									oIframe.style.visibility="visible";
							}
						}
						else
						{
							oDiv.style.zIndex=2;
							if(oIframe!=null)
							{
								oIframe.style.zIndex=2;
								if (!gbIE55)
									oIframe.style.visibility="hidden";
							}
						}
					}
				}
				if (!gbIE55)
					oDiv.style.visibility=(bShow==true)?'visible':'hidden';
				this.mbShow=bShow;
			}

		}
	}
	this.load=function()
	{
		if(!this.mbloaded)
		{
			if(this.msComFile.length>0){
				var strFile= _getFullPath(getPath(), this.msComFile);
				var oDiv=getElement(this.msDivId);
				if(oDiv){
					if(gbIE4||gbOpera7){
						var nIFrameHeight=oDiv.style.pixelHeight;
						var nIFrameWidth=oDiv.style.pixelWidth;
						var sHTML="<IFRAME ID="+this.msIFrameId+" title=\"" + this.msName + "\" SRC=\""+strFile+"\" BORDER=0 FRAMEBORDER=no STYLE=\"width:";
						if(gbMac){
							sHTML+=nIFrameWidth+"px;height:"+nIFrameHeight+"px;\"></IFRAME>";
						}else{
							sHTML+="100%; height:100%;\"></IFRAME>";
						}
						oDiv.innerHTML=sHTML;
					}else if(gbNav6 || gbSafari){
					    gsHTML = "<IFRAME ID=" + this.msIFrameId + " title=\"" + this.msName + "\" SRC=\"" + strFile + "\" BORDER=0 FRAMEBORDER=no STYLE=\"width:100%;border:0;height:100%;\"></IFRAME>";
						goDiv = oDiv;
						setTimeout("delayLoad()", 100);
					}
					this.mbloaded=true;
				}
			}
		}
	}
	this.unload=function()
	{
		var oDiv=getElement(this.msDivId);
		if(oDiv)
			oDiv.innerHTML="";
	}
	this.getDivHTML=function()
	{
		var sHTML="";
		if(gbMac&&gbIE4)
			sHTML+="<DIV ID="+this.msDivId+" ALIGN=left STYLE=\"position:absolute;z-index:1;left:0;top:0;width:100%;height:100%;margin:0;padding:0;border:0;\">";
		else if(gbIE5)
			sHTML+="<DIV ID="+this.msDivId+" ALIGN=left STYLE=\"position:absolute;z-index:1;left:0;top:0;width:100%;height:100%;\">";
		else if(gbIE4||gbWindows)
			sHTML+="<DIV ID="+this.msDivId+" ALIGN=left STYLE=\"position:absolute;z-index:1;left:0;top:0;width:100%;height:100%;visibility:hidden\">";
		else if(gbMac&&gbNav6)
			sHTML+="<DIV ID="+this.msDivId+" ALIGN=left STYLE=\"position:absolute;z-index:1;left:0;top:0;width:100%;height:100%;visibility:hidden\">";
		else if(gbUnixOS)
			sHTML+="<DIV ID="+this.msDivId+" ALIGN=left STYLE=\"position:absolute;z-index:1;left:0;top:0;width:100%;height:100%;visibility:hidden\">";
		else
			sHTML+="<DIV ID="+this.msDivId+" ALIGN=left STYLE=\"position:absolute;z-index:1;left:0;top:0;width:100%;height:"+parent.height+";visibility:hidden\">";
		sHTML+="</DIV>";
		return sHTML;
	}
}  

function whComMan()
{
	this.sName="";
	this.maCom=new Array();
	this.addCom=function(sName,sComFile)
	{
		var owhCom=new whCom(sName,sComFile);
		this.maCom[this.maCom.length]=owhCom;
	}
	this.init=function()
	{
		var sHTML="";
		for(var i=0;i<this.maCom.length;i++)
		{
			sHTML+=this.maCom[i].getDivHTML();
		}
		if(gbSafari&&!gbSafari3)
		{
			var range = document.createRange();
		  	range.setStartBefore(document.body.lastChild);
		  	var docFrag = range.createContextualFragment(sHTML);
		   	document.body.appendChild(docFrag)		
	   }
		else
			document.body.insertAdjacentHTML("beforeEnd",sHTML);

	}
	this.showById=function(nId)
	{
		for(var s=0;s<this.maCom.length;s++)
		{
			if(s!==nId)
				this.maCom[s].show(false);
		}
		this.maCom[nId].show(true);
	}
	this.show=function(sName)
	{
		navigator.currentNavPen = sName;
		var bFound=false;
		for(var i=0;i<this.maCom.length;i++)
		{
			if(sName==this.maCom[i].msName)
			{
				bFound=true;
				break;
			}
		}
		if(bFound)
		{
			this.showById(i);
			this.sName=sName;
		}
	}
	this.unload=function()
	{
		for(var i=0;i<this.maCom.length;i++)
		{
			this.maCom[i].unload();
		}		
	}
	this.getCurrent=function()
	{
		return this.sName;
	}
}

function getPath()
{
	if(gsPath=="")
	{
		gsPath=location.href;
		gsPath=_replaceSlash(gsPath);
		var nPosFile=gsPath.lastIndexOf("/");
		gsPath=gsPath.substring(0,nPosFile+1);
	}
	return gsPath;
}

goMan=new whComMan();

function onGetPane(oMsg)
{
    if (oMsg.oParam.bEnable)
        goMan.addCom(oMsg.iParam.sName, oMsg.iParam.sFileName);
}

function addPane(sName,sFileName)
{
	var iParam=new Object();
	iParam.sName = sName;
	iParam.sFileName = sFileName;
	var oMsg=new whMessage(WH_MSG_GETPANE, iParam, new Object());
	request(oMsg, onGetPane);
}

function onGetDefPane(oMsg) {
    if (oMsg.oParam)
        gsFirstPane = oMsg.oParam;
    else
        gsFirstPane = oMsg.iParam.sName;
}

function setShowPane(sName, bForce)
{
	if ((gsFirstPane == "") || bForce)
	{
		var iParam=new Object();
		iParam.sName = sName;
		var oMsg=new whMessage(WH_MSG_GETDEFPANE, iParam, null);
		request(oMsg, onGetDefPane);
	}
}

function onGetCmd(oMsg) {
    var bHidePane = false;
    if (oMsg) {
        if (oMsg.oParam > 0) {
            if (oMsg.oParam == 1)
                gsFirstPane = "toc";
            else if (oMsg.oParam == 2)
                gsFirstPane = "idx";
            else if (oMsg.oParam == 3)
                gsFirstPane = "fts";
            else if (oMsg.oParam == 4)
                gsFirstPane = "glo";
        }
        else if (oMsg.oParam == 0) {
            bHidePane = true;
        }
    }
    goMan.init();
    if (gsProjName != "")
        loadData2(gsProjName);
    if (bHidePane) {
        gsFirstPane = "";
        var oMsg1 = new whMessage(WH_MSG_HIDEPANE, null, null)
        notify(oMsg1);
    }
    else {
        if (gsFirstPane != "")
            goMan.show(gsFirstPane);
        else
            goMan.showById(0);
    }
}

function SendGetCmd() {
    if (goMan && goMan.maCom.length > 0) {
        var oMsg = new whMessage(WH_MSG_GETCMD, null, null);
        request(oMsg, onGetCmd);
    }
    else {
        setTimeout("SendGetCmd();", 1);
    }
}

function window_OnLoad() {
    SendGetCmd();   
}

function setServerEnabled()
{
	gServerEnabled = true;
}

function loadData2(strFile)
{
	if(gbXML)
		loadDataXML(strFile);
	else
		loadData(strFile);
}

function addProject(bPreferXML,sXMLName,sHTMLName)
{
	var bLoadXML=bPreferXML;
	if(!gbIE4&&!gbNav6&&!gbOpera7&&!gbSafari3)
		return;
	if(gbIE4&&!gbIE5)
		bLoadXML=false;
	if (gbIE5&&!gbMac)
		bLoadXML=true;
	if(gbIE55||gbNav6||gbSafari3)
		bLoadXML=true;
	if(gbOpera7)
		bLoadXML=false;		
	if(bLoadXML)
		addProjectXML(sXMLName);
	else
		addProjectHTML(sHTMLName);
}

function addProjectHTML(sName)
{
	gbXML=false;
	gsProjName=sName;
}

function mrAlterProjUrl(sProjUrl)
{
	if( mrIsOnEngine()==true )
	{
		var sProjName=mrGetProjName();
		if( sProjName!='' )
		{
			// now build the server url
			sProjUrl=mrGetEngineUrl()+'?mgr=sys&cmd=prjinf&prj='+sProjName;
		};
	};

	return sProjUrl;
};

function addProjectXML(sName)
{
	// intialize the roboengine varialbes
	mrInitialize();

	gbXML=true;
	gsProjName=mrAlterProjUrl(sName);
}

function window_MyBunload()
{
	goMan.unload();
	window_BUnload();
}

function putDataXML(xmlDoc,sdocPath)
{
	if(xmlDoc!=null)
	{
		var projectNode=xmlDoc.getElementsByTagName("project")[0];
		if(projectNode)
		{
			var aRProj=new Array();
			aRProj[0]=new Object();
			aRProj[0].sPPath=_getPath(sdocPath);

			// server serves the full path, so we don't need the project path anymore
			if( mrIsOnEngine()==true )
				aRProj[0].sPPath="";

			var sLangId=projectNode.getAttribute("langid");
			if(sLangId)
			{
				aRProj[0].sLangId=sLangId;
			}
			var sDPath=projectNode.getAttribute("datapath");
			if(sDPath)
			{
				if(sDPath.lastIndexOf("/")!=sDPath.length-1)
					sDPath+="/";
				aRProj[0].sDPath=sDPath;
			}
			else
				aRProj[0].sDPath="";
			aRProj[0].sToc=projectNode.getAttribute("toc");
			aRProj[0].sIdx=projectNode.getAttribute("index");
			aRProj[0].sFts=projectNode.getAttribute("fts");
			aRProj[0].sGlo=projectNode.getAttribute("glossary");
			var RmtProject=projectNode.getElementsByTagName("remote");
			var nCount=1;
			for (var i=0;i<RmtProject.length;i++)
			{
				var sURL=RmtProject[i].getAttribute("url");
				if(sURL)
				{
					if(sURL.lastIndexOf("/")!=sURL.length-1)
						sURL+="/";
					aRProj[nCount]=new Object();
					aRProj[nCount++].sPPath=_getFullPath(aRProj[0].sPPath,sURL);
				}
			}
			putProjectInfo(aRProj);
		}
		else
		{
			// on Netscape 6.0 under some situation the xml file cannot be loaded.
			// so we use pure html instead.
			if (gnChecked == 0)
				setTimeout("redirectToList();",100);
			else
			{
				gnChecked++;
				setTimeout("checkRemoteProject();", 1);
			}
		}
	}
}

function onLoadXMLError()
{
	gnChecked++;
	setTimeout("checkRemoteProject();", 1);
}

function redirectToList()
{
	if(gbReDirectThis)
		document.location=gsNavReDirect;
	else
		parent.document.location=gsNavReDirect;
}

function putProjectInfo(aRProj)
{
	if(gnChecked==0||isSamePath(gaProj[gnChecked].sPPath,aRProj[0].sPPath))
	{
		if(gnChecked!=0)
		{
			if(aRProj[0].sLangId!=gaProj[0].sLangId)
				alert("병합된 도움말 시스템의 언어가 "+aRProj[0].sPPath+" 마스터 도움말 시스템과 다르므로 병합된 도움말 시스템에서 색인 및 전체 텍스트 검색 기능을 사용할 수 없습니다.");
		}
		gaProj[gnChecked]=aRProj[0];
		for(var i=1;i<aRProj.length;i++)
		{
			var bFound=false;
			for(var j=0;j<gaProj.length;j++)
			{
				if(isSamePath(gaProj[j].sPPath,aRProj[i].sPPath))
				{
					bFound=true;
					break;
				}
			}
			if(!bFound)
			{
				gaProj[gaProj.length]=aRProj[i];
			}
		}
		gnChecked++;
		setTimeout("checkRemoteProject();", 1);
	}
	else
		alert("로드할 수 없습니다. [새로 고침]을 클릭하십시오.");
}

function isSamePath(sPath1,sPath2)
{
	return (sPath1.toLowerCase()==sPath2.toLowerCase());
}

function checkRemoteProject()
{
	if(gaProj.length > gnChecked)
	{
		setTimeout("cancelProj("+gnChecked+");",10000);
		loadData2(gaProj[gnChecked].sPPath+gsProjName);
	}
	else{
		var oMsg=new whMessage(WH_MSG_PROJECTREADY,null,null);
		gbReady=true;
		notify(oMsg);
	}
}

function cancelProj(i)
{
	if(i==gnChecked)
	{
		gnChecked++;
		setTimeout("checkRemoteProject();", 1);
	}	
}

function window_resize()
{
	for(var i=0;i<goMan.maCom.length;i++)
	{
		var oFrame=getElement(goMan.maCom[i].msIFrameId);
		if(oFrame)
		{
			oFrame.style.height=document.body.clientHeight;
			oFrame.style.width=document.body.clientWidth;
		}
	}
	window_resize2();
}

function window_resize2()
{
	if(document.body)
	{
		if(document.body.clientWidth > 1 && document.body.clientHeight>1)
		{
			var oMsg = new whMessage(WH_MSG_RESIZEPANE, null, null);
			notify(oMsg);
		}
	}
}

function window_unload()
{
	unregisterListener2(WH_MSG_GETPROJINFO);
	unregisterListener2(WH_MSG_SHOWTOC);
	unregisterListener2(WH_MSG_SHOWIDX);
	unregisterListener2(WH_MSG_SHOWFTS);
	unregisterListener2(WH_MSG_SHOWGLO);
	unregisterListener2(WH_MSG_GETPANEINFO);
	unregisterListener2(WH_MSG_GETHIGHLIGHTINFO);
	//unregisterListener2(WH_MSG_GETSEARCHSTR);
	//unregisterListener2(WH_MSG_HILITESEARCH);
	//unregisterListener2(WH_MSG_GETNUMRSLT);
}

function onReceiveRequest(oMsg) {
    if (oMsg) {
        var nMsgId = oMsg.msgId;
        if (nMsgId == WH_MSG_GETPROJINFO) {
            if (gbReady) {
                var oProj = new Object();
                oProj.aProj = gaProj;
                oProj.bXML = gbXML;
                oMsg.oParam = oProj;
                reply(oMsg);
            }
            return false;
        }
        else if (nMsgId == WH_MSG_GETPANEINFO) {
            oMsg.oParam = goMan.getCurrent();
            reply(oMsg);
            return false;
        }

        else if (oMsg.msgId == WH_MSG_GETHIGHLIGHTINFO) {
            var ftsElem = getElement("ftsIFrame");
            if (ftsElem) {
                try {
                    if (typeof (ftsElem.contentWindow.document) != 'undefined' &&
                    typeof (ftsElem.contentWindow.document.forms[0]) != "undefined") {
                        oMsg.oParam.bHighlight = true;
                        var str1 = ftsElem.contentWindow.document.forms[0].quesn.value;
                        if (ftsElem.contentWindow.document.forms[0].quesnsyn) {
                            var str2 = ftsElem.contentWindow.document.forms[0].quesnsyn.value;
                            if (str2 != "")
                                str1 += str2;
                        }
                        oMsg.oParam.strTerms = str1;

                        var tbl = ftsElem.contentWindow.document.getElementById("FtsRslt");
                        if (tbl)
                            oMsg.oParam.nResults = tbl.rows.length;
                        else
                            oMsg.oParam.nResults = 0;
                        reply(oMsg);
                        return false;
                    }
                }
                catch (e) {
                    return true;
                }
            }
            return true;
        }
    
        /*else if (nMsgId == WH_MSG_HILITESEARCH) {
            oMsg.oParam = true;
            reply(oMsg);
            return true;
        }
        else if (nMsgId == WH_MSG_GETSEARCHSTR) {
            var ftsElem = getElement("ftsIFrame");
            if (ftsElem) {
                if (typeof (ftsElem.contentWindow.document.forms[0]) != "undefined") {
                    var str1 = ftsElem.contentWindow.document.forms[0].quesn.value;
                    if (ftsElem.contentWindow.document.forms[0].quesnsyn) {
                        var str2 = ftsElem.contentWindow.document.forms[0].quesnsyn.value;
                        if (str2 != "")
                            str1 += str2;
                    }
                    oMsg.oParam = str1;
                }
            }
            reply(oMsg);

            return true;
        }
        else if (nMsgId == WH_MSG_GETNUMRSLT) {
            var ftsElem = getElement("ftsIFrame");
            if (ftsElem) {
                var tbl = ftsElem.contentWindow.document.getElementById("FtsRslt");
                if (tbl)
                    oMsg.oParam = tbl.rows.length;
                else
                    oMsg.oParam = 0;
            }
            else
                oMsg.oParam = 0;
            reply(oMsg);
            return true;
        }*/
    }
    return true;
}

function onReceiveNotification(oMsg)
{
	if(oMsg)
	{
		var nMsgId=oMsg.msgId;
		if(nMsgId==WH_MSG_SHOWTOC)
		{
			if(goMan)
				goMan.show("toc");
			var onMsg=new whMessage(WH_MSG_PANEINFO, "toc", null);
			notify(onMsg);
			onMsg = new whMessage(WH_MSG_SHOWPANE, null, null);
			notify(onMsg);
		}
		else if(nMsgId==WH_MSG_SHOWIDX)
		{
			if(goMan)
				goMan.show("idx");
			var onMsg=new whMessage(WH_MSG_PANEINFO, "idx", null);
			notify(onMsg);
			onMsg = new whMessage(WH_MSG_SHOWPANE, null, null);
			notify(onMsg);
		}
		else if(nMsgId==WH_MSG_SHOWFTS)
		{
			if(goMan)
				goMan.show("fts");
			var onMsg=new whMessage(WH_MSG_PANEINFO, "fts", null);
			notify(onMsg);
			onMsg = new whMessage(WH_MSG_SHOWPANE, null, null);
			notify(onMsg);
		}
		else if(nMsgId==WH_MSG_SHOWGLO)
		{
			if(goMan)
				goMan.show("glo");
			var onMsg=new whMessage(WH_MSG_PANEINFO, "glo", null);
			notify(onMsg);
			onMsg = new whMessage(WH_MSG_SHOWPANE, null, null);
			notify(onMsg);
		}
	}
	return true;
}

if(window.gbWhUtil&&window.gbWhMsg&&window.gbWhVer&&window.gbWhProxy)
{
	registerListener2(WH_MSG_GETPROJINFO);
	registerListener2(WH_MSG_SHOWTOC);
	registerListener2(WH_MSG_SHOWIDX);
	registerListener2(WH_MSG_SHOWFTS);
	registerListener2(WH_MSG_SHOWGLO);
	registerListener2(WH_MSG_GETPANEINFO);
	registerListener2(WH_MSG_GETHIGHLIGHTINFO);
	//registerListener2(WH_MSG_GETSEARCHSTR);
	//registerListener2(WH_MSG_HILITESEARCH);
	//registerListener2(WH_MSG_GETNUMRSLT);

	if((gbMac&&gbIE4)||(gbSunOS&&gbIE5)||gbOpera7)
	{
		window.onresize=window_resize;
	}
	else if(gbIE4)
	{
		window.onresize=window_resize2;
	}
	window.onload=window_OnLoad;
	window.onbeforeunload=window_MyBunload;
	window.onunload=window_unload;
	gbWhPHost=true;
}
else
	document.location.reload();

