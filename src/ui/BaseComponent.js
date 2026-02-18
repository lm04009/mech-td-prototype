import { BaseScreen } from './BaseScreen.js';

export class BaseComponent {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.container = null;
    }

    mount(parent) {
        this.container = document.createElement('div');
        this.container.classList.add('ui-component');
        parent.appendChild(this.container);
        this.onMount(this.container);
    }

    onMount(container) { }

    unmount() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }

    update(dt) { }
}
