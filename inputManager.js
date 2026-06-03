class InputManager {
    /**
     * 
     * @param {Game} game 
     * @param {Object} settings 
     * @param {Object} boardConfig
     */
    constructor(game, settings) {
        this.game = game;
        this.settings = settings;
        this.players = settings.players;
        this.hasRemote = settings.players.some(p => p.type === PLAYER_TYPE.HUMAN_REMOTE);
    }

    processLocalInput(col, row) {
        const { game } = this;
        if (col < 0 || row < 0 || col >= this.settings.boardSize || row >= this.settings.boardSize) return;
        if (!this.needsLocalInput()) return;
        if (!game.canMoveAt(col, row)) return;
        if (this.hasRemote) Network.sendMessage('move', { col, row });
        game.move(col, row);
        game.resolveAll();
        //TODO - handle bot turns
    }

    processRemoteInput(x, y) {
        if (!this.hasRemote) return;
        const { game } = this;
        this.game.move(x, y);
        this.game.resolveAll();
    }

    needsLocalInput() {
        return this.players[this.game.currentTurn - 1].type === PLAYER_TYPE.HUMAN_LOCAL && !this.game.isGameOver() && this.hasNeededRemotePlayers();
    }

    hasNeededRemotePlayers() {
        if (!this.hasRemote) return true;
        else return Network.members && Network.members.length >= this.countPlayerType(PLAYER_TYPE.HUMAN_REMOTE) + 1; //+1 for the local user
    }

    getTurnType() {
        return this.players[this.game.currentTurn - 1].type;
    }

    countPlayerType(type) {
        return this.players.filter(p => p.type === type).length;
    }

    /*processBotTurns() {
        if (this.game.isGameOver()) return;
        switch
        while (this.players[this.game.currentTurn].type === PLAYER_TYPE.BOT) this.game.botMove();
    }*/
}