class SettingsScene extends Scene {
    constructor() {
        super(SCENE_TYPE.SETTINGS);
        this.container = null;
        this.settings = {
            playerCount: 2,
            players: [{ type: PLAYER_TYPE.HUMAN_LOCAL }, { type: PLAYER_TYPE.HUMAN_LOCAL }, { type: PLAYER_TYPE.HUMAN_LOCAL }, { type: PLAYER_TYPE.HUMAN_LOCAL }, { type: PLAYER_TYPE.HUMAN_LOCAL }, { type: PLAYER_TYPE.HUMAN_LOCAL }, { type: PLAYER_TYPE.HUMAN_LOCAL }, { type: PLAYER_TYPE.HUMAN_LOCAL }],
            boardSize: 5,
            singularExplosions: false,
            shuffleOrder: true,
            roomName: '',
        };
    }

    get app() { return window.app; }

    start() {
        this.container = new PIXI.Container();
        this.overlayContainer = new PIXI.Container();
        this.app.stage.addChild(this.container);
        this.app.stage.addChild(this.overlayContainer);
        this._roomInput = this._createRoomInput();
        document.getElementById('stage').appendChild(this._roomInput);
        this.draw();
    }

    draw() {
        this.container.removeChildren();
        const hasRemote = this.settings.players.slice(0, this.settings.playerCount).some(p => p.type === PLAYER_TYPE.HUMAN_REMOTE);
        const W = this.app.renderer.width;
        const cx = Math.floor(W / 2);
        let y = 40;
        const ROW = 44;
        const LABEL_STYLE = { fill: 0xeeeeee, fontSize: 18 };
        const TITLE_STYLE = { fill: 0xfcf0cc, fontSize: 26, fontWeight: 'bold' };
        const PLAYER_COLORS = [0x009ffd, 0xf76c5e, 0x44dd88, 0xffd166, 0xcc88ff, 0xff9944, 0x44eedd, 0xff66aa];

        // Title
        const title = new PIXI.Text({ text: 'Ustawienia gry', style: TITLE_STYLE });
        title.anchor.set(0.5, 0);
        title.x = cx; title.y = y;
        this.container.addChild(title);
        y += 50;

        // --- Player count ---
        this._addLabel('Liczba graczy:', cx, y, LABEL_STYLE);
        y += ROW;
        const countBtns = this._addButtonGroup(
            ['2', '3', '4', '5', '6', '7', '8'],
            [2, 3, 4, 5, 6, 7, 8],
            this.settings.playerCount,
            cx, y,
            (v) => { this.settings.playerCount = v; this.draw(); }
        );
        this.container.addChild(countBtns);
        y += ROW + 10;

        // --- Per-player type ---
        const PLAYER_OPTIONS = [
            { label: 'Stacjonarny', value: PLAYER_TYPE.HUMAN_LOCAL },
            { label: 'Zdalny', value: PLAYER_TYPE.HUMAN_REMOTE },
            { label: 'Bot - łatwy', value: PLAYER_TYPE.BOT_EASY },
        ];
        this._addLabel('Typy graczy:', cx, y, LABEL_STYLE);
        y += ROW;
        for (let i = 0; i < this.settings.playerCount; i++) {
            const color = PLAYER_COLORS[i];
            const dot = new PIXI.Graphics();
            dot.circle(0, 0, 7).fill(color);
            dot.x = cx - 120; dot.y = y + 14;
            this.container.addChild(dot);

            const pLabel = new PIXI.Text({ text: `Gracz ${i + 1}`, style: { fill: color, fontSize: 16 } });
            pLabel.anchor.set(0, 0.5);
            pLabel.x = cx - 108; pLabel.y = y + 14;
            this.container.addChild(pLabel);

            const idx = i;
            const dd = this._addDropdown(
                PLAYER_OPTIONS,
                this.settings.players[i].type,
                cx + 40, y,
                (v) => { this.settings.players[idx].type = v; this.draw(); }
            );
            this.container.addChild(dd);
            y += ROW;
        }
        y += 10;

        // --- Turn randomisation ---
        this._addLabel('Losój kolejność:', cx, y, LABEL_STYLE);
        y += ROW;
        const shuffleToggle = this._addToggle(
            ['Tak', 'Nie'],
            this.settings.shuffleOrder ? 0 : 1,
            cx, y,
            (v) => { this.settings.shuffleOrder = v === 0; this.draw(); }
        );
        this.container.addChild(shuffleToggle);
        y += ROW + 10;

        // --- Board size ---
        this._addLabel('Rozmiar planszy:', cx, y, LABEL_STYLE);
        y += ROW;
        const sizeBtns = this._addButtonGroup(
            ['4×4', '5×5', '6×6', '7×7', '8×8', '9×9', '10×10', '11×11'],
            [4, 5, 6, 7, 8, 9, 10, 11],
            this.settings.boardSize,
            cx, y,
            (v) => { this.settings.boardSize = v; this.draw(); }
        );
        this.container.addChild(sizeBtns);
        y += ROW + 10;

        // --- Advanced mode ---
        this._addLabel('Eksplodowanie pól > 4:', cx, y, LABEL_STYLE);
        y += ROW;
        const advToggle = this._addToggle(
            ['Po n-3', 'Po 1'],
            this.settings.singularExplosions ? 1 : 0,
            cx, y,
            (v) => { this.settings.singularExplosions = v === 1; this.draw(); }
        );
        this.container.addChild(advToggle);
        y += ROW + 10;

        // --- Room name ---
        if (hasRemote) {
            this._addLabel('Nazwa pokoju:', cx, y, LABEL_STYLE);
            y += ROW;
            this._positionRoomInput(cx, y);
            this._roomInput.style.display = 'block';
            this._roomInput.style.textAlign = 'center';
            y += ROW + 10;
        } else {
            this._roomInput.style.display = 'none';
        }

        // --- Start button ---
        y += 10;
        const canStart = !hasRemote || this.settings.roomName.trim() !== '';
        const startBtn = this._makeButton('Rozpocznij grę', canStart ? 0xfcf0cc : 0x666666, canStart ? 0x111111 : 0x999999, 180, 42);
        startBtn.x = cx - 90; startBtn.y = y;
        startBtn.cursor = canStart ? 'pointer' : 'default';
        if (canStart) {
            startBtn.on('pointerdown', () => SceneManager.startScene(SCENE_TYPE.GAME, this.settings));
        } else {
            startBtn.on('pointerdown', () => {
                this._roomInput.style.outline = '2px solid #ff4444';
                setTimeout(() => { this._roomInput.style.outline = 'none'; }, 600);
            });
        }
        this.container.addChild(startBtn);
    }

