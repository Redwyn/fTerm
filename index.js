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


const creds = {
	'account': 'null',
	'password': 'void'
}

global.chatInstance = null;

class clientWrapper {
	constructor () {
		this.ui = new uiEngine();
		this.instance = null;
		
		this.printFile('motd.txt');

		//////////////////////////////////////////////////////////////////////////////////////////////////
		// Event handling to couple UI and chat controller.
		//////////////////////////////////////////////////////////////////////////////////////////////////

		this.ui.on('querySent', (query) => {
			if(query.message[0] != '/') {
				this.ui.log(query.message);
			}

			let commandRaw = query.message.slice(1);
			let command = commandRaw.split(' ');

			if(command[0] == 'login' && this.instance == null) {
				this.instance = new fControl.fcontrol(fControl.API_ROOT, fControl.API_ENDPOINTS, creds, this.ui);
			}
		})
		
	}

	printFile(path) {
		fs.readFile(path, 'utf8', (err, data) => {
			let lines = data.toString().replace(/\r\n/g, '\n').split('\n');

			for(let i = 0; i < lines.length; i++) {
				this.ui.log(lines[i]);
			}
		});
	}

	
}

let client = new clientWrapper();
