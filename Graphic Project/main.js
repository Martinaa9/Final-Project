// Variable to check if the game has started
let gameStarted = false;

// Variable for the Play button
const playButton = document.getElementById('playBtn');

// Add a listener for the "Play" button
document.getElementById('playBtn').addEventListener('click', () => {
  gameStarted = true; 
  document.getElementById('playBtn').style.display = 'none'; 
  //document.getElementById('intensity-control').style.display = 'block'; 
  document.getElementById('intensity-control').style.display = 'flex';
  createLabyrinthPath(); 
  createBall(); 
  createHoleWithFlag(); 
  sun.visible = true; 
  trees.forEach(tree => tree.visible = true); 
  flowers.forEach(flower => flower.visible = true); 
  document.getElementById('timerDisplay').style.display = 'block'; 
  document.getElementById('toggleViewBtn').style.display = 'block'; 
});

// Listener for the Play button
playButton.addEventListener('click', startGame);

// Initialization of global variables for managing the labyrinth and the ball
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); 
// Create a new perspective camera with the parameters
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true }); // Create a new WebGL renderer (antialias smooths edges)
renderer.setSize(window.innerWidth, window.innerHeight); 
renderer.setClearColor(0x80ff80); 
renderer.shadowMap.enabled = true; // Enable support for shadows
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Shadow map type for soft shadows
document.body.appendChild(renderer.domElement); // Add the renderer to the DOM

// Positioning the camera
camera.position.set(15, 20, 20);
camera.lookAt(0, 0, 0); // Sets the direction the camera is looking

// Camera controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Enable damping
controls.dampingFactor = 0.25; // Damping factor
controls.enableZoom = true; 

// Adjust rendering to window size
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight; // Update the camera's aspect ratio
  camera.updateProjectionMatrix(); // Update the camera's projection matrix
  renderer.setSize(window.innerWidth, window.innerHeight); // Update the renderer's size
});

// Adding an ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight); 

// Adding a directional light (sun)
const directionalLight = new THREE.DirectionalLight(0xffffff, 2); 
const sunInitialPosition = new THREE.Vector3(20, 15, -10); 
directionalLight.position.copy(sunInitialPosition); // Copy the initial position of the sun
directionalLight.castShadow = true; // Enable shadow casting
scene.add(directionalLight); 

// Configure the directional light's shadows
directionalLight.shadow.mapSize.width = 1024; 
directionalLight.shadow.mapSize.height = 1024; 
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50; 

// Create the sun to visualize the light direction
const sunGeometry = new THREE.SphereGeometry(1, 32, 32); // Sphere geometry for the sun
const sunMaterialYellow = new THREE.MeshBasicMaterial({ color: 0xffff00 }); 
const sunMaterialWhite = new THREE.MeshBasicMaterial({ color: 0xffffff }); 

// Create the sun with the initial yellow material
const sun = new THREE.Mesh(sunGeometry, sunMaterialYellow);
sun.position.copy(sunInitialPosition); 
sun.visible = false; 
scene.add(sun); 

// Function to update the sun's color based on light intensity
function updateSunColor(intensity) {
  const yellow = new THREE.Color(0xffff00); 
  const white = new THREE.Color(0xffffff); 
  const skyBlue = new THREE.Color(0x87CEEB); 
  const nightBlue = new THREE.Color(0x000033); 

  // Interpolate the sun's color
  const sunColor = yellow.clone().lerp(white, 1 - (intensity / 2));

  // Interpolate the background color
  const backgroundColor = skyBlue.clone().lerp(nightBlue, 1 - (intensity / 2));

  // Apply the interpolated colors
  sun.material.color.copy(sunColor);
  scene.background.copy(backgroundColor);
}

// Function to calculate light intensity
function calculateIntensity() {
  const time = Date.now() * 0.0001; // Variable intensity based on time
  return Math.abs(Math.sin(time)); // Intensity between 0 and 1
}

