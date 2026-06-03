class JoiningGameScene extends Scene {
    constructor() {
        super(SCENE_TYPE.JOINING_GAME);
        this.container = null;
        this._input = null;
        this._roomName = '';
        this.connecting = false;
    }

    get app() { return window.app; }

    start() {
        this.container = new PIXI.Container();
        this.app.stage.addChild(this.container);
        this._input = this._createInput();
        document.getElementById('stage').appendChild(this._input);
        this.draw();
    }

    draw() {
        this.container.removeChildren();
        const W = this.app.renderer.width;
        const H = this.app.renderer.height;
        const cx = Math.floor(W / 2);
        const cy = Math.floor(H / 2);

        const TITLE_STYLE = { fill: 0xfcf0cc, fontSize: 24, fontWeight: 'bold' };
        const LABEL_STYLE = { fill: 0x888888, fontSize: 15 };

        const title = new PIXI.Text({ text: 'Dołącz do gry', style: TITLE_STYLE });
        title.anchor.set(0.5, 0.5);
        title.x = cx;
        title.y = cy - 80;
        this.container.addChild(title);

        const label = new PIXI.Text({ text: 'Nazwa pokoju', style: LABEL_STYLE });
        label.anchor.set(0.5, 0.5);
        label.x = cx;
        label.y = cy - 30;
        this.container.addChild(label);

        this._positionInput(cx, cy - 10);

        const canJoin = this._roomName.trim() !== '';

        const joinBtn = this._makeButton('Dołącz', canJoin ? 0xfcf0cc : 0x666666, canJoin ? 0x111111 : 0x999999, 200, 48);
        joinBtn.x = cx - 100;
        joinBtn.y = cy + 50;
        joinBtn.cursor = canJoin ? 'pointer' : 'default';
        if (canJoin && !this.connecting) {
            joinBtn.on('pointerdown', () => this.onJoinButton());
        } else if (!this.connecting) {
            joinBtn.on('pointerdown', () => {
                this._input.style.outline = '2px solid #ff4444';
                setTimeout(() => { this._input.style.outline = 'none'; }, 600);
            });
        }
        this.container.addChild(joinBtn);

        const backBtn = this._makeButton('Wróć', 0x444444, 0xeeeeee, 200, 48);
        backBtn.x = cx - 100;
        backBtn.y = cy + 110;
        backBtn.on('pointerdown', () => SceneManager.startScene(SCENE_TYPE.MAIN_MENU));
        this.container.addChild(backBtn);

        if (this.connecting) {
            const connectingLabel = new PIXI.Text({ text: 'Łączenie...', style: { fill: 0x888888, fontSize: 15 } });
            connectingLabel.anchor.set(0.5, 0);
            connectingLabel.x = cx;
            connectingLabel.y = cy + 170;
            this.container.addChild(connectingLabel);
        }
    }

    _createInput() {
        const el = document.createElement('input');
        el.type = 'text';
        el.placeholder = 'Wpisz nazwę pokoju';
        el.addEventListener('input', () => { this._roomName = el.value; this.draw(); });
        Object.assign(el.style, {
            position: 'absolute',
            background: '#444',
            color: '#eee',
            border: 'none',
            borderRadius: '6px',
            fontSize: '15px',
            fontWeight: 'bold',
            outline: 'none',
            padding: '0 12px',
            boxSizing: 'border-box',
            textAlign: 'center',
        });
        return el;
    }

    _positionInput(cx, y) {
        const DW = 200, DH = 34;
        const canvas = this.app.canvas;
        const rect = canvas.getBoundingClientRect();
        const scaleX = rect.width / this.app.renderer.width;
        const scaleY = rect.height / this.app.renderer.height;
        this._input.style.left = `${rect.left + Math.round(cx - DW / 2) * scaleX}px`;
        this._input.style.top = `${rect.top + Math.round(y) * scaleY}px`;
        this._input.style.width = `${DW * scaleX}px`;
        this._input.style.height = `${DH * scaleY}px`;
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

    update() {
        // if (this.connecting) this.draw();
    }

    onResize() {
        this.draw();
    }

    onJoinButton() {
        if (this.connecting) return;
        Network.connentToRoom(this._roomName.trim());
        this.connecting = true;
        console.log('joining room: ', this._roomName.trim());
        this.draw();
    }

    end() {
        this._input.remove();
        this.container.destroy({ children: true });
    }
}
