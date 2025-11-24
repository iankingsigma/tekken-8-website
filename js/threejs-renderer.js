// Three.js Renderer with GLB Model Support
let scene, camera, renderer, mixer, clock;
let playerModel, cpuModel;
let modelLoader;

function initThreeJS() {
    try {
        console.log('Initializing Three.js with GLB models...');
        
        // Scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000);
        
        // Camera
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            console.error('Canvas element not found');
            return;
        }
        
        camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
        camera.position.set(0, 8, 15);
        camera.lookAt(0, 0, 0);
        
        // Renderer
        renderer = new THREE.WebGLRenderer({ 
            canvas, 
            antialias: true,
            alpha: true
        });
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(10, 15, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        scene.add(directionalLight);
        
        // Arena
        createArena();
        
        // Initialize loader
        initModelLoader();
        
        // Clock for animations
        clock = new THREE.Clock();
        
        console.log('Three.js initialized successfully');
        
        // Start animation loop
        animate();
        
    } catch (error) {
        console.error('Error initializing Three.js:', error);
        // Fallback to canvas rendering
        fallbackToCanvas();
    }
}

function initModelLoader() {
    // Check if GLTFLoader is available
    if (typeof THREE.GLTFLoader === 'undefined') {
        console.warn('GLTFLoader not available, loading from CDN...');
        loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/loaders/GLTFLoader.js', () => {
            modelLoader = new THREE.GLTFLoader();
            loadFighterModels();
        });
    } else {
        modelLoader = new THREE.GLTFLoader();
        loadFighterModels();
    }
}

function loadScript(src, callback) {
    const script = document.createElement('script');
    script.src = src;
    script.onload = callback;
    document.head.appendChild(script);
}

function loadFighterModels() {
    console.log('Loading fighter models...');
    
    // Load player model
    modelLoader.load(
        'assets/models/player.glb',
        (gltf) => {
            console.log('Player model loaded successfully');
            playerModel = setupModel(gltf, -5, 0, 0x00ff00);
            scene.add(playerModel);
        },
        (progress) => {
            console.log('Loading player model:', (progress.loaded / progress.total * 100) + '%');
        },
        (error) => {
            console.error('Error loading player model:', error);
            createFallbackPlayerModel();
        }
    );
    
    // Load CPU model (using player model for now, or different model if available)
    modelLoader.load(
        'assets/models/player.glb',
        (gltf) => {
            console.log('CPU model loaded successfully');
            cpuModel = setupModel(gltf, 5, 0, 0xff0000);
            cpuModel.rotation.y = Math.PI; // Face player
            scene.add(cpuModel);
        },
        (progress) => {
            console.log('Loading CPU model:', (progress.loaded / progress.total * 100) + '%');
        },
        (error) => {
            console.error('Error loading CPU model:', error);
            createFallbackCPUModel();
        }
    );
}

function setupModel(gltf, x, z, color) {
    const model = gltf.scene;
    
    // Position and scale
    model.position.set(x, 0, z);
    model.scale.set(1, 1, 1);
    
    // Enable shadows
    model.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            // Apply color if needed
            if (color && child.material) {
                child.material.color = new THREE.Color(color);
            }
        }
    });
    
    // Set up animations if available
    if (gltf.animations && gltf.animations.length) {
        mixer = new THREE.AnimationMixer(model);
        const action = mixer.clipAction(gltf.animations[0]);
        action.play();
    }
    
    return model;
}

function createFallbackPlayerModel() {
    console.log('Creating fallback player model');
    playerModel = createHumanoidModel(0x00ff00, -5, 0);
    scene.add(playerModel);
}

function createFallbackCPUModel() {
    console.log('Creating fallback CPU model');
    cpuModel = createHumanoidModel(0xff0000, 5, 0);
    cpuModel.rotation.y = Math.PI;
    scene.add(cpuModel);
}

function createArena() {
    // Floor
    const floorGeometry = new THREE.PlaneGeometry(25, 12);
    const floorMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x1a1a2a,
        shininess: 30
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    
    // Grid
    const gridHelper = new THREE.GridHelper(25, 25, 0xff0033, 0x222244);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);
    
    // Walls
    const wallGeometry = new THREE.BoxGeometry(25, 3, 1);
    const wallMaterial = new THREE.MeshPhongMaterial({ color: 0x333344 });
    
    const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
    leftWall.position.set(0, 1.5, -6);
    scene.add(leftWall);
    
    const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
    rightWall.position.set(0, 1.5, 6);
    scene.add(rightWall);
}