// Function to update the sun's position in the global coordinate system
function updateSunPosition() {
  const globalRotationMatrix = new THREE.Matrix4();
  globalRotationMatrix.extractRotation(camera.matrixWorld); // Extract the global rotation of the camera
  sun.position.copy(sunInitialPosition); // Reset the sun's position to the initial position
  sun.position.applyMatrix4(globalRotationMatrix); // Apply the global rotation to the sun's position
  directionalLight.position.copy(sunInitialPosition); // Keep the directional light's position fixed
  directionalLight.position.applyMatrix4(globalRotationMatrix); // Apply the global rotation to the directional light
}

// Make the intensity controls invisible at the start
document.getElementById('intensity-control').style.display = 'none';

// Handle light intensity
const intensityInput = document.getElementById('lightIntensity');
intensityInput.addEventListener('input', () => {
  const intensityValue = parseFloat(intensityInput.value); // Get the intensity value from the input slider
  directionalLight.intensity = intensityValue; // Update the directional light's intensity
  updateAuraLightIntensity(intensityValue); // Update the aura's intensity 
  updateSunColor(intensityValue); // Update the sun's color based on the intensity
});

// Loading textures
const textureLoader = new THREE.TextureLoader();
const roadTexture = textureLoader.load('assets/road_texture.jpg'); 
const grassTexture = textureLoader.load('assets/grass_texture.jpg'); 

// Dimensions of the maze cells and the maze itself
const cellSize = 1; 
const labyrinthSize = 30; 
let labyrinth;

// Function to create the maze
function createLabyrinthPath() {
  const pathMaterial = new THREE.MeshStandardMaterial({ map: roadTexture, side: THREE.DoubleSide });
  const grassMaterial = new THREE.MeshStandardMaterial({ map: grassTexture });

  // 30x30 maze structure
  labyrinth = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1],
    [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 1, 1, 1],
    [1, 0, 0, 1, 0, 0, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1],
    [1, 0, 0, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1],
    [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    [1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  ];

  // Iteration over the labyrinth structure to create the terrain
for (let i = 0; i < labyrinth.length; i++) {
  for (let j = 0; j < labyrinth[i].length; j++) {
    // Calculate the x and z position for each cell in the labyrinth
    const x = (i - labyrinthSize / 2) * cellSize;
    const z = (j - labyrinthSize / 2) * cellSize;
    
    // If the value in the cell is 0, create a path segment
    if (labyrinth[i][j] === 0) {
      const pathSegment = new THREE.Mesh(new THREE.PlaneGeometry(cellSize, cellSize), pathMaterial);
      pathSegment.rotation.x = -Math.PI / 2; // Rotate the plane to align with the ground
      pathSegment.position.set(x, 0.01, z);
      pathSegment.receiveShadow = true; 
      scene.add(pathSegment);
    } else { // If the value in the cell is 1, create a border segment
      const borderSegment = new THREE.Mesh(new THREE.BoxGeometry(cellSize, 1, cellSize), grassMaterial);
      borderSegment.position.set(x, 0.5, z);
      borderSegment.receiveShadow = true; 
      borderSegment.castShadow = true;
      scene.add(borderSegment);
    }
  }
}
// Create trees and flowers using the array of positions
treePositions.forEach(pos => createTree(pos[0], pos[1]));
flowerPositions.forEach(pos => createFlower(pos[0], pos[1]));

// Create a pond
createPond(-12, 12, 1.5);
}

// Define empty arrays to hold the tree and flower objects
const trees = [];
const flowers = [];

// Definition of tree positions
const treePositions = [
  [-3, -5],[-14, -3],[-2, 12],[-12, 7],[5, 5],[5, -10]
];

// Definition of flower positions
const flowerPositions = [
  [3, 1],[-12, -9],[-9, -4],[0, -2],[3, -5],[-2, 3],[-6, -1],[-12, 1],[-7, 5],[-10, 8],[-4, 12],[1, 10],
  [3, 6],[-2, -9],[-7, -12],[2, -12],[-8, 12]
];

