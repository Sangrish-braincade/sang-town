# sang-town — Game Design Document

> Produced by a multi-agent design pass (6 design lenses → synthesis → adversarial critique → revise), 2026-06-23.

I've verified the ground truth. The critique is accurate: 407-line monolith, Reflector at L116-121, blanket `envMapIntensity=0.6` at L126, ACES@1.0 at L59-60, bloom threshold 0.85 at L73, radial plot grid at L148-151, random-walk NPCs at L335-346, `qlist` mirroring the 5 sections, day/night targets at L286-292/L399-405. Note: the day/night targets are actually at L286-292 and L399-405 (the doc says L291-292/L397-403 and L286-292; both roughly correct). Now I'll write the final revised plan.

# SANG-TOWN — Game Design Document (v2, post-critique)

*A small, hand-built creative block you walk. The portfolio is two addresses on the street, not the street itself. The look is the product; the town is the frame.*

---

## 1. Concept & Pillars

**sang-town is a compact, over-detailed corner of a dev district you explore in third person.** You spawn on a wet-stone plaza on a rain-just-stopped morning. A couple of buildings on the block *are* Sang's work — you walk in and something happens, you don't read a panel. You can flip to night and the block goes neon-on-wet-stone. A few hidden floppy-disks reward poking around. A serious reviewer taps "read as a page →" (top-right) and is gone in two seconds; everyone else gets a small, good-looking world and infers the builder from how well it's built.

The honest scope: **~2 dressed hero buildings + a dressed plaza + Kenney filler/skyline.** Most "buildings" are filler that already exist in the current build — they stay filler. The win condition is *"this looks and feels good in 90 seconds on a phone,"* not *"this is a city."*

**Pillars (ranked — when they conflict, the higher one wins):**
1. **The look is the product.** The single thing that must land is matte-day / subtle-wet-night with no glaze, on a real phone. Everything else is negotiable scope; this is not.
2. **Game first, résumé inside — and the numbers are *found*, not *recited*.** A building either *does something* on entry or it's pure dressing. CV metrics live as graffiti, stickers, and objects you discover — never as bullet points in a speech bubble.
3. **Compact & over-detailed beats large & empty.** Honour this literally: a *small* dressed area, not a 180m island specced as "compact."
4. **Restraint is the flex.** Subtle wet-shimmer, never a mirror. Matte where it should be matte.
5. **Curiosity is the only goal.** No checklist UI. The floppy-disks are the game; the geography is the navigation.

---

## 2. The World Map

**Cut the figure-8 grid and the 180m island. Keep the current radial layout** (`main.js:148-151`) — it already works, and the street-grid rebuild was the single biggest hidden cost in v1.

A **compact plaza-and-ring**: a dressed central plaza (the hero surface), two real hero buildings on the nearest plots, and the existing Kenney boxes as filler around the ring, fading into a fogged skyline. Soft edge stays the existing `br > 95` clamp — no sea-wall, no water plane (cut; both were dressing for an island we no longer build).

```
                 ░░░ FOG / SKYLINE SILHOUETTE (instanced Kenney, ~5 draws) ░░░
        ┌───────────────────────────────────────────────────┐
        │   [filler]      [filler]        [filler]            │
        │                                                     │
        │   ┌──────────┐    ◎ PLAZA ◎    ┌──────────┐         │
        │   │ THE LAB  │   wet-stone +   │ THE      │         │
        │   │ (research│   "sang" host   │ ARCADE   │         │
        │   │  hero)   │   beacon        │ (Aicade  │         │
        │   └──────────┘   + mailbox     │  hero)   │         │
        │                  + cowsay alley └──────────┘         │
        │   [filler]      [filler]        [filler]            │
        └───────────────────────────────────────────────────┘
                 ░░░ FOG / SKYLINE SILHOUETTE ░░░
```

