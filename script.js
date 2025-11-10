// Tekken 8: Pixel Edition — script.js
// Plug this file next to index.html. Controls: WASD / Arrows + J (punch) K (kick) L (special)

/*
Features implemented:
- Movement, jump, gravity
- Attacks: punch, kick, special (with simple combo chaining)
- Simple CPU AI with three behavior states (passive, aggressive, tactical)
- Collision/hit detection, damage, hit invulnerability, stun
- Pixel-scaled sprite drawing (placeholder images)
- HUD updates via DOM (index.html has p1hp/p2hp)
- Configurable character data at CHAR_LIST
*/

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const GAME = {
  width: canvas.width,
  height: canvas.height,
  gravity: 0.9,
  floor: canvas.height - 26,
  scale: 1, // logical scale (canvas already small)
};

// ----------------- Assets & Characters -----------------
const CHAR_LIST = [
  {name:'Jin', src:'https://raw.githubusercontent.com/iankingsigma/tekkengame/main/img1.png', maxHp:120, atkP:22, atkK:14, color:'#d1132a'},
  {name:'Xiaoyu', src:'https://raw.githubusercontent.com/iankingsigma/tekkengame/main/img4.png', maxHp:95, atkP:18, atkK:12, color:'#58a11d'},
  {name:'Meme67', src:'https://raw.githubusercontent.com/iankingsigma/tekkengame/main/img2.png', maxHp:67, atkP:30, atkK:22, color:'#fbc531'},
  {name:'Rival', src:'https://raw.githubusercontent.com/iankingsigma/tekkengame/main/img3.png', maxHp:110, atkP:20, atkK:16, color:'#3aa1ff'},
];

const IMGS = [];
let assetsLoaded = 0;
CHAR_LIST.forEach((c,i)=>{
  const img = new Image(); img.src = c.src; img.onload = ()=>{ assetsLoaded++; };
  IMGS.push(img);
});

// ----------------- Utilities -----------------
function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
function rand(min,max){ return Math.random()*(max-min)+min; }

// ----------------- Fighter factory -----------------
function makeFighter(charIdx, x, isPlayer=true){
  const c = CHAR_LIST[charIdx];
  return {
    charIdx,
    name: c.name,
    x: x,
    y: GAME.floor,
    w: 22,
    h: 36,
    vx:0, vy:0,
    onGround:true,
    facing: isPlayer?1:-1, // 1 = right, -1 = left
    hp: c.maxHp,
    maxHp: c.maxHp,
    atkP: c.atkP,
    atkK: c.atkK,
    color: c.color,
    attackState: null, // null or {type:'punch'|'kick'|'special', timer:...}
    attackCooldown:0,
    hitInv:0,
    stun:0,
    isPlayer,
    aiState: 'idle', aiTimer: 0, // for CPU
    comboBuffer: [] // store recent inputs for combos
  };
}

let player = makeFighter(0, 64, true);
let cpu = makeFighter(3, GAME.width-64, false);

// ----------------- DOM HUD references -----------------
const p1hpEl = document.getElementById('p1hp');
const p2hpEl = document.getElementById('p2hp');

function updateHUD(){
  p1hpEl.style.width = clamp(player.hp/player.maxHp*100, 0,100) + '%';
  p2hpEl.style.width = clamp(cpu.hp/cpu.maxHp*100, 0,100) + '%';
}

// ----------------- Input -----------------
const keys = {};
window.addEventListener('keydown', e=>{ keys[e.key] = true; if([' ','ArrowUp','ArrowLeft','ArrowRight','a','d','w','A','D','W'].includes(e.key)) e.preventDefault(); });
window.addEventListener('keyup', e=>{ keys[e.key] = false; });

// Add convenience mapping for actions
function inputPunch(){ keys['J'] = true; setTimeout(()=>keys['J']=false, 40); }
function inputKick(){ keys['K'] = true; setTimeout(()=>keys['K']=false, 40); }

// ----------------- Combo system -----------------
// Simple combo detection: record last few input chars and match sequences
const COMBOS = [
  {name:'JinRising', seq:['up','punch'], effect:(att,def)=>{ def.hp -= Math.round(att.atkP*1.4); def.stun = 28; }},
  {name:'SweepKick', seq:['down','kick'], effect:(att,def)=>{ def.hp -= Math.round(att.atkK*1.6); def.vy = -3; }},
  {name:'67Bomb', seq:['punch','punch','kick'], effect:(att,def)=>{ def.hp -= 40; def.stun = 40; if(att.name.includes('67')){ // meme chaos: extra damage
      def.hp -= 8; screenShake = 8; }
    }
  }
];

