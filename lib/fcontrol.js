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

		this.verboseConsole = false;

		this.ApiRoot = ApiRoot || API_ROOT;
		this.ApiEndpoints = ApiEndpoints || API_ENDPOINTS;
		
		this.creds = credentials;
		
		this.ticket = '';
		this.socketPath = 'wss://chat.f-list.net/chat2';
		this.socket = null;
		this.term = term;

		this.clientName = 'fTerm - Text-only FChat Client';
		this.clientVer = '0.1 Dev';

        this.clientCommands = {};
        this.loadClientCommands('./client_modules');
        //this.serverCommands = this.loadCommands('./server_modules');

		this.callbacks = {};

		this.character = '';
		this.user = {
			characters: [],
			default_character: {},
			ticket: '',
			friends: [],
			bookmarks: [],
			error: ''
		}

		this.officialChannels = {};
		this.channels = {};
		this.activeChannel = 'console';

		this.serverVars = {
			chat_max: null,
			priv_max: null,
			lfrp_max: null,
			lfrp_flood: null,
			msg_flood: null,
			permissions: null,
			icon_blacklist: null
		};

		this.activeUsers = {};
		this.chatOps = {};
		this.friends = {};
		this.bookmarks = {};
		this.ignored = {};
		
		this.sessions = {};
		this.term.log('Ready to authenticate...');
	}

    //////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////

    loadClientCommands(cmdPath) {
		this.term.log('console', 'Loading command files...', true);
		
		let cmds = {};

        const fileList = fs.readdirSync(cmdPath);

        if(fileList.length == 0) {
            console.error('CRITICAL: No client commands available. Something is very wrong.');
            console.error('\t Please download and reinstall F-Term from the github repo.');
            console.error(fileList);
            process.exit(1);
        }

        for(let c = 0; c < fileList.length; c++) {
			let name = fileList[c].substr(4, 3);
			let path = './.' + cmdPath + '/' + fileList[c];
			
			this.term.log('loading ' + name + ' from ' + path + ' ...');
            
            this.clientCommands[name] = (require(path));
        }

		//process.exit(0);
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////
    // Retrieves a user ticket(token) from the server's JSON endpoint.
    // Must be called prior to creating a websocket connection.
    //////////////////////////////////////////////////////////////////////////////////////////////////////

	async getTicket() {
		let giblet = await pushRequest(this.ApiRoot + this.ApiEndpoints.getApiTicket, 'POST', this.creds);

		this.user.characters = JSON.stringify(giblet.data.characters);
		this.user.default_character = JSON.stringify(giblet.data.default_character);
		this.user.ticket = JSON.stringify(giblet.data.ticket);
		this.user.friends = JSON.stringify(giblet.data.friends);
		this.user.bookmarks = JSON.stringify(giblet.data.bookmarks);
		this.user.error = JSON.stringify(giblet.data.error);

		this.user = giblet.data;
		this.term.log('Grabbed ticker!');
		//this.term.log('' + JSON.stringify(Object.keys(this.user)));
		return this.ticket;
	}

    //////////////////////////////////////////////////////////////////////////////////////////////////////
    // Sends a command to the server. Relies on buildCommand() to function.
    //////////////////////////////////////////////////////////////////////////////////////////////////////

	sendCommand(identifier, payload) {
		let suffix = (payload != undefined) ? (' ' + JSON.stringify(payload)) : '';

		//this.term.log(this.activeChannel, identifier + suffix);
		this.socket.send(identifier + suffix);
	}

    //////////////////////////////////////////////////////////////////////////////////////////////////////
    // Sends a message as a client, relays the message to the MSG command handler as the server will not
    // Relay this back to the client.
    //
    // Honestly, the server should send some form of data back as a check to ensure data wasn't lost.
    // Perhaps with some form of dedicated confirmation command?
    //////////////////////////////////////////////////////////////////////////////////////////////////////

	sendMessage(text) {
		if(this.channels[this.activeChannel] != undefined)
		{
			let json = {
				channel: this.activeChannel,
				message: text
			}
		
			this.sendCommand('MSG', json);
			this.clientCommands['MSG'](json, this);
		}
	}
	
	//////////////////////////////////////////////////////////////////////////////////////////////////////
	// Changes the active tab to the tab ID specified, if it exists.    
	//////////////////////////////////////////////////////////////////////////////////////////////////////
    changeChannels(channelId) {
		if(this.channels[channelId] != undefined)
		{
			this.activeChannel = channelId
		}
	}
    
    
    //////////////////////////////////////////////////////////////////////////////////////////////////////
    // Builds a command to be sent, does not actually send said command.
    // Checks should be added to ensure a command is complete and does not contain unnecesary data.
    //////////////////////////////////////////////////////////////////////////////////////////////////////
	
	buildCommand(identifier, payload) {
		if(payload == undefined) return identifier;

		return identifier + JSON.stringify(payload);
	}
	
    //////////////////////////////////////////////////////////////////////////////////////////////////////
    // Handles commands as a client only. 
    //////////////////////////////////////////////////////////////////////////////////////////////////////

	handleCommand(cmd) {
		if(this.clientCommands[cmd.id] == undefined)
        {
			this.term.log(colors.bgBlue('' + cmd.id + ': ' + (cmd.data)));
			this.emit('unknowncmd', cmd.data);
        }

        if(this.clientCommands[cmd.id] != undefined)
        {
            this.clientCommands[cmd.id](cmd.data, this);
        }

		if(this.callbacks[cmd] != undefined) {
			this.callbacks[cmd]();

			delete this.callbacks[cmd];
		}
	}

    //////////////////////////////////////////////////////////////////////////////////////////////////////
    // Allows you to request a method be called when a specific command is recieved.
    //////////////////////////////////////////////////////////////////////////////////////////////////////

	requestResponse(cmd, callback) {
		if (this.callbacks[cmd] == undefined) {
			this.callbacks[cmd] = callback;

			return true;
		}

		return false;
	}
    
    //////////////////////////////////////////////////////////////////////////////////////////////////////
    // BROKEN. Requests the list of active channels and returns it.
    //////////////////////////////////////////////////////////////////////////////////////////////////////

	getChannels() {
		this.sendCommand('CHA');

		while(this.officialChannels == {})  {}
		return this.officialChannels;
				
	}
    
    //////////////////////////////////////////////////////////////////////////////////////////////////////
    // Sends a join channel request.
    //////////////////////////////////////////////////////////////////////////////////////////////////////

    joinChannel(id) {
    	this.sendCommand('JCH', {
    		channel: id
    	});
    }
    
    //////////////////////////////////////////////////////////////////////////////////////////////////////
	// Initiates a connection with the server.
	// Must request a ticket before using this.
    //////////////////////////////////////////////////////////////////////////////////////////////////////
	
	async connect () {

		const characterName = arguments[0] || this.user.default_character;
		
		this.socket = new WebSocket(this.socketPath);

		this.socket.on('open', () => {
			this.term.log('Connected!');
				
			this.sessions[characterName] = {
				activeChannels: {},
				privMessages: {}
			}

			this.character = characterName;
	
				
			this.sendCommand('IDN', {
				method: 'ticket',
				account: this.creds.account,
				ticket: this.user.ticket,
				character: characterName,
				cname: this.clientName,
				cversion: this.clientVer
			});
		});
	
		this.socket.on('message', (data) => {
			let identifier = '' + data.slice(0, 3);
			let json = JSON.parse((data.length > 3) ? data.slice(4) : '{}');

			this.handleCommand({"id": identifier, "data": json});

			//this.term.log('' + identifier + colors.blue(colors.bgWhite(data.length)));
		})
	}
}

module.exports = fcontrol;
