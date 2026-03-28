export class InputManager {
    constructor(canvas) {
        this.canvas = canvas;

        this._keysDown = new Map();
        this._keysPressed = new Map();
        this._virtualActionsDown = new Map();
        this._virtualActionsPressed = new Map();
        this._virtualActionCounts = new Map();
        this._virtualKeysDown = new Map();
        this._virtualKeysPressed = new Map();
        this._virtualKeyCounts = new Map();
        this._activePointerBindings = new Map();

        this._pointerPos = { x: 0, y: 0 };
        this._pointerDown = false;
        this._pointerClicked = false;

        this._context = 'exploration';
        this._mobileControlsRoot = document.getElementById('mobileControls');

        this._actionMap = {
            moveUp: ['ArrowUp', 'KeyW'],
            moveDown: ['ArrowDown', 'KeyS'],
            moveLeft: ['ArrowLeft', 'KeyA'],
            moveRight: ['ArrowRight', 'KeyD'],
            confirm: ['Enter', 'Space', 'KeyZ'],
            cancel: ['Escape', 'KeyX'],
            interact: ['KeyE'],
            pause: ['Escape'],
        };

        this._bindEvents();
        this._syncContext();
    }

    _bindEvents() {
        window.addEventListener('keydown', (e) => {
            if (!this._keysDown.get(e.code)) {
                this._keysPressed.set(e.code, true);
            }
            this._keysDown.set(e.code, true);
            e.preventDefault();
        });

        window.addEventListener('keyup', (e) => {
            this._keysDown.set(e.code, false);
            e.preventDefault();
        });

        this.canvas.addEventListener('pointermove', (e) => {
            this._updatePointerPosition(e);
        });

        this.canvas.addEventListener('pointerdown', (e) => {
            this._updatePointerPosition(e);
            this._pointerDown = true;
            this._pointerClicked = true;
            e.preventDefault();
        });

        const releasePointer = (e) => {
            this._pointerDown = false;

            const binding = this._activePointerBindings.get(e.pointerId);
            if (!binding) {
                return;
            }

            this._applyVirtualBinding(binding, false);
            binding.button.classList.remove('is-active');
            this._activePointerBindings.delete(e.pointerId);
        };

        window.addEventListener('pointerup', releasePointer);
        window.addEventListener('pointercancel', releasePointer);

        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        this._bindMobileControls();
    }

    _bindMobileControls() {
        if (!this._mobileControlsRoot) {
            return;
        }

        const buttons = this._mobileControlsRoot.querySelectorAll('[data-action], [data-key]');
        for (const button of buttons) {
            const releaseBinding = (pointerId) => {
                const binding = this._activePointerBindings.get(pointerId);
                if (!binding || binding.button !== button) {
                    return;
                }

                this._applyVirtualBinding(binding, false);
                this._activePointerBindings.delete(pointerId);
                button.classList.remove('is-active');
            };

            button.addEventListener('pointerdown', (e) => {
                e.preventDefault();

                const binding = this._resolveVirtualBinding(button);
                if (!binding) {
                    return;
                }

                this._activePointerBindings.set(e.pointerId, { ...binding, button });
                this._applyVirtualBinding(binding, true);
                button.classList.add('is-active');

                if (typeof button.setPointerCapture === 'function') {
                    try {
                        button.setPointerCapture(e.pointerId);
                    } catch {
                        // Ignore browsers that refuse pointer capture here.
                    }
                }
            });

            button.addEventListener('pointerup', (e) => {
                releaseBinding(e.pointerId);
            });
            button.addEventListener('pointercancel', (e) => {
                releaseBinding(e.pointerId);
            });
            button.addEventListener('contextmenu', (e) => {
                e.preventDefault();
            });
        }
    }

    _resolveVirtualBinding(button) {
        const action = button.dataset.action;
        if (action) {
            return { action };
        }

        const key = button.dataset.key;
        if (key) {
            return { key };
        }

        return null;
    }

    _applyVirtualBinding(binding, isDown) {
        if (binding.action) {
            this._setVirtualState(
                this._virtualActionCounts,
                this._virtualActionsDown,
                this._virtualActionsPressed,
                binding.action,
                isDown,
            );
        }

        if (binding.key) {
            this._setVirtualState(
                this._virtualKeyCounts,
                this._virtualKeysDown,
                this._virtualKeysPressed,
                binding.key,
                isDown,
            );
        }
    }

    _setVirtualState(countMap, downMap, pressedMap, key, isDown) {
        const previousCount = countMap.get(key) || 0;
        const nextCount = isDown ? previousCount + 1 : Math.max(0, previousCount - 1);

        countMap.set(key, nextCount);
        downMap.set(key, nextCount > 0);

        if (isDown && previousCount === 0) {
            pressedMap.set(key, true);
        }
    }

    _updatePointerPosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        this._pointerPos.x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        this._pointerPos.y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
    }

    isActionDown(action) {
        const keys = this._actionMap[action];
        const keyboardDown = keys ? keys.some((key) => this._keysDown.get(key)) : false;
        return keyboardDown || this._virtualActionsDown.get(action) || false;
    }

    isActionPressed(action) {
        const keys = this._actionMap[action];
        const keyboardPressed = keys ? keys.some((key) => this._keysPressed.get(key)) : false;
        return keyboardPressed || this._virtualActionsPressed.get(action) || false;
    }

    isKeyDown(code) {
        return this._keysDown.get(code) || this._virtualKeysDown.get(code) || false;
    }

    isKeyPressed(code) {
        return this._keysPressed.get(code) || this._virtualKeysPressed.get(code) || false;
    }

    getPointerPos() {
        return { x: this._pointerPos.x, y: this._pointerPos.y };
    }

    isPointerDown() {
        return this._pointerDown;
    }

    isPointerClicked() {
        return this._pointerClicked;
    }

    setContext(context) {
        this._context = context;
        this._syncContext();
    }

    getContext() {
        return this._context;
    }

    _syncContext() {
        if (!this._mobileControlsRoot) {
            return;
        }

        this._mobileControlsRoot.dataset.context = this._context;
    }

    endFrame() {
        this._keysPressed.clear();
        this._virtualActionsPressed.clear();
        this._virtualKeysPressed.clear();
        this._pointerClicked = false;
    }
}
