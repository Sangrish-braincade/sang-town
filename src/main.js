import './style.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// ---------- asset paths (public/ served at /) ----------
const BLDG = (n) => encodeURI(`/assets/city/kenney-commercial/Models/GLB format/${n}.glb`);
const CHAR = (n) => encodeURI(`/assets/characters/kenney-mini/Models/GLB format/${n}.glb`);
const HDRI = (n) => `/assets/hdri/${n}.hdr`;
const TEX  = (n) => `/assets/textures/plaza/PavingStones092_1K-JPG_${n}.jpg`;

// ---------- the 5 "places" (your work, as addresses) ----------
const STATIONS = [
  { id:'about', name:'sang', tag:'the host', hex:0xFF5B22, css:'#FF5B22', body:[
    { lead:true, t:'hey — i\'m sang.' },
    { t:'co-founder & cto · <b>aicade</b> — text → game.' },
    { t:'founder · <b>pulstra</b> — i rent the brain out (ai/ml). three clients right now.' },
    { t:'building · <b>zeno</b> — it remembers you so you don\'t have to.' },
    { t:'<span style="color:#1a8f4e">available · uk msc, sep 2026.</span> poke around — the glowing folks are the good stuff.' } ] },
  { id:'work', name:'the arcade', tag:'aicade', hex:0x39e6e6, css:'#39e6e6', body:[
    { lead:true, t:'the arcade. it builds games.' },
    { t:'type a prompt → get a playable game. i led the architecture and grew eng <b>7 → 20</b>.' },
    { t:'~3,000 games shipped. go poke the cabinet.' } ] },
  { id:'research', name:'the lab', tag:'research', hex:0xc69bff, css:'#c69bff', body:[
    { lead:true, t:'simpler beats clever. it\'s on the board.' },
    { t:'<b>kv-cache eviction</b>, gqa-aware — beats h2o at every budget · arXiv 2026.' },
    { t:'also: a ship-hull paper (IF 9.20) and squat biomechanics, in review.' } ] },
  { id:'now', name:'the board', tag:'this week', hex:0xfff5a0, css:'#fff5a0', body:[
    { t:'▸ zeno → claude-desktop companion window' },
    { t:'▸ "simpler is better" kv paper → arXiv' },
    { t:'▸ uk msc applications, sep 2026' },
    { t:'▸ pulstra: satoshi · omniactive · visteon' } ] },
  { id:'contact', name:'the mailbox', tag:'say hi', hex:0x3df58c, css:'#3df58c', body:[
    { lead:true, t:'let\'s talk.' },
    { t:'<a href="mailto:sangrish03@gmail.com">sangrish03@gmail.com</a>' },
    { t:'github · <a href="https://github.com/sangrish-braincade" target="_blank" rel="noopener">github.com/sangrish-braincade</a>' },
    { t:'x · <a href="https://x.com/Sangrish03" target="_blank" rel="noopener">@Sangrish03</a> · linkedin · <a href="https://linkedin.com/in/sangrish" target="_blank" rel="noopener">in/sangrish</a>' } ] },
];

// ---------- townsfolk — every NPC says something ----------
const NPC_LINES = [
  { name:'mira',   t:'you new here? walk up to the glowing folks — that\'s where the good stuff is.' },
  { name:'devang', t:'sang built this whole block. typed it into existence, mostly.' },
  { name:'okabe',  t:'the lab guy proved "simpler beats clever." annoying, honestly. he\'s right.' },
  { name:'priya',  t:'i found a floppy disk behind the arcade. didn\'t even know what it was, lol.' },
  { name:'sol',    t:'flip it to night (press N). the stone gets wet and the signs glow. worth it.' },
  { name:'reza',   t:'pulstra? that\'s his consultancy. satoshi, omniactive, visteon. busy man.' },
  { name:'aiko',   t:'try typing "cowsay" somewhere quiet. i\'ve said too much.' },
  { name:'bo',     t:'the arcade literally makes games from a sentence. go press the cabinet.' },
  { name:'nadia',  t:'serious recruiter? there\'s a "read as a page" link, top-right. boring but fast.' },
  { name:'jun',    t:'zeno remembers your festivals, your family, your voice notes. kinda sweet.' },
  { name:' True',  t:'he found 13 bugs in a YC hackathon backend once. filed them politely. menace.' },
  { name:'lena',   t:'keep walking past the edge and the fog just swallows you. cozy, right?' },
];

