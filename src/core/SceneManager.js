export const SceneType = {
    FULLSCREEN: 'fullscreen',
    MODAL_OVERLAY: 'modal_overlay',
    NON_MODAL_OVERLAY: 'non_modal_overlay',
};

export class SceneManager {
    constructor() {
        this._stack = [];
        this._transition = null;
    }

    push(scene, transition = null) {
        if (scene.onEnter) scene.onEnter();
        this._stack.push(scene);
        if (transition) {
            this._transition = transition;
            this._transition.start();
        }
    }

    pop(transition = null) {
        if (this._stack.length === 0) return null;
        const scene = this._stack.pop();
        if (scene.onExit) scene.onExit();
        if (transition) {
            this._transition = transition;
            this._transition.start();
        }
        return scene;
    }

    replace(scene, transition = null) {
        if (this._stack.length > 0) {
            const old = this._stack.pop();
            if (old.onExit) old.onExit();
        }
        if (scene.onEnter) scene.onEnter();
        this._stack.push(scene);
        if (transition) {
            this._transition = transition;
            this._transition.start();
        }
    }

    update(dt) {
        if (this._transition) {
            this._transition.update(dt);
            if (this._transition.isComplete()) {
                this._transition = null;
            }
        }

        for (let i = this._stack.length - 1; i >= 0; i--) {
            const scene = this._stack[i];
            scene.update(dt);
            if (scene.type === SceneType.FULLSCREEN || scene.type === SceneType.MODAL_OVERLAY) {
                break;
            }
        }
    }

    render(ctx) {
        let renderFrom = this._stack.length - 1;
        for (let i = this._stack.length - 1; i >= 0; i--) {
            renderFrom = i;
            if (this._stack[i].type === SceneType.FULLSCREEN) {
                break;
            }
        }

        for (let i = renderFrom; i < this._stack.length; i++) {
            this._stack[i].render(ctx);
            if (i < this._stack.length - 1 && this._stack[i + 1].type === SceneType.MODAL_OVERLAY) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            }
        }

        if (this._transition) {
            this._transition.render(ctx);
        }
    }

    handleInput(inputManager) {
        for (let i = this._stack.length - 1; i >= 0; i--) {
            const scene = this._stack[i];
            if (scene.handleInput) {
                scene.handleInput(inputManager);
            }
            if (scene.type !== SceneType.NON_MODAL_OVERLAY) {
                break;
            }
        }
    }

    currentScene() {
        return this._stack.length > 0 ? this._stack[this._stack.length - 1] : null;
    }

    get stackSize() {
        return this._stack.length;
    }
}
