"use strict";

onload=function() {


var View = {
	canvas: document.getElementById('canvas'),

	drawPointUnderFinger: function (touchX, touchY) {
		this.ctx.beginPath();
		this.ctx.arc(
			touchX,
			touchY,
			10,
			0, 
			Math.PI * 2);
		this.ctx.fillStyle = "eee";
		this.ctx.fill();
	}
};
View.canvas.height = window.innerHeight;
View.canvas.width = window.innerWidth;
View.ctx = View.canvas.getContext("2d");

View.canvas.onclick = function (e) {
	View.drawPointUnderFinger(e.clientX, e.clientY);
}



}