// ---------- DOM ----------
const $ = (id) => document.getElementById(id);
const loadEl = $('load'), loadbar = $('loadbar');
const isTouch = matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window;
if (isTouch) document.body.classList.add('touch');
$('quest')?.style && ($('quest').style.display = 'none'); // killed the section-mirroring quest list

// ---------- renderer / scene / camera ----------
const LOW = isTouch; // low-end / mobile: skip bloom + shadows, lower DPR
const renderer = new THREE.WebGLRenderer({ antialias:!LOW, powerPreference:'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, LOW ? 1 : 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = !LOW;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.AgXToneMapping;   // filmic, no glaze
renderer.toneMappingExposure = 0.95;
renderer.outputColorSpace = THREE.SRGBColorSpace;
$('app').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xcfe0d6, 0.006);

const camera = new THREE.PerspectiveCamera(55, innerWidth/innerHeight, 0.1, 400);
camera.position.set(0, 8, 18);

// ---------- post (subtle bloom) ----------
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.18, 0.7, 0.92);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ---------- lights ----------
const hemi = new THREE.HemisphereLight(0xffffff, 0x6a705e, 0.7);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff2d8, 2.6);
sun.position.set(38, 56, 22); sun.castShadow = !LOW;
sun.shadow.mapSize.set(1024, 1024);
const sc = sun.shadow.camera; sc.left=-70; sc.right=70; sc.top=70; sc.bottom=-70; sc.near=1; sc.far=200;
sun.shadow.bias = -0.0004; scene.add(sun);
// brand point-lights — vermillion = "this is sang's"; off by day, on at night
const lampArcade = new THREE.PointLight(0xFF5B22, 0, 14, 2); lampArcade.position.set(12, 5, 8); scene.add(lampArcade);
const lampPlaza  = new THREE.PointLight(0xEDE3D2, 0, 16, 2); lampPlaza.position.set(0, 6, 0);   scene.add(lampPlaza);

// ---------- loaders ----------
const manager = new THREE.LoadingManager();
manager.onProgress = (_u, l, t) => { if (t) loadbar.style.width = Math.round(l/t*100) + '%'; };
manager.onLoad = () => setTimeout(() => loadEl.classList.add('gone'), 300);
const gltfLoader = new GLTFLoader(manager);
const rgbe = new RGBELoader(manager);
const texLoader = new THREE.TextureLoader(manager);
const pmrem = new THREE.PMREMGenerator(renderer);

// ---------- environment (day + night) ----------
let envDay=null, envNight=null, bgDay=null, bgNight=null, applied=false;
function loadEnv(name){
  rgbe.load(HDRI(name), (tex) => {
    tex.mapping = THREE.EquirectangularReflectionMapping;
    const env = pmrem.fromEquirectangular(tex).texture;
    if (name === 'day') { envDay = env; bgDay = tex; } else { envNight = env; bgNight = tex; }
    if (envDay && bgDay && !applied) { applied = true; applyEnv(); }
  });
}
function applyEnv(){ scene.environment = isNight ? envNight : envDay; scene.background = isNight ? bgNight : bgDay; }
loadEnv('day'); loadEnv('night');

// ---------- de-glaze: per-role material tuning ----------
function tuneMaterial(n){
  if (!n.isMesh || !n.material) return;
  const m = n.material;
  const name = (n.name + ' ' + (m.name||'')).toLowerCase();
  if (/glass|window/.test(name))            { m.roughness = 0.10; m.metalness = 0.0; m.envMapIntensity = 1.0; }
  else if (/metal|trim|sign|rail/.test(name)){ m.roughness = 0.35; m.metalness = 0.85; m.envMapIntensity = 0.6; }
  else { if (m.roughness !== undefined) m.roughness = Math.max(m.roughness, 0.85); if (m.metalness !== undefined) m.metalness = 0.0; m.envMapIntensity = 0.18; }
}
function dressObject(o){ o.traverse(n => { if (n.isMesh){ n.castShadow = true; n.receiveShadow = true; tuneMaterial(n); } }); }

