function cmd (data, host) {
	if(host.channels[data.channel] != undefined) {
		host.channels[data.channel].description = data.description;
	}
}

module.exports = cmd;
