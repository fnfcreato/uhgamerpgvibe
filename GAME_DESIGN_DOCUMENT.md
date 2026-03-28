# Sword of Stability — Game Design Document
## HTML5 Canvas Pixel-Style RPG Adventure

---

## 1. SYSTEM LIST

### Core Systems (Priority Order)

| # | System | Description |
|---|--------|-------------|
| 1 | **Game Loop & Canvas Renderer** | requestAnimationFrame loop, canvas clearing, layered rendering, delta time |
| 2 | **Input Manager** | Keyboard state tracking, key-down/up events, context switching (exploration vs battle vs menu) |
| 3 | **Sprite & Animation System** | Spritesheet loading, frame-based animation, pixel-art scaling (nearest-neighbor) |
| 4 | **Character Controller** | Top-down movement with velocity, friction/braking, idle transitions |
| 5 | **Camera System** | Fixed top-down camera following player, smooth lerp, world-to-screen transform |
| 6 | **Tile Map & Collision** | 2D tile-based world, collision layers, area boundaries |
| 7 | **Battle Trigger System** | Proximity detection to enemies/training dummies → transition to battle scene |
| 8 | **Scene Manager** | Switch between scenes (Exploration, Battle, Dialogue, Cutscene, Menu) |
| 9 | **Turn-Based Battle Manager** | State machine: PlayerTurn → EnemyTurn → loop. Manages UI, turns, win/loss |
| 10 | **Attack Timing Bar (FIGHT)** | Undertale-style QTE: moving bar, center = max damage, scaled damage zones |
| 11 | **Sword System** | Equip up to 2 swords, each modifies bar speed/style/count. Sword stats & selection |
| 12 | **Block/Shield System (BLOCK)** | Shield durability, damage reduction formula, broken-shield fallback |
| 13 | **Dodge Mini-Game (Enemy Attacks)** | Circle-press QTE: rings approach circles, press on green = DODGED, miss = HITTED |
| 14 | **Health & Soul System** | Player HP, soul integrity (story meter), enemy HP pools |
| 15 | **Enemy AI / Attack Patterns** | Per-enemy attack animations, dodge pattern sequences, damage values |
| 16 | **Inventory System** | Swords, shields, items. Equip slots (2 sword, 1 shield) |
| 17 | **Pixel UI Framework** | Canvas-drawn buttons, menus, text boxes, HUD elements (no DOM) |
| 18 | **NPC & Dialogue System** | Interact with NPCs, typewriter text, branching dialogue, quest flags |
| 19 | **Quest / Progression System** | Main story flags, area unlocks, boss gates |
| 20 | **World & Area System** | Corrupted zones, area transitions, corruption visuals |
| 21 | **Boss Battle System** | Unique boss mechanics (1x1x1x1, John Doe, Corrupted 1x1x1x1) |
| 22 | **Infection / Soul Fade System** | Final act: timer-based soul degradation, visual corruption on player |
| 23 | **Cutscene / Ending System** | Scripted sequences: death, rebirth, funeral, epilogue text |
| 24 | **Audio Manager** | Web Audio API: BGM, SFX, volume control, crossfade between areas |
| 25 | **Save/Load System** | localStorage persistence for progress, inventory, area |

---

## 2. FILE STRUCTURE

