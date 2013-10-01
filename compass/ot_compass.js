/*

gimbaled compass in pure HTML5
 (c) 2013 by Volker Kinkelin
 www.owntrack.net
 contact: grundguetiger at gmail fullstop com
 
 you can use it for whatever you like, if this notice
 is maintained

 V 0.1 01.10.2013 initial release

*/

// create a gimbaled compass
// within the div named divName
var compassify = function (divName) {

	var eleCompassCanvas = null, // canvas to draw on
	oldTrueAlpha = 0, // old display alpha
	colors = {
		background : 'rgba(0,0,0,0)',
		ring : '#fff',
		centerIn : '#000',
		centerOut : '#000',
		star : '#f00',
		numbers : '#0f0',
		NESW : '#f00'
	},
	NESW = ['N','E','S','W'], // letters for four directions
	inertia = '0.7s linear', // slower = smoother, less responsive display
	minInterval = 400, // minimum time[msec] between two updates
	datLastUpdate = 0; // timestamp of last update

	// provide browser-specific properties & correction functions
	var myBrowser = function () {

		// defaults:
		var is = undefined;
		var cssPrefix = '';

		// default = no correction = Chrome V29.0
		var correctors = {
			alpha : function (angle) {
				return angle
			},
			beta : function (angle) {
				return angle
			},
			gamma : function (angle) {
				return angle
			}
		};

		// now update defaults, depending on browser
		if (/Firefox/.test(navigator.userAgent)) {

			is = 'FF';
			correctors.alpha = function (angle) {
				return 360 - angle;
			};
			correctors.beta = function (angle) {
				return -angle;
			};
			correctors.gamma = function (angle) {
				return -angle;
			};

		} else if (/Chrome/.test(navigator.userAgent)) {

			is = 'CR';
			cssPrefix = '-webkit-';

		} else if (/KHTML/.test(navigator.userAgent)) {

			is = 'KH';
			cssPrefix = '-webkit-';
			correctors.alpha = function (angle) {
				return angle + 90;
			};

		}

		return ({
			is : is,
			cssPrefix : cssPrefix,
			correctors : correctors
		});

	}
	();

	// create canvas within DIV named divName and draw compass on it
	var drawCompass = function (divName) {

		// no canvas? -> create one
		if (eleCompassCanvas === null) {

			var eleCompassCont = document.getElementById(divName);

			// still no idea where to draw on?
			if (eleCompassCont === null)
				return;

			eleCompassCanvas = document.createElement('canvas');

			// adapt canvas to parent div size
			var cntWidth = eleCompassCont.offsetWidth;
			var cntHeight = eleCompassCont.offsetHeight;

			// compass is quadradic -> find smaller dimension
			var smallerDim = (cntWidth < cntHeight ? cntWidth : cntHeight) - 5;

			eleCompassCanvas.setAttribute('width', smallerDim);
			eleCompassCanvas.setAttribute('height', smallerDim);

			// center vertically
			eleCompassCanvas.setAttribute('style', 'position:relative; top:50%; margin-top:-' + Math.round(smallerDim / 2) + 'px');

			eleCompassCont.appendChild(eleCompassCanvas);

			var largerDim = (cntWidth > cntHeight ? cntWidth : cntHeight);
			eleCompassCont.style[myBrowser.cssPrefix + 'perspective'] = (largerDim * 2) + 'px';

			// buttery movements
			eleCompassCanvas.style[myBrowser.cssPrefix + 'transition'] = myBrowser.cssPrefix + 'transform ' + inertia;

		}

		// now start the art
		var ctx = eleCompassCanvas.getContext('2d');

		var width = ctx.canvas.width,
		height = ctx.canvas.height,
		widthsemi = width / 2;

		// prepare background
		ctx.fillStyle = colors.background;
		ctx.fillRect(0, 0, width, height);

		// outer circle
		ctx.fillStyle = colors.ring;
		ctx.beginPath();
		ctx.arc(widthsemi, widthsemi, widthsemi - 2, 0, 2 * Math.PI);
		ctx.fill();

		var radFact = Math.PI / 180; // degree -> radians
		var ringsize = width / 8; // outr ring width

		// draw degree ticks
		// functional programming here...
		var radPhi,
		cosPhi,
		sinPhi,
		xOuter,
		yOuter,
		innerRadius;

		// drawing func for all sorts of ticks
		var drawTick = function (width) {

			ctx.lineWidth = width;
			ctx.beginPath();
			ctx.moveTo(widthsemi + innerRadius * cosPhi, widthsemi + innerRadius * sinPhi);
			ctx.lineTo(xOuter, yOuter);
			ctx.stroke();

		};

		var phi = 360; // = current angle
		while (phi) {

			phi -= 5; // tick every 5°

			// omit NESW
			if (phi % 90 == 0)
				continue;

			// common calculations
			radPhi = radFact * phi;

			// shortcut
			cosPhi = Math.cos(radPhi);
			sinPhi = Math.sin(radPhi);

			// coords of outer end of tick
			xOuter = widthsemi * (1 + cosPhi);
			yOuter = widthsemi * (1 + sinPhi);

			// large 30 degree ticks
			if (phi % 30 == 0) {

				innerRadius = widthsemi - ringsize;
				drawTick(4);
				continue;

			}

			// medium 10 degree ticks
			if (phi % 10 == 0) {

				innerRadius = widthsemi - ringsize / 2;
				drawTick(3);
				continue;

			}

			// small 5 degree ticks
			if (phi % 5 == 0) {

				innerRadius = widthsemi - ringsize / 4;
				drawTick(2);
				continue;

			}

		} // for( var phi = 0; phi < 360; phi += 5) {

		// erase center background circle
		ctx.lineWidth = 0;
		
		// radial gradient on demand
		var fillColor = ctx.createRadialGradient(widthsemi,widthsemi,widthsemi/4,widthsemi,widthsemi,widthsemi);
		fillColor.addColorStop(0,colors.centerIn);
		fillColor.addColorStop(1,colors.centerOut);
		ctx.fillStyle= fillColor;

		ctx.beginPath();
		ctx.arc(widthsemi, widthsemi, widthsemi - ringsize, 0, 360 * radFact);
		ctx.fill();

		// inner star
		innerRadius = width * 0.025;

		ctx.fillStyle = colors.star;
		ctx.beginPath();
		ctx.moveTo(width - ringsize, widthsemi);

		for (var phi = 45; phi < 360; phi += 45) {

			if (phi % 90 == 0) // outer:
				ctx.lineTo(widthsemi + (widthsemi - ringsize) * Math.cos(phi * radFact), widthsemi + (widthsemi - ringsize) * Math.sin(phi * radFact));
			else // inner:
				ctx.lineTo(widthsemi + innerRadius * Math.cos(phi * radFact), widthsemi + innerRadius * Math.sin(phi * radFact));

		}

		ctx.fill();

		// red center circle
		ctx.arc(widthsemi, widthsemi, (width * 0.04), 0, 360 * radFact);
		ctx.fill();

		// black 90 degree lines
		ctx.lineWidth = 1;
		for (var phi = 0; phi < 360; phi += 90) {

			ctx.beginPath();
			ctx.moveTo(widthsemi, widthsemi);
			ctx.lineTo(widthsemi + (widthsemi - ringsize) * Math.cos(phi * radFact), widthsemi + (widthsemi - ringsize) * Math.sin(phi * radFact));
			ctx.stroke();

		}

		// numeric degrees every 30°
		ctx.textAlign = 'center';

		ctx.textBaseline = 'top';
		ctx.font = (ringsize / 3) + 'px Verdana';
		ctx.fillStyle = colors.numbers;

		ctx.save();
		ctx.translate(widthsemi, widthsemi);

		var step = 30;
		for (var phi = 0; phi < 360; phi += step) {

			ctx.fillText(phi, 0,  - widthsemi + ringsize * 1.1);
			ctx.rotate(step * radFact);

		}
		ctx.restore();

		// NESW directions
		ctx.fillStyle = colors.NESW;

		ctx.textBaseline = 'alphabetic';
		ctx.font = 'bold ' + (ringsize) + 'px Verdana';

		ctx.save();

		// move to top center
		ctx.translate(widthsemi, widthsemi);

		NESW.forEach(function (val) {

			ctx.fillText(val, 0,  - widthsemi + ringsize * 0.9);
			ctx.rotate(90 * radFact);

		});

		// be kind
		ctx.restore();

	}; // var drawCompass = function( canvasName, boolAutosize ) {

	// debuging only: show some text
	var log = function (what) {

		// find output div
		var elemLog = document.getElementById('otcomlog');

		// not found -> create one
		if (elemLog === null) {

			elemLog = document.createElement('div');
			elemLog.setAttribute('id', 'otcomlog');
			document.body.appendChild(elemLog);

		}

		elemLog.innerHTML = what;

	}

	// update compass orientation
	var updateDisplay = function (evt) {

		var deviceAlpha = evt.alpha,
		trueAlpha = myBrowser.correctors.alpha(deviceAlpha);

		// limit rotation
		if (Math.abs(oldTrueAlpha) > 1080)
			oldTrueAlpha %= 360;

		var delta = trueAlpha - oldTrueAlpha;

		// busy doing nothing?
		if (Math.abs(delta) < 0.5)
			return;

		if (delta > 180) {

			delta = (trueAlpha - oldTrueAlpha - 360) % 180;

		} else {

			if (delta < -180)
				delta = (oldTrueAlpha + 360 - trueAlpha) % -180;

		}

		// output some info
		if (window.location.hash === '#debug') {
			log('&alpha;:' + evt.alpha + ' ' + myBrowser.correctors.alpha(evt.alpha) +
				'<br>&beta;:' + evt.beta + ' ' + myBrowser.correctors.beta(evt.beta) +
				'<br>&gamma;:' + evt.gamma + ' ' + myBrowser.correctors.gamma(evt.gamma) +
				'<br>' + oldTrueAlpha + ' &delta;' + delta +
				'<br>' + navigator.userAgent);
		}

		oldTrueAlpha += Math.round(delta);

		if (true) {
			eleCompassCanvas.style[myBrowser.cssPrefix + 'transform'] =
				'rotateX(' + myBrowser.correctors.beta(evt.beta) + 'deg) ' +
				'rotateY(' + myBrowser.correctors.gamma(-evt.gamma) + 'deg)' +
				'rotateZ(' + oldTrueAlpha + 'deg) ';

		} else {

			eleCompassCanvas.style[myBrowser.cssPrefix + 'transform'] = 'rotate(' + oldTrueAlpha + 'deg)';

		}

	};

	// callback for orientation updates
	var onDeviceOrientationChange = function (evt) {

		var now = new Date(),
		deltaT = now - datLastUpdate;

		// limit update rate
		if (deltaT < minInterval)
			return;

		updateDisplay(evt, 0);
		datLastUpdate = now;

	}

	// start or stop listening to the mighty magnetometer
	var startStop = function (blnStart) {

		if (blnStart)
			window.addEventListener('deviceorientation', onDeviceOrientationChange, false);
		else
			window.removeEventListener('deviceorientation', onDeviceOrientationChange, false);

	};

	// div name given -> create compass canvas within
	if (divName)
		drawCompass(divName);

	// no canvas -> here no fun
	if (eleCompassCanvas !== null)
		startStop(true);

	// publish some may be useful stuff
	return ({
		colors : colors,
		NESW: NESW,
		drawCompass : drawCompass,
		startStop : startStop,
		eleCompassCanvas : eleCompassCanvas,
		onDeviceOrientationChange : onDeviceOrientationChange
	});

}; // var compassify = function (divName) {