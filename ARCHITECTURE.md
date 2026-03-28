# Sword of Stability — JavaScript Architecture Blueprint

---

## Layer 0: Shared State & Context

| Class | Responsibility | Connections |
|---|---|---|
| **`GameContext`** | Container passed into all scenes and systems. Holds references to `InputManager`, `AudioManager`, `AssetLoader`, `SceneManager`, `Camera`, and all Layer 6 systems. Avoids global singletons. | Created by `Game` at startup. Passed into every scene constructor and system method. |
| **`GameState`** | Single source of truth for all mutable runtime state. Contains `PlayerState`, `InventoryState`, `QuestState`, `AreaState`, `SettingsState`. All systems read/write through this object. Serialized/deserialized by `SaveManager`. | Owned by `Game`. Read/written by all scenes and systems. Never duplicated — one authoritative copy. |
| **`PlayerState`** | `{ hp, maxHp, soulIntegrity, position: {x,y}, equippedSwords: [ItemInstance, ItemInstance], equippedShield: ItemInstance }` | Part of `GameState`. Read by `BattleScene`, `HUD`, `Camera`. Written by `BattleScene`, `InventoryManager`, `ExplorationScene`. |
| **`InventoryState`** | `{ items: ItemInstance[], equippedSwords: [slot0, slot1], equippedShield: slot0 }` | Part of `GameState`. Read/written by `InventoryManager`. Read by `AttackTimingBar`, `BlockSystem`, `HUD`, `InventoryUI`. |
| **`QuestState`** | `{ flags: Map<string, boolean\|number>, completedQuests: Set<string>, defeatedBosses: Set<string>, openedChests: Set<string>, defeatedEnemySpawns: Set<string> }` | Part of `GameState`. Read/written by `QuestManager`. Read by `AreaManager`, `DialogueSystem`. |
| **`AreaState`** | `{ currentAreaId, playerSpawnPoint, visitedAreas: Set<string> }` | Part of `GameState`. Read/written by `AreaManager`. |
| **`SettingsState`** | `{ bgmVolume, sfxVolume, saveVersion }` | Part of `GameState`. Read/written by `MenuUI`, `AudioManager`. |

---

## Layer 1: Core Engine

| Class | Responsibility | Connections |
|---|---|---|
| **`Game`** | Owns the canvas, runs the `requestAnimationFrame` loop, uses a **fixed timestep** for logic updates (`update(FIXED_DT)`) and variable render (`render(ctx, interpolation)`). Creates `GameContext` and `GameState`. | Holds `GameContext`. Passes context downward. Calls `SceneManager.update()` / `SceneManager.render()`. |
| **`InputManager`** | Tracks keyboard **and pointer** state. Keyboard: `Map` of key→down, `isKeyDown()` (held), `isKeyPressed()` (one-shot, consumed on read). Pointer: tracks canvas-relative position, click state via `getPointerPos()`, `isPointerDown()`, `isPointerClicked()`. Exposes **semantic actions** (`confirm`, `cancel`, `interact`, `moveUp/Down/Left/Right`, `pause`, `dodge_key_A/S/D/W`) mapped from raw keys. Scenes own input handling and pass actions down — entities never read `InputManager` directly. | Read by active scene only. Scene distributes actions to its subsystems. `SceneManager` manages which scene receives input. |
| **`SceneManager`** | Maintains a scene stack. Supports three scene types: **Fullscreen** (exclusive update+render), **Modal Overlay** (pauses scene below, renders on top), **Non-Modal Overlay** (scene below keeps updating+rendering). Generic transition interface: any scene push/pop can specify a `Transition` (fade, pixelate, flash). Routes `update`/`render`/`handleInput` to scenes based on stack rules. | Called by `Game` each frame. Delegates to scene stack. Owns active `Transition` if any. |
| **`Camera`** | Lerp-follows a target (the `Player`). Provides `worldToScreen(x,y)` transform. Supports screen shake (offset injection). | Read by `TileRenderer`, every `Entity.render()`, `HUD`. `BattleScene` triggers shake via `GameContext`. |
| **`AssetLoader`** | Preloads images and audio files. Returns `Promise`s. Fires a progress callback for the loading screen. | Used at startup by `Game`. Assets referenced by `SpriteSheet`, `AudioManager`, `TileMap`. |
| **`AudioManager`** | Wraps Web Audio API. Play/stop/loop BGM with crossfade. Fire-and-forget SFX. Volume reads from `SettingsState`. | Called by scenes and `AreaManager` (BGM crossfade). Part of `GameContext`. |

