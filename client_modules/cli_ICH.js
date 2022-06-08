function cmd (data, host) {
	if(host.channels[data.channel] != undefined) {
		host.channels[data.channel].users = data.users;
		host.channels[data.channel].mode = data.mode;
	}
}

module.exports = cmd;
