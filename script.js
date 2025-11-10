// --- Pixel Tekken by ian kishk ---

// Pixel fighters (customizable: add more fighters here; use pixel art, emoji, or loaded images for avatars)
const CHARACTERS = [
  {
    name: "41",
    hp: 120,
    punch: 23,
    description: "The fierce hero with unmatched combos.",
    color: "#c80018",
    img: "https://raw.githubusercontent.com/iankingsigma/tekken-8-website/main/img1.png",
    avatar: [[0,0,"#c80018"],[1,20,"#e84118"],[-1,20,"#e84118"]]
  },
  {
    name: "21",
    hp: 115,
    punch: 20,
    description: "He dreams of being the toughest in the universe.",
    color: "#faa805",
    img: "https://raw.githubusercontent.com/iankingsigma/tekken-8-website/main/paul.png",
    avatar: [[0,0,"#faa805"],[1,20,"#c80018"],[-1,20,"#c80018"]]
  },
  {
    name: "401",
    hp: 97,
    punch: 18,
    description: "An acrobat full of surprises.",
    color: "#58a11d",
    img: "https://raw.githubusercontent.com/iankingsigma/tekken-8-website/main/img4.png",
    avatar: [[0,0,"#58a11d"],[1,20,"#fbc531"],[-1,20,"#fbc531"]]
  },
  {
    name: "666",
    hp: 118,
    punch: 21,
    description: "Devil-powered and ruthless.",
    color: "#841dae",
    img: "https://raw.githubusercontent.com/iankingsigma/tekken-8-website/main/kazuya.png",
    avatar: [[0,0,"#841dae"],[1,20,"#e84118"],[-1,20,"#e84118"]]
  },
  {
    name: "69",
    hp: 103,
    punch: 18,
    description: "Nature’s brawler with strong spirit.",
    color: "#04aff5",
    img: "https://raw.githubusercontent.com/iankingsigma/tekken-8-website/main/julia.png",
    avatar: [[0,0,"#04aff5"],[1,20,"#fbc531"],[-1,20,"#fbc531"]]
  },
  {
    name: "67)",
    hp: 67,
    punch: 67,
    description: "The forbidden meme fighter. Chaos!",
    color: "#fbc531",
    img: "https://raw.githubusercontent.com/iankingsigma/tekken-8-website/main/img2.png",
    avatar: [[0,0,"#fbc531"],[1,20,"#fbc531"],[-1,20,"#fbc531"]]
  }
];

// Global game state
const $menu = document.getElementById("menu");
const $select = document.getElementById("select");
const $fightUI = document.getElementById("fightUI");
const $fighterList = document.getElementById("fighterList");
const $vsBtn = document.getElementById("vsBtn");
const $canvas = document.getElementById("canvas");
const $stats = document.getElementById("fightStats");
const ctx = $canvas.getContext("2d");
let selected = [null, null];
let pickMode = "arcade";

// ---- MENU ----
window.showMenu = function() {
  $menu.className = "active";
  $select.className = "";
  $fightUI.className = "";
  selected = [null, null];
};

window.showSelect = function(isVersus=false) {
  $menu.className = "";
  $select.className = "active";
  $fightUI.className = "";
  pickMode = isVersus ? "versus" : "arcade";
  selected = [null, null];
  renderSelect();
};

// ---- CHARACTER SELECT ----

