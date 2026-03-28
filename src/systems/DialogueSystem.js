import { SceneType } from '../core/SceneManager.js';
import { DIALOGUES } from '../data/dialogues.js';
import { TextBox } from '../ui/TextBox.js';
import { Button } from '../ui/Button.js';
import { CANVAS } from '../data/constants.js';

export class DialogueSystem {
    constructor(context, dialogueId, options = {}) {
        this.type = SceneType.MODAL_OVERLAY;
        this.context = context;
        this.onComplete = options.onComplete || null;

        this._dialogue = DIALOGUES[dialogueId];
        this._nodeMap = new Map();
        for (const node of this._dialogue.nodes) {
            this._nodeMap.set(node.id, node);
        }

        this._currentNode = null;
        this._textBox = new TextBox();
        this._choiceButtons = [];
        this._choiceIndex = 0;
        this._showingChoices = false;
        this._done = false;

        this._goToNode('start');
    }

    onEnter() {
        this.context.input.setContext('dialogue');
    }

    onExit() {
        this.context.input.setContext('exploration');
    }

    _goToNode(nodeId) {
        const node = this._nodeMap.get(nodeId);
        if (!node) {
            this._endDialogue();
            return;
        }

        this._currentNode = node;
        this._textBox.setText(node.speaker, node.text);
        this._showingChoices = false;
        this._choiceButtons = [];
        this._choiceIndex = 0;

        if (node.setFlag) {
            this.context.state.quest.flags.set(node.setFlag.key, node.setFlag.value);
        }
    }

    _showChoices() {
        const choices = this._currentNode.choices;
        this._choiceButtons = [];
        this._choiceIndex = 0;
        this._showingChoices = true;

        const btnW = 140;
        const btnH = 14;
        const gap = 2;
        const totalH = choices.length * (btnH + gap) - gap;
        const startY = this._textBox.y - totalH - 4;
        const startX = Math.round((CANVAS.INTERNAL_WIDTH - btnW) / 2);

        for (let i = 0; i < choices.length; i++) {
            const choice = choices[i];
            const btn = new Button(
                startX,
                startY + i * (btnH + gap),
                btnW,
                btnH,
                choice.text,
                () => this._selectChoice(choice),
            );
            this._choiceButtons.push(btn);
        }

        this._choiceButtons[0].focused = true;
    }

    _selectChoice(choice) {
        if (choice.setFlag) {
            this.context.state.quest.flags.set(choice.setFlag.key, choice.setFlag.value);
        }

        if (choice.nextNode) {
            this._goToNode(choice.nextNode);
        } else {
            this._endDialogue();
        }
    }

    _endDialogue() {
        this._done = true;
        this.context.scenes.pop();
        if (this.onComplete) {
            this.onComplete();
        }
    }

    handleInput(input) {
        if (this._done) return;

        if (this._showingChoices) {
            if (input.isActionPressed('moveUp')) {
                this._choiceButtons[this._choiceIndex].focused = false;
                this._choiceIndex = (this._choiceIndex - 1 + this._choiceButtons.length) % this._choiceButtons.length;
                this._choiceButtons[this._choiceIndex].focused = true;
                this.context.audio.playSFX('menu_confirm');
            } else if (input.isActionPressed('moveDown')) {
                this._choiceButtons[this._choiceIndex].focused = false;
                this._choiceIndex = (this._choiceIndex + 1) % this._choiceButtons.length;
                this._choiceButtons[this._choiceIndex].focused = true;
                this.context.audio.playSFX('menu_confirm');
            } else if (input.isActionPressed('confirm')) {
                this._choiceButtons[this._choiceIndex].activate();
            }
            return;
        }

        if (input.isActionPressed('confirm') || input.isActionPressed('interact')) {
            this.context.audio.playSFX('menu_confirm');
            if (!this._textBox.isFullyRevealed()) {
                this._textBox.rushReveal();
            } else {
                this._advanceNode();
            }
        }
    }

    _advanceNode() {
        const node = this._currentNode;
        if (!node) {
            this._endDialogue();
            return;
        }

        if (node.choices) {
            this._showChoices();
        } else if (node.nextNode) {
            this._goToNode(node.nextNode);
        } else {
            this._endDialogue();
        }
    }

    update(dt) {
        if (this._done) return;

        this._textBox.update(dt);

        for (const btn of this._choiceButtons) {
            btn.update(dt);
        }
    }

    render(ctx) {
        this._textBox.draw(ctx);

        for (const btn of this._choiceButtons) {
            btn.draw(ctx);
        }
    }
}
