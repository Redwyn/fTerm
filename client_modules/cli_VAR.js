function cmd (data, host) {
	host.serverVars[data.variable] = data.value;

	host.term.log('Server reported ' + data.variable.toUpperCase() + ' at ' + data.value);
}

module.exports = cmd;