| Zone | Role | Contents |
|---|---|---|
| **HUB — Plaza** | spawn + host | Wet-stone floor (the hero surface), fountain, the **"sang" host beacon** (the `about` station, you walk into it), the **mailbox** (`contact`), benches/planters. One bobbing beacon sits **dead-center in the spawn view**. |
| **THE ARCADE** *(hero #1)* | Aicade | A prebuilt `Building_*` re-skinned; lit storefront; cabinet out front that *does something* on interact (see §3). Cowsay/konami live here. |
| **THE LAB** *(hero #2)* | research | A prebuilt `Building_*` re-skinned institutional; chalkboard prop; "IF 9.20" as graffiti, arXiv title scrawled on the board. |
| **Filler ring** | ambient city | The existing Kenney boxes, demoted to dressing. A few get neon signage for the night payoff. **No portfolio content.** |
| **Skyline** | depth | Instanced Kenney `skyscraper-*` / `low-detail-*` in fog. ~5 draw calls. |
| **Back alley** *(secret)* | easter egg | Behind the Arcade — a terminal NPC; typing `cowsay` pops an ASCII cow over the plaza. |

**Cut from v1:** sea-wall + water plane, lighthouse, Research Row / Old Town / The Strip / The Wharf as distinct zones, the rooftop observatory secret, the recognition wall as a built structure (recognition becomes stickers/posters on the two hero buildings instead). Zeno and Zaqencare are **no longer hero buildings** — they survive as dialogue lines and a sticker, not as built addresses. (Phone-booth and care-clinic builds: cut.)

---

## 3. Game Loop & Mechanics

**Verbs:** MOVE (WASD / joystick) · LOOK (drag + wheel) · APPROACH→INTERACT (E / TALK button) · TOGGLE day↔night (N / button) · DISCOVER (floppy-disks + secrets).

**The 60–120s loop:** spawn on the wet plaza, one beacon dead ahead → walk into the host beacon, get one conversational line → wander toward the Arcade, the cabinet *does a thing* → flip to night, the block transforms → spot a glowing floppy-disk, grab it, get a one-liner → find the rest / trigger cowsay → leave (or hit "read as a page →").

**Goal: the 3 floppy-disks ARE the game. No quest tracker.**
- **Kill `qlist` entirely** (`main.js:189-191`, the `<li>` list, the `q-<id>` done-marking at L277). It is the nav bar wearing a quest hat — a reviewer maps the 5 labels to portfolio sections in one glance and the illusion dies. Remove the HTML list node too.
- **3 hidden floppy-disks (💾)** are the only tracked objective, shown as a tiny `0/3 💾` counter, nothing more. Each pops one conversational easter-egg line. Grabbing all three → confetti + one toast. **One disk is only visible at night** (lit window reveals it) — that's the *only* honest justification the toggle needs (see below).

**Two micro-interactions that actually do something** (the antidote to "approach → read → tick"):
1. **The Arcade cabinet** — interact runs a fake "type a prompt → game" loop: a tiny canvas types `> a platformer about a cat` and "boots" a 3-second pixel animation. This is the one genuinely game-y idea; it carries the whole "i build machines that build games" read without a single stat in a bubble.
2. **The host beacon** — walking *into* it (not pressing E at a sign) triggers a one-line greeting + the player trail effect. Diegetic, not a panel.

Everything else (the Lab chalkboard, the mailbox) is **read-on-interact dressing** — fine, because it's two things, not five, and the copy is conversational (§5).

**Day/night — labeled honestly as a beauty toggle with one real hook.** v1 called it "a mechanic"; it isn't, and pretending wastes effort. It is *the wow moment* (matte-dry-day → wet-glow-night) plus *one* night-gated disk. That's the whole contract. We do **not** half-build a deep time mechanic. (Critique fix A2, option (a) + a thin slice of (b).)

**NPCs — no ambient pathing.** Cut the random-walk (`main.js:222-235`, `333-346`). Replace with **~6 fixed, posed NPCs**: two seated on benches (baked `idle`), one leaning by the Arcade door, a cluster of two "talking," one researcher by the Lab. Optionally **one** NPC on a short hand-authored 3-point loop. Static-but-posed reads as "lived-in" far better than 12 wanderers and costs almost nothing. (Critique fix A3.)

**Onboarding (the first-10-seconds fix):**
- **Auto-nudge on spawn:** drift the camera/player slightly for ~1s so the screen is visibly *live*, not a frozen render.
- One bobbing beacon **dead-center in the spawn frame**, first interaction **≤5m away**.
- Ghosted `WASD / drag` line under the brand, fades on first input.
- **After 3s idle with no input:** a gentle arrow points at the nearest beacon.
- Esc / scrim / ✕ closes dialogue (already wired, L272-278).

**Controls:** keep the camera-relative movement (good, L314-329). Add `interact` one-shot (already via `tryInteract`, L281) and freeze-while-dialogue (already via `openId`, L314). **Jump is optional / cut from v1** — there's nothing to jump onto now that the rooftop is gone. Mobile: joystick (exists) + look-drag + TALK button (hint already swaps to `TAP`, L367).

---

## 4. Art Direction (the headline — do this FIRST, in isolation)

This section is **M1**. It ships on the current engine with no refactor, no grid, no hero assembly. If the look doesn't land here, nothing else matters.

**Root causes of the glaze, confirmed against the file:** (1) blanket `envMapIntensity = 0.6` on *every* mesh (`main.js:126`); (2) ACES at exposure `1.0` over a bright HDRI blows highlights (L59-60); (3) the literal `Reflector` mirror disc (`CircleGeometry(20)`, L116-121); (4) bloom threshold `0.85` low enough that lit plaster bleeds (L73); (5) buildings float on a grey void (L111-114).

### 4a. De-glaze — three highest-leverage changes, in order

**1. Per-role material tuning** — replace the blanket line (`main.js:126`). Kills ~70% of the glaze. Call inside the `enableShadows` traverse:
```js
function tuneMaterial(n){
  const m = n.material; if (!m) return;
  const name = (n.name + ' ' + (m.name||'')).toLowerCase();
  if (/glass|window/.test(name))                { m.roughness = 0.08; m.metalness = 0.0; m.envMapIntensity = 1.1; }
  else if (/metal|trim|sign|chrome/.test(name)) { m.roughness = 0.35; m.metalness = 0.9; m.envMapIntensity = 0.7; }
  else { m.roughness = Math.max(m.roughness, 0.85); m.metalness = 0.0; m.envMapIntensity = 0.18; }
}
```

**2. Tone mapping** (`main.js:59-60`). Switch ACES → **AgX**, exposure `0.85` day. **A/B this against ACES@0.75 with a day+night screenshot before committing** (Open Decision 4) — AgX shifts color feel and the call should be made by eye.
```js
renderer.toneMapping = THREE.AgXToneMapping;  // A/B vs ACES@0.75/0.42
renderer.toneMappingExposure = 0.85;
```

**3. Wet-stone floor** replacing the Reflector (§4b).

**Bloom** (`main.js:73`): `strength 0.35→0.22`, `threshold 0.85→0.92`. Night strength `0.9` (was 1.15 — AgX needs less). Keep `toneMapped:false` on signage. *(SelectiveBloom migration: cut from v1 — `UnrealBloomPass` with a high threshold is good enough; revisit only if the sky blooms.)*

**Matte vs glossy cheat-sheet:**

| Surface | roughness | metalness | envMapIntensity |
|---|---|---|---|
| Brick / concrete / plaster / roof | 0.85–1.0 | 0.0 | **0.18** |
| Painted wood / awnings / props | 0.7 | 0.0 | 0.25 |
| Window glass | 0.08 | 0.0 | 1.1 |
| Metal trim / railings | 0.35 | 0.9 | 0.7 |
| Emissive signage / beacons | 1.0 | 0.0 | 0 (`toneMapped:false`) |
| Plaza stone — DAY | 0.95 | 0.0 | 0.25 |
| Plaza stone — NIGHT wet | 0.50 (mask) | 0.0 | 0.6 + clearcoat |

### 4b. Wet-stone floor — built in two stages, day first

Delete the `Reflector` import (`main.js:5`) and block (L116-121), and the grey ground (L111-114). No render-target mirror — clearcoat + the PMREM environment gives the shimmer cheaply and degrades on mobile (where Reflector was already off).

**STAGE A — ship the matte-day floor and call it done.** This alone satisfies Pillar 1.
```js
const plaza = new THREE.Mesh(
  new THREE.CircleGeometry(22, 96),
  new THREE.MeshPhysicalMaterial({
    map: albedo, normalMap: normal, roughnessMap: rough,
    roughness: 0.95, metalness: 0.0,
    clearcoat: 0.0, clearcoatRoughness: 0.25, clearcoatNormalMap: normal,
    envMapIntensity: 0.25,
  }));
plaza.rotation.x = -Math.PI/2; plaza.position.y = 0.01; plaza.receiveShadow = true; scene.add(plaza);
```
Textures into `public/assets/textures/plaza/`, `repeat = 12`, anisotropy 8, albedo `SRGBColorSpace`.

**STAGE B — night wet-shimmer is a separate, time-boxed experiment with a hard out.** Drive a `wet` factor (0→1, tied to night) into the existing day/night lerp (`main.js:371-378`):
```js
plaza.material.clearcoat       = wet * 0.85;
plaza.material.roughness       = 0.95 - wet * 0.45;
plaza.material.envMapIntensity = 0.25 + wet * 0.45;
// night only, tiny offset scroll — do NOT move geometry:
plaza.material.clearcoatNormalMap.offset.x = (t * 0.003) % 1;
plaza.material.clearcoatNormalMap.offset.y = (t * 0.0015) % 1;
```
**The good version REQUIRES the `onBeforeCompile` puddle mask** — multiply `roughnessFactor` by `(1.0 - mask.r * wet)` so only masked low spots catch neon and dry stone stays matte. Without it you get a uniform sheen = glaze = the thing we're killing. So: **commit to the GLSL injection, or don't ship Stage B.**

> **Hard rule (critique fix D11):** Stage B is boxed to ~2 hours *on a real phone*. If it reads as wet-plastic-fake, ship **dry stone + higher `envMapIntensity` at night (~0.6) + the brand point-lights** and move on. The hero surface must never block the build.

`Prop_Drain`/manhole props near the masked puddles sell "it rained."

### 4c. Brand palette as light, not paint

Ink `#0F0E0C` for matte ground beyond the plaza (replace `0x2a2c30`, L113). Cream `#EDE3D2` for plaza light pools + HUD. **Vermillion `#FF5B22` reserved for Sang's two places** — the host beacon, the Arcade door light, the player trail. The city stays neutral so the accent *means* "this is Sang's." Don't tint brick/glass; palette lives in point lights, emissive signs, fog, UI.

### 4d. Lighting & mood (re-baselined for AgX, edit the `dnTarget` blocks at L286-292 and L399-405)

- **Day:** sun `2.6` warm `0xfff2d8`, hemi `0.7` (lower than current `0.8` so shadows have shape), exposure `0.85`, bloom `0.18`, fog `0xcfe0d6` density `0.006`.
- **Night:** sun `0.12` cool `0xaecbff`, hemi `0.22`, exposure `0.45`, bloom `0.9` threshold `0.9`, fog `0x0a0c14` density `0.012`. Mood from emissive signage + wet plaza, not directional light. Sign `emissiveIntensity` night ~`2.6` (already L291).
- **Point lights:** 2 only — vermillion over the Arcade door, cream at plaza center — intensity `0` day → `~3` night, distance `12`. **Mirror these into `__setNight`** (L399-405) or the headless QA harness lies.

---

## 5. Portfolio-as-World Mapping

Content becomes a *thing you do or find* — and the **numbers are found, not recited** (critique fix B4). The dialogue is conversational; the metrics are environmental. Rewrite `STATIONS[].body` (`main.js:18-44`) accordingly. Only two stations remain as built addresses; the rest collapse into the host line and dressing.

| Content | In-world form | Experience |
|---|---|---|
| **Aicade** | **The Arcade** (hero #1) | Cabinet runs the fake "prompt → game" loop. Spoken line is conversational: *"yeah — the arcade. it builds games. go poke the cabinet."* The **"3,000 / 7→20"** numbers appear as a **flyer taped to the cabinet**, not in the bubble. |
| **Research** | **The Lab** (hero #2) | Chalkboard + arXiv link. **"IF 9.20"** is **graffiti on the brick**; the paper title is **scrawled on the board**. Spoken line: *"simpler beats clever. it's on the board."* |
| **Pulstra** | **host dialogue + desk objects** | Not a building. One host line: *"i rent the brain out — three clients right now."* Client logos as small props near the host beacon. |
| **Zeno** | **host dialogue + a sticker** | Not a building. Host line: *"zeno remembers you so you don't have to."* **"top 300 / 20k vibecon"** as a **sticker**, not spoken. |
| **Zaqencare** | **one sticker** | Not a building. *"live in canada, keeping grandparents on schedule"* as a small poster on a filler shopfront. |
| **Now / this week** | **a lit notice-board prop** on the plaza | Glowing list, read-on-approach. No rooftop. |
| **Contact** | **The Mailbox** 📮 | Interact → email/github/x/linkedin as letters (current links, L38-43). |
| **Recognition** (Samsung Prism, TEDx, vibecon 13 vulns) | **dressing only** | TEDx poster, "13 bugs" sticker on the Arcade, Samsung billboard on a filler tower. Found, never listed. |
| **Persona / "mild menace"** | **cowsay + konami + the player trail** | The builder read comes from the world being well-built, not from claims. |
| **Serious-reviewer escape** | **top-right "read as a page →" link ONLY** | The in-plaza kiosk is **cut** (critique fix B6) — one escape hatch is enough; two instances of "this is really a résumé" inside the game is one too many. |

---

## 6. Asset Utilisation

| Asset pack | Role |
|---|---|
| **Quaternius Downtown MegaKit** (incl. **3 prebuilt `Building_*`**) | **Use the 3 prebuilt `Building_*` as the two heroes** (re-skin/sign). **Do NOT hand-assemble from 76 Brick + 30 Cornice + 26 Roof modules** — that's modeling-by-trial with no viewport, ~1 day/building, highest-variance task in the plan (critique fix D9). Borrow `Prop_Drain`/`ManholeCover`/`Planter`/`Bollard` for plaza clutter. Its `T_Concrete_Asphalt` PBR is a fallback for the wet floor. |
| **Kenney City Commercial** | Stays as the **filler ring** (already the current buildings, L145-146) + **instanced skyline** in fog + shopfront dressing. |
| **Kenney Mini Characters** (rigged, baked clips) | **Player + the ~6 posed NPCs** (already wired, L209-235). Aid/wheelchair props → one Zaqencare poster shopfront if used at all. |
| **Quaternius Universal Base / Animation Library** | **Cut from the written plan entirely** (critique fix D10). The Superhero rig is name-incompatible with the anim library; runtime retarget is fragile and the offline Blender bake is a rabbit hole for a cosmetically-nicer player nobody asked for. **The Kenney player is the player. Full stop.** |
| **Poly Haven HDRIs** (`day.hdr` / `night.hdr`) | Kept (L98-108), but `envMapIntensity` lowered + roughness clamped to kill sky-glaze. Pre-shrink to ~2k/webp. |
| **three-mesh-bvh** (installed, unused) | **Cut.** Circle/cylinder colliders (already L322-323) are fine at this scale. |
| **pmndrs/postprocessing** | **Cut from v1.** Stay on `UnrealBloomPass` with high threshold. |

**Still to download:** one **CC0 paving PBR set** for the floor — `curl -L -o stone.zip "https://ambientcg.com/get?file=PavingStones092_1K-JPG.zip"` → `public/assets/textures/plaza/`. A 256×256 puddle mask can be generated, not downloaded. *(Or reuse staged Quaternius `T_Concrete_Asphalt` — nothing strictly blocks.)*

---

## 7. Technical Plan & Phased Roadmap

**Do the look first, refactor never (until forced).** The critique is right: a 407-line file does not need `core/world/player/input/ui/config` + an EventTarget bus before the game is known. Splitting first = a week of work where the demo looks identical, then a re-split once content forces new shapes. **Split opportunistically, only as files grow.** (Critique fix C8.)

**What we actually need, not a framework:**
- **A loader, not an AssetManager.** Add `DRACOLoader('/draco/')` + `KTX2Loader('/basis/').detectSupport(renderer)` to the existing `GLTFLoader` (L92). That's it. No architecture.
- **Collision:** keep the existing circle colliders (L322-324). No BVH.
- **Optimize pipeline:** `npx @gltf-transform/cli optimize in.glb out.glb --texture-compress ktx2 --compress draco` for the two static heroes; **Meshopt for characters** (Draco kills anim data). Copy decoders to `public/draco/` + `public/basis/`.

**Perf / first-paint (the real bounce risk — critique fix E13):**
- **Stream, don't block.** Spawn on the dressed plaza with HDRI + floor + nearest beacon loaded in <2s; pop the filler ring + skyline in after. The current build blocks on `manager.onLoad` (L91) — change to a two-phase load.
- Static **hero image behind the loader** (`preview-day.jpg` exists) buys patience.
- DPR cap (present, L55); `InstancedMesh` for skyline + repeated props; pause loop on `visibilitychange`; freeze far NPC mixers; keep `__setNight`/`__dbg` QA (L396-406) and **mirror every new night value into it**.

**Measure before you trust targets (critique fix D12):** the 256MB city + 147MB char raw source compressing to <10MB is a *hope* until proven. **Spike the optimize pipeline on ONE hero + ONE character and measure actual output before committing.** Targets to validate, not assert: initial interactive <8-10MB, each hero GLB <3MB, each character <600KB, <150 draws desktop / <80 mobile.

**Roadmap — honestly sized, look-first:**

1. **M1 — The look fix (DO FIRST, current engine, no refactor).** Delete Reflector + grey ground; per-role `tuneMaterial`; AgX-vs-ACES A/B; lower bloom; **Stage-A matte-day wet-stone floor**; brand point-lights; re-baseline day/night targets *and* `__setNight`. *Exit: matte by day, no glaze, looks good on a real phone.* **This is the milestone that de-risks everything.**
2. **M2 — Night shimmer (time-boxed) + two heroes.** Stage-B wet-shimmer with the `onBeforeCompile` mask, with the 2-hour hard-out to dry-stone. Drop in the 2 prebuilt `Building_*` heroes (re-skin, sign, place on nearest plots). Demote Kenney to filler. Wire Draco/KTX2/Meshopt loaders; run the compression spike + measure. *Exit: two real-feeling addresses, night looks deliberate, size measured.*
3. **M3 — Game feel + content.** Conversational `STATIONS` rewrite (numbers → graffiti/stickers/flyers); the Arcade cabinet micro-interaction; mailbox + notice-board; **kill `qlist`**, add the 3 floppy-disks + `0/3` counter + payoff; cowsay + konami + player trail; ~6 posed NPCs; spawn auto-nudge + idle arrow + dead-center beacon; two-phase streaming load. *Exit: reads as a game, curiosity rewarded, no résumé UI.*
4. **M4 — Polish + ship.** Mobile QA on a real phone (matte-day mobile view must be attractive on its own — critique fix E15), Lighthouse/draw-call audit, create `page.html` + wire the top-right link, redeploy to Amplify (`baseDirectory: dist`, ship `public/draco/` + `public/basis/`). *Exit: shipped.*

*(Module split happens inside whichever milestone first makes `main.js` painful — not as its own milestone.)*

**This is ~2–3 weekends, not 5 tidy "M"s.** The honest v1 (M1 + the two heroes + better copy + cowsay) hits ~80% of the value and is reachable in about a week.

---

## 8. Open Decisions for Sang

1. **Stone texture source:** curl ambientCG `PavingStones092` (recommend — best grout-line read for the wet effect), or reuse staged Quaternius `T_Concrete_Asphalt`?
2. **`read as a page →` target:** `page.html` does **not exist** in the repo (verified) — the link points at a stale Amplify URL. Drop the local copy from `C:\Users\sang\Claude\sang-portfolio\page.html` into `public/`, or point elsewhere?
3. **Two heroes — confirm Aicade + the Lab** are the right two to build, with Zeno/Zaqencare/Pulstra demoted to dialogue + stickers? (If you'd rather Aicade + Zeno, swap the Lab out — but keep it to two.)
4. **Tone mapping:** approve the AgX-vs-ACES screenshot A/B as a *blocking* step in M1 before committing the color feel?
5. **Night shimmer scope:** OK with the hard rule — Stage B is 2 hours boxed, and if it looks fake we ship dry-stone-with-night-envMap and never revisit?

---

## What changed after critique

- **Killed the quest tracker (`qlist`).** It mapped 1:1 to portfolio sections — the résumé reasserting itself as UI. The 3 floppy-disks are now the *only* goal; geography is the navigation. (Fixes A1, B5.)
- **Day/night relabeled honestly** as a beauty toggle + one night-gated disk, not "a mechanic." Stopped pretending; stopped half-building a deeper time system. (Fix A2.)
- **NPCs: ambient pathing cut** for ~6 fixed posed NPCs (+ optional one short loop). Brownian drift never reads as "lived-in." (Fix A3.)
- **Numbers are now found, not recited** — CV metrics moved to graffiti/stickers/flyers; dialogue made conversational. (Fix B4.)
- **In-plaza "read as a page" kiosk cut** — top-right link only. (Fix B6.)
- **Scope slashed:** 6 heroes → **2**; figure-8 grid → **keep current radial**; cut sea-wall/water/lighthouse, rooftop secret, recognition wall, the phone-booth/care-clinic builds, jump, three-mesh-bvh, the `core/world/...` module split + EventTarget bus, SelectiveBloom, the AssetManager-as-framework. Zeno/Zaqencare/Pulstra demoted from buildings to dialogue+dressing. (Fixes C7, C8.)
- **Hero-building assembly de-risked:** use the **3 prebuilt `Building_*`** instead of hand-stacking 153 modules. Deletes the highest-variance task. (Fix D9.)
- **Superhero player removed from the written plan entirely** so no one attempts the rig-retarget trap. Kenney player, full stop. (Fix D10.)
- **Wet-stone split into Stage A (matte day, ships) + Stage B (night shimmer, 2-hour time-box with a dry-stone fallback)**, and the `onBeforeCompile` puddle mask is now mandatory-or-cut, not "optional." (Fix D11.)
- **Perf targets demoted to "measure-first."** Compression pipeline must be spiked on one hero + one character before the asset plan is trusted. (Fix D12.)
- **First-paint streaming + spawn auto-nudge + dead-center beacon + idle arrow added** as the explicit first-10-seconds bounce defense; mobile matte-day promoted to a primary view, not a downgrade. (Fixes E13, E14, E15.)
- **Roadmap reordered: the look (M1) ships first, in isolation, on the current engine** — the one thing the critique called non-negotiable.

---

## First milestone (M1) = the smallest genuinely-fun playable slice

**One beautiful matte plaza with one well-lit building, looking right on a real phone — walkable, with the day↔night flip as the payoff.**

Concretely, M1 is *done* when, on the **current 407-line engine with zero refactor**, a phone visitor can:
1. spawn on the **wet-stone plaza** (Stage-A matte-day floor, Reflector + grey ground deleted),
2. **walk** around it in third person (existing movement, existing colliders),
3. see **no glaze** — per-role `tuneMaterial` replacing the blanket `envMapIntensity=0.6`, AgX-or-ACES chosen by A/B screenshot, bloom threshold raised,
4. **flip to night** (N / button) and watch the block go warm-matte-morning → cool-with-glowing-signs, with the two brand point-lights coming up,
5. all of it **interactive in under 2 seconds** behind the existing `preview-day.jpg` loader.

No street grid, no hero assembly, no new content, no quest, no NPCs-rerouted, no module split. If this slice looks and feels good on a real phone, the project is worth continuing. If it doesn't, no amount of town fixes it — which is exactly why it goes first.

---

**Key files:** all of world build / art / day-night / stations / characters live in `C:\Users\sang\Claude\sang-town\src\main.js`. Verified line refs: Reflector import **L5** + block **L116–121** (delete); blanket glaze **L126** (replace with `tuneMaterial`); tone map **L59–60**; bloom **L73**; grey ground **L111–114** (delete); radial plots **L148–151** (keep); `qlist` build **L189–191** + done-marking **L277** (delete); random-walk NPCs **L222–235** + **L333–346** (replace with posed); day/night targets **L286–292** and **L399–405**; `__setNight`/`__dbg` QA **L396–406**. New textures → `C:\Users\sang\Claude\sang-town\public\assets\textures\plaza\`. Assets root `C:\Users\sang\Claude\sang-town\public\assets\{city,characters,hdri}`. `page.html` must be created (absent); local copy at `C:\Users\sang\Claude\sang-portfolio\page.html`.

---

# Appendix: Full critique (pre-revision)

Now I have the ground truth. The current build is a 407-line monolith (the doc says it, confirmed), buildings are scaled-up Kenney boxes on a radial grid, NPCs random-walk, stations are signs-on-boxes. The doc proposes turning this into a hand-built explorable district. Here's my adversarial review.

---

# Skeptical review: SANG-TOWN GDD

## A. What will NOT be fun / feels empty or choresome

**1. "Find everyone" is a checklist with no friction — it's a chore wearing a quest hat.**
Walk to 5 beacons, press E, read 2 lines, watch a checkmark. There is zero decision-making, zero risk, zero skill. The doc admits goals must be "light, never chores" but the loop *is* the chore: the reward for visiting a beacon is text. A game designer would not ship "approach → read → tick."
**Fix:** Make at least the buildings *do something* on entry, not print copy. The Aicade cabinet "type a prompt → game" mock is the one genuinely game-y idea in the doc — lean into 2-3 of those micro-interactions and cut the rest to pure dressing. Better: drop the explicit quest tracker entirely and let the 3 floppy-disks be the only goal. A visible checklist of "businesses visited" is the resume reasserting itself as a UI.

**2. The day/night toggle has one (1) reason to exist and the doc knows it.**
"At least one collectible is only visible at night" is a fig leaf. A button you press once to see the pretty version is chrome, not a mechanic, no matter how the doc labels it. Nothing about traversal, the collectibles, or the secrets actually *requires* reasoning about time.
**Fix:** Either (a) accept it's a beauty toggle and stop calling it a mechanic (honest, fine), or (b) gate 2-3 collectibles + the rooftop-view payoff behind night so flipping is a real tool you reach for repeatedly. Pick (a) for scope. Don't half-build (b).

**3. NPCs "going somewhere" will read as aimless drift, same as today.**
Current NPCs random-walk to random radial points. The doc says "re-route onto sidewalk waypoints with destinations (café, doors)" — but waypoint pathing that *reads* as intentional (queue at café, enter a door, sit) is real work and the doc hand-waves it. Half-done, it looks exactly like the current Brownian motion and the "lived-in" pillar collapses.
**Fix:** Cut ambient pathing. Place ~6 NPCs in *fixed, posed* arrangements (seated at café via the baked idle, leaning by a door, a cluster talking) plus 2-3 on a single short hand-authored loop. Static-but-posed reads as "lived-in" far better than 12 wanderers, and costs almost nothing.

## B. Where it still reads as a RESUME, not a game

**4. The copy is still resume bullets in a lowercase hoodie.**
"3,000 of them. team went 7 → 20." "top 300 of 20,000 at vibecon." "IF 9.20." These are CV metrics with the capitalization removed. A visitor who wanted a game is now reading achievement stats in a speech bubble — the exact failure mode pillar 1 warns against. Making it diegetic doesn't help if the *content* is still "here are my numbers."
**Fix:** The number-dropping should be *findable*, not *told*. Put "IF 9.20" as graffiti on the lab wall, "13 bugs" as a sticker — the doc already does this for Recognition. Extend it to ALL of them and make the spoken dialogue actually conversational ("yeah, the arcade. it builds games. go try the cabinet."). If the dialogue exists to recite accomplishments, it's a panel with a 3D model in front of it.

**5. The quest tracker literally re-themes the resume sections.**
`qlist` = about/work/research/now/contact → "businesses visited." You renamed the nav bar. A reviewer sees five labeled destinations mapping 1:1 to portfolio sections and the illusion is gone in one glance.
**Fix:** Remove the named tracker. Let the world's geography be the navigation.

**6. The "read as a page →" kiosk is an admission the game might fail its audience.**
Defensible as a UX escape hatch — but a kiosk *in the plaza* plus a top-right link is two instances of "this is actually a resume" planted in your game world. One is enough.
**Fix:** Keep only the unobtrusive top-right link. Kill the in-world kiosk.

## C. Over-scoped for a solo build / won't ship

**7. The milestone stack is 3-4 weekends of work sold as five tidy "M"s.** Realistic effort, given the current 407-line monolith:
- M1 full module split + event bus + jump = a real refactor with no visible payoff (risky to do first — see below).
- M3 alone — assemble 4-6 hero buildings from 153 modules, lay a street grid, build an AssetManager with Draco+KTX2+Meshopt, integrate three-mesh-bvh capsule collision, NPC routing — is **the entire project**, smuggled into one milestone.
- M4 adds rooftop, phone booth, mailbox interactions, 3 collectibles, konami/cowsay/cat, café audio+particles, camera push-in, AND a Blender retarget spike.

This is a 6-8 week solo project minimum, and that's if nothing fights back. The Quaternius LEGO assembly (item D) will eat far more than budgeted.
**Fix — ruthless cut to a shippable v1:**
- Keep the **current** radial layout. Drop the figure-8 grid. (The grid is the single biggest hidden cost — see D.)
- Ship **2** real hero buildings (Aicade + the Lab), not 6. The rest stay Kenney filler — which is what they already are.
- Cut: rooftop secret, three-mesh-bvh (circle colliders are fine for this scale), AssetManager-as-framework (you need *a loader with Draco/KTX2*, not an architecture), café particles/audio, Superhero player.
- The honest v1 = current engine + de-glaze (M2) + 2 dressed hero buildings + better copy + cowsay/konami. That ships in a week and hits 80% of the value.

**8. The module split (M1 first) is over-engineering with negative early ROI.**
A 407-line file does not need `core/world/player/input/ui/config` + an EventTarget bus before you've decided what the game *is*. Doing the big refactor first means a week of work where the demo looks identical, and you'll refactor again once content forces new shapes.
**Fix:** Do M2 (the look fix) FIRST — it's the biggest visible win on the smallest code and needs almost no restructuring. Split modules *opportunistically* as files actually grow. The "green-checkpoint migration, zero behavior change" is a tax you pay before you've earned it.

## D. Riskiest technical assumptions

**9. Quaternius LEGO building assembly is the project's iceberg.** "Assembled LEGO-style (ground floor + brick courses + cornice cap + roof)" from 76 Brick + 30 Cornice + 26 Roof + 22 Trim modules — by hand, per building, with correct snapping/UV continuity — is *modeling work*, not coding. Doing it in code (`gltf-transform merge`) gives you a merged mesh but you still have to author every transform by trial-and-error with no viewport. Doing it in Blender means a Blender pipeline you don't have set up. Either way, one good-looking hero building is easily a full day; 6 is a week of fiddly placement that produces buildings that may still look like stacked bricks.
**Fix:** Use the **3 prebuilt `Building_*`** GLBs as your heroes — they're already assembled by the artist. Re-skin/sign them. Only hand-assemble if a prebuilt genuinely can't read as "the Arcade." This deletes the highest-variance task in the plan.

**10. Player-animation mismatch — the doc gets this right, then reintroduces the risk as "M4 stretch."** Correct call: ship on Kenney Mini (already wired, baked clips), Superhero is a name-incompatible rig. But listing the bone-rename script (`DEF-neck→neck_01`) in the doc invites someone to attempt it. Runtime retarget is fragile; even the offline bake is a Blender/Mixamo rabbit hole for a *cosmetically nicer player nobody asked for*.
**Fix:** Cut Superhero-as-player entirely from the written plan. The Kenney player is fine. Don't leave a tempting trap in the doc.

**11. Wet-stone shimmer — the subtlety is the trap, and the GLSL fallback is hand-waved.** The plan is mostly sound (clearcoat + PMREM, no Reflector — good, Reflector is already mobile-disabled). Real risks:
- `clearcoatNormalMap.offset` animation: scrolling a normal map's offset every frame works, but at "speed 0.001–0.004" it's either invisible or, if the puddle mask is uniform, a sheet of moving plastic — the exact "mirror/glaze" you're killing. The line between "ever so slightly shimmers" and "looks wet-plastic-fake" is narrow and only findable by eye, on real hardware.
- The puddle mask via `onBeforeCompile` multiplying `roughnessFactor` is the part that actually makes it look real, and it's flagged "if avoiding GLSL, accept near-uniform sheen." Near-uniform sheen on stone = glaze. So the good version *requires* the GLSL shader injection the doc treats as optional.
- `MeshPhysicalMaterial` + clearcoat + per-frame offset writes on mobile is a real perf cost on the thing tier-1 phones choke on.
**Fix:** Build the day-matte version first and ship that as the floor. Treat night wet-shimmer as a *separate, time-boxed* experiment with a hard "if it looks fake in 2 hours, ship dry stone with higher envMapIntensity at night and move on." Don't let the hero surface block the build. And commit to the `onBeforeCompile` mask — without it the effect isn't worth doing.

**12. Perf/mobile targets are asserted, not derived.** "<150 draw calls desktop / <80 mobile," "initial download <8-10MB" — from a **256MB city + 147MB char + 12MB HDRI** raw source. The whole project rests on the gltf-transform optimize pipeline hitting ~30-40x compression while keeping animated characters intact (Meshopt, since Draco kills anim — doc knows this). That pipeline is unproven here and KTX2/Basis decoder wiring is fiddly. If hero buildings are merged statics with baked textures you're probably fine; if you keep 12 NPCs with skinned meshes + physical-material floor + bloom on a mid phone, 80 draw calls won't save you from shader cost.
**Fix:** Stand up the optimize pipeline on ONE building + ONE character as a spike *before* committing to the asset plan. Measure actual output size. Until then, treat 8-10MB as a hope, not a target.

## E. First-10-seconds bounce risks

**13. Load time is the #1 bounce risk and it's invisible in the doc.** A WebGL town that needs to pull multi-MB GLBs + two HDRIs before anything moves = a progress bar, which is where curious visitors leave. The current build loads everything before `manager.onLoad`. Even optimized, first paint of a 3D world is slow vs. a webpage.
**Fix:** Spawn the player on a dressed plaza with the HDRI + ground + nearest building loaded, then stream the rest. Show an *interactive* scene in <2s even if the far city is still popping in. A static hero image behind the loader (you already have `preview-day.jpg`) buys patience.

**14. "What do I do?" — third-person WASD with no goal on screen.** A visitor lands, sees a guy on stone, a fountain, some boxes. The "ghosted WASD line that fades after first input" assumes they know to give input. Many won't; they'll see a static screen and leave. The nearest-beacon-is-the-tutorial only works if a beacon is *immediately* visible and obviously a destination.
**Fix:** Auto-nudge the camera/player slightly on spawn so it's clearly live, keep ONE bobbing beacon dead-center in the spawn view, and make the first interaction trivially reachable (5m away). Consider a 2s idle → gentle arrow toward the beacon.

**15. Mobile is where most "curious visitor" traffic actually is, and it's the weakest spec.** Joystick + right-half look-drag + TALK button + no wet shimmer + reduced NPCs = a degraded experience on the platform most likely to receive a link tap. If it's janky on a phone, the bounce is instant.
**Fix:** Design the mobile experience as primary for the first-impression path, not a downgrade. If wet-stone and bloom are desktop-only, make sure the *matte day* mobile view is genuinely attractive on its own.

---

## What's GOOD (so the cuts are credible)
- De-glaze diagnosis is correct and specific: blanket `envMapIntensity=0.6` (line 126), ACES@1.0 over puresky, the literal Reflector disc (lines 118-121), low bloom threshold. The per-role `tuneMaterial` fix is the right move and the single highest-ROI change in the doc.
- Killing Reflector for clearcoat+PMREM is correct (Reflector's a render-target you don't need; already mobile-disabled).
- Ship-on-Kenney-player decision is right.
- "Compact & over-detailed beats large & empty" is the correct pillar — the problem is the doc then specs 20-25 buildings and a 180m island, contradicting its own pillar.

---

## The single most important thing to get right

**Do the de-glaze (M2) first, in isolation, on the existing engine — and ship that as a visible win before touching architecture, the street grid, or hero-building assembly.** It is the smallest code, the biggest visual payoff, the thing the art feedback actually asked for, and it de-risks everything: if the matte-day / subtle-night look doesn't land, no amount of city-building or module-splitting matters. Everything else in the doc is negotiable scope; the look is not. Get one beautiful matte plaza with one well-lit building looking right on a real phone, *then* decide how much town to build around it.

Key file: `C:\Users\sang\Claude\sang-town\src\main.js` (delete Reflector import L5 + block L118-121; replace blanket glaze L126; tone map L59-60; bloom L73; day/night targets L286-292/L397-405).
