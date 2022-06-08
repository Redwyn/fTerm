function cmd (data, host) {
	if(host.channels[data.channel] != undefined) {
		host.channels[data.channel].ops = data.oplist;
	}
}

module.exports = cmd;
