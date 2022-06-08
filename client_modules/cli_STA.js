function cmd (data, host) {
	if(host.activeUsers[data.character] == undefined) return;

	host.activeUsers[data.character].status = data.status;
	host.activeUsers[data.character].statusText = data.statusmsg;

	if (host.verboseConsole) host.term.log('User ' + data.character + ' has updated their status.');
}

module.exports = cmd;
