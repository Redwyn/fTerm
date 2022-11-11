const { builtinModules } = require("module");
const https = require('https');
const http = require('follow-redirects').http;
const querystring = require('querystring');

class requestHandler {
    constructor (host, paths, lock = false) {
        // If true then all paths must have freeze used on them after being set.
        this.lock = lock;
        Object.freeze(this.lock);

        // Determine protocol and port.
        this.protocol = host.split(':')[0];

        // If protocol is invalid, throw an error.
        if(this.protocol != 'http' && this.protocol != 'https') {
            console.error('Invalid protocol. Must be "http" or "https", but "' + this.protocol + '" was provided.');

            return false;
        }

        
        this.port = ((this.protocol) == 'https') ? 443 : 80;
        this.hostname = (host.split(':')[1].slice(2).split('/'))[0];

        this.paths = paths;

        if(!lock) return true;

        // Freeze paths provided.
        let pathIds = Object.keys(this.paths);
        for(let i = 0; i < this.pathIds.length; i++) {
            Object.freeze(this.paths[pathIds[i]]);
        }

        return true;
    }

    // Returns true if path is free or matches existing entry. Returns false if path exists but does not match.
    addPath(id, path) {
        if(this.paths[id] === undefined) {
            this.paths[id] = path;

            if(this.lock) Object.freeze(this.paths[id]);

            return true;
        }

        if(this.paths[id] === path) return true;

        if(!lock) this.paths[id] = path;

        return false;
    }

    buildRequest(path, method, body, verbose = false) {
        let options = {
            hostname: this.hostname,
            port: this.port,
            path: '/',
            method: method
        }

        options.path = this.paths[path];
        let bodyReturn = null;

        if (body != null) {
            bodyReturn = '' + querystring.stringify(body);

            options.headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': bodyReturn.length
            }
        }

        if (verbose) console.log(bodyReturn);

        return {"options": options, "body": bodyReturn};
    }

    async pushRequest(path, method, body, useString = false) {
        if(this.paths[path] == undefined) {
            throw 'Invalid path - Path ID: "' + path + '" does not exist.';
        }

        // Build a request which we can reference.
        const specs = this.buildRequest(path, method, body)

        // Using the specified port number, determine if we need to use http or https.
        const requestor = (specs.options.port == 443) ? https.request : http.request;

        const request = new Promise((resolve, reject) => {
            const req = requestor(specs.options, res => {
                let response = {
                    status: res.statusCode,
                    dataRaw: [],
                    data: ''
                }
    
                res.on('data', d => {
                    response.dataRaw.push(d);
                })
    
                res.on('end', () => {
                    try {
                        response.data = JSON.parse((Buffer.concat(response.dataRaw)).toString());
                    }
                    catch (e) {
                        response.data = (Buffer.concat(response.dataRaw)).toString();
                    }
    
                    resolve(response);
                })
            });
        
            req.on('error', error => {
                throw (error);
            });
        
            req.write(specs.body);
            req.end();
        });

        try {
            let bod = await request;
            return bod;
        } catch (e) {
            throw e;
        }
    }
}

module.exports = requestHandler;
