function cmd (data, host) {
	if(host.activeUsers[data.character] != undefined) {
		delete host.activeUsers[data.character]
			if(host.verboseConsole) host.term.log('User ' + data.character + 'has left.');;
	}
}

module.exports = cmd;
