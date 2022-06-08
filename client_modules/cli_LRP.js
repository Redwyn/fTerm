function cmd (data, host) {
		host.term.log(data.channel, host.colors.bgGreen(data.character) + ': ' + data.message.replace(/\r\n/g, '\n').split('\n'));
}

module.exports = cmd;
