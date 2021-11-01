// Ya know what? Lets try and keep this to a single JS file.
// Might make this interesting, or just hellish.

// Requires:
//   colors
//   axios
//   websockets
//   events
//   form-data
//   ansi-escape-sequences

// I'd like to keep non-core dependencies to a minimum but, eh...

//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////

'use strict';

let FChatCredentials = {
	username: 'someone',
	password: 'abcdefg0123'
};

let colors = require('colors');
let WebSocketClient = require('websocket').client;
let axios = require('axios');
let FormData = require('form-data');
let EventEmitter = require('events');

let ansi = require('ansi-escape-sequences');

//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////

// The FChat Instance class.
class fChatInstance extends EventEmitter {
	constructor (credentials) {
		super();
		this.ticket = null;
		
		this.userCredentials = FChatCredentials;
		this.userData = {};
		
		this.clientName = 'fTerm';
		this.clientVersion = '1.0.0';
		
		this.socket = null;
		this.con = null;
	}
	
	/////////////////////////////////////////////////
	// Part of the initialization process, 
	// creates a websocket with F-Chat and
	// identifies the client with their servers.
	/////////////////////////////////////////////////

	setCredentials(credentials)
	{
		this.userCredentials = credentials;
	}
	
	async connect(serverUrl = 'wss://chat.f-list.net/chat2')
	{
		this.emit('socket_opening');
		
		this.socket = new WebSocketClient();
		
		this.socket.on('connect', (con) => {
			this.con = con;
			this.emit('socket_connected');
			
			this.identify();
			
			con.on('error', (err) => {
				this.emit('socket_error', err.toString());
			});
			
			con.on('close', (o_O) => {
				this.emit('socket_closed');
			});
			
			con.on('message', (msg) => {
				this.parse(msg.utf8Data);
			});
		});
		
		this.socket.connect(serverUrl);
	}
	
	/////////////////////////////////////////////////
	// Retrieves a connection ticket from  
	// F-List's servers. This should be 
	// refreshed every 30 minutes, maybe even a
	// few seconds sooner.
	/////////////////////////////////////////////////
	
	async getTicket() {
		this.emit('ticket_requested');
		
		// data that we need to send to F-List
		
		let userData = new FormData();
		userData.append('account', this.userCredentials.username);
		userData.append('password', this.userCredentials.password);
		
		await axios({
			method: 'post',
			url: 'https://www.f-list.net/json/getApiTicket.php',
			data: userData,
			headers: {
				'Content-Type': `multipart/form-data; boundary=${userData._boundary}`
			}
		})
		.then(res => {
			this.userData = res.data;
			this.ticket = res.data.ticket;
			
			this.emit('ticket_acquired');
		})
		.catch(err => {
			this.emit('unknown_error', err);
		})
	}
	
	/////////////////////////////////////////////////
	// Send an IDN command to F-Chat.
	/////////////////////////////////////////////////
	
	async identify() {
		//console.log('Identifying with Server...');
		//console.log('Using Ticket: ' + this.ticket);
		
		let identifier = {
			method: 'ticket',
			account: this.userCredentials.username,
			ticket: this.ticket,
			character: this.userData.default_character,
			cname: this.clientName,
			cversion: this.clientVersion
		};
	
		if(this.con.connected && (this.ticket != null))
		{
			this.emit('identifying');
			this.con.sendUTF('IDN ' + JSON.stringify(identifier));
		} else {
			//if(!this.con.connected) console.log('ERROR: Unable to identify, no connection established');
			//if(this.ticket == null) console.log('ERROR: Unable to obtain Ticket');
		}
	}
	
	/////////////////////////////////////////////////
	// Initializes the client connection.
	/////////////////////////////////////////////////
	
	async init(credentials) {
		//if(credentials != null) this.userCredentials = this.credentials;

		await this.getTicket();
		await this.connect();
	}
	
	/////////////////////////////////////////////////

	parse(data) {
		let cmd = data.substr(0, 3);
		let jsonRaw = data.substr(4, data.length);
		let json = null;
		
		try {
			json = JSON.parse(jsonRaw);
		} catch (err) {
			this.emit('invalid_json', jsonRaw);
		}
		
		if(cmd == 'PIN')
		{
			this.con.sendUTF('pin');
		} else {
			this.emit('command', {command: cmd, data: json, rawData: jsonRaw});
		}
	}
}