### Scene Type Rules

| Type | Update Below? | Render Below? | Input Focus |
|---|---|---|---|
| **Fullscreen** | No | No | Exclusive |
| **Modal Overlay** (Menu, Inventory, Dialogue) | No | Yes (dimmed) | Exclusive — scene below is frozen |
| **Non-Modal Overlay** (HUD, notifications) | Yes | Yes | Pass-through — scene below still receives input |

---

## Layer 2: Rendering

| Class | Responsibility | Connections |
|---|---|---|
| **`SpriteSheet`** | Parses a spritesheet image into named frames/regions. Supports both uniform grid (row/column) and **custom frame definitions** (`{ name, x, y, w, h, anchorX, anchorY }`) for non-uniform sprites (bosses, effects). | Consumed by `Animator`. Created per asset (player, enemies, UI, bosses). |
| **`Animator`** | Drives frame-based animation (current frame, timer, loop, on-complete callback). Supports **animation event callbacks** at specific frames (e.g., "deal damage on frame 3", "spawn particle on frame 5"). | Owned by every `Entity` (`Player`, `Enemy`, `NPC`, `EnemyBattle`). Reads from `SpriteSheet`. |
| **`TileRenderer`** | Draws tile map layers (ground, decoration, foreground) to canvas using `Camera` offset. Caches static layers to an **offscreen buffer** and only redraws on camera movement beyond a threshold. | Reads `TileMap` data. Uses `Camera.worldToScreen()`. Called by `ExplorationScene.render()`. |
| **`PixelText`** | Bitmap font renderer. Draws strings to canvas from a font spritesheet. Supports alignment, color tint. | Used by `TextBox`, `BattleUI`, `HUD`, `MenuUI`, `InventoryUI`, ending/credits scenes. |
| **`EffectManager`** | Manages temporary visual objects: particles, damage number popups, hit sparks, screen flashes, corruption overlays, tint effects. Each effect has a lifetime and `update(dt)`/`render(ctx)`. | Owned by `GameContext`. Called by `BattleScene`, `ExplorationScene`, `AreaManager`. Renders as a layer on top of entities. |

---

## Layer 3: World / Exploration

| Class | Responsibility | Connections |
|---|---|---|
| **`ExplorationScene`** *(Fullscreen Scene)* | Owns exploration gameplay. Handles input and distributes semantic actions to `Player`. **Detects entity interactions** (enemy proximity → push battle, NPC interact → push dialogue overlay). Y-sorts entities for correct depth rendering. | Reads `InputManager` and distributes actions. Owns `Player`, `AreaManager`, `HUD`, `Camera`. Pushes `BattleScene`/`DialogueOverlay` via `SceneManager`. |
| **`Entity`** | Base class. `position {x,y}`, `size {w,h}`, `sprite`, `animator`, abstract `update(dt)` / `render(ctx, camera)`. | Superclass of `Player`, `Enemy`, `NPC`. |
| **`Player`** *(extends Entity)* | Receives movement actions from `ExplorationScene` (not raw input). Velocity + friction braking model. Transitions between walk/idle animations. Reads equipment from `PlayerState`. Can be driven by `ScriptRunner` for cutscene movement. | Receives actions from `ExplorationScene` or `ScriptRunner`. Checks `TileMap` for collision. `Camera` follows it. Reads `PlayerState` for stats. |
| **`Enemy`** *(extends Entity)* | Overworld patrol AI. Has a proximity radius. **Exposes** `isPlayerInRange(playerPos)` — does NOT trigger battles itself. Links to an enemy def ID and a unique spawn ID (for tracking defeated state). | Checked by `ExplorationScene` for proximity. Links to `enemies.js` def. Spawn ID checked against `QuestState.defeatedEnemySpawns`. |
| **`NPC`** *(extends Entity)* | Interaction zone. **Exposes** `isPlayerInRange(playerPos)` and `canInteract()` — does NOT trigger dialogue itself. Links to NPC def with `dialogueId`. | Checked by `ExplorationScene` for interaction. Links to `npcs.js` data. |
| **`TileMap`** | Holds 2D grid data (tile IDs, collision layer). Exposes `isSolid(tileX, tileY)` and `getTile(layer, x, y)`. Pure map geometry — no spawn data. | Loaded from JSON map files. Read by `Player` (collision), `TileRenderer` (drawing). |
| **`AreaManager`** | Loads/unloads areas from `AreaDef` data. Instantiates `TileMap`, spawns `Enemy[]` and `NPC[]` from area def (skipping defeated enemies via `QuestState`). Tells `AudioManager` to crossfade BGM. | Owns current `TileMap`, `Enemy[]`, `NPC[]`. Reads `AreaDef` from `areas.js`. Reads `QuestState` for gates and defeated enemies. |

