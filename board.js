// PixiJS Grid Base — board.js
// Uses Pixi v8

class BoardScene extends Scene {
    constructor() {
        super(SCENE_TYPE.GAME);
        this.stageEl = document.getElementById('stage');
        this.gridContainer = null;
        this.tokensContainer = null;
        this.config = {
            cols: 5,
            rows: 5,
            baseTileSize: 64
        };
        this.game = null;
        this.UI_COLORS = {
            grid: "fcf0cc",
            background: "46494c",
            extra: "d90368",
            validHiglight: "ffffff",
            inValidHiglight: "333355",
        };
        this.PLAYER_COLORS = [0xfcf0cc, 0x009ffd, 0xf76c5e, 0x44dd88, 0xffd166, 0xcc88ff, 0xff9944, 0x44eedd, 0xff66aa];
        this.PLAYER_NAMES_MIANOWNIK = ["neutralny", "niebieski", "czerwony", "zielony", "żółty", "fioletowy", "pomarańczowy", "seledynowy", "różowy"];
        this.PLAYER_NAMES_DOPEŁNIACZ = ["neutralnego", "niebieskiego", "czerwonego", "zielonego", "żółtego", "fioletowego", "pomarańczowego", "seledynowego", "różowego"];
    }

    get app() { return window.app; }

    start() {
        this.updateTileSize();
        this.game = new Game({ width: this.config.cols, height: this.config.rows });
        this.initBoard();
    }

    update() {
        super.update();
        this.centerBoardInStage();
    }

    onMemberUpdate() {
        super.onMemberUpdate();
        this.drawBorder();
    }

    onResize() {
        super.onResize();
        this.updateTileSize();
        this.fitCanvasToWindow();
    }

    updateTileSize() {
        if (this.config.baseTileSize * this.config.cols > window.innerWidth) {
            this.config.tileSize = Math.floor(window.innerWidth / this.config.cols) - 1;
        } else {
            this.config.tileSize = this.config.baseTileSize;
        }
    }

    initBoard() {
        this.gridContainer = new PIXI.Container();
        this.tokensContainer = new PIXI.Container();

        const boardContainer = new PIXI.Container();
        boardContainer.addChild(this.gridContainer);
        boardContainer.addChild(this.tokensContainer);

        this.app.stage.addChild(boardContainer);
        this.app.boardContainer = boardContainer;

        this.buildGrid();
        this.centerBoardInStage();
        this.setupInteraction();
        this.drawAllTokens();
        this.drawBorder();
    }

    fitCanvasToWindow() {
        if (!this.app || !this.app.boardContainer) return;
        this.app.renderer.resize(this.stageEl.clientWidth, this.stageEl.clientHeight);
        this.centerBoardInStage();
    }

    centerBoardInStage() {
        const { config, app, gridContainer, tokensContainer } = this;
        const boardW = config.cols * config.tileSize;
        const boardH = config.rows * config.tileSize;
        app.boardContainer.x = Math.round((app.renderer.width - boardW) / 2);
        app.boardContainer.y = Math.round((app.renderer.height - boardH) / 2);
        gridContainer.x = 0;
        gridContainer.y = 0;
        tokensContainer.x = 0;
        tokensContainer.y = 0;
    }

    buildGrid() {
        const { config, gridContainer, game } = this;
        gridContainer.removeChildren();

        const g = new PIXI.Graphics();
        const ts = config.tileSize;
        const { cols, rows } = config;

        g.rect(0, 0, cols * ts, rows * ts).fill(0x2b2b2b);
        g.setStrokeStyle({ width: 1, color: 0x444444 });
        for (let x = 0; x <= cols; x++) {
            g.moveTo(x * ts + 0.5, 0.5);
            g.lineTo(x * ts + 0.5, rows * ts + 0.5);
        }
        for (let y = 0; y <= rows; y++) {
            g.moveTo(0.5, y * ts + 0.5);
            g.lineTo(cols * ts + 0.5, y * ts + 0.5);
        }
        g.stroke();
        gridContainer.addChild(g);

        const tileHit = new PIXI.Container();
        tileHit.interactive = true;
        tileHit.hitArea = new PIXI.Rectangle(0, 0, cols * ts, rows * ts);
        gridContainer.addChild(tileHit);

        const highlight = new PIXI.Graphics();
        highlight.visible = false;
        gridContainer.addChild(highlight);

        tileHit.on('pointermove', (e) => {
            const pos = e.data.getLocalPosition(gridContainer);
            const col = Math.floor(pos.x / ts);
            const row = Math.floor(pos.y / ts);
            if (col < 0 || row < 0 || col >= cols || row >= rows || !game.canMoveAt(col, row) || !this.canPlay()) {
                highlight.visible = false;
                return;
            }
            const highlightColor = this.UI_COLORS.validHiglight;
            highlight.visible = true;
            highlight.clear();
            highlight.setStrokeStyle({ width: 2, color: highlightColor, alpha: 0.8 });
            highlight.rect(col * ts + 1, row * ts + 1, ts - 2, ts - 2);
            highlight.fill({ color: highlightColor, alpha: 0.08 });
            highlight.stroke();
        });

        tileHit.on('pointerout', () => { highlight.visible = false; });

        tileHit.on('pointerdown', (e) => {
            const pos = e.data.getLocalPosition(gridContainer);
            const col = Math.floor(pos.x / ts);
            const row = Math.floor(pos.y / ts);
            this.clickTile(col, row);
        });
    }

