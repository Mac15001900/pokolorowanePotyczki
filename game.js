const DEFAULT_CONFIG = {
    width: 5,
    height: 5,
    maxValue: 4,
    splitAt: 4,
    multiplyAtLargeSplits: false,
    amountOfPlayers: 2,
}

class Game {
    constructor(config = DEFAULT_CONFIG) {
        this.config = Object.assign({}, DEFAULT_CONFIG, config);
        this.tiles = new Array(this.config.width * this.config.height);
        for (let i = 0; i < this.tiles.length; i++) {
            this.tiles[i] = {
                value: 0,
                color: 0,
            }
        }
        this.addStartingPositions();
        this.currentTurn = 1;
    }

    addStartingPositions() {
        let positions = this.makeStartingPositions(this.config.amountOfPlayers, this.config.width, this.config.height);
        for (let playerId = 1; playerId <= this.config.amountOfPlayers; playerId++) {
            for (let i = 0; i < positions[playerId - 1].length; i++) {
                const { x, y, value } = positions[playerId - 1][i];
                if (x === undefined || y == undefined || value == undefined) console.error("No starting position specified for player " + playerId);
                this.addToTile(x, y, value, playerId);
            }
        }
    }

    canMoveAt(x, y) {
        if (this.isGameOver()) return false;
        return this.getTile(x, y).color === this.currentTurn && this.getTile(x, y).value > 0;
    }

    move(x, y) {
        this.addToTile(x, y, 1, this.currentTurn);
        this.resolveAll();
        this.advanceTurn();
    }

    addToTile(x, y, value, color) {
        let tile = this.getTile(x, y);
        tile.value += value;
        tile.color = color;
    }

    getTile(x, y) {
        return this.tiles[x + y * this.config.width];
    }

    resolveStep() {
        let splitIndexes = this.tiles.map((t, i) => t.value >= this.config.splitAt ? i : null).filter(v => v !== null);
        splitIndexes.forEach(i => {
            let y = Math.floor(i / this.config.width);
            let x = i % this.config.width;
            this.splitTile(x, y);
        })
    }

    isResolved() {
        return this.tiles.every(t => t.value < this.config.splitAt) || this.getVictor();
    }

    resolveAll() {
        let count = 0;
        while (!this.isResolved()) {
            this.resolveStep();
            count++;
            if (count > 10000) {
                console.error("Potential infinite loop in resolve. Stopping");
                return;
            }
        }
    }

    splitTile(x, y) {
        let tile = this.getTile(x, y);
        let neighbors = [
            { x: x - 1, y },
            { x: x + 1, y },
            { x, y: y - 1 },
            { x, y: y + 1 }
        ].filter(p => p.x >= 0 && p.y >= 0 && p.x < this.config.width && p.y < this.config.height);
        neighbors.forEach(p => {
            let amountAdded = this.config.multiplyAtLargeSplits ? (tile.value - this.config.splitAt + 1) : 1;
            this.addToTile(p.x, p.y, amountAdded, tile.color);
        })
        tile.value = 0;
        tile.color = 0;
    }

    advanceTurn() {
        this.currentTurn = this.currentTurn % this.config.amountOfPlayers + 1;
        while (this.isPlayerEliminated(this.currentTurn)) this.advanceTurn();
    }

    isPlayerEliminated(color) {
        return !this.tiles.some(t => t.color === color);
    }

    getVictor() {
        let color = this.tiles.find(t => t.color > 0)?.color;
        if (!color) return 0;
        if (this.tiles.every(t => t.color === color || t.color === 0)) return color;
        else return 0;
    }

    isGameOver() {
        return this.getVictor() > 0;
    }

    reset() {
        this.tiles.forEach(t => {
            t.value = 0;
            t.color = 0;
        })
        this.addStartingPositions();
        this.currentTurn = 1;
    }

    makeStartingPositions(amountOfPlayers, width, height) {
        let positions = [];
        for (let i = 1; i <= amountOfPlayers; i++) {
            let x = 0, y = 0;
            switch (i) {
                case 1: x = 1; y = height - 2; break;
                case 2: x = width - 2; y = 1; break;
                case 3: x = 1; y = 1; break;
                case 4: x = width - 2; y = height - 2; break;
                case 5: x = 1; y = Math.floor(height / 2); break;
                case 6: x = Math.floor(width / 2); y = height - 2; break;
                case 7: x = width - 2; y = Math.floor(height / 2); break;
                case 8: x = Math.floor(width / 2); y = 1; break;
            }
            if (height % 2 == 0 && i === 7) y--;
            if (width % 2 == 0 && i === 8) x--;
            positions.push([{ x, y, value: 3 }]);
        }
        console.log(positions);
        return positions;
    }
}