// Function to create trees
function createTree(x, z) {
  // Trunk
  const trunkHeight = 2.5;
  const trunkWidth = 0.5;
  const trunkGeometry = new THREE.BoxGeometry(trunkWidth, trunkHeight, trunkWidth);
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
  // Enable shadows for the trunk
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  // Set the trunk position
  trunk.position.set(x, trunkHeight / 2, z);
  scene.add(trunk);

  // Branches
  const branchMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
  const branchGeometry = new THREE.BoxGeometry(0.3, 0.5, 0.3);
  // Relative positions of the branches to the trunk
  const branches = [
    { x: -0.5, y: 1, z: 0 }, // left branch
    { x: 0.5, y: 1, z: 0 },  // right branch
    { x: 0, y: 1.5, z: -0.5 }, // back branch
    { x: 0, y: 1.5, z: 0.5 }   // front branch
  ];

  // Iterate through each branch to add it to the tree
  branches.forEach(branch => {
    // Horizontal branch
    const branchMeshHorizontal = new THREE.Mesh(branchGeometry, branchMaterial);
    branchMeshHorizontal.castShadow = true;
    branchMeshHorizontal.receiveShadow = true;
    branchMeshHorizontal.position.set(x + branch.x, trunkHeight - 0.5, z + branch.z);
    scene.add(branchMeshHorizontal);
    // Vertical branch
    const branchMeshVertical = new THREE.Mesh(branchGeometry, branchMaterial);
    branchMeshVertical.castShadow = true;
    branchMeshVertical.receiveShadow = true;
    branchMeshVertical.position.set(x + branch.x, trunkHeight + 0.5, z + branch.z);
    branchMeshVertical.scale.y = 2; // Make the vertical branch longer
    scene.add(branchMeshVertical);
  });

  // Leaves material
  const leavesMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });

  // Pixelated foliage
  const radius = 3; 
  const leavesSize = 0.5;

  // Create the tree foliage with cube-shaped leaves
  for (let y = 0; y <= radius; y++) {
    const layerHeight = trunkHeight + (y * leavesSize); // height of the leaves layer
    const layerRadius = Math.sqrt(radius * radius - y * y) + (y === radius ? 1 : 0); // radius of the leaves layer
    
    // Iterate through the x and z positions of the current leaves layer
    for (let i = -layerRadius; i <= layerRadius; i++) {
      for (let j = -layerRadius; j <= layerRadius; j++) {
        // Check if the current point is within the layer radius
        if (i * i + j * j <= layerRadius * layerRadius) {
          const leavesGeometry = new THREE.BoxGeometry(leavesSize, leavesSize, leavesSize);
          const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);

          // Enable shadows for the leaves
          leaves.castShadow = true;
          leaves.receiveShadow = true;
          // Set the leaves position
          leaves.position.set(x + j * leavesSize, layerHeight, z + i * leavesSize);
          scene.add(leaves);
        }
      }
    }
  }
}

// Function to create flowers
function createFlower(x, z) {
  const petalMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const centerMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 }); 

  const petalSize = 0.2; 

  // Creating the petals
  const petals = [
      { x: 0, y: 0, z: petalSize },     // Top petal
      { x: 0, y: 0, z: -petalSize },    // Bottom petal
      { x: petalSize, y: 0, z: 0 },     // Right petal
      { x: -petalSize, y: 0, z: 0 }     // Left petal
  ];

  petals.forEach(petal => {
      const petalGeometry = new THREE.BoxGeometry(petalSize, 0.1, petalSize);
      const petalMesh = new THREE.Mesh(petalGeometry, petalMaterial);
      petalMesh.position.set(x + petal.x, 1, z + petal.z);
      petalMesh.castShadow = true;
      petalMesh.receiveShadow = true;
      scene.add(petalMesh);
  });

  // Creating the center of the flower
  const centerGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
  const centerMesh = new THREE.Mesh(centerGeometry, centerMaterial);
  centerMesh.position.set(x, 1, z);
  centerMesh.castShadow = true;
  centerMesh.receiveShadow = true;
  scene.add(centerMesh);
}

