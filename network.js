if (!debugConfig) window.debugConfig = {}; //If debug config is not present, assume all options are false

//References to dynamic DOM elements


var gameState = { received: false, game: null, config: null }; //GameState, this is shared with any player that joins the game


//Name and room selection
function getUsername() {
    var name;
    if (debugConfig.random_username) name = getRandomName();
    else name = prompt(s.enter_username, "");

    while (!name) {
        var name = prompt(s.enter_username_non_empty, "");
    }
    myName = name;
    return (name);
}

function getRandomName() {
    const adjs = ["autumn", "hidden", "bitter", "misty", "silent", "empty", "dry", "dark", "summer", "icy", "delicate", "quiet", "white", "cool", "spring", "winter", "patient"];
    const nouns = ["waterfall", "river", "breeze", "moon", "rain", "wind", "sea", "morning", "snow", "lake", "sunset", "pine", "shadow", "leaf", "dawn", "glitter", "forest", "hill"];
    const name = adjs[Math.floor(Math.random() * adjs.length)] + "_" + nouns[Math.floor(Math.random() * nouns.length)];
    return (name);
}

function getRoomName() {
    //Check if set by debug options
    if (debugConfig.dev_server) return "dev";
    if (debugConfig.random_server) return (Math.random() * 1000) + "";

    let s = { //TEMP
        enter_room_name: "Wpisz nazwę pokoju"
    }

    //Try to get it from the URL
    var roomFromURL = (new URLSearchParams(window.location.search)).get('room');
    if (roomFromURL) return roomFromURL;

    //If that fails, ask the user for it. If removing DOM, try to make 'shareableLink' accessible another way
    var chosenName = prompt(s.enter_room_name);
    while (!chosenName) chosenName = prompt(s.enter_room_name);
    var shareableLink = encodeURI(window.location.origin + window.location.pathname + "?room=" + chosenName);
    return chosenName;
}

//Translation
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

//Networking
const ROOM_BASE = 'observable-main-'
const CHANNEL_ID = '7cWu8Jb0yB8VhORw';
let roomName = ROOM_BASE + getRoomName();

function getMember(input) {
    let id = input;
    if (typeof input === 'object') id = input.id;
    let res = members.find(m => m.id === id);
    if (!res) console.error('Member with id ' + id + ' not found.');
    return res;
}

function isDebugger(member) {
    return member.authData && member.authData.user_is_from_scaledrone_debugger;
}

function sendMessage(type, content) {
    if (debugConfig.disable_messages) return;
    var message = { type: type, content: content };
    if (members.length === 1) receiveMessage(message, members[0]); //Won't send anything over the network if we're the only player
    else drone.publish({ room: roomName, message: message });
}

const drone = new ScaleDrone(CHANNEL_ID, {
    data: { // Will be sent out as clientData via events
        name: getUsername(),
    },
});

drone.on('open', error => {
    if (error) {
        return console.error(error);
    }
    console.log('Successfully connected to Scaledrone');

    const room = drone.subscribe(roomName);
    room.on('open', error => {
        if (error) {
            return console.error(error);
        }
        console.log('Successfully joined room');
    });

    // List of currently online members, emitted once
    room.on('members', m => {
        members = m.filter(x => !isDebugger(x));
        if (members.length === 1) {
            //This is what happens when the player joins an empty room
            gameState.received = true;
        }
        window.userPlayerId = members.length;
        updateBoard();
    });

    // User joined the room
    room.on('member_join', member => {
        if (isDebugger(member)) return;
        members.push(member);
        if (gameState.received) {
            gameState.memberData = members;
            sendMessage('welcome', gameState);
        }
        updateBoard();
    });

    // User left the room
    room.on('member_leave', ({ id }) => {
        if (!getMember(id)) return; //If they don't exist, it was probably the debugger
        const index = members.findIndex(member => member.id === id);
        members.splice(index, 1);
    });

    room.on('data', receiveMessage);

});

function receiveMessage(data, serverMember) {
    if (debugConfig.log_messages) console.log(data);
    if (serverMember) {
        let member = getMember(serverMember);
        //console.log(member);
        switch (data.type) {
            case 'general': //Example message type no 1
                break;
            case 'debug': //Example message type no 2
                console.log(data.content);
                break;
            case 'welcome': //Sent whenever a new player joins the game, informing them of the game state
                if (!gameState.received) {
                    //This is what happens after the player joins a non-empty room
                    gameState = data.content;
                    //'gs' will now contain 'memberData' with all extra info about members; you might want to copy it to 'members'
                }
                break;
            case 'move':
                if (member.id !== drone.clientId) {
                    game.move(data.content.col, data.content.row);
                    game.resolveAll();
                    updateBoard();
                }
                break;
            case 'reset':
                game.reset();
                updateBoard();
                break;
            default: console.error('Unkown message type received: ' + data.type);
        }
    } else {
    }
}
















