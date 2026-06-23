import './style.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// ---------- asset paths (public/ served at /) ----------
const BLDG = (n) => encodeURI(`/assets/city/kenney-commercial/Models/GLB format/${n}.glb`);
const CHAR = (n) => encodeURI(`/assets/characters/kenney-mini/Models/GLB format/${n}.glb`);
const HDRI = (n) => `/assets/hdri/${n}.hdr`;

// ---------- portfolio content (the town's people) ----------
const STATIONS = [
  { id:'about', name:'sang', tag:'the host', hex:0xFF5B22, css:'#FF5B22', body:[
    { lead:true, t:'hey — i\'m sang.' },
    { t:'co-founder & cto · <b>aicade</b> — text → game, scaled the team 7 → 20.' },
    { t:'founder · <b>pulstra</b> — ai/ml consultancy, 3 active clients.' },
    { t:'building · <b>zeno</b> — a claude-desktop memory companion.' },
    { t:'<span style="color:#1a8f4e">available · uk msc, sep 2026.</span>' } ] },
  { id:'work', name:'the studio', tag:'selected work', hex:0x39e6e6, css:'#39e6e6', body:[
    { t:'<b>aicade</b> — text-to-game engine. type a prompt, get a playable game. led architecture; grew eng 7 → 20.' },
    { t:'<b>zaqencare</b> — geriatric / home-care scheduling, live in canada.' },
    { t:'<b>zeno</b> — ai memory-companion (web + whatsapp), pivoting into a claude-desktop window.' } ] },
  { id:'research', name:'the lab', tag:'research', hex:0xc69bff, css:'#c69bff', body:[
    { t:'<b>[preprint]</b> simpler is better: gqa-aware kv-cache eviction — beats h2o at every budget · arXiv 2026.' },
    { t:'<b>[published]</b> ship-hull optimisation · results in engineering · IF 9.20.' },
    { t:'<b>[in review]</b> squat biomechanics · with prof. davidson.' } ] },
  { id:'now', name:'the board', tag:'this week', hex:0xfff5a0, css:'#fff5a0', body:[
    { t:'▸ pivoting zeno → claude-desktop mcp companion window' },
    { t:'▸ "simpler is better" kv paper → arXiv this week' },
    { t:'▸ uk msc applications, sep 2026 entry' },
    { t:'▸ pulstra: satoshi · omniactive · visteon' } ] },
  { id:'contact', name:'the mailbox', tag:'say hi', hex:0x3df58c, css:'#3df58c', body:[
    { lead:true, t:'let\'s talk.' },
    { t:'<a href="mailto:sangrish03@gmail.com">sangrish03@gmail.com</a>' },
    { t:'github · <a href="https://github.com/sangrish-braincade" target="_blank" rel="noopener">github.com/sangrish-braincade</a>' },
    { t:'x · <a href="https://x.com/Sangrish03" target="_blank" rel="noopener">@Sangrish03</a>' },
    { t:'linkedin · <a href="https://linkedin.com/in/sangrish" target="_blank" rel="noopener">in/sangrish</a>' } ] },
];

// ---------- DOM ----------
const $ = (id) => document.getElementById(id);
const loadEl = $('load'), loadbar = $('loadbar'), loadtip = $('loadtip');
const isTouch = matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window;
if (isTouch) document.body.classList.add('touch');

// ---------- renderer / scene / camera ----------
const app = $('app');
const renderer = new THREE.WebGLRenderer({ antialias:true, powerPreference:'high-performance', preserveDrawingBuffer:true });
renderer.setPixelRatio(Math.min(devicePixelRatio, isTouch ? 1.5 : 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xbfe0d6, 0.0065);

const camera = new THREE.PerspectiveCamera(55, innerWidth/innerHeight, 0.1, 400);
camera.position.set(0, 8, 18);

// ---------- post (bloom) ----------
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.35, 0.7, 0.85);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ---------- lights ----------
const hemi = new THREE.HemisphereLight(0xffffff, 0x8a9a7a, 0.8);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff2d8, 2.4);
sun.position.set(40, 60, 25);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
const sc = sun.shadow.camera; sc.left=-70; sc.right=70; sc.top=70; sc.bottom=-70; sc.near=1; sc.far=200;
sun.shadow.bias = -0.0004;
scene.add(sun);

// ---------- loaders ----------
const manager = new THREE.LoadingManager();
manager.onProgress = (_u, loaded, total) => { if (total) loadbar.style.width = Math.round((loaded/total)*100) + '%'; };
manager.onLoad = () => { setTimeout(() => loadEl.classList.add('gone'), 300); };
const gltfLoader = new GLTFLoader(manager);
const rgbe = new RGBELoader(manager);
const pmrem = new THREE.PMREMGenerator(renderer);

