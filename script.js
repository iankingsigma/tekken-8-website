// --- Pixel Tekken (Playable!) by ian kishk ---

const CHARACTERS = [
  {
    name: "Character 67",
    hp: 77,
    punch: 22,
    kick: 21,
    combo: 33,
    description: "Legendary meme fighter, unleashes the golden 67.",
    color: "#fbc531",
    img: "https://raw.githubusercontent.com/iankingsigma/tekken-8-website/main/img2.png"
  },
  {
    name: "Fighter 41",
    hp: 112,
    punch: 20,
    kick: 22,
    combo: 31,
    description: "A strong, heavy puncher with solid defense.",
    color: "#c80018",
    img: "https://raw.githubusercontent.com/iankingsigma/tekken-8-website/main/img1.png"
  },
  {
    name: "Fighter 21",
    hp: 90,
    punch: 17,
    kick: 27,
    combo: 27,
    description: "Swift and fast, excels at quick combos and dodges.",
    color: "#58a11d",
    img: "https://raw.githubusercontent.com/iankingsigma/tekken-8-website/main/img4.png"
  },
  {
    name: "Fighter 201",
    hp: 139,
    punch: 14,
    kick: 18,
    combo: 26,
    description: "Tank-like endurance. Slower but can take a beating.",
    color: "#841dae",
    img: "https://raw.githubusercontent.com/iankingsigma/tekken-8-website/main/img3.png"
  }
];

// --- DOM and Game State ---
const $menu = document.getElementById("menu");
const $select = document.getElementById("select");
const $fightUI = document.getElementById("fightUI");
const $fighterList = document.getElementById("fighterList");
const $vsBtn = document.getElementById("vsBtn");
const $canvas = document.getElementById("canvas");
const ctx = $canvas.getContext("2d");
const $stats = document.getElementById("fightStats");
const $controlsBar = document.getElementById("controls-bar");
let selected = null;

window.showMenu = function() {
  $menu.className = "active";
  $select.className = "";
  $fightUI.className = "";
  $controlsBar.style.display="none";
  selected = null;
};

window.showSelect = function() {
  $menu.className = "";
  $select.className = "active";
  $fightUI.className = "";
  $controlsBar.style.display="none";
  selected = null;
  renderSelect();
};

function renderSelect() {
  let html = "";
  CHARACTERS.forEach((f,i) => {
    html += `<div class="char-card ${selected===i ? "selected" : ""}" tabindex="0" data-idx="${i}">
      <img src="${f.img}" class="char-img" alt="${f.name}">
      <div class="char-name">${f.name}</div>
      <span class="char-hp">HP: ${f.hp}</span>
      <div class="char-desc">${f.description}</div>
      <span class="char-punch">Punch: ${f.punch} &nbsp; Kick: ${f.kick} &nbsp; Combo: ${f.combo}</span>
    </div>`;
  });
  $fighterList.innerHTML = html;
  document.querySelector("#pickTitles span").innerText = "Player: " + (selected===null ? "Choose!" : CHARACTERS[selected].name);
  document.querySelectorAll('.char-card').forEach(card => {
    card.onclick = function() {
      const charIdx = Number(card.getAttribute("data-idx"));
      selected = charIdx;
      renderSelect();
      showFightBtn();
    };
  });
  showFightBtn();
}

function showFightBtn() {
  $vsBtn.style.display = (selected!==null) ? "block" : "none";
}

$vsBtn.onclick = startFightGame;

// ---- PLAYABLE FIGHT SYSTEM ----
let fightAnimRequest = null;
let keys = {};
let game = null;

// Key listener (real time controls)
window.addEventListener('keydown',e=>{
  if(!game||game.over) return;
  keys[e.key.toLowerCase()]=true;
  performPlayerAction();
});
window.addEventListener('keyup',e=>{
  keys[e.key.toLowerCase()]=false;
});

// Start fight and initialize game engine
function startFightGame() {
  $menu.className = "";
  $select.className = "";
  $fightUI.className = "active";
  $controlsBar.style.display="flex";
  $stats.innerHTML = "";
  game = initGameState(selected, pickCpu());
  fightAnimRequest && cancelAnimationFrame(fightAnimRequest);
  fightAnimRequest = requestAnimationFrame(gameLoop);
}

function pickCpu() {
  let cpuChoices = CHARACTERS.map((_,i)=>i).filter(i=>i!==selected);
  return cpuChoices[Math.floor(Math.random()*cpuChoices.length)];
}

// Main game state
function initGameState(youIdx, cpuIdx) {
  // Initial positions
  return {
    you: {...CHARACTERS[youIdx]},
    cpu: {...CHARACTERS[cpuIdx]},
    youX: 120,
    cpuX: 500,
    youHP: CHARACTERS[youIdx].hp,
    cpuHP: CHARACTERS[cpuIdx].hp,
    youDir: 1,
    cpuDir: -1,
    phase: "ready",
    timer: 0,
    lastMove: {},
    cpuCooldown: 0,
    anims: [],
    over:false
  };
}

