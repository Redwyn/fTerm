"use strict";

/*

If you're using this in your own project, I'd appreciate if you left this comment in place. :)

*/

const path = require('path');
const fs = require('fs');

const https = require('https');
const http = require('http');
const colors = require('colors');
const querystring = require('querystring');
const WebSocket = require('ws');
const EventEmitter = require('events');

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////

async function pushRequest(path, method, body, queryonly = false) {
	let specs = buildRequest(path, method, body);

	// Using the port number, determine if we need to use http or https.
	const requestor = (specs.options.port == 443) ? https.request : http.request;
	
	//if(specs.options.port == 80) {this.term.error('ERROR: Unable to make http requests.'); return;};

	const request = new Promise((resolve, reject) => {
		const req = requestor(specs.options, res => {
			let response = {
				status: res.statusCode,
				dataRaw: [],
				data: ''
			}

			res.on('data', d => {
				response.dataRaw.push(d);
			})

			res.on('end', () => {
				response.data = JSON.parse((Buffer.concat(response.dataRaw)).toString());

				resolve(response);
			})
		});
	
		req.on('error', error => {
			this.terminal.error(error);
		});
	
		req.write(specs.body);
		req.end();
	});

	try {
		let bod = await request;
		return bod;
		//process.stdout.write(bod.data);
	} catch (e) {
		console.error(e);
	}

	//process.stdout.write(await request());
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////

function buildRequest(path, method, body, verbose = false) {
	let options = {
		hostname: 'example.com',
		port: 443,
		path: '/',
		method: method
	}

	let bodyReturn = null;

	let cache = [];

	cache = path.split(':');
	options.port = (cache[0] == 'https') ? 443 : 80;

	cache = (cache[1].slice(2).split('/'));
	options.hostname = cache[0];
	cache.shift();
	options.path = '/' + cache.join('/') + '?' + querystring.stringify(body);

	// Take the body of the requst and make it safe to send.
	if(body != null) {
		bodyReturn = '' + JSON.stringify(body);
	
		options.headers = {
			'Content-Type': 'application/json',
			'Content-Length': bodyReturn.length
		}
	}

	if (verbose) console.log(bodyReturn);

	return {"options":options, "body":bodyReturn};
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////

const API_ROOT = 'https://www.f-list.net/';
const API_ENDPOINTS = {
	getApiTicket : "json/getApiTicket.php",
	bookmark_add : 'json/api/bookmark-add.php',
	bookmark_list : 'json/api/bookmark-list.php',
	bookmark_remove : 'json/api/bookmark-list.php',
	character_data : 'json/api/character-data.php',
	character_list : 'json/api/character-list.php',
	group_list : 'json/api/group-list.php',
	ignore_list : 'json/api/ignore-list.php',
	info_list : 'json/api/info-list.php',
	kink_list : 'json/api/kink-list.php',
	mapping_list : 'json/api/mapping-list.php',
	friend_list : 'json/api/friend-list.php',
	friend_remove : 'json/api/friend-remove.php',
	request_accept : 'json/api/request-accept.php',
	request_cancel : 'json/api/request-cancel.php',
	request_deny : 'json/api/request-deny.php',
	request_list : 'json/api/request-list.php',
	request_pending : 'json/api/request-pending.php',
	request_send : 'json/api/request-send.php',
};

class fcontrol extends EventEmitter {
	constructor(ApiRoot, ApiEndpoints, credentials, term = console) {
		super();
		
		this.colors = colors;
		
		this.settings = {
			showTimestamp: true,
			verboseConsole: false,
			devMode: true,
		}

		this.ApiRoot = ApiRoot || API_ROOT;
		this.ApiEndpoints = ApiEndpoints || API_ENDPOINTS;
		
		this.creds = credentials;
		
		this.ticket = '';
		this.socketPath = 'wss://chat.f-list.net/chat2';
		this.socket = null;
		
		// Configure Terminal eventHandlers.
		this.term = term;
		
		this.term.on('tabChanged', (id) => {
			this.changeChannels(id);
		});

		this.clientName = 'fTerm - Text-only FChat Client';
		this.clientVer = '0.1.3 Dev';

        this.clientCommands = {};
        this.loadClientCommands('./client_modules');
        //this.serverCommands = this.loadCommands('./server_modules');

		this.callbacks = {};

		this.character = '';
		this.userData = {
			characters: [],
			default_character: {},
			ticket: '',
			friends: [],
			bookmarks: [],
			error: ''
		}
		
		this.userTable = {};
		this.publicChannelTable = {};
		this.pricateChannelTable = {};
		
		this.serverData = {
			chatOps: {},
			friends: {},
			bookmarks: {},
			ignored: {},
		}
		
		this.serverVars = {
			chat_max: null,
			priv_max: null,
			lfrp_max: null,
			lfrp_flood: null,
			msg_flood: null,
			permissions: null,
			icon_blacklist: null
		};
		
		this.sandbox = {
			commands: {
					addUser: this.addUser,
					getTime: this.getTime,
					getUser: this.getUser,
					printDebug: this.printDebug,
					printError: this.printError,
					printLine: this.printLine,
					printMessage: this.printMessage,
					printNotice: this.printNotice,
					printWarning: this.printWarning,
					removeUser: this.removeUser,
					sendCommand: this.sendCommand,
					//setRequestResponse: this.setRequestResponse,
				},
		};
		
		this.term.log('Ready to authenticate...');
	}

    //////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////

	//////////////////////////////////////////////////////////////////////////////////////////////////////

    loadClientCommands(cmdPath) {
		this.term.log('console', 'Loading command files...', true);
		
		let cmds = {};

        const fileList = fs.readdirSync(cmdPath);

        if(fileList.length == 0) {
			if(!this.settings.devMode) {
            console.error('CRITICAL: No client modules available. Something is very wrong.');
            console.error('\t Please download and reinstall F-Term from the github repo.');
            console.error(fileList);
            process.exit(1);
			} else {
				console.log('Dev Mode Enabled, continuing to run with no client modules...');
			}
        }

        for(let c = 0; c < fileList.length; c++) {
			let name = fileList[c].substr(4, 3);
			let path = './.' + cmdPath + '/' + fileList[c];
			
			this.term.log('loading ' + name + ' from ' + path + ' ...');
            
            try {
				this.clientCommands[name] = (require(path));
			} catch (err) {
				this.term.log('ERROR: unable to load command from patch "' + path + '"');
			}
        }
    }
	
    //////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////

	addUser(username, gender, status, statusMessage) {
		if (this.userTable[username] == undefined || this.userTable[username] == null)
		{
			this.userTable[username] = {
				'gender': gender,
				'status': status,
				'statusMessage': statusMessage
			};
		}
	}

    //////////////////////////////////////////////////////////////////////////////////////////////////////
    // Retrieves a user ticket(token) from the server's JSON endpoint.
    // Must be called prior to creating a websocket connection.
    //////////////////////////////////////////////////////////////////////////////////////////////////////

	async getTicket() {
		const giblet = await pushRequest(this.ApiRoot + this.ApiEndpoints.getApiTicket, 'POST', this.creds);

		this.userData.characters = JSON.stringify(giblet.data.characters);
		this.userData.default_character = JSON.stringify(giblet.data.default_character);
		this.userData.ticket = JSON.stringify(giblet.data.ticket);
		this.userData.friends = JSON.stringify(giblet.data.friends);
		this.userData.bookmarks = JSON.stringify(giblet.data.bookmarks);
		this.userData.error = JSON.stringify(giblet.data.error);

		this.userData = giblet.data;
		this.term.log('Grabbed ticket!');
		
		return this.ticket;
	}
	
	//////////////////////////////////////////////////////////////////////////////////////////////////////
    // Returns an array with the current time.
	//////////////////////////////////////////////////////////////////////////////////////////////////////
    
    getTime() {
		const date = new Date();
		
		return {
			hours: date.getHours(),
			minutes: date.getMinutes(),
			seconds: date.getSeconds(),
		}
	}
	
	//////////////////////////////////////////////////////////////////////////////////////////////////////
	// Gets a user from the users database.
	//////////////////////////////////////////////////////////////////////////////////////////////////////
	
	getUser (username) {
		if (this.userTable[username] == undefined) {
			return null;
		}
		
		return this.userTable[username];
	}

    //////////////////////////////////////////////////////////////////////////////////////////////////////
	// Handles server commands
    //////////////////////////////////////////////////////////////////////////////////////////////////////

	handleServerCommand() {
		const id = arguments[0].id;
		const payload = arguments[0].data;
		
		this.printWarning('console', 'Invalid command ' + this.colors.black(this.colors.bgWhite(id)) + ' does not exist.');
	}
	
    //////////////////////////////////////////////////////////////////////////////////////////////////////
    // Prints a message to the specified channel.
    //////////////////////////////////////////////////////////////////////////////////////////////////////
    
    printLine() {
		const channel = (arguments[1] != undefined) ? arguments[0] : 'console';
		const message = (arguments[1] != undefined) ? arguments[1] : arguments[0];
		
		let prefix = '';
		
		if(this.settings.showTimestamp) {
			let time = this.getTime();
			
			let dateString = ('[' + time.hours + ':' + time.minutes + ':' + time.seconds + ']');
			
			prefix += colors.bgWhite(colors.black(dateString));
		}
		
		
		
		this.term.log(prefix + message);
	}
    
    //////////////////////////////////////////////////////////////////////////////////////////////////////
    // Prints a warning message to the specified channel.
    //////////////////////////////////////////////////////////////////////////////////////////////////////
    
    printDebug(channel, message) {
		this.printLine('console', colors.bgDarkYellow(colors.black('DEBUG:')) + ' ' + message);
	}
	
    //////////////////////////////////////////////////////////////////////////////////////////////////////
    // Prints a warning message to the specified channel.
    //////////////////////////////////////////////////////////////////////////////////////////////////////
    
    printError(channel, message) {
		this.printLine('console', colors.bgRed(colors.white('ERROR:')) + ' ' + message);
	}
	
    //////////////////////////////////////////////////////////////////////////////////////////////////////
    // Prints a warning message to the specified channel.
    //////////////////////////////////////////////////////////////////////////////////////////////////////
    
    printMessage(channel, user, message) {
		this.printLine('console', colors.bgDarkBlue(colors.white(user + ':')) + ' ' + message);
	}
	
    //////////////////////////////////////////////////////////////////////////////////////////////////////
    // Prints a warning message to the specified channel.
    //////////////////////////////////////////////////////////////////////////////////////////////////////
    
    printNotice(channel, message) {
		this.printLine('console', colors.bgBlue(colors.white('NOTICE:')) + ' ' + message);
	}
	
    //////////////////////////////////////////////////////////////////////////////////////////////////////
    // Prints a warning message to the specified channel.
    //////////////////////////////////////////////////////////////////////////////////////////////////////
    
    printWarning(channel, message) {
		this.printLine('console', colors.bgYellow(colors.black('WARNING:')) + ' ' + message);
	}
    
    //////////////////////////////////////////////////////////////////////////////////////////////////////
    // Removes a user from the userTable.
    //////////////////////////////////////////////////////////////////////////////////////////////////////
    
    removeUser(username) {
		if(this.userTable[username] != undefined) {
			delete this.userTable[username];
		}
	}
    
    //////////////////////////////////////////////////////////////////////////////////////////////////////
    // Allows you to request a method be called when a specific command is recieved.
    //////////////////////////////////////////////////////////////////////////////////////////////////////

	setRequestResponse(cmd, callback) {
		if (this.callbacks[cmd] == undefined) {
			this.callbacks[cmd] = callback;

			return true;
		}

		return false;
	}

    //////////////////////////////////////////////////////////////////////////////////////////////////////
    // Sends a command to the server.
    //////////////////////////////////////////////////////////////////////////////////////////////////////

	sendCommand(identifier, payload) {
		const suffix = (payload != undefined) ? (' ' + JSON.stringify(payload)) : '';

		this.socket.send(identifier + suffix);
	}
   
    //////////////////////////////////////////////////////////////////////////////////////////////////////
	// Initiates a connection with the server.
	// Must request a ticket before using this.
    //////////////////////////////////////////////////////////////////////////////////////////////////////
	
	async connect () {

		const characterName = arguments[0] || this.userData.default_character;
		
		this.socket = new WebSocket(this.socketPath);

		this.socket.on('open', () => {
			this.term.log('Connected!');

			this.character = characterName;
	
				
			this.sendCommand('IDN', {
				method: 'ticket',
				account: this.creds.account,
				ticket: this.userData.ticket,
				character: characterName,
				cname: this.clientName,
				cversion: this.clientVer
			});
		});
	
		this.socket.on('message', (data) => {
			const identifier = '' + data.slice(0, 3);
			const json = JSON.parse((data.length > 3) ? data.slice(4) : '{}');

			this.handleServerCommand({"id": identifier, "data": json});

			//this.term.log('' + identifier + colors.blue(colors.bgWhite(data.length)));
		})
	}
}

module.exports = fcontrol;