function renderSelect() {
  let html = "";
  CHARACTERS.forEach((f,i) => {
    html += `<div class="char-card ${selected.includes(i) ? "selected" : ""}" tabindex="0" data-idx="${i}">
      <img src="${f.img}" class="char-img" alt="${f.name}">
      <div class="char-name">${f.name}</div>
      <span class="char-hp">HP: ${f.hp}</span>
      <div class="char-desc">${f.description}</div>
      <span class="char-punch">Punch: ${f.punch}</span>
    </div>`;
  });
  $fighterList.innerHTML = html;
  document.getElementById("p1tit").innerText = "Player 1: " + (selected[0]===null ? "Choose!" : CHARACTERS[selected[0]].name);
  document.getElementById("p2tit").innerText = (pickMode==="versus" ? "Player 2: " : "CPU: ") + (selected[1]===null ? "Choose!" : CHARACTERS[selected[1]].name);

  // Click logic
  document.querySelectorAll('.char-card').forEach(card => {
    card.onclick = function() {
      const charIdx = Number(card.getAttribute("data-idx"));
      // P1 selects first, then P2
      if(selected[0]===null) {
        selected[0]=charIdx;
      } else if(selected[1]===null && charIdx!==selected[0]) {
        selected[1]=charIdx;
      } else if(selected.includes(charIdx)) {
        // Remove pick
        if(selected[1]===charIdx) selected[1]=null;
        else if(selected[0]===charIdx) selected[0]=null;
      }
      renderSelect();
      showFightBtn();
    };
  });
  showFightBtn();
}

function showFightBtn() {
  $vsBtn.style.display = (selected[0]!==null && selected[1]!==null) ? "block" : "none";
}

// ---- FIGHT ----

$vsBtn.onclick = startFightGame;
let fightState = {};
let fightAnimRequest = null;

function startFightGame() {
  $menu.className = "";
  $select.className = "";
  $fightUI.className = "active";
  $stats.innerHTML = "";
  // Setup fighters
  let f1 = CHARACTERS[selected[0]], f2 = CHARACTERS[selected[1]];
  fightState = {
    f1: {...f1}, f2: {...f2},
    hp: [f1.hp, f2.hp],
    turn: Math.random()>0.5?0:1,
    phase: "intro",
    timer: 0,
    anim: 0,
    action: null, // {type:'punch',from:0/1}
    winner: null,
    log: [],
    pos: [100,500], // fighters X positions
    punchOffset: [0,0],
    round:1
  };
  fightAnimRequest && cancelAnimationFrame(fightAnimRequest);
  requestAnimationFrame(fightLoop);
}

// Main fight loop
function fightLoop() {
  renderFightCanvas();
  if(fightState.phase=="intro") {
    fightState.timer++;
    $stats.innerHTML = `Round ${fightState.round} - Prepare to fight!`;
    if(fightState.timer>60) { fightState.phase="turn"; fightState.timer=0; }
  }
  else if(fightState.phase=="turn") {
    // Decide who acts
    $stats.innerHTML = `Round ${fightState.round}: ${fightState.turn===0?"Player 1":"Player 2"} (${fighterName(fightState.turn)}) attacks!`;
    setTimeout(()=>{
      fightState.action={type:"punch",from:fightState.turn};
      fightState.phase="action";
      fightState.timer=0;
      requestAnimationFrame(fightLoop);
    },700);
    fightState.phase="wait";
  }
  else if(fightState.phase=="action" && fightState.action) {
    let from = fightState.action.from, to = 1-from;
    if(fightState.timer<14){
      // Animate move forward
      fightState.punchOffset[from]=fightState.timer*5;
      fightState.punchOffset[to]=0;
    } else if(fightState.timer==14){
      // Connect punch!
      fightState.punchOffset[from]=70;
      showHitEffect(from==0?fightState.pos[1]:fightState.pos[0],210);
    } else if(fightState.timer<24) {
      fightState.punchOffset[from]=70-(fightState.timer-14)*7;
    } else {
      fightState.punchOffset=[0,0];
      // Damage calculation!
      let damage = CHARACTERS[selected[from]].punch + Math.floor(Math.random()*8)-4;
      if(selected[from]===5){ // Meme 67 has chaos power
        damage += Math.floor(Math.random()*17) + 10;
        if(Math.random()>0.75) { spam67(); }
      }
      damage = Math.max(7, damage);
      fightState.hp[to] -= damage;
      fightState.log.push(`${fighterName(from)} dealt ${damage} to ${fighterName(to)}!`);
      // KO check!
      if(fightState.hp[to]<=0) {
        fightState.hp[to]=0;
        fightState.winner = from;
        fightState.phase = "ko";
        $stats.innerHTML = `<span style='color:#fbc531;font-size:1.7em;'>${fighterName(from)} Wins!</span>`;
      } else {
        fightState.turn = to; fightState.phase = "next"; fightState.round++;
      }
    }
    fightState.timer++;
  }
  else if(fightState.phase=="next") {
    fightState.phase="turn";fightState.timer=0;
  }
  else if(fightState.phase=="ko") {
    // Game ends
    $stats.innerHTML += `<br><span style='color:#fed;'>K.O! Click Main Menu to play again.</span>`;
    return;
  }
  fightAnimRequest = requestAnimationFrame(fightLoop);
}

