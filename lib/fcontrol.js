/*
I spent a whole day on this so it'd be appreciated if you left this comment in place.

Essentially this is a (kind of?) simple web request handler. Send in your request and get a response back!

Runs asynchronously so you'll have to figure out how to make it work synchronously if that's needed.

*/

const https = require('https');
const http = require('http');
//const inputHandler = new (require('input-handler'))();
const querystring = require('querystring');
const WebSocket = require('ws');
const EventEmitter = require('event-emitter');

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
	constructor (ApiRoot, ApiEndpoints, credentials, term = console) {
		super();
		this.ApiRoot = ApiRoot || API_ROOT;
		this.ApiEndpoints = ApiEndpoints || API_ENDPOINTS;
		this.creds = credentials;
		this.ticket = 'g'
		this.socketPath = 'wss://chat.f-list.net/chat2'
		this.socket = null;
		this.term = term;

		this.clientName = 'fTerm - Text-only FChat Client.';
		this.clientVer = '0.1 Dev'

		this.user = {
			characters : [],
			default_character: {},
			ticket: '',
			friends: [],
			bookarmsk: [],
			error: ''
		}

		this.activeUsers = {};
		this.activeUsersIndex = [];
		this.sessions = {};
		this.term.log('Ready to authenticate...');
	}

	async getTicket () {
		let giblet = await pushRequest(API_ROOT + API_ENDPOINTS.getApiTicket, 'POST', this.creds)
		this.user = giblet.data.ticket;
		this.ticket = this.user.ticket

		this.ticket = giblet.data.ticket;
		this.term.log('Grabbed ticket!')
		return this.ticket;
	}

	sendCommand(identifier, payload) {
		this.socket.send(this.buildCommand(identifier, payload));
	}

	buildCommand(identifier, payload) {
		if(payload == undefined) return identifier;
	
		return identifier + JSON.stringify(payload);
	}

	handleCommand(cmd) {
		switch(cmd.id) {
			case 'PIN':
				this.sendCommand('PIN');
				this.term.log('fdsafdsfsfdsfdsfdsfdsfdsfdsfsaffd');
			default:
				this.emit('unknowncmd', cmd);
		}
	}

	async connect (characterName) {
		 this.socket = new WebSocket(this.socketPath);

		 this.socket.on('open', () => {
		 	this.term.log('connected!');

			this.sessions[characterName] = {
				activeChannels: {},
				privMessages: {}	
			}
		 	
		 	this.socket.send(this.buildCommand('IDN ', {
		 		method : 'ticket',
		 		account : this.creds.account,
		 		ticket : this.ticket,
		 		character : characterName,
		 		cname : this.clientName,
		 		cversion : this.clientVer,
		 	}));
		 });

		 this.socket.on('message', (data) => {
			let identifier = data.slice(0, 3);

			if (identifier == 'PIN') {
				this.sendCommand('pin');
				return;
			}
			
			try {
				let payload = JSON.parse(data.toString().substring(4));

			 	//this.term.log(`Recieved: ${identifier}`)
				//this.term.log(payload);

			 	if(identifier == 'MSG')
		 		{
			 		this.emit('flipscreen', {});
			 		return
			 	}

			 	this.emit('unknowncmd', {id: '' + identifier, data: payload});
			 }
			 catch(err) {
			 	this.term.log('Error: ' + identifier + '\n' + err);
			 	process.exit();
			 } 
		 });
	}
}


//let test = API_ROOT + API_ENDPOINTS.getApiTicket;

module.exports = {
	"fcontrol" : fcontrol,
	"API_ROOT" : API_ROOT,
	"API_ENDPOINTS" : API_ENDPOINTS
}
