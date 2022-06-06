class botdb {
	constructor (source = 'bot.db') {
		console.log('Initialized DB.');
		
		this.db = require('better-sqlite3')(source);
		this.procedures = {};
		this.insert = {};
		this.find = {};
	}

	build() {
		let build = {};
		build.config = this.db.prepare('CREATE TABLE IF NOT EXISTS config (setting_id INTEGER PRIMARY KEY AUTOINCREMENT, parameter TEXT UNIQUE, value TEXT);');
		build.users = this.db.prepare('CREATE TABLE IF NOT EXISTS users (user_id INTEGER PRIMARY KEY AUTOINCREMENT, discord_id TEXT UNIQUE, kick_count INTEGER DEFAULT 0, ban_count INTEGER DEFAULT 0);');

		///////////////////////////////
		// Begin Building.
		///////////////////////////////
		let build_keys = Object.keys(build);

		for(let i = 0; i < build_keys.length; i++)
		{
			build[build_keys[i]].run();
		}

		let fill = [];
		fill.push("INSERT OR IGNORE INTO config VALUS(NULL, 'token', 'null')");

		///////////////////////////////
		// Prepare insert statements.
		///////////////////////////////

		this.insert.users = this.db.prepare('INSERT OR IGNORE INTO users VALUES (NULL, @discord_id, @kicks, @bans);');

		this.find.token = this.db.prepare("SELECT * FROM config WHERE parameter = 'token';");
	}
}

module.exports = botdb;