// --- Renderers ---

function fighterName(idx){ return idx===0?CHARACTERS[selected[0]].name:CHARACTERS[selected[1]].name; }

// Draw pixel fighters and game scene
function renderFightCanvas() {
  ctx.clearRect(0,0,$canvas.width,$canvas.height);
  // Arena
  ctx.fillStyle="#222237";
  ctx.fillRect(0,0,$canvas.width,$canvas.height);
  ctx.fillStyle="#c84141";
  ctx.fillRect(70,260,500,16);
  ctx.fillStyle="#888";
  ctx.fillRect(75,276,490,7);

  // Fighters
  renderPixelFighter(fightState.pos[0]+fightState.punchOffset[0],210,selected[0],fightState.hp[0],fightState.winner===0);
  renderPixelFighter(fightState.pos[1]-fightState.punchOffset[1],210,selected[1],fightState.hp[1],fightState.winner===1,true);
}

// Fighter renderer (pixel shapes + img overlay)
function renderPixelFighter(x,y,charIdx,hp,isWinner,flip) {
  let char = CHARACTERS[charIdx];
  // Main body
  ctx.save();
  ctx.translate(x, y);
  if(flip){ ctx.scale(-1,1);}
  // Pixel body
  ctx.beginPath();
  ctx.arc(0, 0, 40, 0, 2*Math.PI); ctx.fillStyle = char.color;
  ctx.globalAlpha = 0.88; ctx.fill();
  // Gloves/hands
  ctx.globalAlpha = 0.98;
  ctx.beginPath();
  ctx.arc(-28,38,16,0,2*Math.PI);ctx.arc(28,38,16,0,2*Math.PI);
  ctx.fillStyle = "#e84118"; ctx.fill();
  ctx.globalAlpha=1;
  // Avatar overlay (pixel img w glow)
  let imgObj = new window.Image();
  imgObj.src = char.img;
  ctx.save();
  ctx.globalAlpha=0.95;
  ctx.drawImage(imgObj,-33,-48,66,76);
  ctx.restore();
  // HP
  ctx.save();
  ctx.fillStyle="#212140";
  ctx.fillRect(-36,-65,72,12);
  ctx.fillStyle=char.color;
  ctx.fillRect(-36,-65,Math.max(2,(72*(Math.max(0,hp)/char.hp))),12);
  ctx.font="bold 12px monospace";
  ctx.fillStyle="#fbc531";
  ctx.textAlign="center";
  ctx.fillText(hp+"",0,-54);
  ctx.restore();
  // K.O glow
  if(isWinner){
    ctx.strokeStyle="#fbc531";
    ctx.lineWidth=7;
    ctx.beginPath();
    ctx.arc(0,0,43,0,2*Math.PI); ctx.globalAlpha=0.33+0.18*Math.random(); ctx.stroke();
  }
  ctx.restore();
}

// FX
function showHitEffect(x, y) {
  ctx.save();
  ctx.font="bold 40px Arial";
  ctx.fillStyle="#fbc531";
  ctx.globalAlpha=0.92;
  ctx.textAlign="center";
  ctx.fillText("POW!",x,y-18);
  ctx.restore();
}

// Golden "67" meme
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
    },Math.random()*999);
  }
}

// On load: start menu
showMenu();
