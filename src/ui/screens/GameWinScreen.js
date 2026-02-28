import { BaseScreen } from '../BaseScreen.js';

export class GameWinScreen extends BaseScreen {
    onMount(container) {
        container.className = 'screen-overlay';

        const title = document.createElement('div');
        title.className = 'screen-title';
        title.textContent = 'MISSION ACCOMPLISHED';
        title.style.color = '#0f0';
        container.appendChild(title);

        const sub = document.createElement('div');
        sub.style.fontSize = '24px';
        sub.style.marginBottom = '40px';
        sub.style.color = '#fff';
        sub.textContent = 'All objectives complete.';
        container.appendChild(sub);

        const restartBtn = document.createElement('button');
        restartBtn.className = 'btn';
        restartBtn.textContent = 'RETURN TO BASE';
        restartBtn.onclick = () => {
            import('../../game/BaseScene.js').then(module => {
                this.uiManager.game.switchScene(new module.BaseScene());
            });
        };
        container.appendChild(restartBtn);
    }
}