    drawAllTokens() {
        const { tokensContainer, config, game } = this;
        tokensContainer.removeChildren();
        const ts = config.tileSize;

        for (let r = 0; r < config.rows; r++) {
            for (let c = 0; c < config.cols; c++) {
                const count = game.getTile(c, r).value;
                if (!count) continue;

                const cx = c * ts + ts / 2;
                const cy = r * ts + ts / 2;
                const padding = Math.floor(ts * 0.12);
                const radius = Math.floor((ts - padding * 2) / 2);

                const g = new PIXI.Graphics();
                const mainColor = [0x66ccff, 0xff5500][game.getTile(c, r).color - 1];
                g.circle(cx, cy, radius).fill(mainColor);

                const dotR = Math.max(2, Math.floor(radius * 0.12));
                const spread = radius * 0.55;
                const positions = this.getDotPositions(count, spread);
                for (const [dx, dy] of positions) {
                    g.circle(cx + dx, cy + dy, dotR).fill(0xffffff);
                }

                tokensContainer.addChild(g);
            }
        }
    }

    updateBoard() {
        this.drawAllTokens();
        this.drawBorder();
    }

    getDotPositions(n, spread) {
        const cols = Math.ceil(Math.sqrt(n));
        const rows = Math.ceil(n / cols);
        const stepX = cols > 1 ? spread * 2 / (cols - 1) : 0;
        const stepY = rows > 1 ? spread * 2 / (rows - 1) : 0;
        const offsetX = cols > 1 ? -spread : 0;
        const offsetY = rows > 1 ? -spread : 0;

        const positions = [];
        for (let i = 0; i < n; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            positions.push([offsetX + col * stepX, offsetY + row * stepY]);
        }
        const lastRowCount = n % cols || cols;
        if (lastRowCount < cols) {
            const shift = (cols - lastRowCount) * stepX / 2;
            const lastRowStart = n - lastRowCount;
            for (let i = lastRowStart; i < n; i++) {
                positions[i][0] += shift;
            }
        }
        return positions;
    }

    clickTile(col, row) {
        const { config, game } = this;
        if (col < 0 || row < 0 || col >= config.cols || row >= config.rows) return;
        if (!this.canPlay()) return;
        if (!game.canMoveAt(col, row)) return;
        Network.sendMessage('move', { col, row });
        game.move(col, row);
        game.resolveAll();
        this.drawAllTokens();
        this.drawBorder();
    }

    drawBorder() {
        const { config, game, app, PLAYER_COLORS, PLAYER_NAMES_MIANOWNIK, PLAYER_NAMES_DOPEŁNIACZ } = this;
        let color = PLAYER_COLORS[game.currentTurn];
        let text = `Tura gracza ${PLAYER_NAMES_DOPEŁNIACZ[game.currentTurn]}.`;
        if (game.currentTurn === window.userPlayerId) text = "Twoja tura.";
        if (Network.members) {
            if (Network.members.length === 1) text = "Oczekiwanie na drugiego gracza...";
        } else {
            text = "Łączenie...";
        }
        const victor = game.getVictor();
        if (victor) {
            text = `Wygrywa gracz ${PLAYER_NAMES_MIANOWNIK[victor]}!`;
            color = PLAYER_COLORS[victor];
        }

        if (app.boardBorder) app.boardBorder.destroy();
        const border = new PIXI.Graphics();
        const pad = 4;
        border.setStrokeStyle({ width: pad * 2, color });
        border.rect(-pad, -pad, config.cols * config.tileSize + pad * 2, config.rows * config.tileSize + pad * 2);
        border.stroke();
        app.boardContainer.addChildAt(border, 0);
        app.boardBorder = border;

        if (app.turnLabel) app.turnLabel.destroy();
        const label = new PIXI.Text({
            text: text,
            style: { fill: color, fontSize: 18, fontWeight: 'bold' }
        });
        label.anchor.set(0.5, 0);
        label.x = (config.cols * config.tileSize) / 2;
        label.y = config.rows * config.tileSize + 12;
        app.boardContainer.addChild(label);
        app.turnLabel = label;

        if (app.resetButton) app.resetButton.destroy();
        if (victor) {
            const btn = new PIXI.Container();
            btn.interactive = true;
            btn.cursor = 'pointer';

            const bg = new PIXI.Graphics();
            const bw = 140, bh = 36;
            bg.roundRect(0, 0, bw, bh, 8).fill(color);
            btn.addChild(bg);

            const btnLabel = new PIXI.Text({
                text: 'Zagraj ponownie',
                style: { fill: 0x111111, fontSize: 16, fontWeight: 'bold' }
            });
            btnLabel.anchor.set(0.5);
            btnLabel.x = bw / 2;
            btnLabel.y = bh / 2;
            btn.addChild(btnLabel);

            btn.x = (config.cols * config.tileSize - bw) / 2;
            btn.y = config.rows * config.tileSize + 42;

            btn.on('pointerover', () => bg.tint = 0xbbbbbb);
            btn.on('pointerout', () => bg.tint = 0xffffff);
            btn.on('pointerdown', () => { Network.sendMessage('reset'); });

            app.boardContainer.addChild(btn);
            app.resetButton = btn;
        }
    }

    canPlay() {
        return !this.game.isGameOver() && this.game.currentTurn === window.userPlayerId && Network.members.length >= 2;
    }

    setupInteraction() {
        this.app.canvas.addEventListener('contextmenu', (ev) => { ev.preventDefault(); });
    }

    end() {
        this.app.boardContainer.destroy({ children: true });
    }
}


