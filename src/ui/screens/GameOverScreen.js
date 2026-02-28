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
        const scene = this.uiManager.game.currentScene;
        reason.textContent = (scene && scene.gameOverReason) ? scene.gameOverReason : 'Critical Failure';
        container.appendChild(reason);

        const restartBtn = document.createElement('button');
        restartBtn.className = 'btn';
        restartBtn.textContent = 'REBOOT SYSTEM';
        restartBtn.onclick = () => {
            // Dynamic import because of cyclical dependency if we try top-level
            import('../../game/BaseScene.js').then(module => {
                this.uiManager.game.switchScene(new module.BaseScene());
            });
        };
        container.appendChild(restartBtn);
    }
}
