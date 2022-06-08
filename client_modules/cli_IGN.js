function cmd (data, host) {
	if(data.action == 'init') {
		host.ignored = {};
		for(let i = 0; i < data.characters.length; i++) {
			host.ignored[data.characters[i]] = true;
		}
	}

	else if(data.action == 'add') {
		host.ignored[data.character] = true;
	}

	else if(data.action == 'delete') {
		delete host.ignored[data.character];
	}

	else {
		host.term.log('Unknown IGN action: ' + data.action);
	}
}

module.exports = cmd;