// ---------- ground + wet stone plaza ----------
const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400),
  new THREE.MeshStandardMaterial({ color:0x0F0E0C, roughness:1, metalness:0 }));
ground.rotation.x = -Math.PI/2; ground.receiveShadow = true; scene.add(ground);

const stoneAlbedo = texLoader.load(TEX('Color'));
const stoneNormal = texLoader.load(TEX('NormalGL'));
const stoneRough  = texLoader.load(TEX('Roughness'));
const stoneAO     = texLoader.load(TEX('AmbientOcclusion'));
stoneAlbedo.colorSpace = THREE.SRGBColorSpace;
[stoneAlbedo, stoneNormal, stoneRough, stoneAO].forEach(t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(14,14); t.anisotropy = 8; });
const plazaMat = new THREE.MeshStandardMaterial({
  map:stoneAlbedo, normalMap:stoneNormal, roughnessMap:stoneRough, aoMap:stoneAO,
  roughness:1.0, metalness:0.0, envMapIntensity:0.22,
}); // wetness faked via roughness+envMap (cheaper than clearcoat over a full-screen floor)
const plaza = new THREE.Mesh(new THREE.CircleGeometry(26, 96), plazaMat);
plaza.rotation.x = -Math.PI/2; plaza.position.y = 0.012; plaza.receiveShadow = true;
plaza.geometry.setAttribute('uv2', plaza.geometry.attributes.uv); // aoMap needs uv2
scene.add(plaza);

// ---------- helpers ----------
const colliders = [];
const bboxOf = (o) => new THREE.Box3().setFromObject(o);
const signMats = [];
function makeSign(label, css){
  const c = document.createElement('canvas'); c.width=512; c.height=128; const x=c.getContext('2d');
  x.fillStyle='#0F0E0C'; x.fillRect(0,0,512,128); x.strokeStyle=css; x.lineWidth=8; x.strokeRect(8,8,496,112);
  x.fillStyle=css; x.font='600 56px "JetBrains Mono", monospace'; x.textAlign='center'; x.textBaseline='middle'; x.fillText(label,256,68);
  const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace; tex.anisotropy=4;
  const m=new THREE.MeshStandardMaterial({ map:tex, emissive:0xffffff, emissiveMap:tex, emissiveIntensity:0.3, toneMapped:false, roughness:1 });
  signMats.push(m); return m;
}

// ---------- city ----------
const BUILDINGS = ['building-a','building-b','building-c','building-d','building-e','building-f','building-g','building-h','building-i','building-j','building-k','building-l'];
const plots = [];
[-1.5,-0.5,0.5,1.5].forEach(gx => [-1.5,-0.5,0.5,1.5].forEach(gz => { if (Math.abs(gx)<1 && Math.abs(gz)<1) return; plots.push([gx*22, gz*22]); }));
plots.sort((a,b) => Math.hypot(a[0],a[1]) - Math.hypot(b[0],b[1]));

const talkables = []; // {kind, ent, x, z, r, beacon?}
plots.forEach((p, i) => {
  const name = BUILDINGS[i % BUILDINGS.length];
  gltfLoader.load(BLDG(name), (g) => {
    const o = g.scene; const bb = bboxOf(o); const h = bb.max.y - bb.min.y;
    const targetH = 9 + (i % 4) * 4; const s = targetH / h; o.scale.setScalar(s);
    const bb2 = bboxOf(o); o.position.set(p[0], -bb2.min.y, p[1]); o.rotation.y = Math.atan2(-p[0], -p[1]);
    dressObject(o); scene.add(o);
    const fp = Math.max(bb2.max.x-bb2.min.x, bb2.max.z-bb2.min.z);
    colliders.push({ x:p[0], z:p[1], r: fp*0.55 });
    if (i < STATIONS.length) {
      const st = STATIONS[i];
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(7, 1.75), makeSign(st.name, st.css));
      const inward = new THREE.Vector2(-p[0], -p[1]).normalize();
      sign.position.set(p[0] + inward.x*(fp*0.5+0.1), targetH*0.42, p[1] + inward.y*(fp*0.5+0.1));
      sign.lookAt(0, targetH*0.42, 0); scene.add(sign);
      const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(0.55,0),
        new THREE.MeshStandardMaterial({ color:st.hex, emissive:st.hex, emissiveIntensity:1.2, toneMapped:false }));
      const bx = p[0]+inward.x*3.2, bz = p[1]+inward.y*3.2; beacon.position.set(bx, targetH+1.6, bz); scene.add(beacon);
      talkables.push({ kind:'station', ent:st, x:bx, z:bz, beacon, baseY:targetH+1.6 });
    }
  });
});

