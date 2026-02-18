import { BaseScreen } from '../BaseScreen.js';

export class GameOverScreen extends BaseScreen {
    onMount(container) {
        container.className = 'screen-overlay';

        const title = document.createElement('div');
        title.className = 'screen-title';
        title.textContent = 'MISSION FAILED';
        title.style.color = '#f00';
        container.appendChild(title);

        const reason = document.createElement('div');
        reason.style.fontSize = '24px';
        reason.style.marginBottom = '40px';
        reason.textContent = this.uiManager.game.gameOverReason || 'Critical Failure';
        container.appendChild(reason);

        const restartBtn = document.createElement('button');
        restartBtn.className = 'btn';
        restartBtn.textContent = 'REBOOT SYSTEM';
        restartBtn.onclick = () => {
            this.uiManager.game.reset();
            this.uiManager.hideScreen(); // Or switch to HUD/Main
        };
        container.appendChild(restartBtn);
    }
}