```
stability_swordgame/
├── index.html                          -- Canvas element, script loading
├── css/
│   └── style.css                       -- Fullscreen canvas, cursor, font-face
│
├── src/
│   ├── main.js                         -- Entry point: init canvas, start game loop
│   ├── core/
│   │   ├── Game.js                     -- Game loop (update/render), delta time, canvas setup
│   │   ├── InputManager.js             -- Keyboard state, context switching (explore/battle/menu)
│   │   ├── SceneManager.js             -- Scene stack, transitions (fade, slide)
│   │   ├── Camera.js                   -- Top-down follow camera, lerp, world↔screen coords
│   │   ├── AssetLoader.js              -- Image/audio preloader with progress callback
│   │   └── AudioManager.js             -- Web Audio API: play/stop/loop BGM & SFX
│   │
│   ├── rendering/
│   │   ├── SpriteSheet.js              -- Spritesheet parser, frame extraction
│   │   ├── Animator.js                 -- Frame-based animation (play, loop, callbacks)
│   │   ├── TileRenderer.js             -- Draws tile map layers to canvas
│   │   └── PixelText.js               -- Bitmap font renderer (pixel-art text)
│   │
│   ├── world/
│   │   ├── TileMap.js                  -- Map data, collision grid, tile lookups
│   │   ├── AreaManager.js              -- Area loading, corruption effects, transitions
│   │   ├── Entity.js                   -- Base: position, size, sprite, update/render
│   │   ├── Player.js                   -- Movement with velocity + friction/braking, animation
│   │   ├── Enemy.js                    -- Overworld enemy: patrol, proximity trigger
│   │   └── NPC.js                      -- NPC: interaction zone, dialogue ID
│   │
│   ├── battle/
│   │   ├── BattleScene.js              -- Battle state machine, turn flow, UI layout
│   │   ├── BattleTransition.js         -- Screen effect entering/exiting battle
│   │   ├── AttackTimingBar.js          -- Moving bar QTE: speed, hit zones, multi-press
│   │   ├── DodgeMiniGame.js            -- Circle QTE: rings, timing, multi-circle sequences
│   │   ├── BlockSystem.js              -- Shield durability, damage reduction, break state
│   │   ├── DamageCalculator.js         -- finalDmg = base × timing × hits; dodge/block calc
│   │   ├── BattleUI.js                 -- FIGHT/BLOCK buttons, HP bars, feedback text
│   │   ├── EnemyBattle.js              -- Enemy in battle: stats, attack pattern, sprite
│   │   └── BossController.js           -- Boss phases, unique patterns, phase transitions
│   │
│   ├── ui/
│   │   ├── UIElement.js                -- Base: rect, draw, click detection (canvas-based)
│   │   ├── Button.js                   -- Pixel-art button: hover, press, callback
│   │   ├── TextBox.js                  -- Dialogue box with typewriter effect
│   │   ├── InventoryUI.js              -- Grid display, equip slots (2 sword + 1 shield)
│   │   ├── HUD.js                      -- HP bar, soul meter, equipped items overlay
│   │   └── MenuUI.js                   -- Pause menu, settings, save/load
│   │
│   ├── systems/
│   │   ├── DialogueSystem.js           -- Dialogue tree runner, flag checks, choices
│   │   ├── QuestManager.js             -- Quest flags, progression gates, completion checks
│   │   ├── InventoryManager.js         -- Add/remove items, equip/unequip, capacity
│   │   └── SaveManager.js              -- localStorage serialize/deserialize game state
│   │
│   └── data/
│       ├── swords.js                   -- Sword defs: name, damage, barSpeed, barCount, sprite
│       ├── shields.js                  -- Shield defs: name, durability, reductionPercent
│       ├── enemies.js                  -- Enemy defs: hp, damage, dodgePatterns, sprite
│       ├── bosses.js                   -- Boss defs: phases, unique attacks, dialogue
│       ├── maps.js                     -- Tile map data (or JSON loader paths)
│       ├── npcs.js                     -- NPC defs: position, dialogueId, questId
│       ├── dialogues.js               -- Dialogue trees: sequences, choices, flags
│       ├── quests.js                   -- Quest defs: id, requirements, rewards
│       └── constants.js               -- Timing windows, multipliers, physics values
│
├── assets/
│   ├── sprites/
│   │   ├── player.png                  -- Player spritesheet (walk, idle, battle)
│   │   ├── enemies/                    -- Enemy spritesheets per type
│   │   ├── bosses/                     -- Boss spritesheets (1x1x1x1, John Doe, etc.)
│   │   ├── npcs/                       -- NPC spritesheets
│   │   ├── effects/                    -- Hit sparks, dodge flash, corruption particles
│   │   └── ui/                         -- Button frames, bar graphics, icons
│   ├── tilesets/
│   │   ├── town.png                    -- Town of Robloxia tileset
│   │   └── corrupted.png              -- Corrupted zone tileset
│   ├── audio/
│   │   ├── bgm/                        -- Background music (town, battle, boss, ending)
│   │   └── sfx/                        -- Sound effects (slash, perfect, dodge, block, break)
│   └── fonts/
│       └── pixel.png                   -- Bitmap font spritesheet
│
└── maps/
    ├── town_of_robloxia.json           -- Tile map data (layers, collisions, spawns)
    ├── corrupted_zone_1.json
    ├── corrupted_zone_2.json
    ├── corrupted_zone_3.json
    └── final_arena.json
```

---

## 3. STEP-BY-STEP BUILD ORDER

### Phase 1 — Engine Foundation (Week 1)
> Goal: A canvas with a game loop and keyboard input.