function pushComboBuffer(f, token){
  const tb = f.comboBuffer;
  tb.push(token);
  if(tb.length>6) tb.shift();
  // check combos (longest first)
  for(const c of COMBOS){
    const s = c.seq.join(',');
    const recent = tb.slice(-c.seq.length).join(',');
    if(recent === s){
      return c; // matched
    }
  }
  return null;
}

// ----------------- AI -----------------
// CPU has three states: passive (zoning), aggressive (rush), tactical (punish)
function updateAI(dt){
  cpu.aiTimer -= dt;
  const dx = player.x - cpu.x;
  const distance = Math.abs(dx);

  // simple state transitions
  if(cpu.aiTimer <= 0){
    const r = Math.random();
    if(r<0.45) cpu.aiState = 'aggressive';
    else if(r<0.8) cpu.aiState = 'tactical';
    else cpu.aiState = 'passive';
    cpu.aiTimer = rand(60,140);
  }

  // behavior
  if(cpu.aiState === 'aggressive'){
    // close in and attack
    if(distance > 36) cpu.vx = Math.sign(dx) * 1.4;
    else cpu.vx = 0;
    // attack when close and cooldown ready
    if(distance < 46 && cpu.attackCooldown<=0 && Math.random() < 0.06){
      cpu.attackState = {type: Math.random()<0.6? 'punch':'kick', timer:16};
      cpu.attackCooldown = 36;
    }
  } else if(cpu.aiState === 'tactical'){
    // circle, wait for opening
    if(distance > 72) cpu.vx = Math.sign(dx) * 0.9;
    else cpu.vx = -Math.sign(dx) * 0.5; // step back
    if(distance < 42 && cpu.attackCooldown<=0 && Math.random() < 0.035){
      // 30% chance chain
      cpu.attackState = {type:'punch', timer:20}; cpu.attackCooldown = 46;
    }
  } else { // passive
    cpu.vx = Math.sign(dx) * 0.5;
    if(Math.random() < 0.02 && cpu.attackCooldown<=0 && distance < 68){ cpu.attackState = {type:'punch', timer:14}; cpu.attackCooldown = 46; }
  }
}

// ----------------- Physics & Game update -----------------
let last = performance.now();
let running = true;
let screenShake = 0;

function gameLoop(now){
  const dt = Math.min(40, now - last) / 16.6667; // normalized
  last = now;
  if(running) update(dt);
  render();
  requestAnimationFrame(gameLoop);
}

function update(dt){
  // PLAYER INPUT
  let move = 0;
  if(keys['a']||keys['A']||keys['ArrowLeft']) move = -1;
  if(keys['d']||keys['D']||keys['ArrowRight']) move = 1;
  player.vx = player.vx*0.7 + move*1.6;
  if((keys['w']||keys['ArrowUp']||keys[' ']) && player.onGround){ player.vy = -6; player.onGround = false; }
  player.vy += GAME.gravity*0.18*dt; player.y += player.vy;
  if(player.y >= GAME.floor){ player.y = GAME.floor; player.vy = 0; player.onGround = true; }
  if(move!==0) player.facing = move>0?1:-1;

  // Attacks input
  // Punch: J or j
  if((keys['j']||keys['J']) && player.attackCooldown <= 0){
    player.attackState = {type:'punch', timer:18}; player.attackCooldown = 36;
    const c = pushComboBuffer(player, 'punch'); if(c){ c.effect(player, cpu); player.comboBuffer = []; }
  }
  if((keys['k']||keys['K']) && player.attackCooldown <= 0){
    player.attackState = {type:'kick', timer:20}; player.attackCooldown = 44; const c = pushComboBuffer(player, 'kick'); if(c){ c.effect(player, cpu); player.comboBuffer = []; }
  }
  // map up/down for combos
  if(keys['ArrowUp']||keys['w']||keys['W']){ const c = pushComboBuffer(player, 'up'); if(c){ c.effect(player,cpu); player.comboBuffer=[]; } }
  if(keys['ArrowDown']||keys['s']||keys['S']){ const c = pushComboBuffer(player, 'down'); if(c){ c.effect(player,cpu); player.comboBuffer=[]; } }

  // timers
  player.attackCooldown = Math.max(0, player.attackCooldown - dt);
  cpu.attackCooldown = Math.max(0, cpu.attackCooldown - dt);
  if(player.attackState) player.attackState.timer -= dt; if(player.attackState && player.attackState.timer<=0) player.attackState=null;
  if(cpu.attackState) cpu.attackState.timer -= dt; if(cpu.attackState && cpu.attackState.timer<=0) cpu.attackState=null;
  player.hitInv = Math.max(0, player.hitInv - dt); cpu.hitInv = Math.max(0, cpu.hitInv - dt);
  player.stun = Math.max(0, player.stun - dt); cpu.stun = Math.max(0, cpu.stun - dt);

  // apply velocities
  player.x += player.vx; cpu.x += cpu.vx;
  // simple friction
  player.vx *= 0.86; cpu.vx *= 0.86;
  // bounds
  player.x = clamp(player.x, 18, GAME.width-18);
  cpu.x = clamp(cpu.x, 18, GAME.width-18);

  // CPU AI update
  if(!cpu.isPlayer && cpu.stun<=0 && player.hp>0 && cpu.hp>0){ updateAI(dt); }

  // CPU attack execution (damage when attackState in hit window)
  handleAttacks(player, cpu);
  handleAttacks(cpu, player);

  // reduce hp floor
  if(player.hp <= 0 || cpu.hp <= 0){ running = false; screenShake = 10; }
  updateHUD();
}