// ---------- environment (day + night) ----------
let envDay = null, envNight = null, bgDay = null, bgNight = null, applied = false;
function loadEnv(name) {
  rgbe.load(HDRI(name), (tex) => {
    tex.mapping = THREE.EquirectangularReflectionMapping;
    const env = pmrem.fromEquirectangular(tex).texture;
    if (name === 'day') { envDay = env; bgDay = tex; } else { envNight = env; bgNight = tex; }
    if (envDay && bgDay && !applied) { applied = true; applyEnv(); }
  });
}
function applyEnv() { scene.environment = isNight ? envNight : envDay; scene.background = isNight ? bgNight : bgDay; }
loadEnv('day');
loadEnv('night');

// ---------- ground + reflective plaza ----------
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(400, 400),
  new THREE.MeshStandardMaterial({ color:0x2a2c30, roughness:0.9, metalness:0.0 }));
ground.rotation.x = -Math.PI/2; ground.receiveShadow = true; scene.add(ground);

let reflector = null;
if (!isTouch) {
  reflector = new Reflector(new THREE.CircleGeometry(20, 64), {
    textureWidth: 1024, textureHeight: 1024, color: 0x1a1c22 });
  reflector.rotation.x = -Math.PI/2; reflector.position.y = 0.02; scene.add(reflector);
}

// ---------- helpers ----------
const colliders = []; // {x,z,r}
function bboxOf(o){ return new THREE.Box3().setFromObject(o); }
function enableShadows(o){ o.traverse(n => { if (n.isMesh){ n.castShadow = true; n.receiveShadow = true; if (n.material) n.material.envMapIntensity = 0.6; } }); }

// signage texture
const signMats = [];
function makeSign(label, css) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = '#0F0E0C'; x.fillRect(0,0,512,128);
  x.strokeStyle = css; x.lineWidth = 8; x.strokeRect(8,8,496,112);
  x.fillStyle = css; x.font = '600 56px "JetBrains Mono", monospace';
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(label, 256, 68);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const mat = new THREE.MeshStandardMaterial({ map:tex, emissive:0xffffff, emissiveMap:tex,
    emissiveIntensity:0.35, toneMapped:false, roughness:1 });
  signMats.push(mat);
  return mat;
}

// ---------- city: place Kenney buildings around a plaza ----------
const BUILDINGS = ['building-a','building-b','building-c','building-d','building-e','building-f',
  'building-g','building-h','building-i','building-j','building-k','building-l'];
const plots = [];
[-1.5,-0.5,0.5,1.5].forEach(gx => [-1.5,-0.5,0.5,1.5].forEach(gz => {
  if (Math.abs(gx) < 1 && Math.abs(gz) < 1) return; // keep plaza open
  plots.push([gx*22, gz*22]);
}));
// stations get the 5 plots closest to centre, sign facing inward
plots.sort((a,b) => Math.hypot(a[0],a[1]) - Math.hypot(b[0],b[1]));

const stationMeshes = []; // {st, x, z, r}
plots.forEach((p, i) => {
  const name = BUILDINGS[i % BUILDINGS.length];
  gltfLoader.load(BLDG(name), (g) => {
    const o = g.scene;
    const bb = bboxOf(o); const h = bb.max.y - bb.min.y;
    const targetH = 9 + (i % 4) * 4;
    const s = targetH / h; o.scale.setScalar(s);
    const bb2 = bboxOf(o);
    o.position.set(p[0], -bb2.min.y, p[1]);
    o.rotation.y = Math.atan2(-p[0], -p[1]); // face plaza centre
    enableShadows(o); scene.add(o);
    const fp = Math.max(bb2.max.x - bb2.min.x, bb2.max.z - bb2.min.z);
    colliders.push({ x:p[0], z:p[1], r: fp * 0.55 });

    // first 5 plots become stations with a glowing sign facing the plaza
    if (i < STATIONS.length) {
      const st = STATIONS[i];
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(7, 1.75), makeSign(st.name, st.css));
      const inward = new THREE.Vector2(-p[0], -p[1]).normalize();
      sign.position.set(p[0] + inward.x * (fp*0.5 + 0.1), targetH*0.42, p[1] + inward.y * (fp*0.5 + 0.1));
      sign.lookAt(0, targetH*0.42, 0);
      scene.add(sign);
      // beacon
      const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(0.6, 0),
        new THREE.MeshStandardMaterial({ color:st.hex, emissive:st.hex, emissiveIntensity:1.2, toneMapped:false }));
      beacon.position.set(p[0] + inward.x*3, targetH + 2, p[1] + inward.y*3);
      scene.add(beacon);
      stationMeshes.push({ st, x:p[0] + inward.x*3, z:p[1] + inward.y*3, beacon });
    }
  });
});