// Function to create the pond
function createPond(x, z, radius) {
  // Creating the pond
  const waterGeometry = new THREE.CircleGeometry(radius, 32);
  const waterMaterial = new THREE.MeshStandardMaterial({ color: 0x87CEEB, transparent: true, opacity: 0.7 });
  const waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
  waterMesh.rotation.x = -Math.PI / 2; // Rotate to make it flat
  waterMesh.position.set(x, 0.02, z); 
  waterMesh.receiveShadow = true;
  scene.add(waterMesh);

  // Creating rocks around the pond
  createRocksAroundPond(x, z, radius);
  
  // Specify positions for the ducks
  const duckPositions = [
    { x: x - 0.5, z: z - 0.5 },
    { x: x + 0.5, z: z + 0.5 },
    { x: x, z: z + 0.5 }
  ];
  createDucks(duckPositions);
}

// Function to create rocks around the pond
function createRocksAroundPond(x, z, radius) {
  const rockMaterial = new THREE.MeshStandardMaterial({ color: 0xA9A9A9 });
  const rockCount = 24; 
  const rockSize = 0.3; 

  // Loop to create each rock
  for (let i = 0; i < rockCount; i++) {
      const angle = (i / rockCount) * Math.PI * 2; // Angle for each rock

      // Position of the rocks
      const rockX = x + Math.cos(angle) * radius;
      const rockZ = z + Math.sin(angle) * radius;

      // Creating the rock
      const rockGeometry = new THREE.BoxGeometry(rockSize, rockSize, rockSize); 
      const rockMesh = new THREE.Mesh(rockGeometry, rockMaterial);
      rockMesh.position.set(rockX, 0.25, rockZ); 
      rockMesh.castShadow = true;
      rockMesh.receiveShadow = true;
      scene.add(rockMesh);
  }
}

// Function to create ducks
function createDucks(positions) {
  const duckMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFF00 });
  // Loop to create a duck for each provided position
  positions.forEach(pos => {
      // Creating the body
      const duckBodyGeometry = new THREE.SphereGeometry(0.2, 16, 16);
      const duckBody = new THREE.Mesh(duckBodyGeometry, duckMaterial);
      duckBody.position.set(pos.x, 0.25, pos.z);
      duckBody.castShadow = true;
      duckBody.receiveShadow = true;

      // Head of the ducks
      const duckHeadGeometry = new THREE.SphereGeometry(0.1, 16, 16);
      const duckHead = new THREE.Mesh(duckHeadGeometry, duckMaterial);
      duckHead.position.set(pos.x, 0.3, pos.z + 0.1); // Position above the body
      duckHead.castShadow = true;
      duckHead.receiveShadow = true;
      
      // Create a group to combine body and head of the duck
      const duckGroup = new THREE.Group();
      duckGroup.add(duckBody);
      duckGroup.add(duckHead);
      scene.add(duckGroup);
  });
}  

// Function to load and add an OBJ file with its MTL
function loadOBJ(mtlPath, objPath, array, addCallback) {
  const mtlLoader = new THREE.MTLLoader(); // Creates an instance of the MTL loader
  mtlLoader.load(mtlPath, (materials) => { // Loads the MTL file
      materials.preload(); // Preloads materials to ensure they are ready

      const objLoader = new THREE.OBJLoader(); // Creates an instance of the OBJ loader
      objLoader.setMaterials(materials); // Associates the loaded materials with the OBJ loader
      objLoader.load(objPath, (object) => { // Loads the OBJ file
          addCallback(object, array); // Calls the callback with the loaded object and the array to add it to
      });
  });
}

// Function to add a model to the scene with specific dimensions and position
function addModel(object, array, positions, scale, visible) {
  positions.forEach(([x, y, z]) => { // For each specified position
      const model = object.clone(); // Clones the object to create a new instance
      model.scale.set(scale, scale, scale); // Sets the model's scale
      model.position.set(x, y + 0.3, z); 
      model.visible = visible; 
      model.castShadow = true;
      model.receiveShadow = true;
      scene.add(model); 
      array.push(model); // Adds the model to the specified array
  });
}

// Load and add tree models
loadOBJ('assets/tree.mtl', 'assets/tree.obj', trees, (object, array) => {
  addModel(object, array, [
      [4, 0, -3],
      [-11, 0, -9],
      [-5, 0, 5]
  ], 0.3, false);
});

