class InputManager {
    /**
     * 
     * @param {Game} game 
     * @param {Object} settings 
     * @param {Object} boardConfig
     */
    constructor(game, settings, isHost) {
        this.game = game;
        this.settings = settings;
        this.isHost = isHost;
        this.players = settings.players;
        this.hasRemote = settings.players.some(p => p.type === PLAYER_TYPE.HUMAN_REMOTE);

        this.PLAYER_NAMES_MIANOWNIK = ["neutralny", "niebieski", "czerwony", "zielony", "żółty", "fioletowy", "pomarańczowy", "seledynowy", "różowy"];
        this.PLAYER_NAMES_DOPEŁNIACZ = ["neutralnego", "niebieskiego", "czerwonego", "zielonego", "żółtego", "fioletowego", "pomarańczowego", "seledynowego", "różowego"];
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
        if (!this.hasRemote || !this.isHost) return true;
        else return Network.members && Network.members.length >= this.countPlayerType(PLAYER_TYPE.HUMAN_REMOTE) + 1; //+1 for the local user
    }

    getTurnType() {
        return this.players[this.game.currentTurn - 1].type;
    }

    countPlayerType(type) {
        return this.players.filter(p => p.type === type).length;
    }

    /**
     * Find the color id for a given remote player, based on their order.
     * @param {Number} remoteId Which remote player to get the color for. 0 for the first remote player.
     * @returns {Number|null} Color id for this player, or null if none are left and this player is a spectator
     */
    colorForNextRemotePlayer(remoteId) {
        let remoteColors = this.players.map((p, i) => p.type === PLAYER_TYPE.HUMAN_REMOTE ? i + 1 : null).filter(i => i !== null);
        return remoteColors[remoteId] || null;

    }

    getTurnDescription() {
        if (!this.hasNeededRemotePlayers()) return `Oczekiwanie na graczy...`;
        switch (this.getTurnType()) {
            case PLAYER_TYPE.HUMAN_LOCAL:
                if (this.countPlayerType(PLAYER_TYPE.HUMAN_LOCAL) === 1) return `Twoja tura`;
                else return `Tura gracza ${this.PLAYER_NAMES_DOPEŁNIACZ[this.game.currentTurn]}`;
            case PLAYER_TYPE.HUMAN_REMOTE: return `Oczekiwanie na ruch gracza ${this.PLAYER_NAMES_DOPEŁNIACZ[this.game.currentTurn]}...`;
            default: return 'Bot myśli...';
        }
    }

    /*processBotTurns() {
        if (this.game.isGameOver()) return;
        switch
        while (this.players[this.game.currentTurn].type === PLAYER_TYPE.BOT) this.game.botMove();
    }*/
}