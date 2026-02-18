export class BaseScreen {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.container = null;
        this.eventListeners = [];
    }

    /**
     * Called when the screen is mounted.
     * @param {HTMLElement} parentContainer - The definition container (#ui-layer)
     */
    mount(parentContainer) {
        this.container = document.createElement('div');
        this.container.classList.add('screen-container'); // Helper class
        // Default style - fill? or component based?
        // Screens usually take over, so maybe full size?
        // We'll let CSS handle it via classes or subclasses
        parentContainer.appendChild(this.container);
        this.onMount(this.container);
    }

    /**
     * Override this to build your DOM.
     * @param {HTMLElement} container 
     */
    onMount(container) {
        // Abstract
    }

    /**
     * Called when the screen is unmounted.
     */
    unmount() {
        // Remove event listeners
        this.eventListeners.forEach(cleanup => cleanup());
        this.eventListeners = [];

        // Remove DOM
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.container = null;
        this.onUnmount();
    }

    onUnmount() {
        // Abstract cleanup
    }

    /**
     * Helper to add DOM event listeners that auto-cleanup on unmount.
     * @param {HTMLElement} element 
     * @param {string} event 
     * @param {function} handler 
     */
    addListener(element, event, handler) {
        element.addEventListener(event, handler);
        this.eventListeners.push(() => element.removeEventListener(event, handler));
    }

    /**
     * Updates the screen (if needed per frame).
     * @param {number} dt 
     */
    update(dt) {
        // Optional
    }
}