// Load and add flower models
loadOBJ('assets/flower.mtl', 'assets/flower.obj', flowers, (object, array) => {
  addModel(object, array, [
      [-9, 0, 10],
      [2, 0, 8],
      [2, 0, -11],
      [-11, 0, -8],
      [-3, 0, 2]
  ], 0.004, false);
});

// Function to create the ball
let ball;
function createBall() {
const ballGeometry = new THREE.SphereGeometry(0.5, 32, 32);
const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
ball = new THREE.Mesh(ballGeometry, ballMaterial);
ball.position.set(-(labyrinthSize / 2 - 1) * cellSize + cellSize / 2, 0.5, -(labyrinthSize / 2 - 1) * cellSize + cellSize / 2);
ball.castShadow = true; 
ball.receiveShadow = true;
scene.add(ball);
}

// Function to create the pole with the flag
function createHoleWithFlag() {
// Creation of the pole
const poleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 2, 32);
const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
const pole = new THREE.Mesh(poleGeometry, poleMaterial);

// Position of the pole in the specified cell
const poleX = (19 - labyrinthSize / 2) * cellSize;
const poleZ = (26 - labyrinthSize / 2) * cellSize;

pole.position.set(poleX, 1, poleZ);
pole.castShadow = true;
scene.add(pole);

// Creation of the flag
const flagShape = new THREE.Shape();
flagShape.moveTo(-0.05, -0.15); // Defines the starting point of the flag's shape
flagShape.lineTo(0.25, -0.15); // Base point
flagShape.lineTo(0, 0.40); // Point to create the slanted edge of the flag
flagShape.lineTo(-0.05, -0.15); // Closes the shape of the flag

const flagGeometry = new THREE.ShapeGeometry(flagShape);
const flagMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, side: THREE.DoubleSide });
const flag = new THREE.Mesh(flagGeometry, flagMaterial);
flag.position.set(0.2, 1.35, 0);
flag.rotation.z = -Math.PI / 2; // Rotates the flag by -90 degrees around the z-axis to orient it correctly
flag.scale.set(1.5, 1.5, 1); // Scales the flag to enlarge it by 1.5 times along the x and y axes
flag.castShadow = true;
pole.add(flag);

// Creation of the pole's base
const holeGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 32);
const holeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
const hole = new THREE.Mesh(holeGeometry, holeMaterial);
hole.position.set(poleX, 0.1, poleZ);
scene.add(hole);
}

// Function to start the game
function startGame() {
playButton.style.display = 'none'; 
createLabyrinthPath(); 
createHoleWithFlag(); 
startTimer(); 
animate(); 
}

let timer; // Variable for the timer
let timeElapsed = 0; // Time elapsed in seconds
const timerDisplay = document.getElementById('timerDisplay'); // Retrieves the HTML element with id 'timerDisplay' to display the timer
document.getElementById('timerDisplay').style.display = 'none';

// Timer function
function startTimer() {
timeElapsed = 0; // Resets the elapsed time
timerDisplay.innerText = `Time: ${timeElapsed} seconds`; // Shows the initial time

timer = setInterval(() => {
  timeElapsed++; // Increments the elapsed time
  timerDisplay.innerText = `Time: ${timeElapsed} seconds`; // Updates the timer display
}, 1000); // Updates every second
}

// Function to stop the timer
function stopTimer() {
clearInterval(timer); 
}

// Variables to manage pressed keys
let keyState = {};

// Listener for keyboard keys
window.addEventListener('keydown', (event) => {
  keyState[event.key] = true;
});

window.addEventListener('keyup', (event) => {
  keyState[event.key] = false;
});

