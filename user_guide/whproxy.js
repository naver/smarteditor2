//    WebHelp 5.10.001

var gbInited = false;
var gWndStubPage = null;

function getStubPage_inter(wCurrent) {
    if (null == wCurrent.parent || wCurrent.parent == wCurrent)
        return null;

    if (typeof (wCurrent.parent.whname) == "string" && "wh_stub" == wCurrent.parent.whname)
        return wCurrent.parent;
    else {
        if (wCurrent.parent.frames.length != 0 && wCurrent.parent != wCurrent)
            return getStubPage_inter(wCurrent.parent);
        else
            return null;
    }
}

function getStubPage() {
    if (!gbInited) {
        if (msgHandlerProxy.checkChromeLocal()) {
            var oWnd = top.frames['ContentFrame'];
            if (typeof (oWnd) != 'undefined' && oWnd != null)
                gWndStubPage = oWnd;
            else
                gWndStubPage = top;
            if (gWndStubPage == this)
                gWndStubPage = null;
        }
        else
            gWndStubPage = getStubPage_inter(window);
        gbInited = true;
    }
    return gWndStubPage;
}

var g_qCallBack = {};

function MessageHanderProxy() {
    this.srcWnd = null;
    this.routerWnd = null;
    this.uniqueId = 0;
    
    this.init = function() {
        this.srcWnd = window;
        this.routerWnd = getStubPage();
        if (this.checkChromeLocal()) {
            this.srcWnd.addEventListener("message", onReceiveMsg, false);
        }
    }

    this.registerListener = function(frameName, msgId) {
        if (this.routerWnd) {
            if (this.checkChromeLocal()) {
                if (this.routerWnd.postMessage) {
                    var oMsg = new whMessage(msgId, frameName, null);
                    oMsg.msgType = "register";
                    this.routerWnd.postMessage(JSON.stringify(oMsg), "*");
                    return true;
                }
            }
            else {
                if (this.routerWnd.registerListener) {
                    this.routerWnd.registerListener(frameName, msgId);
                    return true;
                }
            }
        }
        return false;
    }

    this.registerListener2 = function (msgId) {
        if (this.routerWnd) {
            if (this.checkChromeLocal()) {
                var oMsg = new whMessage(msgId, null, null);
                oMsg.msgType = "register";
                this.routerWnd.postMessage(JSON.stringify(oMsg), "*");
            }
            else
                this.routerWnd.registerListener2(this.srcWnd, msgId);
            return true;
        }
        return false;
    }

    this.unregisterListener = function (frameName, msgId) {
        if (this.routerWnd) {
            if (this.checkChromeLocal()) {
                var oMsg = new whMessage(msgId, frameName, null);
                oMsg.msgType = "unregister";
                this.routerWnd.postMessage(JSON.stringify(oMsg), "*");
            }
            else
                this.routerWnd.unregisterListener(frameName, msgId);
            return true;
        }
        return false;
    }

    this.unregisterListener2 = function (msgId) {
        if (this.routerWnd) {
            if (this.checkChromeLocal()) {
                var oMsg = new whMessage(msgId, null, null);
                oMsg.msgType = "unregister";
                this.routerWnd.postMessage(JSON.stringify(oMsg), "*");
            }
            else
                this.routerWnd.unregisterListener2(this.srcWnd, msgId);
            return true;
        }
        return false;
    }

    this.notify = function (oMsg) {
        if (this.routerWnd) {
            if (this.checkChromeLocal()) {
                oMsg.msgType = "notify";
                this.routerWnd.postMessage(JSON.stringify(oMsg), "*");
            }
            else
                this.routerWnd.notify(oMsg);
        }
    }

    this.request = function (oMsg, fCallback) {
        if (this.routerWnd) {
            if (this.checkChromeLocal()) {
                this.uniqueId++;
                if (fCallback)
                    g_qCallBack[this.uniqueId] = fCallback;
                oMsg.msgType = "request";
                oMsg.msgSeqNum = this.uniqueId;
                this.routerWnd.postMessage(JSON.stringify(oMsg), "*");
            }
            else {
                this.routerWnd.request(oMsg);
                if (fCallback)
                    fCallback(oMsg);
            }
        }
    }

    this.reply = function (oMsg) {
        if (this.routerWnd) {
            if (this.checkChromeLocal()) {
                oMsg.msgType = "reply";
                this.routerWnd.postMessage(JSON.stringify(oMsg), "*");
            }
        }
    }

    this.checkChromeLocal = function() {
        if (window.chrome)
            if (document.location.protocol.substring(0, 4) == "file")
            return true;
        return false;
    }
}

function onReceiveMsg(event) {
    try{
        var oMsg = JSON.parse(event.data);
        switch (oMsg.msgType) {
            case "register":
                break;
            case "unregister":
                break;
            case "notify":
                onReceiveNotification(oMsg);
                break;
            case "request":
                onReceiveRequest(oMsg);
                break;
            case "reply":
                g_qCallBack[oMsg.msgSeqNum](oMsg);
                g_qCallBack[oMsg.msgSeqNum] = null;
                break;
        }
    }catch(e)
    {
    }
}

var msgHandlerProxy = new MessageHanderProxy();
msgHandlerProxy.init();

function registerListener(frameName, msgId) {
    msgHandlerProxy.registerListener(frameName, msgId);
}

function registerListener2(msgId) {
    msgHandlerProxy.registerListener2(msgId);
}

function unregisterListener(frameName, msgId) {
    msgHandlerProxy.unregisterListener(frameName, msgId);
}

function unregisterListener2(msgId) {
    msgHandlerProxy.unregisterListener2(msgId);
}

function notify(oMsg) {
    msgHandlerProxy.notify(oMsg);
}

function request(oMsg, fCallback) {
    msgHandlerProxy.request(oMsg, fCallback);
}

function reply(oMsg){
     msgHandlerProxy.reply(oMsg);
}

var gbWhProxy=true;

var gbPreview=false;
gbPreview=false; 
if (gbPreview)
	document.oncontextmenu=contextMenu;

function contextMenu()
{
	return false;
}