    _createRoomInput() {
        const el = document.createElement('input');
        el.type = 'text';
        el.placeholder = '';
        el.value = this.settings.roomName;
        el.addEventListener('input', () => { this.settings.roomName = el.value; this.draw(); });
        Object.assign(el.style, {
            position: 'absolute',
            display: 'none',
            background: '#444',
            color: '#eee',
            border: 'none',
            borderRadius: '6px',
            fontSize: '15px',
            fontWeight: 'bold',
            outline: 'none',
            padding: '0 12px',
            boxSizing: 'border-box',
        });
        return el;
    }

    _positionRoomInput(cx, y) {
        const DW = 160, DH = 34;
        const canvas = this.app.canvas;
        const rect = canvas.getBoundingClientRect();
        const scaleX = rect.width / this.app.renderer.width;
        const scaleY = rect.height / this.app.renderer.height;
        this._roomInput.style.left = `${rect.left + Math.round(cx - DW / 2) * scaleX}px`;
        this._roomInput.style.top = `${rect.top + Math.round(y) * scaleY}px`;
        this._roomInput.style.width = `${DW * scaleX}px`;
        this._roomInput.style.height = `${DH * scaleY}px`;
    }

    _addLabel(text, cx, y, style) {
        const lbl = new PIXI.Text({ text, style });
        lbl.anchor.set(0.5, 0);
        lbl.x = cx; lbl.y = y;
        this.container.addChild(lbl);
    }

    _addButtonGroup(labels, values, selected, cx, y, onChange) {
        const group = new PIXI.Container();
        const BW = 60, BH = 34, GAP = 8;
        const totalW = labels.length * BW + (labels.length - 1) * GAP;
        let bx = cx - Math.floor(totalW / 2);
        labels.forEach((lbl, i) => {
            const isActive = values[i] === selected;
            const btn = this._makeButton(lbl, isActive ? 0x009ffd : 0x444444, isActive ? 0x111111 : 0xeeeeee, BW, BH);
            btn.x = bx; btn.y = y;
            btn.on('pointerdown', () => onChange(values[i]));
            group.addChild(btn);
            bx += BW + GAP;
        });
        return group;
    }

