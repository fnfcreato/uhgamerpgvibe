import { SceneType } from '../core/SceneManager.js';
import { Button } from './Button.js';
import { PixelText } from '../rendering/PixelText.js';
import { InventoryUI } from './InventoryUI.js';

export class MenuUI {
    constructor(context, options = {}) {
        this.type = SceneType.MODAL_OVERLAY;
        this.context = context;
        this.returnContext = options.returnContext || 'exploration';
        this.ownerScene = options.ownerScene || null;
        this.allowStateActions = options.allowStateActions ?? (this.returnContext === 'exploration');
        this._message = '';
        this._messageTimer = 0;
        this._focusIndex = 0;

        const centerX = 160;
        const startY = 48;
        const buttonWidth = 108;
        const buttonHeight = 16;

        this.buttons = [
            new Button(centerX - buttonWidth / 2, startY, buttonWidth, buttonHeight, 'RESUME', () => {
                this.context.scenes.pop();
            }),
            new Button(centerX - buttonWidth / 2, startY + 22, buttonWidth, buttonHeight, 'INVENTORY', () => {
                this.context.scenes.push(new InventoryUI(this.context, { returnContext: 'menu' }));
            }),
            new Button(centerX - buttonWidth / 2, startY + 44, buttonWidth, buttonHeight, 'SAVE', () => {
                this._handleSave();
            }),
            new Button(centerX - buttonWidth / 2, startY + 66, buttonWidth, buttonHeight, 'LOAD', () => {
                this._handleLoad();
            }),
        ];

        this.buttons[1].disabled = !this.allowStateActions;
        this.buttons[2].disabled = !this.allowStateActions;
        this.buttons[3].disabled = !this.allowStateActions;
        this._syncFocus();
    }

    onEnter() {
        this.context.input.setContext('menu');
    }

    onExit() {
        this.context.input.setContext(this.returnContext);
    }

    _syncFocus() {
        this.buttons.forEach((button, index) => {
            button.focused = index === this._focusIndex;
        });
    }

    _showMessage(text) {
        this._message = text;
        this._messageTimer = 1.25;
    }

    _handleSave() {
        if (!this.allowStateActions) {
            this._showMessage('Save disabled in battle');
            return;
        }

        this._showMessage(this.context.saves.save() ? 'Game saved' : 'Save failed');
    }

    _handleLoad() {
        if (!this.allowStateActions) {
            this._showMessage('Load disabled in battle');
            return;
        }

        if (!this.context.saves.load()) {
            this._showMessage('No save found');
            return;
        }

        this.context.audio.setVolume('bgm', this.context.state.settings.bgmVolume);
        this.context.audio.setVolume('sfx', this.context.state.settings.sfxVolume);
        if (this.ownerScene && typeof this.ownerScene.syncFromGameState === 'function') {
            this.ownerScene.syncFromGameState();
        }
        this._showMessage('Game loaded');
    }

    handleInput(input) {
        if (input.isActionPressed('cancel') || input.isActionPressed('pause')) {
            this.context.scenes.pop();
            return;
        }

        if (input.isActionPressed('moveUp')) {
            this._focusIndex = (this._focusIndex - 1 + this.buttons.length) % this.buttons.length;
            this._syncFocus();
        }
        if (input.isActionPressed('moveDown')) {
            this._focusIndex = (this._focusIndex + 1) % this.buttons.length;
            this._syncFocus();
        }
        if (input.isActionPressed('confirm')) {
            this.buttons[this._focusIndex].activate();
        }

        const pointer = input.getPointerPos();
        for (const button of this.buttons) {
            button.updatePointer(pointer);
            if (button.hovered && input.isPointerClicked()) {
                button.activate();
            }
        }
    }

    update(dt) {
        for (const button of this.buttons) {
            button.update(dt);
        }
        if (this._messageTimer > 0) {
            this._messageTimer -= dt;
        }
    }

    render(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(8, 10, 16, 0.95)';
        ctx.fillRect(70, 28, 180, 110);
        ctx.strokeStyle = '#6f7b8a';
        ctx.strokeRect(70.5, 28.5, 179, 109);

        PixelText.draw(ctx, 'PAUSE MENU', 160, 38, { align: 'center', color: '#fff', weight: 'bold' });
        PixelText.draw(ctx, `BGM ${Math.round(this.context.state.settings.bgmVolume * 100)}%`, 160, 124, { align: 'center', color: '#8fd3ff' });

        for (const button of this.buttons) {
            button.draw(ctx);
        }

        if (this._messageTimer > 0) {
            PixelText.draw(ctx, this._message, 160, 104, { align: 'center', color: '#ffd56a' });
        }
        ctx.restore();
    }
}
