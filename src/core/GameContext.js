export class GameContext {
    constructor({ inputManager, audioManager, assetLoader, sceneManager, camera, effectManager, inventoryManager, saveManager, questManager, gameState }) {
        this.input = inputManager;
        this.audio = audioManager;
        this.assets = assetLoader;
        this.scenes = sceneManager;
        this.camera = camera;
        this.effects = effectManager;
        this.inventory = inventoryManager;
        this.saves = saveManager;
        this.quests = questManager;
        this.state = gameState;
    }
}