---

## Layer 4: Battle

| Class | Responsibility | Connections |
|---|---|---|
| **`BattleScene`** *(Fullscreen Scene)* | Coordinates battle flow. Owns `BattleFlow` for turn logic and `BattlePresentation` for visuals. Handles input and routes to active subsystem (action select, timing bar, dodge game). | Pushed onto `SceneManager` by `ExplorationScene`. Owns `BattleFlow`, `BattlePresentation`, `EnemyBattle[]`, `BossController` (if boss). Reads `PlayerState`. |
| **`BattleFlow`** | Turn state machine: `Intro → PlayerTurn → ActionSelect → (Fight/Block) → EnemyTurn → (Dodge) → CheckWin → loop`. Pure logic — no rendering. Manages turn order for multi-enemy fights, target selection, win/loss conditions, loot drops. | Owned by `BattleScene`. Calls `DamageCalculator`. Reads/writes `PlayerState` HP. Reads `EnemyBattle` state. |
| **`BattlePresentation`** | All battle visuals: draws FIGHT/BLOCK buttons, HP bars (player + enemy), damage number popups, "PERFECT!" feedback text, shield durability bar, enemy sprites, attack animations. | Owned by `BattleScene`. Uses `Button`, `PixelText`, `EffectManager`. Reads `BattleFlow` state, `PlayerState`, `EnemyBattle` state. |
| **`BattleTransition`** *(implements Transition)* | Pixel-dissolve / flash effect when entering/exiting battle. One of several transition types available to `SceneManager`. | Passed to `SceneManager.push()` as a transition config. |
| **`AttackTimingBar`** | Renders the moving bar, center mark, and hit zones. Speed/style configured by the equipped sword's `barSpeed`/`barCount`. Bosses can override with custom bar configs. Detects press timing, returns a multiplier (1.0 / 0.75 / 0.25 / 0). Supports multi-press (rapid slashes). | Created by `BattleScene` on FIGHT. Receives actions from `BattleScene`. Reads sword data from item def. Returns result to `BattleFlow` → `DamageCalculator`. |
| **`DodgeMiniGame`** | Renders circle targets with key labels. Animates rings shrinking toward center. Detects correct-key-in-green-zone → DODGED, else HITTED. Supports multi-circle sequences. | Created by `BattleScene` on enemy turn. Receives actions from `BattleScene`. Pattern data from `EnemyBattle`. Returns per-circle results to `BattleFlow`. |
| **`BlockSystem`** | Reads equipped shield's `ItemInstance` durability. Calculates damage reduction. When durability hits 0 → shield breaks (minimal reduction). **Writes durability back to the `ItemInstance`**, not to Player or its own state. | Called by `BattleFlow` when player chooses BLOCK. Reads/writes shield `ItemInstance` in `InventoryState`. |
| **`DamageCalculator`** | Pure functions: `calcFightDamage(base, timingMult, hitCount)`, `calcDodgeDamage(enemyDmg, dodgedCount, totalCircles)`, `calcBlockDamage(enemyDmg, shieldReduction, isBroken)`. | Called by `BattleFlow`. No state of its own — stateless utility. |
| **`EnemyBattle`** | Represents an enemy *inside* battle. Holds runtime battle state (current HP, damage, dodge patterns, attack animations). Created from an enemy def. | Created from `enemies.js` data. Owns an `Animator` for attack/idle. Provides dodge patterns to `DodgeMiniGame`. |
| **`BossController`** *(wraps EnemyBattle)* | Adds phase system (phase transitions at HP thresholds). Each phase changes dodge patterns, bar speed/config overrides, unique mechanics (e.g., infection timer for Corrupted 1x1x1x1). Triggers mid-fight sequences via `ScriptRunner`. | Owned by `BattleScene` for boss fights. Reads `bosses.js` data. Overrides `EnemyBattle` patterns per phase. Uses `ScriptRunner` for boss dialogue/cutscene moments. |