// quest list UI
const qlist = $('qlist');
STATIONS.forEach(s => { const li = document.createElement('li'); li.id = 'q-'+s.id;
  li.innerHTML = `<span class="dot"></span>${s.name}`; qlist.appendChild(li); });

// ---------- player ----------
let player = null, playerMixer = null, playerActions = {}, playerAction = null;
const CHAR_TARGET_H = 1.7;
function loadCharacter(file, onReady) {
  gltfLoader.load(CHAR(file), (g) => {
    const o = g.scene; const bb = bboxOf(o); const h = bb.max.y - bb.min.y || 1;
    o.scale.setScalar(CHAR_TARGET_H / h);
    o.traverse(n => { if (n.isMesh){ n.castShadow = true; n.frustumCulled = false; } });
    onReady(o, g.animations);
  });
}
function actionsFrom(o, clips) {
  const mixer = new THREE.AnimationMixer(o); const acts = {};
  clips.forEach(c => { acts[c.name] = mixer.clipAction(c); });
  return { mixer, acts };
}
loadCharacter('character-male-a', (o, clips) => {
  player = o; player.position.set(0, 0, 8); scene.add(player);
  const { mixer, acts } = actionsFrom(o, clips); playerMixer = mixer; playerActions = acts;
  playerAction = acts['idle']; if (playerAction) playerAction.play();
});
function setPlayerAnim(name) {
  const next = playerActions[name]; if (!next || next === playerAction) return;
  next.reset().fadeIn(0.2).play(); if (playerAction) playerAction.fadeOut(0.2); playerAction = next;
}

// ---------- NPCs ----------
const npcs = [];
const NPC_VARIANTS = ['character-female-a','character-female-b','character-male-b','character-female-c'];
NPC_VARIANTS.forEach((file, vi) => {
  loadCharacter(file, (o, clips) => {
    for (let k = 0; k < 3; k++) {
      const c = cloneSkinned(o);
      const ang = Math.random()*Math.PI*2, rad = 14 + Math.random()*30;
      c.position.set(Math.cos(ang)*rad, 0, Math.sin(ang)*rad);
      scene.add(c);
      const { mixer, acts } = actionsFrom(c, clips);
      (acts['walk'] || acts['idle'])?.play();
      npcs.push({ obj:c, mixer, acts, walking:true,
        target:new THREE.Vector3(Math.cos(ang+1)*rad, 0, Math.sin(ang+1)*rad), wait:0 });
    }
  });
});

// ---------- input ----------
const keys = {};
addEventListener('keydown', e => {
  if (['arrowup','arrowdown','arrowleft','arrowright'].includes(e.key.toLowerCase())) e.preventDefault();
  keys[e.key.toLowerCase()] = true;
  if (e.key.toLowerCase() === 'e') tryInteract();
  if (e.key === 'Escape') closeDialogue();
  if (e.key.toLowerCase() === 'n') toggleDayNight();
});
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

let camYaw = Math.PI, camPitch = 0.42, camDist = 11;
let dragging = false, lastX = 0, lastY = 0, dragId = -1;
const canvas = renderer.domElement;
canvas.addEventListener('pointerdown', e => { if (joyActive) return; dragging = true; dragId = e.pointerId; lastX = e.clientX; lastY = e.clientY; });
addEventListener('pointermove', e => { if (!dragging || e.pointerId !== dragId) return;
  camYaw -= (e.clientX - lastX) * 0.006;
  camPitch = Math.max(0.12, Math.min(0.95, camPitch + (e.clientY - lastY) * 0.005));
  lastX = e.clientX; lastY = e.clientY; });
addEventListener('pointerup', e => { if (e.pointerId === dragId){ dragging = false; dragId = -1; } });
addEventListener('wheel', e => { camDist = Math.max(5, Math.min(22, camDist + e.deltaY*0.01)); }, { passive:true });

