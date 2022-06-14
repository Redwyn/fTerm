function cmd (data, host) {
	let character = data.character.identity;
	let isUser = character == host.character;
	
	if(isUser) {
		this.term.closeChannel(data.channel);
		
		return;
	}
	
	delete host.channels[data.channel].users[character]
	host.term.log(data.channel, `${character} has left the channel.`);
}

module.exports = cmd;
