// Minimal Three.js hero: phone model + texture swap on scroll. This file expects
// three.module.js and GLTFLoader to be available via dynamic import.

export async function initThreeHero(containerSelector, screenshots, reduceMotion=false){
  const container = document.querySelector(containerSelector);
  if(!container) return;

  // lazy-load Three.js and GLTFLoader from CDN
  const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js');
  const { GLTFLoader } = await import('https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/loaders/GLTFLoader.js');

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.set(0,0,6);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // lighting
  const key = new THREE.DirectionalLight(0xffc6a3, 0.8);
  key.position.set(5,5,5);
  scene.add(key);
  const fill = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(fill);

  // load phone glTF (fallback to box if not available)
  const loader = new GLTFLoader();
  let phoneObj;
  try{
    const gltf = await loader.loadAsync('/models/phone.glb');
    phoneObj = gltf.scene;
    scene.add(phoneObj);
  } catch(e){
    const geometry = new THREE.BoxGeometry(3,6,0.2,32,32,1);
    const material = new THREE.MeshStandardMaterial({color:0x000000, metalness:0.3, roughness:0.6});
    const m = new THREE.Mesh(geometry, material);
    m.rotation.x = 0.02;
    phoneObj = m;
    scene.add(phoneObj);
  }

  // create screen plane and textures
  const screenGeom = new THREE.PlaneGeometry(2.5,4.3);
  const textures = [];
  const tLoader = new THREE.TextureLoader();
  for(const s of screenshots){
    textures.push(tLoader.load(s));
  }
  const screenMat = new THREE.MeshBasicMaterial({map:textures[0]});
  const screenMesh = new THREE.Mesh(screenGeom, screenMat);
  screenMesh.position.set(0,0,0.11);
  scene.add(screenMesh);

  // animate barrel roll on scroll
  let scrollTarget = 0;
  window.addEventListener('scroll', ()=>{
    const t = window.scrollY / (document.body.scrollHeight - window.innerHeight);
    scrollTarget = t * Math.PI * 2; // one full rotation
    const idx = Math.floor(t * textures.length) % textures.length;
    screenMat.map = textures[idx];
    screenMat.needsUpdate = true;
  });

  const clock = new THREE.Clock();
  function animate(){
    requestAnimationFrame(animate);
    const dt = clock.getDelta();
    const current = phoneObj.rotation.z || 0;
    const v = (scrollTarget - current) * 6;
    const next = current + v * dt * 0.5;
    phoneObj.rotation.z = next;
    renderer.render(scene, camera);
  }
  if(!reduceMotion) animate();

  // handle resize
  window.addEventListener('resize', ()=>{
    renderer.setSize(container.clientWidth, container.clientHeight);
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
  });

  return {
    dispose(){
      renderer.dispose();
      container.removeChild(renderer.domElement);
    }
  };
}
