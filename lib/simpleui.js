
const colors = require('colors');
const EventHandler = require('events');

let actions = {};
actions.clearall = '\x1b[2J';
actions.home = '\x1b[H';
actions.homeTab = '\x1b[0;1H';

function clearPane(cols, rows) {
	let newCache = [];
	for (let i = 0; i <= rows; i++)
	{
		newCache.push(''); // remove printed i when fully implemented.
	}

	return newCache;
}
 
class simpleUI extends EventHandler{
	constructor() {
		super();
		// Prevents excessive rendering calls. VERY important.
		this.rendering = false;
		//this.verboseConsole = false;
	
		this.buffer = [];
		this.bufferMax = 200;
		
		this.cols = process.stdout.columns;
		this.rows = process.stdout.rows;

		this.scrollPos = 0;
		this.scrollMax = 0;

		this.cursorPos = {
			x: 0,
			y: 0
		};

        process.stdout.on('resize', () => {
            this.cols = process.stdout.columns;
            this.rows = (process.stdout.rows < 7) ? 7 : process.stdout.rows;

			this.fillPanes();

            this.render();
        })

        this.queryContent = '';
        this.queryLineLimit = 3;

		this.tabs_string = ' [Console] ';

		this.panes = {
			"console" : {buffer:[], curX:0, curY:0, mode:0}
		};

		this.activePane = 'console';

		console.log(actions.clearall + actions.home);

		//////////////////////////////////////////////////////////////////////////////////////////////////
		// Populate panes.
		//////////////////////////////////////////////////////////////////////////////////////////////////

		this.fillPanes();

		//////////////////////////////////////////////////////////////////////////////////////////////////
		// Listen for keypresses and write anything valid to the querypanel.
		//////////////////////////////////////////////////////////////////////////////////////////////////

		this.inputHandler = new (require('input-handler'))();

		this.inputHandler.on('mouse-move', (pos) => {
			process.stdout.write(this.cursorTo(pos.x, pos.y))
		})

		this.inputHandler.on('mouse-click', (pos) => {
			
		})

		this.inputHandler.on('mouse-scroll', (pos, dir) => {
			//this.scrollMax = this.panes[this.activePane].buffer.length;

			this.scrollPos = this.scrollPos + parseInt(dir);

			if(this.scrollPos > this.scrollMax) this.scrollPos = this.scrollMax;

			if(this.scrollPos < 0) this.scrollPos = 0;
			
			//this.log(`Scroll position changed to: ${this.scrollPos}`);
		})
		
		this.inputHandler.on('keypress', (key) => {
			if(key.sequence == '\x7F' && this.queryContent != '') {
				this.queryContent = this.queryContent.slice(0, -1);


				
				this.render();
				return;
			}

			if(key.sequence == '\r') {
				this.emit('querySent', {"message":this.queryContent});
				this.queryContent = '';

				
				this.render();
				return;
			}

			this.queryContent += key.sequence;
			this.render();
			return;
		})
	}

	//////////////////////////////////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////////////////////

	createPane(name) {
		this.panes[name] = {buffer:[], curX:0, curY:0, mode:0};
	}
	
	//////////////////////////////////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////////////////////

	deletePane(name) {
		if(this.panes[name] == undefined) return;

		delete this.panes[name];
	}
	
	//////////////////////////////////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////////////////////

	fillPanes() {
		let index = Object.keys(this.panes);
		for(let i = 0; i < index.length; i++) {
			this.fillPane(index[i]);
		}
	}

	//////////////////////////////////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////////////////////

	fillPane(id) {
		let buffer = this.panes[id].buffer;
		let modifier = (buffer == []) ? 0 : 1;
		let filler = [];

		if(buffer.length < this.rows) {
			let diff = this.rows - buffer.length;
			while(filler.concat(buffer).length < this.rows)
			{
				filler.push('    ');
			}

			this.panes[id].buffer = filler.concat(buffer);
		}

		/*if(buffer.length > this.rows) {
			while(buffer.length > this.rows) {
				buffer.shift();
			}
		}*/

		let newLength = this.panes[id].buffer.length;
		//this.panes[id].('' + newLength + ':' + this.rows);
	}
	
	//////////////////////////////////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////////////////////

	clearPane(id) {
		this.panes[id].buffer = clearPane(this.cols, this.rows);
	}

    //////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////

