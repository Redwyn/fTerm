function cmd (data, host) {
	host.term.log(data.character.identity + ':' + host.character);
	if(data.character.identity == host.character) {
		host.channels[data.channel] = {
			title: data.title,
			ops: [],
			users: [],
			mode: null,
			description: '',
			messages: []
		};

		host.emit('channeljoined', {
			id: data.channel,
			title: data.title
		});

		//host.term.log('console', 'Joined channel ' + data.channel, true);

		return;
	}
		
	host.emit('JCH', {
		channel: data.channel,
		title: data.title,
		character: data.character.identity
	});
}

module.exports = cmd;
