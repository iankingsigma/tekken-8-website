// Three.js Initialization
function initThreeJS() {
    // Scene
    window.scene = new THREE.Scene();
    window.scene.background = new THREE.Color(0x000000);
    
    // Camera - Adjusted for better view
    window.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    window.camera.position.set(0, 8, 15);
    window.camera.lookAt(0, 0, 0);
    
    // Renderer
    const canvas = document.getElementById('gameCanvas');
    window.renderer = new THREE.WebGLRenderer({ 
        canvas, 
        antialias: false,
        alpha: true
    });
    window.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    window.renderer.setPixelRatio(1);
    window.renderer.shadowMap.enabled = true;
    
    // Enhanced Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    window.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 15, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    window.scene.add(directionalLight);
    
    const backLight = new THREE.DirectionalLight(0x4444ff, 0.3);
    backLight.position.set(-5, 5, -5);
    window.scene.add(backLight);
    
    // Enhanced Arena
    const arenaGeometry = new THREE.BoxGeometry(25, 1, 12);
    const arenaMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x1a1a2a,
        shininess: 50,
        specular: 0x222244
    });
    window.arena = new THREE.Mesh(arenaGeometry, arenaMaterial);
    window.arena.position.y = -1;
    window.arena.receiveShadow = true;
    window.scene.add(window.arena);
    
    // Arena details
    const gridHelper = new THREE.GridHelper(25, 25, 0xff0033, 0x222244);
    gridHelper.position.y = 0.01;
    window.scene.add(gridHelper);
    
    // Arena border
    const borderGeometry = new THREE.BoxGeometry(26, 0.5, 13);
    const borderMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xff0033,
        emissive: 0x330000
    });
    const border = new THREE.Mesh(borderGeometry, borderMaterial);
    border.position.y = -0.75;
    window.scene.add(border);
    
    // Create humanoid fighters
    createHumanoidFighters();
    
    // Initialize clock
    window.clock = new THREE.Clock();
}

function createHumanoidFighters() {
    const playerChar = CHARACTERS[gameState.selectedCharacter];
    const cpuIndex = (gameState.selectedCharacter + 1) % CHARACTERS.length;
    const cpuChar = CHARACTERS[cpuIndex];
    
    // Create player character
    window.playerModel = createHumanoidModel(playerChar.color, -5, 0);
    window.scene.add(window.playerModel);
    
    // Create CPU character
    window.cpuModel = createHumanoidModel(cpuChar.color, 5, 0);
    window.cpuModel.rotation.y = Math.PI; // Face player
    window.scene.add(window.cpuModel);
    
    // Update HUD
    document.getElementById('p1Name').textContent = playerChar.name;
    document.getElementById('p2Name').textContent = cpuChar.name;
    document.getElementById('roundText').textContent = `ROUND ${gameState.round}`;
}

function createHumanoidModel(color, x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    
    // Convert hex color to THREE.Color
    const mainColor = new THREE.Color(color);
    const skinColor = new THREE.Color(0xffcc99);
    const pantsColor = new THREE.Color(0x333366);
    
    // Head
    const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    const headMaterial = new THREE.MeshPhongMaterial({ color: skinColor });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.6;
    head.castShadow = true;
    group.add(head);
    
    // Body (Torso)
    const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.6, 1.2, 8);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: mainColor });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.7;
    body.castShadow = true;
    group.add(body);
    
    // Arms
    const armGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1, 8);
    const armMaterial = new THREE.MeshPhongMaterial({ color: mainColor });
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.7, 0.7, 0);
    leftArm.rotation.z = Math.PI / 6;
    leftArm.castShadow = true;
    group.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.7, 0.7, 0);
    rightArm.rotation.z = -Math.PI / 6;
    rightArm.castShadow = true;
    group.add(rightArm);
    
    // Legs
    const legGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1.2, 8);
    const legMaterial = new THREE.MeshPhongMaterial({ color: pantsColor });
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.25, -0.8, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.25, -0.8, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);
    
    // Face details
    const eyeGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.15, 1.65, 0.35);
    group.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.15, 1.65, 0.35);
    group.add(rightEye);
    
    return group;
}

function createBloodEffect(x, y, z) {
    const bloodGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    const bloodMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xff0000,
        transparent: true,
        opacity: 0.8
    });
    
    const blood = new THREE.Mesh(bloodGeometry, bloodMaterial);
    blood.position.set(x, y, z);
    blood.castShadow = true;
    window.scene.add(blood);
    
    // Animate blood effect
    const startTime = Date.now();
    const duration = 500; // milliseconds
    
    function animateBlood() {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / duration;
        
        if (progress < 1) {
            blood.scale.set(1 + progress, 1 + progress, 1 + progress);
            blood.material.opacity = 0.8 * (1 - progress);
            requestAnimationFrame(animateBlood);
        } else {
            window.scene.remove(blood);
        }
    }
    
    animateBlood();
}

function applyDamageFlash(character) {
    if (character === 'player' && window.playerModel) {
        // Flash red
        window.playerModel.children.forEach(child => {
            const originalColor = child.material.color.clone();
            child.material.color.set(0xff0000);
            
            setTimeout(() => {
                child.material.color.copy(originalColor);
            }, 200);
        });
    } else if (character === 'cpu' && window.cpuModel) {
        window.cpuModel.children.forEach(child => {
            const originalColor = child.material.color.clone();
            child.material.color.set(0xff0000);
            
            setTimeout(() => {
                child.material.color.copy(originalColor);
            }, 200);
        });
    }
}
