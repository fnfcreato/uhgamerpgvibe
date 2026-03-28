import { CANVAS, PHYSICS } from '../data/constants.js';
import { GameState } from './GameState.js';
import { GameContext } from './GameContext.js';
import { InputManager } from './InputManager.js';
import { SceneManager } from './SceneManager.js';
import { AssetLoader } from './AssetLoader.js';
import { AudioManager } from './AudioManager.js';
import { Camera } from './Camera.js';
import { EffectManager } from '../rendering/EffectManager.js';
import { InventoryManager } from '../systems/InventoryManager.js';
import { SaveManager } from '../systems/SaveManager.js';
import { QuestManager } from '../systems/QuestManager.js';
import { Button } from '../ui/Button.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.canvas.width = CANVAS.INTERNAL_WIDTH;
        this.canvas.height = CANVAS.INTERNAL_HEIGHT;
        this.ctx.imageSmoothingEnabled = false;

        this.gameState = new GameState();

        const inputManager = new InputManager(this.canvas);
        const sceneManager = new SceneManager();
        const assetLoader = new AssetLoader();
        const audioManager = new AudioManager(this.gameState.settings);
        const camera = new Camera(CANVAS.INTERNAL_WIDTH, CANVAS.INTERNAL_HEIGHT);
        const effectManager = new EffectManager();
        const inventoryManager = new InventoryManager(this.gameState);
        const saveManager = new SaveManager(this.gameState);
        const questManager = new QuestManager(this.gameState);
        Button.setSFXPlayer((id) => audioManager.playSFX(id));

        this.context = new GameContext({
            inputManager,
            audioManager,
            assetLoader,
            sceneManager,
            camera,
            effectManager,
            inventoryManager,
            saveManager,
            questManager,
            gameState: this.gameState,
        });

        this._accumulator = 0;
        this._lastTime = 0;
        this._running = false;

        this._handleResize();
        window.addEventListener('resize', () => this._handleResize());
    }

    _handleResize() {
        const scaleX = window.innerWidth / CANVAS.INTERNAL_WIDTH;
        const scaleY = window.innerHeight / CANVAS.INTERNAL_HEIGHT;
        const rawScale = Math.min(scaleX, scaleY);
        const scale = rawScale >= 1 ? Math.max(1, Math.floor(rawScale)) : Math.max(0.5, rawScale);
        this.canvas.style.width = (CANVAS.INTERNAL_WIDTH * scale) + 'px';
        this.canvas.style.height = (CANVAS.INTERNAL_HEIGHT * scale) + 'px';
    }

    start() {
        this._running = true;
        this._lastTime = performance.now();
        requestAnimationFrame((t) => this._loop(t));
    }

    _loop(currentTime) {
        if (!this._running) return;

        const deltaTime = (currentTime - this._lastTime) / 1000;
        this._lastTime = currentTime;

        const clampedDelta = Math.min(deltaTime, 0.25);
        this._accumulator += clampedDelta;

        this.context.scenes.handleInput(this.context.input);

        while (this._accumulator >= PHYSICS.FIXED_TIMESTEP) {
            this.context.scenes.update(PHYSICS.FIXED_TIMESTEP);
            this.context.effects.update(PHYSICS.FIXED_TIMESTEP);
            this.context.camera.update(PHYSICS.FIXED_TIMESTEP);
            this._accumulator -= PHYSICS.FIXED_TIMESTEP;
        }

        this.context.input.endFrame();

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.imageSmoothingEnabled = false;
        this.context.scenes.render(this.ctx);
        this.context.effects.render(this.ctx, this.context.camera);

        requestAnimationFrame((t) => this._loop(t));
    }

    stop() {
        this._running = false;
    }
}
