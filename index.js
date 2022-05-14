"use strict";
var ctx;
var paddle;				//パドルオブジェクト
var ball;				//ボールオブジェクト
var timer;				//メインループのタイマー
var blocks = [];		//ブロックオブジェクト配列
var balls = 3;			//残ボール数
var score = 0;			//得点
var WIDTH = 600;		//キャンバスの幅
var HEIGHT = 600;		//キャンバスの高さ
var colors = ['red',
			'orange',
			'yellow',
			'green',
			'purple',
			'blue'];

//Ballオブジェクト
function Ball() {
	this.x = 0;
	this.y = HEIGHT + this.r;	//out of the area
	this.dx = 0;				//x軸方向の変化分
	this.dy = 0;				//y軸方向の変化分
	this.r = 10;				//ボール半径
	this.dir = 0;				//ボールの進む向き(ラジアン単位)
	this.speed = 10;

	//現在座標にdx,dyを加算
	this.move = function() {
		this.x += this.dx;
		this.y += this.dy;
	}

	//ボールの向き変え
	this.changeDir = function(dir) {
		this.dir = dir;
		this.dx = this.speed * Math.cos(dir);
		this.dy = - this.speed * Math.sin(dir);
	}

	//ボール描写
	this.draw = function(ctx) {
		drawBall(this.x, this.y, this.r);
	}
}

//BlockオブジェクトとPaddleオブジェクト
Block.prototype = Paddle.prototype = {

	//色をコンテキストに指定し、fillRectで矩形を描画
	draw:function(ctx) {
		ctx.fillStyle = this.color;
		ctx.fillRect(this.x, this.y, this.w, this.h);
	}
}

//Blockオブジェクト
function Block(x, y, i) {
	this.x = x;
	this.y = y;
	this.w = 50;
	this.h = 20;
	this.color = colors[i];
	this.point = (6 - i) * 10;
}

//Paddleオブジェクト
function Paddle() {
	this.x = (WIDTH - this.w) / 2;
	this.y = HEIGHT - 20;
	this.w = 110;
	this.h = 20;
	this.color = 'yellow';
	this.keyL = false;
	this.keyR = false;
}

//処理開始関数
function init() {

	//canvasのコンテキストを取得しctxに格納
	ctx = document.getElementById('canvas').getContext('2d');
	//フォントを指定
	ctx.font = "20pt Arial";

	//initialize event listener
	window.addEventListener('keydown', function(e) {
		toggleKey(e.keyCode, true);
	}, true);

	window.addEventListener('keyup', function(e) {
		toggleKey(e.keyCode, false);
	}, false);

	//initialize players
	paddle = new Paddle();
	ball = new Ball();

	//ゲーム開始時の処理
	start();

	//タイマーの開始(mainLoop関数を15ミリ秒間隔で呼び出し)
	if (isNaN(timer)) {
		timer = setInterval(mainLoop, 15);
	}
}

function toggleKey(code, flag) {
	switch(code) {
		//スペースキー
		case 32:
			//プレイ中でないときボールの位置と向きを初期化
			if (!isPlaying()) {
				//パドル中央
				ball.x = paddle.x + paddle.w / 2;
				//パドル上
				ball.y = paddle.y - ball.r;
				//角度の範囲(45～135度の間)
				ball.changeDir(Math.random() * Math.PI / 2 + Math.PI / 4); //45-135
			}
			break;
		//左矢印
		case 37:
			paddle.keyL = flag;
			break;
		//右矢印
		case 39:
			paddle.keyR = flag;
			break;
	}
}

//ゲーム開始関数
function start() {

	//パドルのサイズを10小さくする(最小値20)
	paddle.w = Math.max(20, paddle.w - 10);
	//パドルのスピードを1早くする(最大値20)
	ball.speed = Math.min(20, ball.speed + 1);

	//lauout blocks
	for (var i = 0; i < 6; i++) {		//縦方向
		for (var j = 0; j < 9; j++) {	//横方向
			blocks.push(new Block(j * 60 + 35, i * 30 + 50, i));
		}
	}
}

//メインループ
function mainLoop() {

	//move the paddle
	if (paddle.keyL) {
		paddle.x = Math.max(0, paddle.x - 10);
	}
	if (paddle.keyR) {
		paddle.x = Math.min(WIDTH - paddle.w, paddle.x + 10);
	}
	draw();
	if (!isPlaying()) {
		return;
	}

	//ボールが一番下にきたとき
	if (ball.y > HEIGHT - paddle.h) {

		//hit tha paddle?
		if (paddle.x < ball.x &&
			ball.x < paddle.x + paddle.w &&
			paddle.y < ball.y &&
			ball.y < paddle.y + paddle.h) {
				var ratio = (paddle.x + paddle.w / 2 - ball.x) / paddle.w * 0.8;	// -0.4 to 0.4
				ball.changeDir(Math.PI / 2 + Math.PI * ratio);
		}
		else {
			if (--balls == 0) {			//game over
				clearInterval(timer);
				timer = NaN;
				draw();
				return;
			}
			ball.y = HEIGHT + ball.r;
		}
	}

	//ボールの次の座標を求める
	var nx = ball.x + ball.dx;
	var ny = ball.y - ball.dy;

	//hit the wall?
	if (ny < ball.r && ball.dy < 0) {
		ball.changeDir(ball.dir * -1);
	}
	else if (nx < ball.r ||
			nx + ball.r > WIDTH) {
		ball.changeDir(Math.PI - ball.dir);
	}

	//hit a block?
	var hit = -1;

	//ブロックに当たったか否か
	blocks.some(function(block, i) {
		if (block.x - ball.r < nx &&
			nx < block.x + block.w + ball.r &&
			block.y - ball.r < ny &&
			ny < block.y + block.h +ball.r) {
			hit = i;
			return true;
		}
		return false;
	});

	//ブロックを衝突した場合
	if (hit >= 0) {
		//スコア加算
		score += blocks[hit].point;
		//ブロック削除
		blocks.splice(hit, 1);
		if (blocks.length <= 0) {		//cleared
			ball.y = HEIGHT + ball.r;
			start();
			return;
		}
		//ブロックの向きを変更
		ball.changeDir(ball.dir * -1);
	}
	//ボールの移動
	ball.move();
}

//ゲーム中か否か
function isPlaying() {
	return ball.y < HEIGHT + ball.r;
}

//座標に半径でボールを描画
function drawBall(x, y ,r) {
	ctx.fillStyle = 'yellow';
	ctx.beginPath();
	ctx.arc(x, y, r, 0, Math.PI * 2, true);
	ctx.fill();
}

function draw() {

	//fill background
	ctx.fillStyle = 'rgb(0, 0, 0)';
	ctx.fillRect(0, 0, WIDTH, HEIGHT);

	//draw blocks
	blocks.forEach(function(block) {
		block.draw(ctx);
	});

	//draw paddle
	paddle.draw(ctx);

	//draw balls
	ball.draw(ctx);
	if (balls > 2) {
		drawBall(80, 15, 10);
	}
	if (balls > 1) {
		drawBall(50, 15, 10);
	}

	//draw score & information
	ctx.fillStyle = 'rgb(0, 255, 0)'
	ctx.fillText(('00000' + score).slice(-5), 500, 30);
	if (isNaN(timer)) {
		ctx.fillText('GAME OVER', 220, 250);
	}
}