### Battle Turn Flow (Explicit)

```
PlayerTurn:
  → Player chooses FIGHT:
      → Select target (if multi-enemy)
      → Select sword (from 2 equipped)
      → AttackTimingBar QTE → result to DamageCalculator → apply damage
  → Player chooses BLOCK:
      → BlockSystem reduces next incoming damage using shield
      → Shield durability decreases on ItemInstance
  → End player turn

EnemyTurn:
  → If player chose BLOCK: enemy damage is reduced by shield, no dodge phase
  → If player did NOT block: DodgeMiniGame plays, each missed circle = partial damage
  → Apply final damage to PlayerState.hp
  → End enemy turn

CheckWin:
  → If all enemies HP ≤ 0: Victory → loot → pop scene
  → If player HP ≤ 0: Defeat → game over flow
  → Else: loop back to PlayerTurn
```

---

## Layer 5: UI (Canvas-Drawn)

| Class | Responsibility | Connections |
|---|---|---|
| **`UIElement`** | Base class for all UI. Rect bounds, `draw(ctx)`, `containsPoint(x,y)` hit-test for pointer, `isFocused` for keyboard navigation. | Superclass of `Button`, `TextBox`. |
| **`Button`** *(extends UIElement)* | Pixel-art button with hover/press states. Activates on pointer click or keyboard `confirm` action when focused. | Used in `BattlePresentation`, `MenuUI`, `InventoryUI`. Receives pointer state and actions from owning scene. |
| **`TextBox`** *(extends UIElement)* | Dialogue box drawn at screen bottom. Typewriter text reveal. Advance on `confirm` action. | Used by `DialogueSystem`. Uses `PixelText` for rendering. |
| **`InventoryUI`** *(Modal Overlay Scene)* | Grid view of `ItemInstance`s. Shows 2 sword equip slots + 1 shield slot. Select/equip/unequip interaction. Displays instance-specific data (durability). | Reads/writes `InventoryState` via `InventoryManager`. Uses `Button`, `PixelText`. Pushed as modal overlay — exploration/battle paused beneath. |
| **`HUD`** *(Non-Modal Overlay)* | Persistent overlay: HP bar, soul integrity meter, equipped weapon/shield icons. | Rendered on top of `ExplorationScene`. Reads `PlayerState` HP/soul, `InventoryState` equipped items. |
| **`MenuUI`** *(Modal Overlay Scene)* | Pause menu with Resume, Inventory, Save, Load, Settings options. | Pushed via `SceneManager` as modal overlay. Calls `SaveManager`, opens `InventoryUI`. Reads/writes `SettingsState`. |

---

## Layer 6: Game Systems