//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////

class fChatWrapper {
	constructor() {
		
		this.userTextBox = '';
		this.rendering = false;
		
		////////////////////////////////////////////////
		// Set up key press interception.
		////////////////////////////////////////////////
		
		this.readline = require('readline');
				
		this.readline.emitKeypressEvents(process.stdin);
		
		process.stdin.setRawMode(true);
		//process.stdout.write('\u026[?25h')
		
		/////////////////////////////////////////////////
		process.stdin.on('keypress', (str, key) => {	
			// We'll need a way to terminate the process, this allows that to happen.
			if(key.ctrl && key.sequence == '\u0003') return process.exit(0);
			
			if(key.name == 'backspace' && this.userTextBox.length > 0) {
				this.userTextBox = this.userTextBox.substr(0, this.userTextBox.length - 1);
			} else if (key.meta) {
				this.selectMenu(key.name);
			} else {
				this.userTextBox += key.sequence;
			}
			
			this.writeChat('Pressed ' + JSON.stringify(key));
			this.render();
		});
		
		/////////////////////////////////////////////////
		// Window framing dimensions.
		/////////////////////////////////////////////////
		
		this.window = {};
		this.window.menuHeight = 2;

		this.window.width = process.stdout.columns;
		this.window.height = process.stdout.rows;

		this.window.inputHeight = 3;

		this.window.chatWidth = Math.floor(process.stdout.columns * 0.8);
		this.window.chatHeight = this.window.height - (this.window.menuHeight + this.window.inputHeight);

		this.window.usersWidth = this.window.width - this.window.chatWidth - 1;
		this.window.usersHeight = this.window.height - (this.window.menuHeight + this.window.inputHeight);
		
		/////////////////////////////////////////////////

		this.chars = {
			arrows: {
				left: '\u25C0',
				right: '\u25B6'
			}
		};

		/////////////////////////////////////////////////

		this.genders = {};
		this.genders.Male = colors.brightBlue;
		this.genders.Female = colors.brightMagenta;
		this.genders.Transgender = colors.yellow;
		this.genders.Shemale = colors.brightYellow;
		this.genders.Herm = colors.magenta;
		
		/////////////////////////////////////////////////
		
		this.screenCache = new Array(this.window.height);
		console.clear();

		process.stdout.cursorTo(0, 0);
		for(let l = 0; l < this.window.height; l++)
		{
			process.stdout.write(''.repeat(this.window.width) + '\n'.toString());
		}
		
		this.channels = {
			system: []
		};
		
		this.channelUsers = {
			system: []
		};
		this.channels['system'] = [];
		
		this.activeChannel = 'system';
		this.activeMenu = '';
		
		this.clientVars = {
			chat_max: 4096,
			priv_max: 50000,
			lfrp_max: 50000,
			lfrp_flood: 600,
			msg_flood: 0.5,
			icon_blacklist: [],
			permissions: 0
		};
		
		this.friends = {};
		
		this.ignoredUsers = {};
		
		this.chatOps = {};

		this.selectedMenu = '';
		this.menus = {};
	}

	/////////////////////////////////////////////////

	adjustResolution() {
		this.window.menuHeight = 2;

		this.window.width = process.stdout.columns;
		this.window.height = process.stdout.rows;

		this.window.inputHeight = 3;

		this.window.chatWidth = Math.floor(process.stdout.columns * 0.8);
		this.window.chatHeight = this.window.height - (this.window.menuHeight + this.window.inputHeight);

		this.window.usersWidth = this.window.width - this.window.chatWidth - 1;
		this.window.usersHeight = this.window.height - (this.window.menuHeight + this.window.inputHeight);
	}

	/////////////////////////////////////////////////

	FormatUsername(user) {
		if(this.channelUsers.system[user] != undefined)
		{
			let userGender = this.channelUsers.system[user].gender

			if(this.genders[userGender] == undefined)
			{
				return '[??] ' + colors.white(user);
			}

			return '[' + userGender.substr(0, 2) + '] ' + (this.genders[userGender](user));
		}

		return '[??] ' + colors.white(user);
	}