    _addToggle(labels, selected, cx, y, onChange) {
        const group = new PIXI.Container();
        const BW = 110, BH = 34, GAP = 8;
        const totalW = 2 * BW + GAP;
        let bx = cx - Math.floor(totalW / 2);
        labels.forEach((lbl, i) => {
            const isActive = i === selected;
            const btn = this._makeButton(lbl, isActive ? 0x009ffd : 0x444444, isActive ? 0x111111 : 0xeeeeee, BW, BH);
            btn.x = bx; btn.y = y;
            btn.on('pointerdown', () => onChange(i));
            group.addChild(btn);
            bx += BW + GAP;
        });
        return group;
    }

    _addDropdown(options, selectedValue, cx, y, onChange) {
        const DW = 160, DH = 34, ITEM_H = 34;
        const group = new PIXI.Container();
        const selected = options.find(o => o.value === selectedValue) ?? options[0];

        const bg = new PIXI.Graphics();
        bg.roundRect(0, 0, DW, DH, 6).fill(0x444444);
        group.addChild(bg);

        const labelText = new PIXI.Text({ text: selected.label, style: { fill: 0xeeeeee, fontSize: 15, fontWeight: 'bold' } });
        labelText.anchor.set(0, 0.5);
        labelText.x = 12; labelText.y = Math.floor(DH / 2);
        group.addChild(labelText);

        const arrow = new PIXI.Text({ text: '▾', style: { fill: 0xeeeeee, fontSize: 14 } });
        arrow.anchor.set(1, 0.5);
        arrow.x = DW - 10; arrow.y = Math.floor(DH / 2);
        group.addChild(arrow);

        group.interactive = true;
        group.cursor = 'pointer';
        group.x = Math.round(cx - DW / 2);
        group.y = Math.round(y);
        group.on('pointerover', () => { bg.tint = 0xbbbbbb; });
        group.on('pointerout', () => { bg.tint = 0xffffff; });
        group.on('pointerdown', () => {
            this.overlayContainer.removeChildren();
            const globalPos = group.getGlobalPosition();
            const ox = globalPos.x;
            const oy = globalPos.y + DH;

            const backdrop = new PIXI.Graphics();
            backdrop.rect(0, 0, this.app.renderer.width, this.app.renderer.height).fill({ color: 0x000000, alpha: 0 });
            backdrop.interactive = true;
            backdrop.on('pointerdown', () => this.overlayContainer.removeChildren());
            this.overlayContainer.addChild(backdrop);

            const menu = new PIXI.Container();
            menu.x = ox; menu.y = oy;

            const menuBg = new PIXI.Graphics();
            menuBg.roundRect(0, 0, DW, options.length * ITEM_H, 6).fill(0x333333);
            menu.addChild(menuBg);

            options.forEach((opt, i) => {
                const item = new PIXI.Container();
                item.interactive = true;
                item.cursor = 'pointer';
                item.y = i * ITEM_H;

                const itemBg = new PIXI.Graphics();
                itemBg.rect(0, 0, DW, ITEM_H).fill(opt.value === selectedValue ? 0x009ffd : 0x333333);
                item.addChild(itemBg);

                const itemLabel = new PIXI.Text({ text: opt.label, style: { fill: opt.value === selectedValue ? 0x111111 : 0xeeeeee, fontSize: 15 } });
                itemLabel.anchor.set(0, 0.5);
                itemLabel.x = 12; itemLabel.y = Math.floor(ITEM_H / 2);
                item.addChild(itemLabel);

                item.on('pointerover', () => { if (opt.value !== selectedValue) itemBg.tint = 0x888888; });
                item.on('pointerout', () => { itemBg.tint = 0xffffff; });
                item.on('pointerdown', () => {
                    this.overlayContainer.removeChildren();
                    onChange(opt.value);
                });
                menu.addChild(item);
            });

            this.overlayContainer.addChild(menu);
        });

        return group;
    }

    _makeButton(text, bgColor, textColor, w, h) {
        const btn = new PIXI.Container();
        btn.interactive = true;
        btn.cursor = 'pointer';

        const bg = new PIXI.Graphics();
        bg.roundRect(0, 0, w, h, 6).fill(bgColor);
        btn.addChild(bg);

        const lbl = new PIXI.Text({ text, style: { fill: textColor, fontSize: 15, fontWeight: 'bold' } });
        lbl.anchor.set(0.5);
        lbl.x = Math.floor(w / 2); lbl.y = Math.floor(h / 2);
        btn.addChild(lbl);

        btn.on('pointerover', () => { bg.tint = 0xbbbbbb; });
        btn.on('pointerout', () => { bg.tint = 0xffffff; });

        return btn;
    }

    onResize() {
        this.draw();
    }

    end() {
        this._roomInput.remove();
        this.container.destroy({ children: true });
        this.overlayContainer.destroy({ children: true });
    }
}