// joystick
let joyVec = { x:0, z:0 }, joyActive = false, joyId = -1;
const stick = $('stick'), knob = $('knob');
stick.addEventListener('pointerdown', e => { joyActive = true; joyId = e.pointerId; joyMove(e); });
addEventListener('pointermove', joyMove);
addEventListener('pointerup', e => { if (e.pointerId !== joyId) return; joyActive = false; joyId = -1; joyVec = {x:0,z:0}; knob.style.transform = 'translate(0,0)'; });
function joyMove(e){ if (!joyActive || e.pointerId !== joyId) return;
  const r = stick.getBoundingClientRect(); let dx = e.clientX-(r.left+r.width/2), dy = e.clientY-(r.top+r.height/2);
  const max = r.width/2, len = Math.hypot(dx,dy); if (len>max){ dx=dx/len*max; dy=dy/len*max; }
  knob.style.transform = `translate(${dx}px,${dy}px)`; joyVec.x = dx/max; joyVec.z = dy/max; }

// ---------- dialogue + quest ----------
const dlg = $('dlg'); let openId = null;
$('dx').onclick = closeDialogue; $('scrim').onclick = closeDialogue;
function openDialogue(st){ openId = st.id;
  $('dav').style.background = st.css; $('dnm').textContent = st.name; $('dtag').textContent = st.tag;
  const body = $('dbody'); body.innerHTML = '';
  st.body.forEach(l => { const d = document.createElement('div'); if (l.lead) d.className = 'lead'; d.innerHTML = l.t; body.appendChild(d); });
  dlg.classList.add('show'); const q = $('q-'+st.id); if (q) q.classList.add('done'); }
function closeDialogue(){ dlg.classList.remove('show'); openId = null; }
let nearest = null;
const hint = $('hint');
function tryInteract(){ if (nearest && !openId) openDialogue(nearest.st); }
hint.addEventListener('click', tryInteract);

// ---------- day / night ----------
let isNight = false;
const dn = { sun:2.4, hemi:0.8, expo:1.0, bloom:0.35, emissive:0.35, fog:0.0065, fogColor:new THREE.Color(0xbfe0d6) };
const dnTarget = { ...dn, fogColor:new THREE.Color(0xbfe0d6) };
function toggleDayNight(){
  isNight = !isNight;
  $('daynight').textContent = isNight ? '☾ night' : '☀ day';
  if (isNight){ Object.assign(dnTarget, { sun:0.15, hemi:0.25, expo:0.42, bloom:1.15, emissive:2.6, fog:0.011 }); dnTarget.fogColor.set(0x0a0c14); }
  else { Object.assign(dnTarget, { sun:2.4, hemi:0.8, expo:1.0, bloom:0.35, emissive:0.35, fog:0.0065 }); dnTarget.fogColor.set(0xbfe0d6); }
  applyEnv();
}
$('daynight').onclick = toggleDayNight;

// ---------- loop ----------
const clock = new THREE.Clock();
const tmp = new THREE.Vector3();
const camPos = new THREE.Vector3(0, 9, 20);