// ---------- characters ----------
const CHAR_H = 1.7;
function loadCharacter(file, cb){
  gltfLoader.load(CHAR(file), (g) => {
    const o = g.scene; const h = (bboxOf(o).max.y - bboxOf(o).min.y) || 1; o.scale.setScalar(CHAR_H/h);
    o.traverse(n => { if (n.isMesh){ n.castShadow = !LOW; } }); // keep frustum culling on (perf)
    cb(o, g.animations);
  });
}
function mixerFor(o, clips){ const mixer=new THREE.AnimationMixer(o); const acts={}; clips.forEach(c=>acts[c.name]=mixer.clipAction(c)); return {mixer,acts}; }

// player
let player=null, pMixer=null, pActs={}, pAction=null;
const vel = new THREE.Vector3();
loadCharacter('character-male-a', (o, clips) => {
  player=o; player.position.set(0,0,9); scene.add(player);
  const m=mixerFor(o,clips); pMixer=m.mixer; pActs=m.acts; pAction=pActs['idle']; pAction?.play();
});
function setAnim(name){ const nx=pActs[name]; if(!nx||nx===pAction) return; nx.reset().fadeIn(0.18).play(); pAction?.fadeOut(0.18); pAction=nx; }

// npcs — each with a name + a line, gently wandering, pause when talked to
const npcs = [];
const NPC_FILES = ['character-female-a','character-female-b','character-female-c','character-male-b','character-male-c','character-female-d'];
NPC_FILES.forEach((file, vi) => {
  loadCharacter(file, (o, clips) => {
    for (let k=0; k<(LOW?1:2); k++){
      const idx = vi*2 + k; if (idx >= NPC_LINES.length) break;
      const c = cloneSkinned(o);
      const ang = (idx/NPC_LINES.length)*Math.PI*2, rad = 13 + (idx%3)*6;
      c.position.set(Math.cos(ang)*rad, 0, Math.sin(ang)*rad); scene.add(c);
      const m = mixerFor(c, clips); (m.acts['walk']||m.acts['idle'])?.play();
      const line = NPC_LINES[idx];
      const npc = { obj:c, mixer:m.mixer, acts:m.acts, cur:'walk', line,
        target:new THREE.Vector3(Math.cos(ang+1.2)*rad, 0, Math.sin(ang+1.2)*rad), wait:0, paused:false };
      npcs.push(npc);
      talkables.push({ kind:'npc', ent:{ name:line.name, tag:'townsfolk', css:'#EDE3D2', body:[{t:line.t}] }, npc });
    }
  });
});

// ---------- input ----------
const keys = {};
addEventListener('keydown', e => {
  const k=e.key.toLowerCase();
  if (['arrowup','arrowdown','arrowleft','arrowright'].includes(k)) e.preventDefault();
  keys[k]=true;
  if (k==='e') tryInteract();
  if (e.key==='Escape') closeDialogue();
  if (k==='n') toggleDayNight();
});
addEventListener('keyup', e => keys[e.key.toLowerCase()]=false);

let camYaw=Math.PI, camPitch=0.42, camDist=10;
let dragging=false, lastX=0, lastY=0, dragId=-1;
const canvas = renderer.domElement;
canvas.addEventListener('pointerdown', e => { if (joyActive) return; dragging=true; dragId=e.pointerId; lastX=e.clientX; lastY=e.clientY; });
addEventListener('pointermove', e => { if(!dragging||e.pointerId!==dragId) return; camYaw-=(e.clientX-lastX)*0.006; camPitch=Math.max(0.12,Math.min(0.95,camPitch+(e.clientY-lastY)*0.005)); lastX=e.clientX; lastY=e.clientY; });
addEventListener('pointerup', e => { if(e.pointerId===dragId){ dragging=false; dragId=-1; } });
addEventListener('wheel', e => { camDist=Math.max(5,Math.min(20,camDist+e.deltaY*0.01)); }, {passive:true});