function createHumanoidModel(color, x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    
    // Body parts
    const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.6, 1.5, 8);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: color });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1;
    body.castShadow = true;
    group.add(body);
    
    // Head
    const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    const headMaterial = new THREE.MeshPhongMaterial({ color: 0xffcc99 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 2.2;
    head.castShadow = true;
    group.add(head);
    
    // Arms
    const armGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1.2, 8);
    const armMaterial = new THREE.MeshPhongMaterial({ color: color });
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.8, 1, 0);
    leftArm.rotation.z = Math.PI / 6;
    leftArm.castShadow = true;
    group.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.8, 1, 0);
    rightArm.rotation.z = -Math.PI / 6;
    rightArm.castShadow = true;
    group.add(rightArm);
    
    // Legs
    const legGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1.5, 8);
    const legMaterial = new THREE.MeshPhongMaterial({ color: 0x333366 });
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.3, -0.9, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.3, -0.9, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);
    
    return group;
}

function animate() {
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    
    // Update animations
    if (mixer) {
        mixer.update(delta);
    }
    
    // Update game state if available
    if (window.gameState && window.gameState.player && window.gameState.cpu) {
        updateModelPositions();
    }
    
    // Render scene
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

function updateModelPositions() {
    if (playerModel && gameState.player) {
        playerModel.position.x = gameState.player.x;
        playerModel.rotation.y = gameState.player.facing === 1 ? 0 : Math.PI;
    }
    
    if (cpuModel && gameState.cpu) {
        cpuModel.position.x = gameState.cpu.x;
        cpuModel.rotation.y = gameState.cpu.facing === 1 ? 0 : Math.PI;
    }
}

function fallbackToCanvas() {
    console.log('Falling back to canvas rendering');
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    function renderCanvas() {
        if (!gameState.gameActive) return;
        
        ctx.fillStyle = '#1a1a2a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw arena
        ctx.fillStyle = '#333';
        ctx.fillRect(50, 300, 700, 10);
        
        // Draw players
        if (gameState.player) {
            drawFighter(ctx, gameState.player.x, 250, gameState.player.character.color, gameState.player.health / gameState.player.maxHealth);
        }
        
        if (gameState.cpu) {
            drawFighter(ctx, gameState.cpu.x, 250, gameState.cpu.character.color, gameState.cpu.health / gameState.cpu.maxHealth, true);
        }
        
        requestAnimationFrame(renderCanvas);
    }
    
    renderCanvas();
}

function drawFighter(ctx, x, y, color, healthPercent, isFlipped = false) {
    ctx.save();
    
    if (isFlipped) {
        ctx.translate(x + 50, y);
        ctx.scale(-1, 1);
        x = -50;
    } else {
        ctx.translate(x, y);
    }
    
    // Body
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 100, 150);
    
    // Health bar
    ctx.fillStyle = '#333';
    ctx.fillRect(-10, -30, 120, 15);
    ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.2 ? '#ffff00' : '#ff0000';
    ctx.fillRect(-10, -30, 120 * healthPercent, 15);
    
    ctx.restore();
}

// Model animation functions
function playAttackAnimation(character) {
    let model = character === 'player' ? playerModel : cpuModel;
    if (!model) return;
    
    // Simple attack animation
    model.position.z = -0.5;
    setTimeout(() => {
        if (model) model.position.z = 0;
    }, 100);
}

function playDamageAnimation(character) {
    let model = character === 'player' ? playerModel : cpuModel;
    if (!model) return;
    
    // Flash effect
    const originalMaterials = [];
    model.traverse((child) => {
        if (child.isMesh && child.material) {
            originalMaterials.push({
                mesh: child,
                color: child.material.color.clone()
            });
            child.material.color.set(0xff0000);
        }
    });
    
    setTimeout(() => {
        originalMaterials.forEach(item => {
            if (item.mesh.material) {
                item.mesh.material.color.copy(item.color);
            }
        });
    }, 200);
}

function createEffect(type, x, y, z) {
    if (!scene) return;
    
    let effect;
    
    switch(type) {
        case 'hit':
            const hitGeometry = new THREE.SphereGeometry(0.3, 8, 8);
            const hitMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xff0000,
                transparent: true,
                opacity: 0.8
            });
            effect = new THREE.Mesh(hitGeometry, hitMaterial);
            break;
            
        case 'parry':
            const parryGeometry = new THREE.RingGeometry(0.2, 0.5, 16);
            const parryMaterial = new THREE.MeshBasicMaterial({ 
                color: 0x00ff00,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.8
            });
            effect = new THREE.Mesh(parryGeometry, parryMaterial);
            effect.rotation.x = Math.PI / 2;
            break;
    }
    
    if (effect) {
        effect.position.set(x, y, z);
        scene.add(effect);
        
        // Animate and remove
        let scale = 1;
        function animateEffect() {
            scale += 0.1;
            effect.scale.set(scale, scale, scale);
            effect.material.opacity -= 0.05;
            
            if (effect.material.opacity > 0) {
                requestAnimationFrame(animateEffect);
            } else {
                scene.remove(effect);
            }
        }
        animateEffect();
    }
}

// Make functions available globally
window.initThreeJS = initThreeJS;
window.playAttackAnimation = playAttackAnimation;
window.playDamageAnimation = playDamageAnimation;
window.createEffect = createEffect;
