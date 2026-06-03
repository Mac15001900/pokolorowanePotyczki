class MainMenuScene extends Scene {
    constructor() {
        super(SCENE_TYPE.MAIN_MENU);
        this.container = null;
        this._joinInput = null;
    }

    get app() { return window.app; }

    start() {
        this.container = new PIXI.Container();
        this.app.stage.addChild(this.container);
        this._joinInput = this._createJoinInput();
        document.getElementById('stage').appendChild(this._joinInput);
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

        const subtitle = new PIXI.Text({ text: 'Wybierz opcję, aby rozpocząć', style: SUBTITLE_STYLE });
        subtitle.anchor.set(0.5, 0.5);
        subtitle.x = cx;
        subtitle.y = cy - 80;
        this.container.addChild(subtitle);

        // --- New game button ---
        const newBtn = this._makeButton('Nowa gra', 0xfcf0cc, 0x111111, 200, 48);
        newBtn.x = cx - 100;
        newBtn.y = cy - 24;
        newBtn.on('pointerdown', () => SceneManager.startScene(SCENE_TYPE.SETTINGS));
        this.container.addChild(newBtn);

        // --- Join game ---
        const JOIN_Y = cy + 50;
        const joinBtn = this._makeButton('Dołącz do gry', 0x444444, 0xeeeeee, 200, 48);
        joinBtn.x = cx - 100;
        joinBtn.y = JOIN_Y;
        joinBtn.on('pointerdown', () => SceneManager.startScene(SCENE_TYPE.GAME, { join: this._joinInput.value.trim() }));
        this.container.addChild(joinBtn);

        const INPUT_Y = JOIN_Y + 62;
        this._positionJoinInput(cx, INPUT_Y);
        this._joinInput.style.display = 'block';

        const hint = new PIXI.Text({ text: 'Nazwa pokoju', style: { fill: 0x666666, fontSize: 13 } });
        hint.anchor.set(0.5, 0);
        hint.x = cx;
        hint.y = INPUT_Y - 20;
        this.container.addChild(hint);
    }

    _createJoinInput() {
        const el = document.createElement('input');
        el.type = 'text';
        el.placeholder = 'Wpisz nazwę pokoju';
        Object.assign(el.style, {
            position: 'absolute',
            background: '#333',
            color: '#eee',
            border: '1px solid #555',
            borderRadius: '6px',
            fontSize: '15px',
            outline: 'none',
            padding: '0 12px',
            boxSizing: 'border-box',
            textAlign: 'center',
        });
        return el;
    }

    _positionJoinInput(cx, y) {
        const DW = 200, DH = 38;
        const canvas = this.app.canvas;
        const rect = canvas.getBoundingClientRect();
        const scaleX = rect.width / this.app.renderer.width;
        const scaleY = rect.height / this.app.renderer.height;
        this._joinInput.style.left   = `${rect.left + Math.round(cx - DW / 2) * scaleX}px`;
        this._joinInput.style.top    = `${rect.top  + Math.round(y) * scaleY}px`;
        this._joinInput.style.width  = `${DW * scaleX}px`;
        this._joinInput.style.height = `${DH * scaleY}px`;
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
        btn.on('pointerout',  () => { bg.tint = 0xffffff; });

        return btn;
    }

    onResize() {
        this.draw();
    }

    end() {
        this._joinInput.remove();
        this.container.destroy({ children: true });
    }
}
