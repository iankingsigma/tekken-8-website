// Three.js Initialization
function initThreeJS() {
    // Scene
    window.scene = new THREE.Scene();
    window.scene.background = new THREE.Color(0x000000);
    
    // Camera
    window.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    window.camera.position.set(0, 5, 10);
    window.camera.lookAt(0, 0, 0);
    
    // Renderer
    const canvas = document.getElementById('gameCanvas');
    window.renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
    window.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    window.renderer.setPixelRatio(1); // Pixelated look
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    window.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7);
    window.scene.add(directionalLight);
    
    // Arena
    const arenaGeometry = new THREE.BoxGeometry(20, 1, 10);
    const arenaMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x1a1a2a,
        shininess: 30
    });
    window.arena = new THREE.Mesh(arenaGeometry, arenaMaterial);
    window.arena.position.y = -0.5;
    window.scene.add(window.arena);
    
    // Add grid pattern to arena
    const gridHelper = new THREE.GridHelper(20, 20, 0xff0033, 0x333333);
    gridHelper.position.y = 0.01;
    window.scene.add(gridHelper);
    
    // Player and CPU models
    createFighters();
    
    // Initialize clock
    window.clock = new THREE.Clock();
}

function createFighters() {
    const playerChar = CHARACTERS[gameState.selectedCharacter];
    const cpuIndex = (gameState.selectedCharacter + 1) % CHARACTERS.length;
    const cpuChar = CHARACTERS[cpuIndex];
    
    // Player model
    const playerGeometry = new THREE.BoxGeometry(1, 2, 1);
    const playerMaterial = new THREE.MeshPhongMaterial({ 
        color: new THREE.Color(playerChar.color)
    });
    window.playerModel = new THREE.Mesh(playerGeometry, playerMaterial);
    window.playerModel.position.set(-3, 1, 0);
    window.scene.add(window.playerModel);
    
    // CPU model
    const cpuGeometry = new THREE.BoxGeometry(1, 2, 1);
    const cpuMaterial = new THREE.MeshPhongMaterial({ 
        color: new THREE.Color(cpuChar.color)
    });
    window.cpuModel = new THREE.Mesh(cpuGeometry, cpuMaterial);
    window.cpuModel.position.set(3, 1, 0);
    window.scene.add(window.cpuModel);
    
    // Update HUD
    document.getElementById('p1Name').textContent = playerChar.name;
    document.getElementById('p2Name').textContent = cpuChar.name;
    document.getElementById('roundText').textContent = `ROUND ${gameState.round}`;
}
