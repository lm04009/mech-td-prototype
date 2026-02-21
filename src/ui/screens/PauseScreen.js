import { BaseScreen } from '../BaseScreen.js';

export class PauseScreen extends BaseScreen {
    onMount(container) {
        container.className = 'screen-overlay';

        const title = document.createElement('div');
        title.className = 'screen-title';
        title.textContent = 'PAUSED';
        title.style.color = '#fff';
        title.style.textShadow = '0 0 10px #fff';
        container.appendChild(title);

        const instruction = document.createElement('div');
        instruction.style.fontSize = '24px';
        instruction.style.marginTop = '20px';
        instruction.textContent = 'Press ESC to resume';
        container.appendChild(instruction);
    }
}
