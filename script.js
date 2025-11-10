const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.style.imageRendering = 'pixelated';

const scale = 4;
const worldWidth = canvas.width;
const worldHeight = canvas.height;
let gameState = 'menu'; // 'menu', 'fight', 'gameover'

const player = {
  x: 40,
  y: worldHeight - 40,
  w: 16,
  h: 24,
  color: 'cyan',
  vx: 0,
  vy: 0,
  onGround: true,
  hp: 100,
  name: 'Player 1'
};

const enemy = {
  x: worldWidth - 60,
  y: worldHeight - 40,
  w: 16,
  h: 24,
  color: 'red',
  vx: 0,
  vy: 0,
  onGround: true,
  hp: 100,
  name: 'CPU'
};

let keys = {};
window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

function drawBox(f){
  ctx.fillStyle = f.color;
  ctx.fillRect(f.x, f.y, f.w, f.h);
}

function updatePlayer(p, isAI=false){
  if(!isAI){
    if(keys['a']) p.vx = -1.5;
    else if(keys['d']) p.vx = 1.5;
    else p.vx = 0;
    if(keys[' '] && p.onGround){
      p.vy = -4;
      p.onGround = false;
    }
    if(keys['j'] && Math.abs(p.x - enemy.x) < 20){
      enemy.hp -= 3;
      document.getElementById('p2hp').style.width = enemy.hp + '%';
    }
  } else {
    // simple AI movement
    if(p.x > player.x + 10) p.vx = -1.2;
    else if(p.x < player.x - 10) p.vx = 1.2;
    else p.vx = 0;
    if(Math.abs(p.x - player.x) < 20 && Math.random() < 0.03){
      player.hp -= 3;
      document.getElementById('p1hp').style.width = player.hp + '%';
    }
  }

  p.vy += 0.2; // gravity
  p.x += p.vx;
  p.y += p.vy;
  if(p.y > worldHeight - 40){
    p.y = worldHeight - 40;
    p.vy = 0;
    p.onGround = true;
  }
  p.x = Math.max(0, Math.min(worldWidth - p.w, p.x));
}

function drawMenu(){
  ctx.fillStyle = '#111';
  ctx.fillRect(0,0,worldWidth,worldHeight);
  ctx.fillStyle = 'white';
  ctx.font = '10px monospace';
  ctx.fillText('TEKKEN 8: PIXEL EDITION', 30, 50);
  ctx.fillText('Press ENTER to Start Fight', 30, 90);
}

function drawFight(){
  ctx.fillStyle = '#333';
  ctx.fillRect(0,0,worldWidth,worldHeight);
  drawBox(player);
  drawBox(enemy);
}

function loop(){
  if(gameState === 'menu'){
    drawMenu();
    if(keys['enter']){
      gameState = 'fight';
    }
  } else if(gameState === 'fight'){
    drawFight();
    updatePlayer(player,false);
    updatePlayer(enemy,true);
    if(player.hp <= 0 || enemy.hp <= 0){
      gameState = 'gameover';
    }
  } else if(gameState === 'gameover'){
    ctx.fillStyle = '#000';
    ctx.fillRect(0,0,worldWidth,worldHeight);
    ctx.fillStyle = 'white';
    ctx.fillText(player.hp <= 0 ? 'CPU Wins!' : 'Player Wins!', 60, 80);
    ctx.fillText('Press R to Restart', 60, 100);
    if(keys['r']){
      player.hp = 100;
      enemy.hp = 100;
      document.getElementById('p1hp').style.width = '100%';
      document.getElementById('p2hp').style.width = '100%';
      gameState = 'menu';
    }
  }
  requestAnimationFrame(loop);
}

loop();