	/////////////////////////////////////////////////
	// Command Parser - This is gonna be fuckin' awful.
	/////////////////////////////////////////////////
	
	parseCommand(data)
	{
		let cmd = data.command
		let jsonRaw = data.rawData
		let json = data.data;
		
		try {
			json = JSON.parse(jsonRaw);
		} catch (err) {
			this.writeChat('[WARNING]: invalid JSON response\n' + jsonRaw);
		}
		
		/////////////////////////////////////////////////
		
		if(cmd == 'ADL') {
			this.chatOps = json.ops;
			
			this.writeChat('Server reports ' + this.chatOps.length + ' chat operators online.');
		}
		
		/////////////////////////////////////////////////
		
		else if(cmd == 'CON') {
			this.writeChat('Server reports ' + json.count + ' users online.');
		}
		
		/////////////////////////////////////////////////
		
		else if(cmd == 'LIS') {			
			for(let i = 0; i < json.characters.length; i++)
			{
				let char = json.characters[i]
				
				this.channelUsers[this.activeChannel][char[0]] = {
					gender: char[1],
					satus: char[2],
					statusmsg: char[3]
				}
			}
			
			this.writeChat('Indexed Users: ' + Object.keys(this.channelUsers[this.activeChannel]).length);
		} 
		
		/////////////////////////////////////////////////
		
		else if(cmd == 'VAR') {
			this.clientVars[json.variable] == json.value;
			
			this.writeChat(colors.bgWhite(colors.black('[SYSTEM]')) + ": Adjusted " + json.variable + ' to ' + json.value);
		}
		
		/////////////////////////////////////////////////
		
		else if(cmd == 'HLO') {
			this.writeChat(jsonRaw);
		}
		
		/////////////////////////////////////////////////
		
		else if(cmd == 'FRL') {
			this.friends = json.characters;
			
			this.writeChat('Server reported ' + this.friends.length + ' friends online.');
		}
		
		/////////////////////////////////////////////////
		
		else if(cmd == 'NLN') {	
			this.channelUsers[this.activeChannel][json.identify] = {
				gender: json.gender,
				status: json.status,
				statusmsg: ''
			}
			
			this.writeChat(colors.bgGreen('[JOIN]') + colors.bgBlue(': ' + json.identity + ' (' + Object.keys(this.channelUsers[this.activeChannel]).length + ' users)'));
			//this.writeChat(colors.bgGreen('User "' + json.identity + '" has joined, new user count is ' + Object.keys(this.channelUsers[this.activeChannel]).length));
		}
		
		/////////////////////////////////////////////////
		
		else if (cmd == 'FLN') {
			delete this.channelUsers[this.activeChannel][json.character];
			
			this.writeChat(colors.bgRed('[LEFT]') + colors.bgBlue(': ' + json.character + ' (' + Object.keys(this.channelUsers[this.activeChannel]).length + ' users)'));
			//this.writeChat(colors.bgRed(('User "' + json.character + '" has logged off, new user count is ' + Object.keys(this.channelUsers[this.activeChannel]).length)));
		}
		
		/////////////////////////////////////////////////
		
		else {
			this.writeChat(colors.bgYellow(colors.black('[WARNING]')) + ": Unknown command \"" + cmd + "\"");
		}
	}
	
	/////////////////////////////////////////////////
	
	render(x = 0, y = 0) {
		if(this.rendering == true) return 0;

		this.rendering = true;

		if(process.stdout.columns != this.window.width || process.stdout.rows != this.window.height)
		{
			this.adjustResolution();
		}

		console.clear();
		this.renderMenuBar();
		this.renderTabs();

		this.renderChat();
		this.renderUsers();
		
		//console.log(this.screenCache.join('\n'));
		
		this.renderInput();

		process.stdout.cursorTo(x, y);

		this.rendering = false;
	}

	/////////////////////////////////////////////////
	
