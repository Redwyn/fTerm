function cmd (data, host) {
	host.term.log('Server reports ' + data.count + ' users online.');
}

module.exports = cmd;