// Function to move the ball
function moveBall() {
  const speed = 0.2;
  let direction, right;

  if (isFirstPersonView) {
    // If in first-person view, use the orientation of the firstPersonCamera
    direction = new THREE.Vector3();
    firstPersonCamera.getWorldDirection(direction); // Get the first-person camera direction relative to the world
    direction.y = 0; // Keep direction only on the horizontal axis
    direction.normalize(); // Normalize the direction vector to have a length of 1
    right = new THREE.Vector3();
    // Calculate the "right" vector as the cross product of the camera's "up" vector and the horizontal direction
    right.crossVectors(firstPersonCamera.up, direction).normalize();
  } else {
    // Otherwise, use the main camera's orientation
    direction = new THREE.Vector3();
    camera.getWorldDirection(direction); // Get the main camera direction relative to the world
    direction.y = 0; // Keep direction only on the horizontal axis
    direction.normalize(); // Normalize the direction vector to have a length of 1
    right = new THREE.Vector3();
    right.crossVectors(camera.up, direction).normalize();
  }

  // Movement based on pressed keys
  if (keyState['ArrowUp'] || keyState['w']) {
    const newPosition = ball.position.clone().addScaledVector(direction, speed);
    if (isCellWalkable(newPosition.x, newPosition.z)) {
      ball.position.copy(newPosition);
      updateAuraLightPosition();
    }
  }
  if (keyState['ArrowDown'] || keyState['s']) {
    const newPosition = ball.position.clone().addScaledVector(direction, -speed);
    if (isCellWalkable(newPosition.x, newPosition.z)) {
      ball.position.copy(newPosition);
      updateAuraLightPosition();
    }
  }
  if (keyState['ArrowLeft'] || keyState['a']) {
    const newPosition = ball.position.clone().addScaledVector(right, speed);
    if (isCellWalkable(newPosition.x, newPosition.z)) {
      ball.position.copy(newPosition);
      updateAuraLightPosition();
    }
  }
  if (keyState['ArrowRight'] || keyState['d']) {
    const newPosition = ball.position.clone().addScaledVector(right, -speed);
    if (isCellWalkable(newPosition.x, newPosition.z)) {
      ball.position.copy(newPosition);
      updateAuraLightPosition();
    }
  }
  // Check if the ball has reached the pole
  checkWinCondition();
}

// Function for collision detection
function isCellWalkable(x, z) {
  // Calculate the current cell coordinates
  const i = Math.round((labyrinthSize / 2 + x) / cellSize);
  const j = Math.round((labyrinthSize / 2 + z) / cellSize);

  // Check if the cell is walkable
  return labyrinth[i][j] === 0;
}

// Retrieve the HTML element with the id 'winMessage' and assign it to the variable 'winMessage'
const winMessage = document.getElementById('winMessage');

// Function to check for a win condition
function checkWinCondition() {
  const polePosition = new THREE.Vector3(
    (19 - labyrinthSize / 2) * cellSize, 1, (26 - labyrinthSize / 2) * cellSize
  );
  const distance = ball.position.distanceTo(polePosition); // Calculate the distance between the ball's current position and the pole's position
  if (distance < 1.0) { // If the ball is near the pole
    stopTimer(); 
    winMessage.style.display = 'block'; // Show the win message

    // Update the win message with the elapsed time
    const timeTaken = timeElapsed.toFixed(2); // Total time
    document.getElementById('timeMessage').innerText = `Total time: ${timeTaken} seconds`;
  }
}

// Add event listener for the restart button
document.getElementById('restartButton').addEventListener('click', restartGame);

// Restart function
function restartGame() {
    winMessage.style.display = 'none';
    // Reset the ball's position and other variables
    ball.position.set(-(labyrinthSize / 2 - 1) * cellSize + cellSize / 2, 0.5, -(labyrinthSize / 2 - 1) * cellSize + cellSize / 2);
    timeElapsed = 0;
    startTimer(); 
    updateAuraLightPosition();
}

// Aura light around the ball
const auraLight = new THREE.PointLight(0xffffff, 0); // White color and initial intensity of 0
auraLight.position.set(-(labyrinthSize / 2) * cellSize + cellSize / 2, 0.5, -(labyrinthSize / 2) * cellSize + cellSize / 2); 
scene.add(auraLight);

