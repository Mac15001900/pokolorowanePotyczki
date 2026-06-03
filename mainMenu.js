class MainMenuScene extends Scene {
    constructor() {
        super(SCENE_TYPE.MAIN_MENU);
        this.container = null;
    }

    get app() { return window.app; }

    start() {
        this.container = new PIXI.Container();
        this.app.stage.addChild(this.container);
        this.draw();
    }

    draw() {
        this.container.removeChildren();
        const W = this.app.renderer.width;
        const H = this.app.renderer.height;
        const cx = Math.floor(W / 2);
        const cy = Math.floor(H / 2);

        const PLAYER_COLORS = [0x009ffd, 0xf76c5e, 0x44dd88, 0xffd166, 0xcc88ff, 0xff9944, 0x44eedd, 0xff66aa];
        const gradient = new PIXI.FillGradient(0, 0, 1, 0);
        PLAYER_COLORS.forEach((c, i) => gradient.addColorStop(i / (PLAYER_COLORS.length - 1), c));
        const TITLE_STYLE = { fill: gradient, fontSize: 36, fontWeight: 'bold' };
        const SUBTITLE_STYLE = { fill: 0x888888, fontSize: 15 };

        const title = new PIXI.Text({ text: 'Pokolorowane Potyczki', style: TITLE_STYLE });
        title.anchor.set(0.5, 0.5);
        title.x = cx;
        title.y = cy - 120;
        this.container.addChild(title);

        const subtitle = new PIXI.Text({ text: 'Wersja 1.1', style: SUBTITLE_STYLE });
        subtitle.anchor.set(0.5, 0.5);
        subtitle.x = cx;
        subtitle.y = cy - 80;
        this.container.addChild(subtitle);

        // --- New game button ---
        const newBtn = this._makeButton('Stwórz grę', 0xfcf0cc, 0x111111, 200, 48);
        newBtn.x = cx - 100;
        newBtn.y = cy - 24;
        newBtn.on('pointerdown', () => SceneManager.startScene(SCENE_TYPE.SETTINGS));
        this.container.addChild(newBtn);

        // --- Join game ---
        const joinBtn = this._makeButton('Dołącz do gry', 0x444444, 0xeeeeee, 200, 48);
        joinBtn.x = cx - 100;
        joinBtn.y = cy + 50;
        joinBtn.on('pointerdown', () => SceneManager.startScene(SCENE_TYPE.JOINING_GAME));
        this.container.addChild(joinBtn);
    }

    _makeButton(text, bgColor, textColor, w, h) {
        const btn = new PIXI.Container();
        btn.interactive = true;
        btn.cursor = 'pointer';

        const bg = new PIXI.Graphics();
        bg.roundRect(0, 0, w, h, 8).fill(bgColor);
        btn.addChild(bg);

        const lbl = new PIXI.Text({ text, style: { fill: textColor, fontSize: 17, fontWeight: 'bold' } });
        lbl.anchor.set(0.5);
        lbl.x = Math.floor(w / 2);
        lbl.y = Math.floor(h / 2);
        btn.addChild(lbl);

        btn.on('pointerover', () => { bg.tint = 0xbbbbbb; });
        btn.on('pointerout', () => { bg.tint = 0xffffff; });

        return btn;
    }

    onResize() {
        this.draw();
    }

    end() {
        this.container.destroy({ children: true });
    }
}
