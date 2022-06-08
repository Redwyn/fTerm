function cmd (data, host) {
	const characters = data.characters;
	try{
		for(let c = 0; c < characters.length; c++) {
			let user = characters[c];
			host.activeUsers[user[0]] = {};
			host.activeUsers[user[0]].gender = user[1];
			host.activeUsers[user[0]].status = user[2];
			host.activeUsers[user[0]].statusText = user[3];

			//host.term.log('User signed in: ' + user[0]);
		} 
	}catch(err) {
		host.term.log(colors.bgRed(JSON.stringify(data)));
	}
}

module.exports = cmd;