| Step | Task | Files |
|------|------|-------|
| 1.1 | Create `index.html` with fullscreen `<canvas>`, load scripts | `index.html`, `css/style.css` |
| 1.2 | Implement game loop with `requestAnimationFrame`, delta time | `Game.js` |
| 1.3 | Set up canvas with nearest-neighbor scaling (`imageSmoothingEnabled = false`) | `Game.js` |
| 1.4 | Implement `InputManager` (keydown/keyup tracking, `isKeyDown()`, `isKeyPressed()`) | `InputManager.js` |
| 1.5 | Build `AssetLoader` to preload images with a loading screen | `AssetLoader.js` |
| 1.6 | Build `SpriteSheet` parser and `Animator` for frame-based animation | `SpriteSheet.js`, `Animator.js` |

**Milestone: Canvas renders at 60fps with input and sprite loading.**

---

### Phase 2 — Player & Camera (Week 2)
> Goal: A character you can move around in a top-down world.

| Step | Task | Files |
|------|------|-------|
| 2.1 | Create `Entity` base class (position, size, update, render) | `Entity.js` |
| 2.2 | Create `Player` with velocity-based movement + friction braking | `Player.js` |
| 2.3 | Tune braking: when keys released, apply friction until velocity → 0 | `Player.js`, `constants.js` |
| 2.4 | Add walk/idle animation transitions (smooth blend on stop) | `Player.js`, `Animator.js` |
| 2.5 | Implement top-down `Camera` with smooth lerp follow | `Camera.js` |
| 2.6 | Build simple test tile map (floor + walls) with collision | `TileMap.js`, `TileRenderer.js` |
| 2.7 | Implement `SceneManager` with an ExplorationScene | `SceneManager.js` |

**Milestone: Player moves with momentum/braking in top-down view on a tile map.**

---

### Phase 3 — Battle Entry & Turn System (Week 3)
> Goal: Walk near an enemy → transition to battle → take turns.

| Step | Task | Files |
|------|------|-------|
| 3.1 | Create `Enemy` overworld entity with proximity detection | `Enemy.js`, `enemies.js` |
| 3.2 | Build `BattleTransition` (screen flash/pixelate effect) | `BattleTransition.js` |
| 3.3 | Create `BattleScene` with state machine (Idle→PlayerTurn→EnemyTurn→Win/Lose) | `BattleScene.js` |
| 3.4 | Build `BattleUI`: draw FIGHT and BLOCK pixel buttons on canvas | `BattleUI.js`, `Button.js` |
| 3.5 | Implement `UIElement` base with canvas hit-testing for mouse/key selection | `UIElement.js` |
| 3.6 | Add basic HP display (player + enemy health bars) | `BattleUI.js`, `HUD.js` |
| 3.7 | Wire turn alternation: player picks action → enemy acts → repeat | `BattleScene.js` |

**Milestone: Walk to enemy → battle screen → FIGHT/BLOCK buttons → turns alternate.**

---

### Phase 4 — Attack Timing Bar [FIGHT] (Week 4)
> Goal: Press FIGHT → pick target → pick sword → timing bar QTE → deal damage.

| Step | Task | Files |
|------|------|-------|
| 4.1 | Build timing bar rendering (meter frame, center mark, moving bar) | `AttackTimingBar.js` |
| 4.2 | Implement bar movement at constant speed (configurable per sword) | `AttackTimingBar.js` |
| 4.3 | Implement hit zone detection: | `AttackTimingBar.js`, `DamageCalculator.js` |
|      | — Center = PERFECT (1.0×) | |
|      | — Near-center = high (0.75×) | |
|      | — Outer = reduced (0.25×) | |
|      | — Miss (bar reaches end) = 0 damage | |
| 4.4 | Show "PERFECT!" / damage number feedback text (animated) | `BattleUI.js` |
| 4.5 | Create `swords.js` with 2 test swords (different speeds, damage) | `swords.js` |
| 4.6 | Add sword selection sub-menu (choose from 2 equipped swords) | `BattleUI.js`, `BattleScene.js` |
| 4.7 | Add enemy selection (when multiple enemies on screen) | `BattleUI.js`, `BattleScene.js` |
| 4.8 | Wire full FIGHT flow: button → target → sword → bar → damage → end turn | `BattleScene.js` |
| 4.9 | Support multi-press for multiple slashes (rapid press within window) | `AttackTimingBar.js` |

**Milestone: Full FIGHT action with timing-based damage scaling.**

---

### Phase 5 — Enemy Attacks & Dodge System (Week 5)
> Goal: Enemy turn → attack animation → dodge QTE with circles.