let joyVec={x:0,z:0}, joyActive=false, joyId=-1;
const stick=$('stick'), knob=$('knob');
stick.addEventListener('pointerdown', e => { joyActive=true; joyId=e.pointerId; joyMove(e); });
addEventListener('pointermove', joyMove);
addEventListener('pointerup', e => { if(e.pointerId!==joyId) return; joyActive=false; joyId=-1; joyVec={x:0,z:0}; knob.style.transform='translate(0,0)'; });
function joyMove(e){ if(!joyActive||e.pointerId!==joyId) return; const r=stick.getBoundingClientRect(); let dx=e.clientX-(r.left+r.width/2), dy=e.clientY-(r.top+r.height/2); const mx=r.width/2, len=Math.hypot(dx,dy); if(len>mx){dx=dx/len*mx; dy=dy/len*mx;} knob.style.transform=`translate(${dx}px,${dy}px)`; joyVec.x=dx/mx; joyVec.z=dy/mx; }

// ---------- dialogue ----------
const dlg=$('dlg'); let openId=null;
$('dx').onclick=closeDialogue; $('scrim').onclick=closeDialogue;
function openDialogue(ent){ openId=ent.name; $('dav').style.background=ent.css; $('dnm').textContent=ent.name; $('dtag').textContent=ent.tag;
  const b=$('dbody'); b.innerHTML=''; ent.body.forEach(l=>{ const d=document.createElement('div'); if(l.lead)d.className='lead'; d.innerHTML=l.t; b.appendChild(d); }); dlg.classList.add('show'); }
function closeDialogue(){ dlg.classList.remove('show'); openId=null; if(nearestNpc) nearestNpc.paused=false; }
let nearest=null, nearestNpc=null;
const hint=$('hint');
function tryInteract(){ if(nearest && !openId){ openDialogue(nearest.ent); if(nearest.kind==='npc'){ nearestNpc=nearest.npc; nearest.npc.paused=true; } } }
hint.addEventListener('click', tryInteract);

// ---------- day / night ----------
let isNight=false;
const dn = { sun:2.6, hemi:0.7, expo:0.95, bloom:0.18, emis:0.3, fog:0.006, wet:0, lamp:0, fogC:new THREE.Color(0xcfe0d6) };
const dnT = { ...dn, fogC:new THREE.Color(0xcfe0d6) };
function nightTargets(on){
  Object.assign(dnT, on ? { sun:0.12, hemi:0.22, expo:0.55, bloom:0.9, emis:2.6, fog:0.012, wet:1, lamp:3 }
                        : { sun:2.6, hemi:0.7, expo:0.95, bloom:0.18, emis:0.3, fog:0.006, wet:0, lamp:0 });
  dnT.fogC.set(on ? 0x0a0c14 : 0xcfe0d6);
}
function toggleDayNight(){ isNight=!isNight; $('daynight').textContent = isNight ? '☾ night' : '☀ day'; nightTargets(isNight); applyEnv(); }
$('daynight').onclick = toggleDayNight;

// ---------- loop (smooth, frame-rate-independent) ----------
const clock = new THREE.Clock();
const tmp = new THREE.Vector3();
const camPos = new THREE.Vector3(0, 9, 20);
const sm = (k, dt) => 1 - Math.exp(-k*dt);     // exp smoothing factor

