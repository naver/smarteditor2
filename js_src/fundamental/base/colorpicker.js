/**
 * ColorPicker Component
 * @author gony
 */
 nhn.ColorPicker = jindo.$Class({
	elem : null,
	huePanel : null,
	canvasType : "Canvas",
	_hsvColor  : null,
 	$init : function(oElement, oOptions) {
		this.elem = jindo.$Element(oElement).empty();
		this.huePanel   = null;
		this.cursor     = jindo.$Element("<div>").css("overflow", "hidden");
		this.canvasType = jindo.$(oElement).filters?"Filter":jindo.$("<canvas>").getContext?"Canvas":null;

		if(!this.canvasType) {
			return false;
		}
		
		this.option({
			huePanel : null,
			huePanelType : "horizontal"
		});
		
		this.option(oOptions);
		if (this.option("huePanel")) {
			this.huePanel = jindo.$Element(this.option("huePanel")).empty();
		}	

		// rgb
		this._hsvColor = this._hsv(0,100,100); // #FF0000

		// event binding
		for(var name in this) {
			if (/^_on[A-Z][a-z]+[A-Z][a-z]+$/.test(name)) {
				this[name+"Fn"] = jindo.$Fn(this[name], this);
			}	
		}

		this._onDownColorFn.attach(this.elem, "mousedown");
		if (this.huePanel) {
			this._onDownHueFn.attach(this.huePanel, "mousedown");
		}	

		// paint
		this.paint();
	},
	rgb : function(rgb) {
		this.hsv(this._rgb2hsv(rgb.r, rgb.g, rgb.b));
	},
	hsv : function(hsv) {
		if (typeof hsv == "undefined") {
			return this._hsvColor;
		}	

		var rgb = null;
		var w = this.elem.width();
		var h = this.elem.height();
		var cw = this.cursor.width();
		var ch = this.cursor.height();
		var x = 0, y = 0;

		if (this.huePanel) {
			rgb = this._hsv2rgb(hsv.h, 100, 100);
			this.elem.css("background", "#"+this._rgb2hex(rgb.r, rgb.g, rgb.b));

			x = hsv.s/100 * w;
			y = (100-hsv.v)/100 * h;
		} else {
			var hw = w / 2;
			if (hsv.v > hsv.s) {
				hsv.v = 100;
				x = hsv.s/100 * hw;
			} else {
				hsv.s = 100;
				x = (100-hsv.v)/100 * hw + hw;
			}
			y = hsv.h/360 * h;
		}

		x = Math.max(Math.min(x-1,w-cw), 1);
		y = Math.max(Math.min(y-1,h-ch), 1);

		this.cursor.css({left:x+"px",top:y+"px"});

		this._hsvColor = hsv;
		rgb = this._hsv2rgb(hsv.h, hsv.s, hsv.v);

		this.fireEvent("colorchange", {type:"colorchange", element:this, currentElement:this, rgbColor:rgb, hexColor:"#"+this._rgb2hex(rgb.r, rgb.g, rgb.b), hsvColor:hsv} );
	},
	paint : function() {
		if (this.huePanel) {
			// paint color panel
			this["_paintColWith"+this.canvasType]();

			// paint hue panel
			this["_paintHueWith"+this.canvasType]();
		} else {
			// paint color panel
			this["_paintOneWith"+this.canvasType]();
		}

		// draw cursor
		this.cursor.appendTo(this.elem);
		this.cursor.css({position:"absolute",top:"1px",left:"1px",background:"white",border:"1px solid black"}).width(3).height(3);

		this.hsv(this._hsvColor);
	},
	_paintColWithFilter : function() {
		// white : left to right
		jindo.$Element("<div>").css({
			position : "absolute",
			top      : 0,
			left     : 0,
			width    : "100%",
			height   : "100%",
			filter : "progid:DXImageTransform.Microsoft.Gradient(GradientType=1,StartColorStr='#FFFFFFFF',EndColorStr='#00FFFFFF')"
		}).appendTo(this.elem);

		// black : down to up
		jindo.$Element("<div>").css({
			position : "absolute",
			top      : 0,
			left     : 0,
			width    : "100%",
			height   : "100%",
			filter : "progid:DXImageTransform.Microsoft.Gradient(GradientType=0,StartColorStr='#00000000',EndColorStr='#FF000000')"
		}).appendTo(this.elem);
	},
	_paintColWithCanvas : function() {
		var cvs = jindo.$Element("<canvas>").css({width:"100%",height:"100%"});		
		cvs.appendTo(this.elem.empty());
		
		var ctx = cvs.attr("width", cvs.width()).attr("height", cvs.height()).$value().getContext("2d");
		var lin = null;
		var w   = cvs.width();
		var h   = cvs.height();

		// white : left to right
		lin = ctx.createLinearGradient(0,0,w,0);
		lin.addColorStop(0, "rgba(255,255,255,1)");
		lin.addColorStop(1, "rgba(255,255,255,0)");
		ctx.fillStyle = lin;
		ctx.fillRect(0,0,w,h);

		// black : down to top
		lin = ctx.createLinearGradient(0,0,0,h);
		lin.addColorStop(0, "rgba(0,0,0,0)");
		lin.addColorStop(1, "rgba(0,0,0,1)");
		ctx.fillStyle = lin;
		ctx.fillRect(0,0,w,h);
	},
	_paintOneWithFilter : function() {
		var sp, ep, s_rgb, e_rgb, s_hex, e_hex;
		var h = this.elem.height();

		for(var i=1; i < 7; i++) {
			sp = Math.floor((i-1)/6 * h);
			ep = Math.floor(i/6 * h);

			s_rgb = this._hsv2rgb((i-1)/6*360, 100, 100);
			e_rgb = this._hsv2rgb(i/6*360, 100, 100);
			s_hex = "#FF"+this._rgb2hex(s_rgb.r, s_rgb.g, s_rgb.b);
			e_hex = "#FF"+this._rgb2hex(e_rgb.r, e_rgb.g, e_rgb.b);

			jindo.$Element("<div>").css({
				position : "absolute",
				left   : 0,
				width  : "100%",
				top    : sp + "px",
				height : (ep-sp) + "px",
				filter : "progid:DXImageTransform.Microsoft.Gradient(GradientType=0,StartColorStr='"+s_hex+"',EndColorStr='"+e_hex+"')"
			}).appendTo(this.elem);
		}

		// white : left to right
		jindo.$Element("<div>").css({
			position : "absolute",
			top      : 0,
			left     : 0,
			width    : "50%",
			height   : "100%",
			filter : "progid:DXImageTransform.Microsoft.Gradient(GradientType=1,StartColorStr='#FFFFFFFF',EndColorStr='#00FFFFFF')"
		}).appendTo(this.elem);

		// black : down to up
		jindo.$Element("<div>").css({
			position : "absolute",
			top      : 0,
			right    : 0,
			width    : "50%",
			height   : "100%",
			filter : "progid:DXImageTransform.Microsoft.Gradient(GradientType=1,StartColorStr='#00000000',EndColorStr='#FF000000')"
		}).appendTo(this.elem);
	},
	_paintOneWithCanvas : function() {
		var rgb = {r:0, g:0, b:0};		
		var cvs = jindo.$Element("<canvas>").css({width:"100%",height:"100%"});
		cvs.appendTo(this.elem.empty());
		
		var ctx = cvs.attr("width", cvs.width()).attr("height", cvs.height()).$value().getContext("2d");
		
		var w = cvs.width();
		var h = cvs.height();
		var lin = ctx.createLinearGradient(0,0,0,h);

		for(var i=0; i < 7; i++) {
			rgb = this._hsv2rgb(i/6*360, 100, 100);
			lin.addColorStop(i/6, "rgb("+rgb.join(",")+")");
		}
		ctx.fillStyle = lin;
		ctx.fillRect(0,0,w,h);

		lin = ctx.createLinearGradient(0,0,w,0);
		lin.addColorStop(0, "rgba(255,255,255,1)");
		lin.addColorStop(0.5, "rgba(255,255,255,0)");
		lin.addColorStop(0.5, "rgba(0,0,0,0)");
		lin.addColorStop(1, "rgba(0,0,0,1)");
		ctx.fillStyle = lin;
		ctx.fillRect(0,0,w,h);
	},
	_paintHueWithFilter : function() {
		var sp, ep, s_rgb, e_rgb, s_hex, e_hex;
		var vert = (this.option().huePanelType == "vertical");		
		var w = this.huePanel.width();
		var h = this.huePanel.height();
		var elDiv = null;

		var nPanelBorderWidth = parseInt(this.huePanel.css('borderWidth'), 10);
		if (!!isNaN(nPanelBorderWidth)) { nPanelBorderWidth = 0; }		
		w -= nPanelBorderWidth * 2; // borderWidth를 제외한 내측 폭을 구함  
		
		for(var i=1; i < 7; i++) {
			sp = Math.floor((i-1)/6 * (vert?h:w));
			ep = Math.floor(i/6 * (vert?h:w));

			s_rgb = this._hsv2rgb((i-1)/6*360, 100, 100);
			e_rgb = this._hsv2rgb(i/6*360, 100, 100);
			s_hex = "#FF"+this._rgb2hex(s_rgb.r, s_rgb.g, s_rgb.b);
			e_hex = "#FF"+this._rgb2hex(e_rgb.r, e_rgb.g, e_rgb.b);

			elDiv = jindo.$Element("<div>").css({
				position : "absolute",
				filter : "progid:DXImageTransform.Microsoft.Gradient(GradientType="+(vert?0:1)+",StartColorStr='"+s_hex+"',EndColorStr='"+e_hex+"')"
			});
			
			var width = (ep - sp) + 1; // IE에서 폭을 넓혀주지 않으면 확대 시 벌어짐, 그래서 1px 보정 			
			elDiv.appendTo(this.huePanel);
			elDiv.css(vert?"left":"top", 0).css(vert?"width":"height", '100%');
			elDiv.css(vert?"top":"left", sp + "px").css(vert?"height":"width", width + "px");
		}
	},
	_paintHueWithCanvas : function() {
		var opt = this.option(), rgb;
		var vtc = (opt.huePanelType == "vertical");
		
		var cvs = jindo.$Element("<canvas>").css({width:"100%",height:"100%"});
		cvs.appendTo(this.huePanel.empty());
		
		var ctx = cvs.attr("width", cvs.width()).attr("height", cvs.height()).$value().getContext("2d");
		var lin = ctx.createLinearGradient(0,0,vtc?0:cvs.width(),vtc?cvs.height():0);

		for(var i=0; i < 7; i++) {
			rgb = this._hsv2rgb(i/6*360, 100, 100);
			lin.addColorStop(i/6, "rgb("+rgb.join(",")+")");
		}
		ctx.fillStyle = lin;
		ctx.fillRect(0,0,cvs.width(),cvs.height());
	},
	_rgb2hsv : function(r,g,b) {
		var h = 0, s = 0, v = Math.max(r,g,b), min = Math.min(r,g,b), delta = v - min;
		s = (v ? delta/v : 0);
		
		if (s) {
			if (r == v) {
				h = 60 * (g - b) / delta;
			} else if (g == v) {
				h = 120 + 60 * (b - r) / delta;
			} else if (b == v) {
				h = 240 + 60 * (r - g) / delta;
			}	

			if (h < 0) {
				h += 360;
			}	
		}
		
		h = Math.floor(h);
		s = Math.floor(s * 100);
		v = Math.floor(v / 255 * 100);

		return this._hsv(h,s,v);
	},
	_hsv2rgb : function(h,s,v) {
		h = (h % 360) / 60; s /= 100; v /= 100;

		var r=0, g=0, b=0;
		var i = Math.floor(h);
		var f = h-i;
		var p = v*(1-s);
		var q = v*(1-s*f);
		var t = v*(1-s*(1-f));

		switch (i) {
			case 0: r=v; g=t; b=p; break;
			case 1: r=q; g=v; b=p; break;
			case 2: r=p; g=v; b=t; break;
			case 3: r=p; g=q; b=v; break;
			case 4: r=t; g=p; b=v; break;
			case 5: r=v; g=p; b=q;break;
			case 6: break;
		}

		r = Math.floor(r*255);
		g = Math.floor(g*255);
		b = Math.floor(b*255);

		return this._rgb(r,g,b);
	},
	_rgb2hex : function(r,g,b) {
		r = r.toString(16); 
		if (r.length == 1) {
			r = '0'+r;
		}
		
		g = g.toString(16); 
		if (g.length==1) {
			g = '0'+g;
		}
		
		b = b.toString(16); 
		if (b.length==1) {
			b = '0'+b;
		}	

		return r+g+b;
	},
	_hex2rgb : function(hex) {
		var m = hex.match(/#?([0-9a-f]{6}|[0-9a-f]{3})/i);
		if (m[1].length == 3) {
			m = m[1].match(/./g).filter(function(c) {
				return c+c; 
			});
		} else {
			m = m[1].match(/../g);
		}
		return {
			r : Number("0x" + m[0]),
			g : Number("0x" + m[1]),
			b : Number("0x" + m[2])
		};
	},
	_rgb : function(r,g,b) {
		var ret = [r,g,b];

		ret.r = r;
		ret.g = g;
		ret.b = b;

		return ret;
	},
	_hsv : function(h,s,v) {
		var ret = [h,s,v];

		ret.h = h;
		ret.s = s;
		ret.v = v;

		return ret;
	},
	_onDownColor : function(e) {
		if (!e.mouse().left) {
			return false;
		}	

		var pos = e.pos();

		this._colPagePos = [pos.pageX, pos.pageY];
		this._colLayerPos = [pos.layerX, pos.layerY];

		this._onUpColorFn.attach(document, "mouseup");
		this._onMoveColorFn.attach(document, "mousemove");

		this._onMoveColor(e);
	},
	_onUpColor : function(e) {
		this._onUpColorFn.detach(document, "mouseup");
		this._onMoveColorFn.detach(document, "mousemove");
	},
	_onMoveColor : function(e) {
		var hsv = this._hsvColor;
		var pos = e.pos();
		var x = this._colLayerPos[0] + (pos.pageX - this._colPagePos[0]);
		var y = this._colLayerPos[1] + (pos.pageY - this._colPagePos[1]);
		var w = this.elem.width();
		var h = this.elem.height();

		x = Math.max(Math.min(x, w), 0);
		y = Math.max(Math.min(y, h), 0);

		if (this.huePanel) {
			hsv.s = hsv[1] = x / w * 100;
			hsv.v = hsv[2] = (h - y) / h * 100;
		} else {
			hsv.h = y/h*360;

			var hw = w/2;

			if (x < hw) {
				hsv.s = x/hw * 100;
				hsv.v = 100;
			} else {
				hsv.s = 100;
				hsv.v = (w-x)/hw * 100;
			}
		}

		this.hsv(hsv);

		e.stop();
	},
	_onDownHue : function(e) {
		if (!e.mouse().left) {
			return false;
		}	

		var pos = e.pos();

		this._huePagePos  = [pos.pageX, pos.pageY];
		this._hueLayerPos = [pos.layerX, pos.layerY];

		this._onUpHueFn.attach(document, "mouseup");
		this._onMoveHueFn.attach(document, "mousemove");

		this._onMoveHue(e);
	},
	_onUpHue : function(e) {
		this._onUpHueFn.detach(document, "mouseup");
		this._onMoveHueFn.detach(document, "mousemove");
	},
	_onMoveHue : function(e) {
		var hsv = this._hsvColor;
		var pos = e.pos();
		var cur = 0, len = 0;
		var x = this._hueLayerPos[0] + (pos.pageX - this._huePagePos[0]);
		var y = this._hueLayerPos[1] + (pos.pageY - this._huePagePos[1]);

		if (this.option().huePanelType == "vertical") {
			cur = y;
			len = this.huePanel.height();
		} else {
			cur = x;
			len = this.huePanel.width();
		}

		hsv.h = hsv[0] = (Math.min(Math.max(cur, 0), len)/len * 360)%360;

		this.hsv(hsv);

		e.stop();
	}
 }).extend(jindo.Component);
