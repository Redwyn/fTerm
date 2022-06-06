
let inputHandler = new (require('input-handler'))();

inputHandler.on('keypress', (key) => {
	console.log(key);
});