function update(dt){
  // ---- desired move (camera-relative) ----
  let ix=0, iz=0;
  if (keys['w']||keys['arrowup']) iz-=1;
  if (keys['s']||keys['arrowdown']) iz+=1;
  if (keys['a']||keys['arrowleft']) ix-=1;
  if (keys['d']||keys['arrowright']) ix+=1;
  if (joyActive){ ix+=joyVec.x; iz+=joyVec.z; }
  const mag = Math.min(1, Math.hypot(ix,iz));
  const sprint = !!keys['shift'];
  let desX=0, desZ=0;
  if (mag>0.08 && !openId){
    ix/=Math.hypot(ix,iz); iz/=Math.hypot(ix,iz);
    const fx=-Math.sin(camYaw), fz=-Math.cos(camYaw), rx=Math.cos(camYaw), rz=-Math.sin(camYaw);
    let mx=fx*(-iz)+rx*ix, mz=fz*(-iz)+rz*ix; const ml=Math.hypot(mx,mz)||1;
    const top=(sprint?7.5:4.2)*mag; desX=mx/ml*top; desZ=mz/ml*top;
  }
  // ---- momentum (accel toward desired, decel to 0) ----
  const a = sm(desX||desZ ? 9 : 12, dt);
  vel.x += (desX - vel.x)*a; vel.z += (desZ - vel.z)*a;
  const speed = Math.hypot(vel.x, vel.z);
  if (player){
    let nx = player.position.x + vel.x*dt, nz = player.position.z + vel.z*dt;
    for (const c of colliders){ const dx=nx-c.x, dz=nz-c.z, d=Math.hypot(dx,dz), min=c.r+0.6; if(d<min&&d>1e-4){ nx=c.x+dx/d*min; nz=c.z+dz/d*min; } }
    const br=Math.hypot(nx,nz); if(br>110){ nx=nx/br*110; nz=nz/br*110; }
    player.position.x=nx; player.position.z=nz;
    if (speed>0.15){ const tr=Math.atan2(vel.x,vel.z); let dr=tr-player.rotation.y; dr=Math.atan2(Math.sin(dr),Math.cos(dr)); player.rotation.y += dr*sm(11,dt); }
    setAnim(speed>5.5 ? 'sprint' : speed>0.4 ? 'walk' : 'idle');
    if (pActs['walk']) pActs['walk'].timeScale = Math.max(0.6, Math.min(1.6, speed/3.2));
  }
  pMixer?.update(dt);

  // ---- npcs: gentle wander + each pauses to "talk" ----
  for (const n of npcs){
    n.mixer.update(dt);
    if (n.paused){ if(n.cur!=='idle'){ n.acts['idle']?.reset().fadeIn(0.2).play(); n.acts[n.cur]?.fadeOut(0.2); n.cur='idle'; } continue; }
    if (n.wait>0){ n.wait-=dt; if(n.cur!=='idle'){ n.acts['idle']?.reset().fadeIn(0.2).play(); n.acts[n.cur]?.fadeOut(0.2); n.cur='idle'; } continue; }
    const d = tmp.subVectors(n.target, n.obj.position); d.y=0;
    if (d.length()<0.6){ n.wait=1.5+Math.random()*2.5; const ang=Math.random()*Math.PI*2, rad=12+Math.random()*28; n.target.set(Math.cos(ang)*rad,0,Math.sin(ang)*rad); }
    else { d.normalize(); n.obj.position.addScaledVector(d, 1.3*dt); n.obj.rotation.y += (Math.atan2(d.x,d.z)-n.obj.rotation.y)*sm(5,dt); if(n.cur!=='walk'){ n.acts['walk']?.reset().fadeIn(0.2).play(); n.acts['idle']?.fadeOut(0.2); n.cur='walk'; } }
  }

  // ---- camera (smoothed follow) ----
  if (player){
    const ox=Math.sin(camYaw)*Math.cos(camPitch)*camDist, oy=Math.sin(camPitch)*camDist, oz=Math.cos(camYaw)*Math.cos(camPitch)*camDist;
    camPos.lerp(tmp.set(player.position.x+ox, oy+1.5, player.position.z+oz), sm(7,dt));
    camera.position.copy(camPos); camera.lookAt(player.position.x, 1.4, player.position.z);
  }

  // ---- nearest talkable (stations + npcs) ----
  nearest=null; let nd=4.5; const t=clock.elapsedTime;
  for (const k of talkables){
    if (k.kind==='station'){ k.beacon.rotation.y += dt*1.4; k.beacon.position.y = k.baseY + Math.sin(t*2)*0.18; }
    const ex = k.kind==='npc' ? k.npc.obj.position.x : k.x;
    const ez = k.kind==='npc' ? k.npc.obj.position.z : k.z;
    if (!player) continue;
    const d = Math.hypot(player.position.x-ex, player.position.z-ez);
    if (d<nd){ nd=d; nearest=k; }
  }
  if (nearest && !openId){ hint.classList.add('show'); $('hinttxt').textContent='talk to '+nearest.ent.name; $('hintkey').textContent=isTouch?'TAP':'E'; }
  else hint.classList.remove('show');

  // ---- day/night lerp ----
  const k = sm(2.6, dt);
  dn.sun+=(dnT.sun-dn.sun)*k; sun.intensity=dn.sun;
  dn.hemi+=(dnT.hemi-dn.hemi)*k; hemi.intensity=dn.hemi;
  dn.expo+=(dnT.expo-dn.expo)*k; renderer.toneMappingExposure=dn.expo;
  dn.bloom+=(dnT.bloom-dn.bloom)*k; bloom.strength=dn.bloom;
  dn.emis+=(dnT.emis-dn.emis)*k; signMats.forEach(m=>m.emissiveIntensity=dn.emis);
  dn.fog+=(dnT.fog-dn.fog)*k; scene.fog.density=dn.fog; dn.fogC.lerp(dnT.fogC,k); scene.fog.color.copy(dn.fogC);
  dn.lamp+=(dnT.lamp-dn.lamp)*k; lampArcade.intensity=dn.lamp; lampPlaza.intensity=dn.lamp*0.8;
  dn.wet+=(dnT.wet-dn.wet)*k;
  plazaMat.roughness = 1.0 - dn.wet*0.45; plazaMat.envMapIntensity = 0.22 + dn.wet*0.6;
}

