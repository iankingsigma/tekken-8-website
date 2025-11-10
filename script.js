// --- Pixel Tekken by ian kishk ---
// Only 4 playable Arcade characters: 67, 41, 21, 201 (IDs for unique game fighters)

const CHARACTERS = [
  {
    name: "Character 67",
    hp: 67,
    punch: 67,
    description: "The forbidden meme fighter. Unleashes golden chaos on victory.",
    color: "#fbc531",
    img: "https://raw.githubusercontent.com/iankingsigma/tekken-8-website/main/img2.png", // Golden 67 image
    avatar: [[0,0,"#fbc531"],[1,20,"#fbc531"],[-1,20,"#fbc531"]]
  },
  {
    name: "Fighter 41",
    hp: 104,
    punch: 21,
    description: "Expert martial artist with high power punches.",
    color: "#c80018",
    img: "https://raw.githubusercontent.com/iankingsigma/tekken-8-website/main/img1.png", // Jin style image
    avatar: [[0,0,"#c80018"],[1,20,"#e84118"],[-1,20,"#e84118"]]
  },
  {
    name: "Fighter 21",
    hp: 84,
    punch: 25,
    description: "Fast and unpredictable pixel brawler.",
    color: "#58a11d",
    img: "https://raw.githubusercontent.com/iankingsigma/tekken-8-website/main/img4.png", // Xiaoyu style image
    avatar: [[0,0,"#58a11d"],[1,20,"#fbc531"],[-1,20,"#fbc531"]]
  },
  {
    name: "Fighter 201",
    hp: 132,
    punch: 15,
    description: "Tank character with endurance for long battles.",
    color: "#841dae",
    img: "https://raw.githubusercontent.com/iankingsigma/tekken-8-website/main/img3.png", // Jin back image
    avatar: [[0,0,"#841dae"],[1,20,"#e84118"],[-1,20,"#e84118"]]
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
let selected = null;

window.showMenu = function() {
  $menu.className = "active";
  $select.className = "";
  $fightUI.className = "";
  selected = null;
};

window.showSelect = function() {
  $menu.className = "";
  $select.className = "active";
  $fightUI.className = "";
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
      <span class="char-punch">Punch: ${f.punch}</span>
    </div>`;
  });
  $fighterList.innerHTML = html;
  document.getElementById("p1tit").innerText = "Player: " + (selected===null ? "Choose!" : CHARACTERS[selected].name);

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

let fightState = {}, fightAnimRequest = null;
function startFightGame() {
  $menu.className = "";
  $select.className = "";
  $fightUI.className = "active";
  $stats.innerHTML = "";
  // CPU picks random other fighter
  let playerChar = CHARACTERS[selected];
  let cpuChoices = CHARACTERS.filter((f,i)=>i!==selected);
  let cpuChar = cpuChoices[Math.floor(Math.random()*cpuChoices.length)];
  let cpuIdx = CHARACTERS.indexOf(cpuChar);

  fightState = {
    f1: {...playerChar}, f2: {...cpuChar},
    hp: [playerChar.hp, cpuChar.hp],
    turn: Math.random()>0.5?0:1,
    phase: "intro",
    timer: 0,
    anim: 0,
    action: null,
    winner: null,
    log: [],
    pos: [120,520], // fighters X positions
    punchOffset: [0,0],
    round:1
  };
  fightAnimRequest && cancelAnimationFrame(fightAnimRequest);
  requestAnimationFrame(()=>fightLoop(selected, cpuIdx));
}

function fightLoop(pIdx, cIdx) {
  renderFightCanvas(pIdx, cIdx);
  if(fightState.phase=="intro") {
    fightState.timer++;
    $stats.innerHTML = `Round ${fightState.round} - Prepare to fight!`;
    if(fightState.timer>60) { fightState.phase="turn"; fightState.timer=0; }
  }
  else if(fightState.phase=="turn") {
    $stats.innerHTML = `Round ${fightState.round}: ${fightState.turn===0?"Player":"CPU"} (${CHARACTERS[fightState.turn===0?pIdx:cIdx].name}) attacks!`;
    setTimeout(()=>{
      fightState.action={type:"punch",from:fightState.turn};
      fightState.phase="action";
      fightState.timer=0;
      requestAnimationFrame(()=>fightLoop(pIdx,cIdx));
    },700);
    fightState.phase="wait";
  }
  else if(fightState.phase=="action" && fightState.action) {
    let from = fightState.action.from, to = 1-from;
    if(fightState.timer<14){
      fightState.punchOffset[from]=fightState.timer*5;
      fightState.punchOffset[to]=0;
    } else if(fightState.timer==14){
      fightState.punchOffset[from]=70;
      showHitEffect(from==0?fightState.pos[1]:fightState.pos[0],210);
    } else if(fightState.timer<24) {
      fightState.punchOffset[from]=70-(fightState.timer-14)*7;
    } else {
      fightState.punchOffset=[0,0];
      let attacker = CHARACTERS[from==0?pIdx:cIdx];
      let defenderIdx = from==1?pIdx:cIdx;
      let damage = attacker.punch + Math.floor(Math.random()*8)-4;
      if(attacker.name==="Character 67"){ 
        damage += Math.floor(Math.random()*17) + 10; 
        if(Math.random()>0.8){ spam67(); }
      }
      damage = Math.max(7, damage);
      fightState.hp[to] -= damage;
      fightState.log.push(`${attacker.name} dealt ${damage} damage!`);
      if(fightState.hp[to]<=0) {
        fightState.hp[to]=0;
        fightState.winner = from;
        fightState.phase = "ko";
        $stats.innerHTML = `<span style='color:#fbc531;font-size:1.35em;'>${attacker.name} Wins!</span>`;
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
    $stats.innerHTML += `<br><span style='color:#fed;'>K.O! Choose Main Menu to play again.</span>`;
    return;
  }
  fightAnimRequest = requestAnimationFrame(()=>fightLoop(pIdx,cIdx));
}

function renderFightCanvas(pIdx, cIdx) {
  ctx.clearRect(0,0,$canvas.width,$canvas.height);
  ctx.fillStyle="#222237";
  ctx.fillRect(0,0,$canvas.width,$canvas.height);
  ctx.fillStyle="#c84141";
  ctx.fillRect(70,260,500,16);
  ctx.fillStyle="#888";
  ctx.fillRect(75,276,490,7);
  renderPixelFighter(fightState.pos[0]+fightState.punchOffset[0],210,pIdx,fightState.hp[0],fightState.winner===0);
  renderPixelFighter(fightState.pos[1]-fightState.punchOffset[1],210,cIdx,fightState.hp[1],fightState.winner===1,true);
}

function renderPixelFighter(x,y,charIdx,hp,isWinner,flip) {
  let char = CHARACTERS[charIdx];
  ctx.save();
  ctx.translate(x, y);
  if(flip){ ctx.scale(-1,1);}
  ctx.beginPath();
  ctx.arc(0, 0, 40, 0, 2*Math.PI); ctx.fillStyle = char.color;
  ctx.globalAlpha = 0.88; ctx.fill();
  ctx.globalAlpha = 0.98;
  ctx.beginPath();
  ctx.arc(-28,38,16,0,2*Math.PI);ctx.arc(28,38,16,0,2*Math.PI);
  ctx.fillStyle = "#e84118"; ctx.fill();
  ctx.globalAlpha=1;
  let imgObj = new window.Image();
  imgObj.src = char.img;
  ctx.save();
  ctx.globalAlpha=0.95;
  ctx.drawImage(imgObj,-33,-48,66,76);
  ctx.restore();
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
  if(isWinner){
    ctx.strokeStyle="#fbc531";
    ctx.lineWidth=7;
    ctx.beginPath();
    ctx.arc(0,0,43,0,2*Math.PI); ctx.globalAlpha=0.33+0.18*Math.random(); ctx.stroke();
  }
  ctx.restore();
}

function showHitEffect(x, y) {
  ctx.save();
  ctx.font="bold 38px Arial";
  ctx.fillStyle="#fbc531";
  ctx.globalAlpha=0.92;
  ctx.textAlign="center";
  ctx.fillText("POW!",x,y-18);
  ctx.restore();
}

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

showMenu();
