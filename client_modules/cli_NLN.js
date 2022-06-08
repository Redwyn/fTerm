function cmd (data, host) {
	if(data.identity == undefined) return;

	host.activeUsers[data.identity] = {};
	host.activeUsers[data.identity].gender = data.gender;
	host.activeUsers[data.identity].status = data.status;
	host.activeUsers[data.identity].statusText = '';

	if (host.verboseConsole) host.term.log('User ' + data.identity + ' joined.')
}

module.exports = cmd;