// Main loop
function gameLoop() {
  renderFightCanvas();
  if(game.over) return;
  // CPU AI: move closer, attack when near, random action
  if(game.phase==="play"){
    if(game.cpuCooldown>0) game.cpuCooldown--;
    let dx = game.cpuX - game.youX;
    if(Math.abs(dx)>84){ // Move closer
      if(dx>0){ game.cpuX -= 5; } else { game.cpuX += 5; }
      game.cpuDir = dx>0?-1:1;
    }
    if(Math.abs(dx)<=94 && game.cpuCooldown<=0) {
      // Random attack: punch/kick/combo
      let move = Math.random();
      if(move < 0.5) doCpuAction("punch");
      else if(move < .81) doCpuAction("kick");
      else doCpuAction("combo");
      game.cpuCooldown = Math.floor(20+Math.random()*25);
    }
  }
  // Start phase
  if(game.phase==="ready"){
    game.timer++;
    $stats.innerHTML = `FIGHT! Use controls below to attack.`;
    if(game.timer>50){game.phase="play";}
  }
  fightAnimRequest = requestAnimationFrame(gameLoop);
}

// Player controls
function performPlayerAction(){
  if(game.phase!=="play"||game.over) return;
  let acted=false;
  // Move
  if(keys["arrowleft"]) { if(game.youX>67) game.youX-=12;game.youDir=-1;acted=true;}
  if(keys["arrowright"]){ if(game.youX<573) game.youX+=12;game.youDir=1;acted=true;}
  // Attacks
  if(keys["z"]){ doPlayerAction("punch");acted=true;}
  if(keys["x"]){ doPlayerAction("kick");acted=true;}
  if(keys["c"]){ doPlayerAction("combo");acted=true;}
  if(acted) renderFightCanvas();
}

function doPlayerAction(type){
  // Must be near enough
  if(game.over) return;
  let dx = Math.abs(game.youX-game.cpuX);
  if(dx>90) return;
  doAttack("you",type);
}

function doCpuAction(type){
  if(game.over) return;
  let dx = Math.abs(game.youX-game.cpuX);
  if(dx>95) return;
  doAttack("cpu",type);
}

// Attack logic
function doAttack(from, type){
  let attacker, defender;
  if(from==="you"){ attacker=game.you; defender=game.cpu; }
  else{ attacker=game.cpu; defender=game.you; }
  // Damage calculation
  let dmg = 0;
  let animColor = "#fff";
  if(type==="punch"){
    dmg = attacker.punch + Math.floor(Math.random()*7)-3;
    animColor="#fbc531";
  }else if(type==="kick"){
    dmg = attacker.kick + Math.floor(Math.random()*6)-3;
    animColor="#36d851";
  }else if(type==="combo"){
    dmg = attacker.combo + Math.floor(Math.random()*8)-5;
    animColor="#ff0367";
  }
  dmg = Math.max(5,dmg);
  // Anim
  let fxX,fxY;
  if(from==="you"){ fxX=game.cpuX;fxY=210;game.lastMove={type,dir:game.youDir,from:'you'};}
  else{ fxX=game.youX;fxY=210;game.lastMove={type,dir:game.cpuDir,from:'cpu'};}
  game.anims.push({fxX,fxY,animColor,type,frame:0});
  // Apply damage
  if(from==="you"){
    game.cpuHP-=dmg;
    if(game.cpu.name==="Character 67" && type==="combo"){ spam67(); }
    if(game.cpuHP<=0){game.cpuHP=0;game.over=true; $stats.innerHTML=`You Win! - ${attacker.name}`;}
  }else{
    game.youHP-=dmg;
    if(game.you.name==="Character 67" && type==="combo"){ spam67(); }
    if(game.youHP<=0){game.youHP=0;game.over=true; $stats.innerHTML=`CPU Wins! - ${attacker.name}`;}
  }
}