// adaptive quality — hold ~60fps: first scale render resolution, then drop bloom
let q_pr = LOW ? 1 : 1.5; const q_floor = LOW ? 0.6 : 0.75, q_cap = LOW ? 1 : 1.5;
let q_bloom = !LOW, q_fA = 0, q_ft = 0;
function q_setPR(p){ q_pr = p; renderer.setPixelRatio(p); renderer.setSize(curW||innerWidth, curH||innerHeight); composer.setSize(curW||innerWidth, curH||innerHeight); }
function render(){ if (q_bloom) composer.render(); else renderer.render(scene, camera); }
function animate(){
  requestAnimationFrame(animate); if (window.__freeze) return;
  resize();
  const dt = Math.min(clock.getDelta(), 0.05); update(dt);
  q_fA++; q_ft += dt;
  if (q_ft >= 0.6){ const fps = q_fA/q_ft; q_fA = 0; q_ft = 0;
    if (fps < 48){ if (q_pr > q_floor) q_setPR(Math.max(q_floor, q_pr-0.2)); else if (q_bloom) q_bloom = false; }
    else if (fps > 58){ if (!q_bloom && !LOW) q_bloom = true; else if (q_pr < q_cap) q_setPR(Math.min(q_cap, q_pr+0.1)); }
  }
  render();
}
window.__kick = animate; animate();

var curW, curH;
function resize(){ const w=innerWidth||document.documentElement.clientWidth||1280, h=innerHeight||document.documentElement.clientHeight||720; if(w===curW&&h===curH) return; curW=w; curH=h; camera.aspect=w/h; camera.updateProjectionMatrix(); renderer.setSize(w,h); composer.setSize(w,h); }
addEventListener('resize', resize); addEventListener('load', resize); resize();

// dev hooks
window.__dbg = { scene, camera, renderer, get player(){return player;}, get npcs(){return npcs;}, get night(){return isNight;} };
window.__setNight = (on) => { isNight=on; $('daynight').textContent=on?'☾ night':'☀ day'; nightTargets(on);
  Object.assign(dn, { sun:dnT.sun,hemi:dnT.hemi,expo:dnT.expo,bloom:dnT.bloom,emis:dnT.emis,fog:dnT.fog,wet:dnT.wet,lamp:dnT.lamp }); dn.fogC.copy(dnT.fogC);
  sun.intensity=dn.sun; hemi.intensity=dn.hemi; renderer.toneMappingExposure=dn.expo; bloom.strength=dn.bloom;
  signMats.forEach(m=>m.emissiveIntensity=dn.emis); scene.fog.density=dn.fog; scene.fog.color.copy(dn.fogC);
  lampArcade.intensity=dn.lamp; lampPlaza.intensity=dn.lamp*0.8;
  plazaMat.roughness=1.0-dn.wet*0.45; plazaMat.envMapIntensity=0.22+dn.wet*0.6;
  applyEnv(); render(); };
console.log('[sang-town] booted (reworked: deglaze + wet-stone + smooth move + talking npcs)');