| Step | Task | Files |
|------|------|-------|
| 5.1 | Define enemy attack data (damage, dodge circle count, timing) | `enemies.js` |
| 5.2 | Build dodge circle rendering (circles with key labels, approaching rings) | `DodgeMiniGame.js` |
| 5.3 | Implement ring animation moving toward circle center | `DodgeMiniGame.js` |
| 5.4 | Detect timing: ring in green zone + correct key = DODGED! | `DodgeMiniGame.js` |
| 5.5 | Wrong timing or wrong key = HITTED! + take damage | `DodgeMiniGame.js` |
| 5.6 | Support multi-circle sequences (2-5 presses per attack) | `DodgeMiniGame.js` |
| 5.7 | Calculate damage: each missed dodge = portion of attack damage | `DamageCalculator.js` |
| 5.8 | Enemy attack animation before dodge phase begins | `EnemyBattle.js` |

**Milestone: Enemies attack with dodge QTE. Full battle loop: FIGHT → Enemy Attack → repeat.**

---

### Phase 6 — Block/Shield System (Week 6)
> Goal: BLOCK option with shield durability.

| Step | Task | Files |
|------|------|-------|
| 6.1 | Create `shields.js` with test shields (durability, reduction %) | `shields.js` |
| 6.2 | Implement BLOCK action: reduce incoming damage by shield % | `BlockSystem.js` |
| 6.3 | Track shield durability (decreases each block, breaks at 0) | `BlockSystem.js` |
| 6.4 | Broken shield: minimal reduction (100 dmg → 98 dmg) | `BlockSystem.js` |
| 6.5 | UI feedback: shield HP bar, crack visual, break animation | `BattleUI.js` |
| 6.6 | Player chooses: BLOCK (reduce damage) or don't block (dodge only) | `BattleScene.js` |

**Milestone: Complete combat triangle: FIGHT, BLOCK, DODGE.**

---

### Phase 7 — Pixel UI & Inventory (Week 7)
> Goal: Canvas-drawn menus, inventory, equipment management.

| Step | Task | Files |
|------|------|-------|
| 7.1 | Build `PixelText` bitmap font renderer | `PixelText.js` |
| 7.2 | Build `InventoryManager` (add, remove, equip, unequip) | `InventoryManager.js` |
| 7.3 | Create `InventoryUI` (grid view, 2 sword + 1 shield equip slots) | `InventoryUI.js` |
| 7.4 | Build `HUD` overlay (HP bar, soul meter, equipped item icons) | `HUD.js` |
| 7.5 | Build `MenuUI` (pause, resume, save, load) | `MenuUI.js` |
| 7.6 | Context-switch input between exploration, battle, and menu | `InputManager.js` |

**Milestone: Player can manage and equip gear via canvas UI.**

---

### Phase 8 — NPCs & Dialogue (Week 8)
> Goal: Talk to NPCs, receive quests, learn story.

| Step | Task | Files |
|------|------|-------|
| 8.1 | Create `NPC` entity with interaction zone (proximity + key press) | `NPC.js` |
| 8.2 | Build `TextBox` with typewriter text effect (canvas-drawn) | `TextBox.js` |
| 8.3 | Implement `DialogueSystem` (tree traversal, choices, flag setting) | `DialogueSystem.js` |
| 8.4 | Create Town of Robloxia NPC dialogue data | `dialogues.js`, `npcs.js` |

**Milestone: NPCs tell the story and give direction.**

---

### Phase 9 — Quest & Progression (Week 9)
> Goal: Main story progression with area unlocks.

| Step | Task | Files |
|------|------|-------|
| 9.1 | Implement `QuestManager` (flags, requirements, completion) | `QuestManager.js`, `quests.js` |
| 9.2 | Gate areas behind quest flags | `AreaManager.js` |
| 9.3 | Build `AreaManager` with area transitions (fade, load new map) | `AreaManager.js` |
| 9.4 | Implement `SaveManager` (localStorage serialize/deserialize) | `SaveManager.js` |
| 9.5 | Auto-save on area transition, manual save from menu | `SaveManager.js` |

**Milestone: Player progresses through story areas with persistence.**

---

### Phase 10 — World Building & Enemies (Weeks 10-11)
> Goal: Full game world with varied enemies.

| Step | Task | Files |
|------|------|-------|
| 10.1 | Design & build Town of Robloxia map (JSON tile data) | `maps/town_of_robloxia.json` |
| 10.2 | Build Corrupted Zones 1-3 maps with corruption visuals | `maps/corrupted_zone_*.json` |
| 10.3 | Create enemy variety (3-5 types, unique dodge patterns per zone) | `enemies.js`, sprites |
| 10.4 | Add corruption visual effects (palette shift, particle overlay) | `AreaManager.js` |
| 10.5 | Balance sword/shield/enemy stats across zones | data files |
| 10.6 | Add loot drops from battles (new swords, shields) | `BattleScene.js` |