// Draw scene and fighters
function renderFightCanvas(){
  ctx.clearRect(0,0,$canvas.width,$canvas.height);
  // Arena/bar
  ctx.fillStyle="#222237";
  ctx.fillRect(0,0,$canvas.width,$canvas.height);
  ctx.fillStyle="#c84141";
  ctx.fillRect(74,260,490,16);
  ctx.fillStyle="#888";
  ctx.fillRect(79,276,480,7);
  // Fighters
  renderFighter(game.youX,210,selected,game.youHP,game.lastMove && game.lastMove.from==="you" ? game.lastMove : null,game.youDir);
  renderFighter(game.cpuX,210,pickCpu(),game.cpuHP,game.lastMove && game.lastMove.from==="cpu" ? game.lastMove : null,game.cpuDir);

  // HP bars
  ctx.save();
  ctx.fillStyle="#212140";
  ctx.fillRect(88,35,160,17);
  ctx.fillRect(392,35,160,17);
  // Player
  ctx.fillStyle=CHARACTERS[selected].color;
  ctx.fillRect(91,39,Math.max(2,156*(game.youHP/CHARACTERS[selected].hp)),13);
  ctx.fillStyle="#fed";
  ctx.font="bold 15px Orbitron";
  ctx.textAlign="left";
  ctx.fillText(CHARACTERS[selected].name,88,31);
  ctx.textAlign="right";
  ctx.fillText(Math.max(0,game.youHP)+" HP",244,49);
  // CPU
  let cpuIdx = pickCpu();
  ctx.fillStyle=CHARACTERS[cpuIdx].color;
  ctx.fillRect(395,39,Math.max(2,156*(game.cpuHP/CHARACTERS[cpuIdx].hp)),13);
  ctx.textAlign="right";
  ctx.fillText(CHARACTERS[cpuIdx].name,552,31);
  ctx.textAlign="left";
  ctx.fillText(Math.max(0,game.cpuHP)+" HP",400,49);
  ctx.restore();

  // Animated hit FX
  for(let i=game.anims.length-1;i>=0;i--){
    let fx = game.anims[i];
    ctx.save();
    ctx.globalAlpha = Math.max(0,1-fx.frame/8);
    ctx.font = fx.type==="combo"?"bold 33px Orbitron":"bold 27px Orbitron";
    ctx.fillStyle = fx.animColor;
    ctx.textAlign = "center";
    ctx.fillText(fx.type.toUpperCase(),fx.fxX,fx.fxY-(fx.frame*7));
    ctx.restore();
    if(++fx.frame>8)game.anims.splice(i,1);
  }
}

// Draw pixel fighter with optional attack pose
function renderFighter(x,y,cIdx,hp,move,dir){
  let f = CHARACTERS[cIdx];
  ctx.save();
  ctx.translate(x, y);
  if(dir<0) ctx.scale(-1,1);

  // Main body
  ctx.beginPath();
  ctx.arc(0, 0, 37, 0, 2*Math.PI); 
  ctx.fillStyle = f.color;
  ctx.globalAlpha = 0.89;
  ctx.fill();

  // Hands/Gloves (move forward if punch/kick)
  let armOffset = move && (move.type==="punch"||move.type==="kick"||move.type==="combo") ? 32 : 19;
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(-armOffset,35,13,0,2*Math.PI);
  ctx.arc(armOffset,35,13,0,2*Math.PI);
  ctx.fillStyle = move && move.type==="kick" ? "#36d851" : "#e84118";
  ctx.fill();

  // Kick pose
  if(move && move.type==="kick"){
    ctx.save();
    ctx.rotate(.28);
    ctx.fillStyle="#36d851";
    ctx.fillRect(17,52,24,8);
    ctx.restore();
    ctx.save();
    ctx.rotate(-.35);
    ctx.fillStyle="#d8f561";
    ctx.fillRect(-38,56,27,7);
    ctx.restore();
  }
  // Combo pose
  if(move && move.type==="combo"){
    ctx.save();
    ctx.rotate(.17);
    ctx.fillStyle="#ff0367";
    ctx.fillRect(19,51,27,7);
    ctx.restore();
    ctx.save();
    ctx.rotate(-.22);
    ctx.fillStyle="#ff0367";
    ctx.fillRect(-34,54,24,7);
    ctx.restore();
  }
  // Draw avatar overlay (face/body image)
  let imgObj = new window.Image();
  imgObj.src = f.img;
  ctx.save();
  ctx.globalAlpha = 0.95;
  ctx.drawImage(imgObj,-33,-48,66,76);
  ctx.restore();
  // HP bar above
  ctx.save();
  ctx.fillStyle = "#212140";
  ctx.fillRect(-32,-58,64,10);
  ctx.fillStyle = f.color;
  ctx.fillRect(-32,-58,Math.max(2,64*(Math.max(0,hp)/f.hp)),10);
  ctx.font = "bold 12px Orbitron";
  ctx.fillStyle="#fbc531";
  ctx.textAlign="center";
  ctx.fillText(hp+"",0,-48);
  ctx.restore();

  ctx.restore();
}

// Meme 67 effect
function spam67() {
  for(let i=0;i<21;i++) {
    setTimeout(()=>{
      const s=document.createElement('span');
      s.className='secret-67';
      s.textContent='67';
      s.style.left=(Math.random()*window.innerWidth*0.8)+'px';
      s.style.top=(Math.random()*window.innerHeight*0.8)+'px';
      document.body.appendChild(s);
      setTimeout(()=>s.remove(), 1100+Math.random()*600);
    },Math.random()*800);
  }
}

// Start in main menu
showMenu();