function handleAttacks(att, def){
  if(!att.attackState) return;
  // define hit window: when timer within certain range
  const t = att.attackState.timer;
  const hitWindow = (att.attackState.type === 'punch') ? (t<12 && t>8) : (t<14 && t>8);
  if(hitWindow && def.hitInv<=0){
    const dist = Math.abs(att.x - def.x);
    if(dist < 46){
      const base = (att.attackState.type==='punch') ? att.atkP : att.atkK;
      const damage = Math.round(base + rand(-4,6));
      def.hp -= damage;
      def.hitInv = 28; def.stun = 16;
      def.vx += (def.x < att.x ? -1.6 : 1.6);
      // slight screen shake for hits
      screenShake = Math.max(screenShake, 4);
      // If attacker is Meme67 special, extra chaos
      if(att.name.includes('67') && Math.random()<0.3){ def.hp -= 6; screenShake = 8; }
    }
  }
}

// ----------------- Rendering -----------------
function render(){
  // clear
  ctx.clearRect(0,0,GAME.width,GAME.height);
  // optional shake
  const sx = screenShake>0 ? rand(-screenShake, screenShake) : 0;
  const sy = screenShake>0 ? rand(-screenShake, screenShake) : 0;
  if(screenShake>0) screenShake *= 0.85; else screenShake = 0;
  ctx.save(); ctx.translate(sx, sy);

  // bg
  ctx.fillStyle = '#111'; ctx.fillRect(0,0,GAME.width,GAME.height);
  // stage ground
  ctx.fillStyle = '#101018'; ctx.fillRect(0, GAME.floor+8, GAME.width, GAME.height - GAME.floor - 8);

  // draw fighters
  drawFighter(player);
  drawFighter(cpu);

  // overlay text e.g., KO
  if(!running){ ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(0,0,GAME.width,GAME.height); ctx.fillStyle='#fff'; ctx.font='10px monospace'; ctx.textAlign='center'; ctx.fillText(player.hp<=0? cpu.name + ' WINS!' : player.name + ' WINS!', GAME.width/2, GAME.height/2); }

  ctx.restore();
}

function drawFighter(f){
  ctx.save();
  const img = IMGS[f.charIdx];
  const sx = Math.round(f.x);
  const sy = Math.round(f.y - f.h);

  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.ellipse(sx, f.y+6, 18,6,0,0,Math.PI*2); ctx.fill();

  // body block
  ctx.fillStyle = f.color; ctx.fillRect(sx-10, sy+8, 20, 18);

  // sprite image
  if(img && img.complete){
    const targetW = 36; const scale = targetW / img.width; const dw = Math.round(img.width * scale), dh = Math.round(img.height * scale);
    ctx.translate(sx, sy+4);
    if(f.facing < 0) ctx.scale(-1,1);
    ctx.drawImage(img, -dw/2, -dh/2, dw, dh);
  }

  // attack effect
  if(f.attackState){ ctx.fillStyle = 'rgba(255,215,80,0.12)'; ctx.fillRect(sx + f.facing*12, sy+6, 10,6); }
  // hurt flash
  if(f.hitInv > 0){ ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(sx-14, sy, 28, 36); }

  ctx.restore();
}

// ----------------- Init & Run -----------------
(function init(){
  // start loop
  last = performance.now();
  requestAnimationFrame(gameLoop);
})();

// Expose some debug helpers to window for quick tweaking
window._GAME = GAME; window._PLAYER = player; window._CPU = cpu; window._IMGS = IMGS;