// Function to update the intensity of the aura light based on the main light brightness
function updateAuraLightIntensity(intensity) {
  // Calculate the aura light intensity based on the main light brightness
  const auraIntensity = THREE.MathUtils.clamp(1 - intensity, 0, 1); // Invert and scale the intensity

  // Set the aura light intensity
  auraLight.intensity = auraIntensity * 2; 
}

// Function to update the aura light position
function updateAuraLightPosition() {
  auraLight.position.copy(ball.position); // Position the aura light at the same position as the ball
  auraLight.position.y += 0.5; // Slightly lift the aura light to make it visible above the ball
}

// Variable for the first-person camera
let firstPersonCamera;

document.getElementById('toggleViewBtn').style.display = 'none';
// Function to create the first-person camera
function createFirstPersonCamera() {
  const fov = 75; // Field of view
  const aspect = window.innerWidth / window.innerHeight; // Browser window aspect ratio
  const near = 0.1; // Camera's near rendering distance
  const far = 100; // Camera's far rendering distance

  // Create a new perspective camera
  firstPersonCamera = new THREE.PerspectiveCamera(fov, aspect, near, far);

  // Position the camera inside the ball
  if (ball) {
    // Position the camera slightly behind the ball
    firstPersonCamera.position.copy(ball.position);
    firstPersonCamera.position.z += 2; // Move the camera forward

    // Orient the camera towards the ball
    firstPersonCamera.lookAt(ball.position);
    
    scene.add(firstPersonCamera);
  }
}

let isFirstPersonView = false; // Flag to track first-person view state
let isPointerLocked = false; // Flag to track pointer lock state
const mouseSensitivity = 0.002; // Mouse sensitivity

// Listener for the view toggle button
document.getElementById('toggleViewBtn').addEventListener('click', () => {
  isFirstPersonView = !isFirstPersonView; // Toggle first-person view state

  if (isFirstPersonView) {
    // Hide the main camera
    camera.visible = false;

    // Show the first-person camera
    if (firstPersonCamera) {
      firstPersonCamera.visible = true;
    }

    // Request pointer lock
    document.body.requestPointerLock();
  } else {
    // Hide the first-person camera
    if (firstPersonCamera) {
      firstPersonCamera.visible = false;
    }

    // Show the main camera
    camera.visible = true;

    // Exit pointer lock
    document.exitPointerLock();
  }
});

// Event listener to track pointer lock state
document.addEventListener('pointerlockchange', () => {
  isPointerLocked = !!document.pointerLockElement; // Update pointer lock state
});

// Function to update the first-person camera
function updateFirstPersonCamera() {
  // Check if the first-person camera is defined and if first-person view is active
  if (firstPersonCamera && isFirstPersonView) {
    // Position the camera slightly behind the ball
    firstPersonCamera.position.copy(ball.position);
    firstPersonCamera.position.z += 2; // Move the camera forward
  }
}

// Listener for mouse movement
document.addEventListener('mousemove', (event) => {
  // Check if first-person view is active and if the pointer is locked
  if (isFirstPersonView && isPointerLocked) {
    const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0; // Get the mouse movement on the X axis, compatible with various browsers
    const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0; // Get the mouse movement on the Y axis, compatible with various browsers

    firstPersonCamera.rotation.y -= movementX * mouseSensitivity; // Adjust camera rotation on the Y axis based on horizontal mouse movement
    firstPersonCamera.rotation.x -= movementY * mouseSensitivity; // Adjust camera rotation on the X axis based on vertical mouse movement

    // Limit vertical rotation to avoid extreme movements
    firstPersonCamera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, firstPersonCamera.rotation.x));
  }
});

// Call to create the first-person camera
createFirstPersonCamera();

// Animation function
function animate() {
  requestAnimationFrame(animate); // Call the animation function for the next frame
  controls.update(); // Update the main camera controls

  if (firstPersonCamera) {
    updateFirstPersonCamera(); // Update the first-person camera if active
  }

  if (gameStarted) {
    updateSunPosition(); 
    moveBall(); 
  }
  
  // Render the scene using the appropriate camera
  renderer.render(scene, isFirstPersonView ? firstPersonCamera : camera);
}

// Start the animation
animate();