	renderChat() {
		let line = this.window.menuHeight - 1;
		let msgCount = this.channels[this.activeChannel].length;
		let lines = (this.window.chatHeight < msgCount) ? this.window.chatHeight : msgCount;
		let msgNum = msgCount - lines - 1;
		
		for(let l = 1; (l < this.window.chatHeight); l++)
		{
			process.stdout.cursorTo(0, line + l);
			process.stdout.write(colors.bgBlue(' '.repeat(this.window.chatWidth)) + colors.bgBrightBlue(' '));

			if(l < lines)
			{
				process.stdout.cursorTo(0, line + l);
				process.stdout.write(this.channels[this.activeChannel][msgNum + l]);
			}
		}
	}
	/////////////////////////////////////////////////
	
	renderInput() {
		process.stdout.cursorTo(0, this.window.menuHeight + this.window.chatHeight);
		console.log(this.userTextBox);
	};
	
	/////////////////////////////////////////////////

	renderMenuBar() {
		process.stdout.cursorTo(0, 0);
		process.stdout.write(colors.bgBrightBlue(' '.repeat(this.window.width)));
	}

	/////////////////////////////////////////////////
	
	renderUsers() {
		let line = this.window.menuHeight;
		let users = Object.keys(this.channelUsers[this.activeChannel]);
		let userCount = users.length;
		let lines = (this.window.chatHeight < userCount) ? this.window.chatHeight : userCount;
		let userNum = userCount - lines - 1;

		let xPos = this.window.chatWidth + 1;

		process.stdout.cursorTo(xPos, line);
		process.stdout.write(colors.bgBrightBlue(' '.repeat(this.window.usersWidth)));
		process.stdout.cursorTo(xPos, line);
		process.stdout.write(colors.bold(colors.bgBrightBlue('Users: ' + users.length)));

		for(let u = 1; u < this.window.usersHeight - 1; u++)
		{
			process.stdout.cursorTo(xPos, line + u);
			process.stdout.write(colors.bgBlue(' '.repeat(this.window.usersWidth - 1)));
			process.stdout.write(colors.bgBrightBlue(' '));

			if(u < lines) {
				process.stdout.cursorTo(xPos, line + u);
				process.stdout.write(colors.bgBlue(this.FormatUsername(users[u])));
			}
		}
	}

	/////////////////////////////////////////////////
	
	renderTabs() {
		/////////////////////////////////////////////////
		// Begin rendering open channels.
		/////////////////////////////////////////////////
		
		process.stdout.cursorTo(0, 1);
		process.stdout.write(colors.bgBlue(this.chars.arrows.left));
		process.stdout.write(colors.bgBrightBlue(' '. repeat(this.window.width - 2)));
		process.stdout.write(colors.bgBlue(this.chars.arrows.right));

		/////////////////////////////////////////////////

		let channels = Object.keys(this.channels);
		let usedSpace = 2;

		
		for(let c = 0; c < channels.length && usedSpace <= this.window.width - 2; c++)
		{
			let color = (channels[c] == this.activeChannel) ? colors.bgBlue : colors.bgBrightBlue;

			process.stdout.cursorTo(usedSpace, 1);
			process.stdout.write(color(channels[c]));
			usedSpace += channels[c].length + 1;	
		}

	}

	/////////////////////////////////////////////////

	selectMenu(id) {
		if(this.menus[id] == undefined) return 0;

		this.selectedMenu = id;
	}

	/////////////////////////////////////////////////
	
	writeChat(message, channel = 'system') {
		
		if(message.length > this.window.width) message = message.substr(0, this.window.chatWidth);
		
		this.channels[channel].push(message);
		
		//if(this.channels[channel].length > 1000) this.channels[channel].shift();
		
		this.render();
	}
}

//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////

let clientInstance = new fChatInstance(FChatCredentials);
let userInterface = new fChatWrapper();
userInterface.render();

clientInstance.on('command', (data) => {
	userInterface.parseCommand(data);
});

clientInstance.on('ticket_request', () => {
	console.log('b');
	userInterface.writeChat('Requesting new auth ticket from F-List...');
});

clientInstance.on('invalid_json', (json) => {
	userInterface.writeChat(colors.bgYellow(colors.black('[WARNING]')) + ": invalid JSON response \n");
});

clientInstance.init(FChatCredentials);