function update(dt){
  // player movement (camera-relative)
  let ix = 0, iz = 0;
  if (keys['w']||keys['arrowup']) iz -= 1;
  if (keys['s']||keys['arrowdown']) iz += 1;
  if (keys['a']||keys['arrowleft']) ix -= 1;
  if (keys['d']||keys['arrowright']) ix += 1;
  if (joyActive){ ix += joyVec.x; iz += joyVec.z; }
  const mag = Math.hypot(ix, iz);
  const sprint = !!keys['shift'];
  let moving = false;

  if (player && mag > 0.08 && !openId){
    ix/=mag; iz/=mag;
    const fx = -Math.sin(camYaw), fz = -Math.cos(camYaw);
    const rx = Math.cos(camYaw),  rz = -Math.sin(camYaw);
    let mx = fx*(-iz) + rx*ix, mz = fz*(-iz) + rz*ix;
    const ml = Math.hypot(mx,mz) || 1; mx/=ml; mz/=ml;
    const speed = (sprint ? 9 : 5) * dt * Math.min(1, mag);
    let nx = player.position.x + mx*speed, nz = player.position.z + mz*speed;
    for (const c of colliders){ const dx=nx-c.x, dz=nz-c.z, d=Math.hypot(dx,dz), min=c.r+0.6;
      if (d < min && d > 1e-4){ nx = c.x + dx/d*min; nz = c.z + dz/d*min; } }
    const br = Math.hypot(nx,nz); if (br > 95){ nx=nx/br*95; nz=nz/br*95; }
    player.position.x = nx; player.position.z = nz;
    const tr = Math.atan2(mx, mz); let drot = tr - player.rotation.y;
    drot = Math.atan2(Math.sin(drot), Math.cos(drot)); player.rotation.y += drot * Math.min(1, dt*12);
    moving = true;
  }
  if (player) setPlayerAnim(moving ? (sprint ? 'sprint' : 'walk') : 'idle');
  if (playerMixer) playerMixer.update(dt);

  // NPC wander
  const t = clock.elapsedTime;
  for (const n of npcs){
    n.mixer.update(dt);
    if (n.wait > 0){ n.wait -= dt; continue; }
    const d = tmp.subVectors(n.target, n.obj.position); d.y = 0;
    if (d.length() < 0.6){ n.wait = 1 + Math.random()*2;
      const ang = Math.random()*Math.PI*2, rad = 12 + Math.random()*32;
      n.target.set(Math.cos(ang)*rad, 0, Math.sin(ang)*rad);
    } else {
      d.normalize(); n.obj.position.addScaledVector(d, 1.4*dt);
      n.obj.rotation.y += (Math.atan2(d.x, d.z) - n.obj.rotation.y) * Math.min(1, dt*6);
    }
  }

  // camera follow
  if (player){
    const ox = Math.sin(camYaw)*Math.cos(camPitch)*camDist;
    const oy = Math.sin(camPitch)*camDist;
    const oz = Math.cos(camYaw)*Math.cos(camPitch)*camDist;
    camPos.lerp(tmp.set(player.position.x+ox, oy+1.4, player.position.z+oz), Math.min(1, dt*6));
    camera.position.copy(camPos);
    camera.lookAt(player.position.x, 1.4, player.position.z);
  }

  // station proximity
  nearest = null; let nd = 5;
  for (const s of stationMeshes){
    s.beacon.rotation.y += dt*1.5; s.beacon.position.y = (s.beacon.position.y) ; // spin
    if (!player) continue;
    const d = Math.hypot(player.position.x - s.x, player.position.z - s.z);
    if (d < nd){ nd = d; nearest = s; }
  }
  if (nearest && !openId){ hint.classList.add('show');
    $('hinttxt').textContent = 'talk to ' + nearest.st.name; $('hintkey').textContent = isTouch ? 'TAP' : 'E';
  } else hint.classList.remove('show');

  // day/night lerp
  const k = Math.min(1, dt*2.5);
  dn.sun += (dnTarget.sun-dn.sun)*k; sun.intensity = dn.sun;
  dn.hemi += (dnTarget.hemi-dn.hemi)*k; hemi.intensity = dn.hemi;
  dn.expo += (dnTarget.expo-dn.expo)*k; renderer.toneMappingExposure = dn.expo;
  dn.bloom += (dnTarget.bloom-dn.bloom)*k; bloom.strength = dn.bloom;
  dn.emissive += (dnTarget.emissive-dn.emissive)*k; signMats.forEach(m => m.emissiveIntensity = dn.emissive);
  dn.fog += (dnTarget.fog-dn.fog)*k; scene.fog.density = dn.fog;
  dn.fogColor.lerp(dnTarget.fogColor, k); scene.fog.color.copy(dn.fogColor);
}

function animate(){
  requestAnimationFrame(animate);
  if (window.__freeze) return;
  const dt = Math.min(clock.getDelta(), 0.05);
  update(dt);
  composer.render();
}
window.__kick = animate;
animate();

addEventListener('resize', () => {
  camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight);
});

window.__dbg = { scene, camera, renderer, composer, get player(){ return player; }, get npcs(){ return npcs; }, get night(){ return isNight; }, get env(){ return { day: !!envDay, night: !!envNight, bgDay: !!bgDay, applied }; } };
window.__setNight = (on) => { // dev: snap day/night instantly + render one frame (bypasses lerp for headless capture)
  isNight = on; document.getElementById('daynight').textContent = on ? '☾ night' : '☀ day';
  Object.assign(dnTarget, on ? { sun:0.15, hemi:0.25, expo:0.42, bloom:1.15, emissive:2.6, fog:0.011 }
                             : { sun:2.4, hemi:0.8, expo:1.0, bloom:0.35, emissive:0.35, fog:0.0065 });
  dnTarget.fogColor.set(on ? 0x0a0c14 : 0xbfe0d6);
  Object.assign(dn, dnTarget); dn.fogColor.copy(dnTarget.fogColor);
  sun.intensity = dn.sun; hemi.intensity = dn.hemi; renderer.toneMappingExposure = dn.expo;
  bloom.strength = dn.bloom; signMats.forEach(m => m.emissiveIntensity = dn.emissive);
  scene.fog.density = dn.fog; scene.fog.color.copy(dn.fogColor); applyEnv(); composer.render();
};
console.log('[sang-town] booted');
