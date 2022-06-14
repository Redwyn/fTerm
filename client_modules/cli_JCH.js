function cmd (data, host) {
	let character = data.character.identity;
	let isUser = character == host.character;
	
	if(isUser) {
		host.channels[data.channel] = {
			title: data.title,
			ops: {},
			users: {},
			mode: null,
			description: '',
			messages: []
		};
		
		host.term.createPane(data.channel, data.title, 'public');
		host.term.changePanes(data.channel);
		host.changeChannels(data.channel);
		host.term.log('console', host.term.activePane);

		host.emit('channeljoined', {
			id: data.channel,
			title: data.title
		});

		return;
	}
	
	host.channels[data.channel].users[character] = host.activeUsers[character].gender;
	host.term.log(data.channel, `${character} has joined the channel.`);
}

module.exports = cmd;