| Class | Responsibility | Connections |
|---|---|---|
| **`DialogueSystem`** | Runs dialogue trees. Traverses nodes, shows text in `TextBox`, handles player choices, sets/checks quest flags. Pushes itself as a **Modal Overlay** — freezes the scene below. | Triggered by `ExplorationScene` (NPC interaction) or `ScriptRunner` (boss/cutscene). Owns a `TextBox`. Reads `dialogues.js` data. Writes flags to `QuestState` via `QuestManager`. |
| **`QuestManager`** | Reads/writes `QuestState`. Checks requirements, marks quests complete, unlocks rewards. Provides helper: `isFlagSet(key)`, `setFlag(key, value)`, `isBossDefeated(id)`, `markEnemyDefeated(spawnId)`. Uses centralized flag constants (not raw strings) from `questFlags.js`. | Reads/writes `QuestState`. Called by `DialogueSystem`, `BattleFlow` (boss defeated). Read by `AreaManager` (gates), `DialogueSystem` (conditional dialogue). |
| **`InventoryManager`** | Reads/writes `InventoryState`. Add/remove `ItemInstance`s, equip/unequip. Capacity limits. Creates `ItemInstance` from def + unique ID. | Reads/writes `InventoryState`. Called by `BattleFlow` (loot), `DialogueSystem` (quest rewards). |
| **`SaveManager`** | Serializes entire `GameState` to `localStorage` with a **version number**. Deserializes on load with version migration support. Each system does NOT need its own serialize logic — `GameState` is the single serialization target. | Reads/writes `GameState`. Called by `MenuUI` (manual save) and `AreaManager` (auto-save on area transition). |
| **`ScriptRunner`** | Executes sequenced command lists for cutscenes, boss intros, death/rebirth, credits. Commands: `fadeOut`, `fadeIn`, `wait`, `showDialogue`, `moveEntity`, `playBGM`, `playSFX`, `shake`, `setFlag`, `spawnEffect`. Processes one command at a time, advances on completion. | Used by `BossController` (mid-fight dialogue), `ExplorationScene` (cutscene triggers), and dedicated `CutsceneScene`. Reads `GameContext` to access systems. |

---

## Layer 7: Data (Plain Objects / Constants)

### Definitions (Static — Never Mutated at Runtime)

| Module | Contents |
|---|---|
| **`swords.js`** | Array of sword defs: `{ id, name, damage, barSpeed, barCount, sprite }` |
| **`shields.js`** | Array of shield defs: `{ id, name, maxDurability, reductionPercent, sprite }` |
| **`enemies.js`** | Array of enemy defs: `{ id, name, hp, damage, dodgePatterns, sprite, zone }` |
| **`bosses.js`** | Array of boss defs: `{ id, name, enemyDefId, phases: [{ hpThreshold, patterns, barSpeedOverride, barCountOverride, dialogue, uniqueMechanic }] }` |
| **`npcs.js`** | Array of NPC defs: `{ id, name, dialogueId, questId, sprite }` *(no position — positions come from `AreaDef`)* |
| **`dialogues.js`** | Dialogue trees: `{ id, nodes: [{ speaker, text, choices?, setFlag?, nextNode }] }` |
| **`quests.js`** | Quest defs: `{ id, requirements: [], rewards: [], gatesArea }` |
| **`questFlags.js`** | Centralized flag name constants: `BOSS_1_DEFEATED`, `ZONE_2_UNLOCKED`, etc. Prevents typo bugs from raw strings. |
| **`areas.js`** | Area defs: `{ id, mapFile, bgm, enemySpawns: [{ spawnId, enemyDefId, x, y }], npcSpawns: [{ npcDefId, x, y }], exits: [{ x, y, w, h, targetAreaId, targetSpawn }], gateConditions: [flagKey], corruptionProfile: { level, palette, particleDensity } }` |
| **`constants.js`** | Timing windows, physics values (friction, speed, fixed timestep), multipliers, canvas resolution (internal 320×180), damage multiplier zones |

### Instances (Created at Runtime — Mutable)

| Concept | Schema |
|---|---|
| **`ItemInstance`** | `{ instanceId, defId, type: 'sword'\|'shield', currentDurability? }` — unique per item in inventory. `defId` links to the static def for base stats. `currentDurability` is mutable (shields). |
| **`EnemySpawn`** | Defined in `AreaDef`. `spawnId` is checked against `QuestState.defeatedEnemySpawns` to skip spawning defeated enemies. |

---

## Scenes Summary

