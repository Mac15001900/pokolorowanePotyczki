const DEFAULT_CONFIG = {
    width: 7,
    height: 7,
    maxValue: 4,
    splitAt: 4,
    multiplyAtLargeSplits: false,
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
    }

    addToTile(x, y, value, color) {
        let tile = this.getTile(x, y);
        tile.value++;
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
        return this.tiles.every(t => t.value < this.config.splitAt);
    }

    resolveAll() {
        let count = 0;
        while (!this.isResolved()) {
            this.resolveStep();
            if (count > 1000) {
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
    }

    reset() {
        this.tiles.forEach(t => {
            t.value = 0;
            t.color = 0;
        })
    }
}