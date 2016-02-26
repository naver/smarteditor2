//	WebHelp 5.10.002
window.whname = "wh_stub";
var gReplyMsgQ = new Object();

function getFrameHandle(frames, framename) {
    var frame = null;
    if (null == frames) return null;
    if (typeof (frames[framename]) != 'undefined' && frames[framename] != null)
        return frames[framename];
    for (var i = 0; i < frames.length; i++) {
        if (frames[i].frames.length > 0) {
            frame = getFrameHandle(frames[i].frames, framename);
            if (null != frame)
                return frame;
        }
    }
    return frame;
}

function listener(sName, oWindow) {
    this.sName = sName;
    this.oWindow = oWindow;
}

function MessageRouter() {
    this.msgListeners = {};

    this.registerListener = function(sWndName, msgId) {
        var listeners = this.getListeners(msgId);
        if (typeof (listeners) == 'undefined' || listeners == null)
            listeners = this.createListeners(msgId);

        if (listeners != null) {
            for (var i = 0; i < listeners.length; i++) {
                if (listeners[i].sName == sWndName)
                    return false;
            }
            var oListener = new listener(sWndName, null);
            listeners[listeners.length] = oListener;
            return true;
        }
        else
            return false;
    }
    this.registerListener2 = function(oWnd, msgId) {
        var listeners = this.getListeners(msgId);
        if (typeof (listeners) == 'undefined' || listeners == null)
            listeners = this.createListeners(msgId);

        if (listeners != null) {
            var oListener = new listener("", oWnd);
            listeners[listeners.length] = oListener;
            return true;
        }
        else
            return false;
    }

    this.unregisterListener = function(sWndName, msgId) {
        var listeners = this.getListeners(msgId);
        if (listeners) {
            for (var i = 0; i < listeners.length; i++) {
                if (listeners[i].sName == sWndName) {
                    removeItemFromArray(listeners, i);
                    return true;
                }
            }
        }
        return false;
    }
    this.unregisterListener2 = function(oWnd, msgId) {
        var listeners = this.getListeners(msgId);
        if (listeners) {
            for (var i = 0; i < listeners.length; i++) {
                if (listeners[i].oWindow == oWnd) {
                    removeItemFromArray(listeners, i);
                    return true;
                }
            }
        }
        return false;
    }

    this.notify = function(oMsg) {
        var bDelivered = false;
        var listeners = this.getListeners(oMsg.msgId);
        if (listeners) {
            for (var i = 0; i < listeners.length; i++) {
                if (listeners[i] != null) {
                    var pFrame = listeners[i].oWindow;
                    if (pFrame == null)
                        pFrame = getFrameHandle(frames, listeners[i].sName);
                    if (null != pFrame) {
                        if (this.checkChromeLocal()) {
                            bDelivered = true;
                            if (pFrame == window)
                                pFrame.onReceiveNotification(oMsg);
                            else
                                pFrame.postMessage(JSON.stringify(oMsg), "*");
                        }
                        else if (pFrame.onReceiveNotification) {
                            bDelivered = true;
                            pFrame.onReceiveNotification(oMsg);
                        }
                    }
                }
            }
        }
        return bDelivered;
    }

    this.request = function(oMsg, oSrcWnd) {
        var bDelivered = false;
        var listeners = this.getListeners(oMsg.msgId);
        if (listeners) {
            for (var i = 0; i < listeners.length; i++) {
                if (listeners[i] != null) {
                    var pFrame = listeners[i].oWindow;
                    if (pFrame == null)
                        pFrame = getFrameHandle(frames, listeners[i].sName);
                    if (null != pFrame) {
                        if (this.checkChromeLocal()) {
                            bDelivered = true;
                            var sReplyId = oMsg.srcWndName;
                            //sReplyId += oMsg.msgId.toString();
                            sReplyId += oMsg.msgSeqNum.toString();
                            gReplyMsgQ[sReplyId] = oSrcWnd;
                            if (pFrame == window) {
                                if (!pFrame.onReceiveRequest(oMsg))
                                    break;
                            }
                            else
                                pFrame.postMessage(JSON.stringify(oMsg), "*");
                        }
                        else if (pFrame.onReceiveRequest) {
                            bDelivered = true;
                            if (!pFrame.onReceiveRequest(oMsg))
                                break;
                        }
                    }
                }
            }
        }
        return bDelivered;
    }

    this.reply = function(oMsg) {
        if (this.checkChromeLocal()) {
            oMsg.msgType = "reply";
            var sReplyId = oMsg.srcWndName;
            sReplyId += oMsg.msgSeqNum.toString();
            var oWnd = gReplyMsgQ[sReplyId];
            if (oWnd) {
                oWnd.postMessage(JSON.stringify(oMsg), "*");
            }
            else {
                alert("Exception: reply for which no request exist");
            }
            delete gReplyMsgQ[sReplyId];
        }
    }


    this.init = function() {
        if (this.checkChromeLocal()) {
            window.addEventListener("message", onReceiveMsg, false);
        }
    }

    //Helper Functions
    this.getListeners = function(nMessageId) {
        return this.msgListeners[nMessageId];
    }

    this.createListeners = function(nMessageId) {
        this.msgListeners[nMessageId] = new Array();
        return this.msgListeners[nMessageId];
    }

    this.checkChromeLocal = function() {
        if (window.chrome)
            if (document.location.protocol.substring(0, 4) == "file")
            return true;
        return false;
    }
}

function onReceiveMsg(event) {

	var oMsg = JSON.parse(event.data);
    switch (oMsg.msgType) {
        case "register":
            if (oMsg.iParam)
                msgRouter.registerListener(oMsg.iParam, oMsg.msgId);
            else
                msgRouter.registerListener2(event.source, oMsg.msgId);
            break;
        case "unregister":
            if (oMsg.iParam)
                msgRouter.unregisterListener(oMsg.iParam, oMsg.msgId);
            else
                msgRouter.unregisterListener2(event.source, oMsg.msgId);
            break;
        case "notify":
            msgRouter.notify(oMsg);
            break;
        case "request":
            msgRouter.request(oMsg, event.source);
            break;
        case "reply":
            msgRouter.reply(oMsg);
            break;
    }
}

var msgRouter = new MessageRouter();
msgRouter.init();

function registerListener(frameName, msgId) {
    msgRouter.registerListener(frameName, msgId);
}

function registerListener2(oWnd, msgId) {
    msgRouter.registerListener2(oWnd, msgId);
}

function unregisterListener(frameName, msgId) {
    msgRouter.unregisterListener(frameName, msgId);
}

function unregisterListener2(oWnd, msgId) {
    msgRouter.unregisterListener2(oWnd, msgId);
}

function notify(oMsg) {
    msgRouter.notify(oMsg);
}

function request(oMsg) {
    msgRouter.request(oMsg, null);
}

function reply(oMsg) {
    msgRouter.reply(oMsg);
}