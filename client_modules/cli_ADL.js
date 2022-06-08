function cmd (data, host) {
	for(let o = 0; o < data.ops.length; o++) {
		host.chatOps[data.ops[o]] = true;
	}

	host.term.log(data.ops.length + ' chat ops reported by the server.');
}

module.exports = cmd;
