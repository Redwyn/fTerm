
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
		newCache.push('');
	}

	return newCache;
}

class log {
	constructor () {
		this.mode = false;
	}
	
	
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
			c: false,
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

		this.panes = {};
		this.createPane('console', 'Console');

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

		this.inputHandler.on('mouse-move', (pos, parent = this) => {
			
			if(pos.x != parent.cursorPos.x || pos.y != parent.cursorPos.y) {
				parent.cursorPos.c = false;
			}
			
			parent.cursorPos.x = pos.x;
			parent.cursorPos.y = pos.y;
			
			this.render();
			process.stdout.write(this.cursorTo(pos.x, pos.y))
		})

		this.inputHandler.on('mouse-click', (pos, parent = this) => {
			parent.cursorPos.c = true;
			parent.cursorPos.x = pos.x;
			parent.cursorPos.y = pos.y;
		})

		this.inputHandler.on('mouse-scroll', (pos, dir) => {
			//this.scrollMax = this.panes[this.activePane].buffer.length;

			this.scrollPos = this.scrollPos + parseInt(dir);

			if(this.scrollPos > this.scrollMax) this.scrollPos = this.scrollMax;

			if(this.scrollPos < 0) this.scrollPos = 0;

			this.render();
			
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
			
			if(key.ctrl && key.name == 'q')
			{
				this.closePane(this.activePane);
				this.changePanes('console');
			}

			this.queryContent += key.sequence;
			this.render();
			return;
		})
	}

	//////////////////////////////////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////////////////////

	createPane(id, name = 'noname', paneType = 'standard') {
		this.panes[id] = {title : name, buffer: [], type: paneType, curX : 0, curY : 0, mode : 0};
		this.changePanes(id);

		this.fillPane(id);
	}
	
	//////////////////////////////////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////////////////////

	closePane(name) {
		if(name == 'console' || this.panes[name] == undefined) return;

		delete this.panes[name];
		
		if(name == this.activePane) this.changePanes('console');
		
		return true;
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
		let pane = 'console';
		let content = null;
		let forceRender = true;

		if(arguments.length == 1) {
			content = arguments[0];
		}

		if(arguments.length == 2) {
			if(typeof arguments[1] == 'boolean') {
				content = arguments[0];
				forceRender = arguments[1];
			} else {
				pane = arguments[0];
				content = arguments[1];
			}
		}

		if(arguments.length == 3) {
			pane = arguments[0];
			content = arguments[1];
			forceRender = arguments[2];
		}
	
		if(this.panes[pane] == undefined) {
			console.log('ERROR: pane "' + pane + '" does not exist.');
			console.log(arguments);
			process.exit();
		}

		//this.panes['console'].buffer.push(pane + ':' + forceRender + ":" + content);
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
		let cache = ('' + text).split(' ');
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
	
	changePanes(id) {
		//this.log('console', ('test: ' + id), false);
		
		if(this.panes[id] != undefined)
		{
			this.activePane = id;
			this.emit('tabChanged', id);
		}
	}
	
	//////////////////////////////////////////////////////////////////////////////////////////////////////
	//  This renders and controls tab switching in one go. The soltuion itself isn't satisfactory so I'll
	//  Promptly revisiting this to improve it.
	//
	//  If need be, I'll push an update to inputHandler on NPM to fix cursor click status reporting.
	//////////////////////////////////////////////////////////////////////////////////////////////////////
	
	buildNavBar() {
		let header = ' ';
		
		let bgColor = colors.bgBlue
		let hvColor = colors.bgBrightBlue;
		
		let paneIDs = Object.keys(this.panes);
		
		for(let p = 0; p < paneIDs.length; p++) {
			let nextPane = '';
			
			let pane = this.panes[paneIDs[p]];
			
			let xMin = header.length;
			let xMax = header.length + pane.title.length + 3;
			
			let hovering = (this.cursorPos.y == 1 && this.cursorPos.x > xMin && this.cursorPos.x < xMax)
			
			if(hovering && this.cursorPos.c) {
				this.changePanes(paneIDs[p]);
				
				this.cursorPos.c = false;
			}
			
			let paneActive = this.activePane != paneIDs[p];
			let prefix = (paneActive) ? ' ' : '[';
			let suffix = (paneActive) ? ' ' : ']';
			
			nextPane = `${prefix}${this.panes[paneIDs[p]].title}${suffix}`;

			if((header + nextPane).length > this.cols) break;
			header += ((hovering) ? hvColor(nextPane) : nextPane) + (((header + nextPane).length < this.cols) ? ' ' : '');
		}
		
		header = bgColor(header.padEnd(this.cols));
		
		return header;
	}
	
	//////////////////////////////////////////////////////////////////////////////////////////////////////
 	//////////////////////////////////////////////////////////////////////////////////////////////////////

	async render() {
		// Necessary to prevent issues with events triggering excessive render calls.
		if(this.rendering) return;
		this.rendering = true;

		let queryBoxHeight = 3;
		let frameBuffer = [];
		
		////////////////////////////////////////////////////////////////////////////////////////////////
		// Render Pane bar.
		////////////////////////////////////////////////////////////////////////////////////////////////

		let header = this.buildNavBar();
		
		const frameStart = actions.clearall + actions.home;
		frameBuffer.push(frameStart + header);

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
        
        if(this.cursorPos.c) {
			this.cursorPos.c = false;
		}

	}

	//////////////////////////////////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////////////////////
}

module.exports = simpleUI; 