    cursorTo(x, y) {
        return ('\u001b[' + y + ';' + x + 'H');
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////////////////////

	log() {
		let paneIncluded = (arguments.length < 3);
	
		const pane = (paneIncluded) ? 'console' : arguments[0];
		const content = (paneIncluded) ? arguments[0] : arguments[1];
		const forceRender = ((paneIncluded) ? arguments[1] : arguments[2]) || true;
		
		this.panes[pane].buffer.push(content);

		if(this.panes[pane].length > this.bufferMax) {
			let trim = this.bufferMax - this.panes[pane].length;
			this.panes[pane].slice(0, trim);
		}

		if (forceRender)
		{
			this.render();
		}	
	}

	//////////////////////////////////////////////////////////////////////////////////////////////////////
	// A simple textwrapper.
	// Simple breaks words in half if a line exceeds the terminal width.
	//////////////////////////////////////////////////////////////////////////////////////////////////////

	wrapText(text, width = this.cols) {
		if(text.length < width) return [text];

		let returnBuffer = [];
		let cache = text;

		while(cache.length > width)
		{
			let remainder = (cache.width - width);
			returnBuffer.push(cache.slice(0, width));
			cache = cache.slice(width);
		}

		returnBuffer.push(cache);
		return returnBuffer;
	}

	//////////////////////////////////////////////////////////////////////////////////////////////////////
	// A better textwrapper. Tries to wrap text without breaking words, if possible.
	// If it can't avoid breaking a word it will fallback to the simple wrapper function.
	//////////////////////////////////////////////////////////////////////////////////////////////////////

	wrapTextNoBreaks(text, width = this.cols) {
		let cache = text.split(' ');
		let returnBuffer = [];


		let lineCache = '';
		while(cache[0] != undefined) {
			let spacer = (lineCache == '') ? '' : ' ';
			let suffix = spacer + cache[0];
			
			if(Math.floor((lineCache.length + suffix.length)) > width) {
				returnBuffer.push(lineCache);
				lineCache = '';

				if(suffix[0] == ' ') suffix = suffix.slice(1);

				// Break word up if it's too long.
				if(cache[0].length > width) {
					let wordLines = this.wrapText(suffix, width);

					while(wordLines.length >1) {
						returnBuffer.push(wordLines[0]);
						wordLines.shift();
					}

					suffix = wordLines[0];
				}
			}

			lineCache += suffix;

			cache.shift();
		}

		returnBuffer.push(lineCache);
		return returnBuffer;
	}
	
	//////////////////////////////////////////////////////////////////////////////////////////////////////
 	//////////////////////////////////////////////////////////////////////////////////////////////////////

	async render() {
		// Necessary to prevent issues with events triggering excessive render calls.
		if(this.rendering) return;
		this.rendering = true;

		let queryBoxHeight = 3;
		let frameBuffer = [];

		// Prepare screen and Render Pane bar.
		const header = actions.clearall + actions.home + colors.bgBlue(this.tabs_string.padEnd(this.cols));
		frameBuffer.push(header);

		// Prepare queryBox header.
		const queryHeader = colors.bgBlue((' ').padStart(this.cols));

		////////////////////////////////////////////////////////////////////////////////////////////////
		// Render pane buffer.
		////////////////////////////////////////////////////////////////////////////////////////////////
		
		let activeBuffer = this.panes[this.activePane].buffer;
		let bufferHeight = this.rows - (queryBoxHeight + 2);
		let trimLength = (activeBuffer.length > bufferHeight) ? activeBuffer.length - bufferHeight : 0;
		let addLength = (activeBuffer.length < bufferHeight) ? bufferHeight - activeBuffer.length : 0;

		// Clip scroll position.
		this.scrollMax = trimLength;
		if(this.scrollPos > this.scrollMax) this.scrollPos = this.scrollMax;
		trimLength -= this.scrollPos;

		// Wrap buffer.
		let wrappedBuffer = [];
		for(let l = trimLength; l < activeBuffer.length - this.scrollPos; l++) {
			wrappedBuffer = wrappedBuffer.concat(this.wrapTextNoBreaks(activeBuffer[l]));
		}

		trimLength = (wrappedBuffer.length > bufferHeight) ? wrappedBuffer.length - bufferHeight : 0;

		wrappedBuffer = wrappedBuffer.slice(trimLength);
		frameBuffer = frameBuffer.concat(wrappedBuffer);

		//Calculate scroll limit.
		
		
		////////////////////////////////////////////////////////////////////////////////////////////////
		// Render QueryPane.
		////////////////////////////////////////////////////////////////////////////////////////////////

		frameBuffer.push(queryHeader);
		
		let queryBuffer = [];
		let querySplit = this.wrapTextNoBreaks(this.queryContent);

		let queryStartLine = (querySplit.length <= queryBoxHeight) ? 0 : (querySplit.length - queryBoxHeight);
		let queryFillLines = (querySplit.length > queryBoxHeight) ? 0 : (queryBoxHeight - querySplit.length);
		for(let q = queryStartLine; q < querySplit.length; q++)
		{
			queryBuffer.push(querySplit[q]);
		}

		let lastLineWidth = queryBuffer[queryBuffer.length - 1].length;
		let cursorX = lastLineWidth + ((lastLineWidth < this.cols) ? 1 : 0);
		let cursorY = this.rows - queryBoxHeight + queryBuffer.length;
		
		while(queryBuffer.length < queryBoxHeight) {
			queryBuffer.push('')
		}

		frameBuffer = frameBuffer.concat(queryBuffer);

		////////////////////////////////////////////////////////////////////////////////////////////////
		// Render buffer to terminal.
		////////////////////////////////////////////////////////////////////////////////////////////////

		if(frameBuffer.length == this.rows) {
			process.stdout.write(frameBuffer.join('\n'));
		} else {
			console.log('FATAL ERROR: screenbuffer size mismatch.');
			console.log('\tBuffer Height: ' + frameBuffer.length);
			console.log('\tWindow Height: ' + this.rows);
			console.log('\tLog Height: ' + wrappedBuffer.length);
			console.log('\tQuery Height: ' + queryBuffer.length);
			process.exit(1);
		}

        this.rendering = false;

	}

	//////////////////////////////////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////////////////////
}

module.exports = simpleUI; 
