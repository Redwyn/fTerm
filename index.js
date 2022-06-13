//////////////////////////////////////////////////////////////////////////////////////////////////////////
// Generate DB.
//////////////////////////////////////////////////////////////////////////////////////////////////////////

const inputHandler = new (require('input-handler'))();
const botdb = require('./lib/db.js');
const cmdIndex = require('./commandIndex.js');
const fs = require('fs');
//const db = new botdb();

const uiEngine = require('./lib/simpleui.js');
const fControl = require('./lib/fcontrol.js');

//const mainUI = new uiEngine();
 
//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////

process.title = 'F-Term'

let creds = {
	'account': 'null',
	'password': 'void'
}

global.chatInstance = null;

class clientWrapper {
	constructor () {
		this.ui = new uiEngine();
		this.instance = null;
		this.active = false;
		
		this.printFile('./assets/motd.txt', true);

		//////////////////////////////////////////////////////////////////////////////////////////////////
		// Event handling to couple UI and chat controller.
		//////////////////////////////////////////////////////////////////////////////////////////////////

		this.ui.on('querySent', (query) => {
			if(query.message[0] != '/') {
				this.instance.sendMessage(query.message);
			}

			let commandRaw = query.message.slice(1);
			let command = commandRaw.split(' ');

			if(command[0] == 'test') {
				this.ui.createPane('Sample');
			}

			if(command[0] == 'login' && this.instance == null) {
				if(command.length == 3) {
					creds = {
						'account' : command[1],
						'password' : command[2]
					}
				}

				this.ui.log(JSON.stringify(creds));
							
				this.run();
			}

			if(command[0] == 'listchannels' && !(this.instance == null)) {
				let channels = this.instance.getChannels();
				let channelNames = Object.keys(channels);

				this.ui.log(this.ui.activePane, 'Here is a list of all public channels:', true)
				
				for(let c = 0; c < channelNames.length; c++) {
					let channel = channels[channelNames[c]];
					this.ui.log(this.ui.activePane, '\t' + channelNames[c] + ":" + channel.users);
				}				
			}

			if(command[0] == 'join' && !(this.instance == null)) {
				if(command[1] == 'pub') {
					let channel = command.slice(2).join(' ');

					this.instance.joinChannel(channel)
				}
			}
		})
		
		this.ui.on('tabChanged', (tabId) => {
			this.instance.changeChannels(tabId);
		});
	}

	printFile(path, forceRender = false) {
		fs.readFile(path, 'utf8', (err, data) => {
			let lines = data.toString().replace(/\r\n/g, '\n').split('\n');

			for(let i = 0; i < lines.length; i++) {
				this.ui.log(lines[i], forceRender);
			}
		});
	}

	async run () {
		this.instance = new fControl(undefined, undefined, creds, this.ui);
		await this.instance.getTicket();

		
		
		this.instance.connect();

		this.instance.on('unknowncmd', (cmd) => {
			
		})

		this.instance.on('channeljoined', (channel) => {
			this.ui.log('console', 'Joining Channel: ' + channel.title);
			this.ui.createPane(channel.id, channel.title);
			this.ui.activePane = channel.id;
			this.instance.activeChannel = channel.id;
		})
	}
}

let client = new clientWrapper();