| Scene | Type | Purpose |
|---|---|---|
| **`LoadingScene`** | Fullscreen | Asset preloading with progress bar |
| **`ExplorationScene`** | Fullscreen | Overworld movement, entity interaction, area traversal |
| **`BattleScene`** | Fullscreen | Turn-based combat |
| **`CutsceneScene`** | Fullscreen | Scripted sequences (death, rebirth, finale, credits) driven by `ScriptRunner` |
| **`DialogueOverlay`** | Modal Overlay | NPC/boss dialogue via `DialogueSystem` |
| **`MenuUI`** | Modal Overlay | Pause menu, settings |
| **`InventoryUI`** | Modal Overlay | Item management, equipment |
| **`HUD`** | Non-Modal Overlay | HP, soul meter, equipped icons |

---

## Connection Summary

```
Game ──creates──► GameContext (shared services) + GameState (shared state)
  │
  ├──owns──► SceneManager ──manages──► Scene Stack
  │              │
  │              ├── Fullscreen: ExplorationScene, BattleScene, CutsceneScene, LoadingScene
  │              ├── Modal Overlay: DialogueOverlay, MenuUI, InventoryUI
  │              └── Non-Modal Overlay: HUD
  │
  ├──owns──► InputManager (keyboard + pointer + semantic actions)
  ├──owns──► AssetLoader
  ├──owns──► AudioManager
  ├──owns──► EffectManager
  │
  │   ExplorationScene:
  │       ├──owns──► Player (receives actions, not raw input)
  │       ├──owns──► AreaManager ──loads──► TileMap, Enemy[], NPC[] (from AreaDef)
  │       ├──owns──► Camera (follows Player)
  │       ├──detects──► Enemy proximity → pushes BattleScene
  │       ├──detects──► NPC interact → pushes DialogueOverlay
  │       └──detects──► Exit zones → AreaManager loads new area
  │
  │   BattleScene:
  │       ├──owns──► BattleFlow (turn state machine, damage, win/loss)
  │       ├──owns──► BattlePresentation (all visuals, UI, effects)
  │       ├──owns──► AttackTimingBar, DodgeMiniGame (created per turn)
  │       ├──owns──► BlockSystem (reads/writes shield ItemInstance)
  │       ├──owns──► EnemyBattle[] (runtime enemy state)
  │       ├──owns──► BossController (if boss fight)
  │       └──uses──► DamageCalculator (stateless)
  │
  │   CutsceneScene:
  │       └──driven by──► ScriptRunner (command list execution)
  │
  │   GameState (single source of truth):
  │       ├── PlayerState (hp, soul, position, equipment refs)
  │       ├── InventoryState (ItemInstance[], equip slots)
  │       ├── QuestState (flags, defeated bosses/enemies, opened chests)
  │       ├── AreaState (current area, visited areas)
  │       └── SettingsState (volume, save version)
  │
  │   Systems (operate on GameState, accessed via GameContext):
  │       ├── QuestManager → reads/writes QuestState
  │       ├── InventoryManager → reads/writes InventoryState
  │       ├── SaveManager → serializes/deserializes entire GameState
  │       ├── DialogueSystem → reads dialogues.js, writes QuestState
  │       └── ScriptRunner → executes cutscene/boss command sequences
  │
  └── Data modules: swords, shields, enemies, bosses, npcs, dialogues,
                     quests, questFlags, areas, constants
```

### Key Architectural Rules

1. **Single source of truth**: All mutable game state lives in `GameState`. Systems read/write through it. No duplicated state across classes.
2. **Entities don't control flow**: Entities expose state (`isPlayerInRange()`). Scenes detect interactions and push other scenes.
3. **Scenes own input**: Only the active scene reads `InputManager`. It distributes semantic actions downward. Subsystems never read input directly.
4. **Defs vs Instances**: Static data (swords.js, enemies.js) is never mutated. Runtime state uses `ItemInstance`, `EnemyBattle`, etc.
5. **Single spawn source**: Entity positions come from `AreaDef` in `areas.js`. Not from NPC defs, not from TileMap.
6. **Fixed timestep**: Logic runs at fixed 60fps timestep. Rendering interpolates for smooth visuals on any refresh rate.
7. **Generic transitions**: `SceneManager` uses a `Transition` interface. `BattleTransition` is one implementation, not a special case.
8. **All rendering through Canvas**: No DOM elements for game UI. `ctx.imageSmoothingEnabled = false` for pixel-perfect rendering at internal resolution (320×180) scaled up.
