function cmd (data, host) {
	host.term.log('ERROR:' + data.number + ': ' + data.message);
}

module.exports = cmd;
