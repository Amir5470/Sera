// High-fidelity Three.js hero: phone model + MeshPhysicalMaterial, spring physics barrel-roll
// Exports initThreeHero(containerSelector, screenshots, { reduceMotion=false })

export async function initThreeHero(containerSelector, screenshots, opts = {}){
  const { reduceMotion = false } = opts;
  const container = document.querySelector(containerSelector);
  if(!container) return;

  // dynamic import of Three and loaders
  const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js');
  const { GLTFLoader } = await import('https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/loaders/GLTFLoader.js');

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.set(0, 0, 6);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  container.appendChild(renderer.domElement);

  // Cinematic lights matching Sera colors
  const key = new THREE.PointLight(0xF97316, 2.0, 50, 2);
  key.position.set(4, 4, 6);
  scene.add(key);
  const rim = new THREE.PointLight(0xFFD166, 1.2, 60, 2);
  rim.position.set(-4, -3, 3);
  scene.add(rim);
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);

  // PHONE BODY with MeshPhysicalMaterial for glass-like clearcoat
  const bodyGeom = new THREE.BoxGeometry(2.8, 5.8, 0.28, 32, 32, 1);
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: 0x0a0a0a,
    metalness: 0.5,
    roughness: 0.12,
    clearcoat: 1.0,
    clearcoatRoughness: 0.02,
    reflectivity: 0.6,
    envMapIntensity: 0.6
  });
  const phoneBody = new THREE.Mesh(bodyGeom, bodyMat);
  phoneBody.castShadow = true;
  phoneBody.receiveShadow = true;
  scene.add(phoneBody);

  // Add slight bevel by rounding later in glTF — fallback here is simple

  // SCREEN: plane slightly in front with initial texture
  const screenGeom = new THREE.PlaneGeometry(2.6, 5.2, 32, 32);
  const loader = new THREE.TextureLoader();
  const textures = screenshots.map(s => loader.load(s));
  textures.forEach(t => { t.encoding = THREE.sRGBEncoding; t.minFilter = THREE.LinearFilter; });
  const screenMat = new THREE.MeshBasicMaterial({ map: textures[0] });
  const screenMesh = new THREE.Mesh(screenGeom, screenMat);
  screenMesh.position.z = 0.16;
  phoneBody.add(screenMesh);

  // subtle polished rim highlight (fake reflection plane)
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    opacity: 0.06,
    transparent: true
  });
  const rimPlane = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 5.8), rimMat);
  rimPlane.rotation.x = -0.1;
  rimPlane.position.set(0, 0.08, 0.19);
  phoneBody.add(rimPlane);

  // SPRING PHYSICS (second-order) for rotation
  let targetRotation = 0;
  let rotation = 0;
  let velocity = 0;
  const stiffness = 120.0; // spring stiffness
  const damping = 18.0; // damping

  // Map scroll -> rotation & swap textures
  function onScroll(){
    const t = window.scrollY / Math.max(1, (document.body.scrollHeight - window.innerHeight));
    targetRotation = t * Math.PI * 2; // one full roll
    const idx = Math.min(Math.floor(t * textures.length), textures.length - 1);
    if(screenMat.map !== textures[idx]){
      screenMat.map = textures[idx];
      screenMat.needsUpdate = true;
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // optional interactive tilt on pointer move (subtle)
  let pointerX = 0, pointerY = 0;
  container.addEventListener('pointermove', (e)=>{
    const r = container.getBoundingClientRect();
    const nx = (e.clientX - (r.left + r.width/2)) / (r.width/2);
    const ny = (e.clientY - (r.top + r.height/2)) / (r.height/2);
    pointerX = nx * 0.08; // tilt range
    pointerY = ny * 0.08;
  });

  // Animation loop with spring integrator (semi-implicit Euler)
  const clock = new THREE.Clock();
  let running = true;
  function step(){
    if(!running) return;
    requestAnimationFrame(step);
    const dt = Math.min(0.032, clock.getDelta());

    // spring physics: acceleration = stiffness * (target - x) - damping * v
    const a = stiffness * (targetRotation - rotation) - damping * velocity;
    velocity += a * dt;
    rotation += velocity * dt;

    // gentle bob
    const time = performance.now() * 0.001;
    const bob = Math.sin(time * 0.8) * 0.03;

    // apply transforms
    phoneBody.rotation.y = rotation;
    phoneBody.rotation.x = pointerY * 0.35 + bob;
    phoneBody.rotation.z = -pointerX * 0.3;

    renderer.render(scene, camera);
  }

  if(!reduceMotion) step();

  // resize handling
  window.addEventListener('resize', ()=>{
    renderer.setSize(container.clientWidth, container.clientHeight);
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
  });

  return {
    dispose(){
      running = false;
      try{
        renderer.dispose();
        while(container.lastChild) container.removeChild(container.lastChild);
      }catch(e){}
      window.removeEventListener('scroll', onScroll);
    }
  };
}
