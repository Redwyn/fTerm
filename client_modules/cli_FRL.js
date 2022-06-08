function cmd (data, host) {
	host.term.log('Friends Online: ' + Object.keys(data))
}

module.exports = cmd;
