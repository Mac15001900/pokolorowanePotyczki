if (!debugConfig) window.debugConfig = {}; //If debug config is not present, assume all options are false

const Network = {
    gameState: { received: false, game: null, config: null },
    members: [],
    drone: null,
    roomName: null,

    init() {
        const ROOM_BASE = 'observable-main-';
        const CHANNEL_ID = '7cWu8Jb0yB8VhORw';
        this.roomName = ROOM_BASE + this.getRoomName();

        this.drone = new ScaleDrone(CHANNEL_ID, {
            data: {
                name: this.getUsername(),
            },
        });

        this.drone.on('open', error => {
            if (error) return console.error(error);
            console.log('Successfully connected to Scaledrone');

            const room = this.drone.subscribe(this.roomName);
            room.on('open', error => {
                if (error) return console.error(error);
                console.log('Successfully joined room');
            });

            room.on('members', m => {
                this.members = m.filter(x => !this.isDebugger(x));
                if (this.members.length === 1) {
                    this.gameState.received = true;
                }
                window.userPlayerId = this.members.length;
                SceneManager.onMemberUpdate();
            });

            room.on('member_join', member => {
                if (this.isDebugger(member)) return;
                this.members.push(member);
                if (this.gameState.received) {
                    this.gameState.memberData = this.members;
                    this.sendMessage('welcome', this.gameState);
                }
                SceneManager.onMemberUpdate();
            });

            room.on('member_leave', ({ id }) => {
                if (!this.getMember(id)) return;
                const index = this.members.findIndex(member => member.id === id);
                this.members.splice(index, 1);
            });

            room.on('data', (data, serverMember) => this.receiveMessage(data, serverMember));
        });
    },

    getUsername() {
        var name;
        if (debugConfig.random_username) name = this.getRandomName();
        else name = prompt(s.enter_username, "");

        while (!name) {
            name = prompt(s.enter_username_non_empty, "");
        }
        myName = name;
        return name;
    },

    getRandomName() {
        const adjs = ["autumn", "hidden", "bitter", "misty", "silent", "empty", "dry", "dark", "summer", "icy", "delicate", "quiet", "white", "cool", "spring", "winter", "patient"];
        const nouns = ["waterfall", "river", "breeze", "moon", "rain", "wind", "sea", "morning", "snow", "lake", "sunset", "pine", "shadow", "leaf", "dawn", "glitter", "forest", "hill"];
        return adjs[Math.floor(Math.random() * adjs.length)] + "_" + nouns[Math.floor(Math.random() * nouns.length)];
    },

    getRoomName() {
        if (debugConfig.dev_server) return "dev";
        if (debugConfig.random_server) return (Math.random() * 1000) + "";

        const s = { enter_room_name: "Wpisz nazwę pokoju" };

        var roomFromURL = (new URLSearchParams(window.location.search)).get('room');
        if (roomFromURL) return roomFromURL;

        var chosenName = prompt(s.enter_room_name);
        while (!chosenName) chosenName = prompt(s.enter_room_name);
        return chosenName;
    },

    getMember(input) {
        let id = typeof input === 'object' ? input.id : input;
        let res = this.members.find(m => m.id === id);
        if (!res) console.error('Member with id ' + id + ' not found.');
        return res;
    },

    isDebugger(member) {
        return member.authData && member.authData.user_is_from_scaledrone_debugger;
    },

    sendMessage(type, content) {
        if (debugConfig.disable_messages) return;
        const message = { type, content };
        if (this.members.length === 1) this.receiveMessage(message, this.members[0]);
        else this.drone.publish({ room: this.roomName, message });
    },

    receiveMessage(data, serverMember) {
        if (debugConfig.log_messages) console.log(data);
        if (!serverMember) return;
        const member = this.getMember(serverMember);
        switch (data.type) {
            case 'general':
                break;
            case 'debug':
                console.log(data.content);
                break;
            case 'welcome':
                if (!this.gameState.received) {
                    this.gameState = data.content;
                }
                break;
            case 'move':
                if (member.id !== this.drone.clientId && SceneManager.inScene(SCENE_TYPE.GAME)) {
                    // SceneManager.scene.game.move(data.content.col, data.content.row);
                    // SceneManager.scene.game.resolveAll();
                    SceneManager.scene.inputManager.processRemoteInput(data.content.col, data.content.row);
                    SceneManager.scene.updateBoard();
                }
                break;
            case 'reset':
                if (SceneManager.inScene(SCENE_TYPE.GAME)) {
                    SceneManager.scene.game.reset();
                    SceneManager.scene.updateBoard();
                }
                break;
            default:
                console.error('Unkown message type received: ' + data.type);
        }
    },
};

Network.init();

//Translation, might get used one day
/*
let lang = 'en'; //Specify default language here (will be used if requested language is not supported)
const languages = { 'en': enStrings, 'pl': plStrings };
let s = languages[lang];

function initLanguage() {
  var browsers = navigator.language; //Gets browser's language.
  if (languages[browsers]) lang = languages[browsers]; //If not supported, we just keep the default
  translate();
}

function changeLanguage(newLanguage) { //Call this to change current language
  if (!languages[newLanguage]) return;
  lang = newLanguage;
  s = languages[newLanguage];
  translate();
}

function translate() {
  var allDom = document.getElementsByTagName("*");
  for (var i = 0; i < allDom.length; i++) {
    var elem = allDom[i];
    var data = elem.dataset;
    //Note: only 'innerHTML', 'value' and 'placeholder'will be translated. Support for more must be added here first
    if (data.s) elem.innerHTML = s[data.s];
    if (data.sInnerHTML) elem.innerHTML = s[data.sInnerHTML];
    if (data.sValue) elem.value = s[data.sValue];
    if (data.sPlaceholder) elem.placeholder = s[data.sPlaceholder];
  }
}

initLanguage(); //Must be called before any user interaction
*/