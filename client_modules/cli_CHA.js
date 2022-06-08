function cmd (data, host) {
	for(let i = 0; i < data.channels.length; i++) {
		let channel = data.channels[i];
			host.officialChannels[channel.name] = {
			mode : channel.mode,
			users : channel.characters
		}
		
		//host.term.log(JSON.stringify(data.channels[i]));
	}
}

module.exports = cmd;