**Milestone: Complete explorable world with combat encounters.**

---

### Phase 11 — Boss Battles (Week 12)
> Goal: Unique boss fights for 1x1x1x1, John Doe, Corrupted 1x1x1x1.

| Step | Task | Files |
|------|------|-------|
| 11.1 | Build `BossController` with phase system | `BossController.js` |
| 11.2 | Design boss dodge patterns (more circles, faster, mixed keys) | `bosses.js` |
| 11.3 | Design boss timing bars (faster, multiple bars, tricky timing) | `bosses.js` |
| 11.4 | Build Final Arena map | `maps/final_arena.json` |
| 11.5 | Boss intro dialogue/cutscene sequences | `dialogues.js` |

**Milestone: All three bosses are playable.**

---

### Phase 12 — Final Battle & Ending (Week 13)
> Goal: Infection mechanic, soul fading, death, rebirth, funeral.

| Step | Task | Files |
|------|------|-------|
| 12.1 | Infection system: corruption shader/overlay spreading on player sprite | `BattleScene.js`, `Player.js` |
| 12.2 | Soul fade: timer reducing max HP during final fight | `BattleScene.js` |
| 12.3 | Final boss: Corrupted 1x1x1x1 wielding Sword of Stability | `BossController.js` |
| 12.4 | Death cutscene (hero collapses, screen fades) | `SceneManager.js` |
| 12.5 | Rebirth sequence (wake up, funeral scene) | `SceneManager.js` |
| 12.6 | Ending text: "The best hero Roblox ever had." + cycle revelation | `PixelText.js` |
| 12.7 | Credits roll | `SceneManager.js` |

**Milestone: Complete game from start to ending.**

---

### Phase 13 — Audio & Polish (Week 14)
> Goal: Sound, juice, final polish.

| Step | Task | Files |
|------|------|-------|
| 13.1 | Implement `AudioManager` with Web Audio API | `AudioManager.js` |
| 13.2 | Add SFX (slash, perfect hit, dodge, block, shield break) | `assets/audio/sfx/` |
| 13.3 | Add BGM (town, battle, boss, ending) with crossfade | `assets/audio/bgm/` |
| 13.4 | Screen shake on hits, flash on perfect timing | `Camera.js`, `BattleScene.js` |
| 13.5 | Corruption particles in overworld (canvas particle system) | `AreaManager.js` |
| 13.6 | Final playtesting and stat balance pass | All data files |

**Milestone: Shipped game.**

---

## 4. DAMAGE FORMULA REFERENCE

```js
// FIGHT damage
finalDamage = baseSwordDamage * timingMultiplier * hitCount;
// timingMultiplier: 1.0 (perfect center) → 0.75 (near) → 0.25 (outer) → 0 (miss)

// BLOCK damage reduction
damageTaken = enemyDamage * (1 - shieldReduction);
// If shield broken: damageTaken = enemyDamage * 0.98;

// DODGE
// Each missed circle = (enemyDamage / totalCircles) applied
// Each dodged circle = 0 damage
```

---

## 5. TECH NOTES

| Concern | Approach |
|---------|----------|
| **Pixel-art scaling** | `ctx.imageSmoothingEnabled = false;` on canvas, render at low res (e.g. 320×180) then scale up |
| **Frame rate** | `requestAnimationFrame` with delta time; logic updates at fixed 60fps timestep |
| **Input** | Track key states in a `Map`; `isKeyPressed()` for one-shot, `isKeyDown()` for held |
| **No DOM UI** | All UI drawn on canvas — buttons use bounding-box hit testing |
| **Modules** | ES6 `import/export` with `<script type="module">` |
| **Persistence** | `localStorage.setItem('save', JSON.stringify(state))` |
| **Audio** | Web Audio API for low-latency SFX; `<audio>` fallback for BGM if needed |

---

## 6. KEY DESIGN RULES

1. **All rendering through Canvas** — no DOM elements for game UI
2. **Pixel-perfect rendering** — low internal resolution, scaled up with nearest-neighbor
3. **Swords modify the QTE, not just numbers** — different bar speeds, counts, styles
4. **Difficulty scales via dodge complexity** — more circles, faster rings, mixed keys
5. **Story told through NPCs + environment** — no long unskippable cutscenes until finale
6. **Save often** — localStorage auto-save on area transitions
