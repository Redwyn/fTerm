////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  Purpose:
//    To provide a core class that can be used to interact with the F-Chat servers. 
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  Restrictions:
//    - This class cannot interact with, or send, commands on it's own, merely relay data.
//      - The only exception to this is pinging the server to indicate a live connection.
//
//    - It must be possible to configure instances to connect to 3rd party servers.
//    - The class must have an accesible buffer for recieved commands, as well as relay events
//    - The class must store all session information in a cache object.
//    - The cache must be accessible through setters and getters.
//    - The class must make minimal use of Node modules.
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// homebrew HTTPS request handler. Needed for F-Chat's JSON API.
const requestHandler = require('./RequestHandler.js');

class fCoreClient {
    constructor () {
        this.apiHost = 'https://www.f-list.net/'
        this.apiPaths = {
            test: "",
            getApiTicket : "/json/getApiTicket.php",
            bookmark_add : '/json/api/bookmark-add.php',
            bookmark_list : '/json/api/bookmark-list.php',
            bookmark_remove : '/json/api/bookmark-remove.php',
            character_data : '/json/api/character-data.php',
            character_list : '/json/api/character-list.php',
            group_list : '/json/api/group-list.php',
            ignore_list : '/json/api/ignore-list.php',
            info_list : '/json/api/info-list.php',
            kink_list : '/json/api/kink-list.php',
            mapping_list : '/json/api/mapping-list.php',
            friend_list : '/json/api/friend-list.php',
            friend_remove : '/json/api/friend-remove.php',
            request_accept : '/json/api/request-accept.php',
            request_cancel : '/json/api/request-cancel.php',
            request_deny : '/json/api/request-deny.php',
            request_list : '/json/api/request-list.php',
            request_pending : '/json/api/request-pending.php',
            request_send : '/json/api/request-send.php',
        };

        this.queryHandler = new requestHandler(this.apiHost, this.apiPaths);
        
        this.cache = {
            characters_user: null,
            character_active: null,

            groups_global: null,

            list_friends: [],
            list_friend_requests_incoming: [],
            list_friend_requests_outgoing: [],

            list_ignored: null,
            list_kinks_available: null,
            list_map_kinks: null,
            list_map_kink_groups: null,
            list_map_infotags: null,
            list_map_infotag_groups: null,
            list_map_profile_fields: null,

            data_profile_fields: null
        };

        this.credentials = {
            account: null,
            password: null,
            ticket: null
        };

        this.socket = null;
        this.socketPath = 'wss://chat.f-list.net/chat2';
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    async requestTicket (params = {no_friends: true, no_bookmarks: true, no_characters: true}) {
        let request = await this.queryHandler.pushRequest('getApiTicket', 'POST', { ...this.credentials, ...arguments[0]});

        if(request.status !== 200 || request.status !== 200) return false;

        this.credentials.ticket = request.data.ticket;

        return true;
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    async requestBookmarkAdd (charName) {
        let request = await this.queryHandler.pushRequest('bookmark_add', 'POST', { 
            account: this.credentials.account,
            ticket: this.credentials.ticket, 
            name: charName // TODO: Once the rest of the API is working, try running this with a user ID in place of the name.
        });

        if(request.status !== 200 || request.data.error !== '') {
            console.error(request);

            return false;
        }

        return true;
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    async requestBookmarkList () {
        let request = await this.queryHandler.pushRequest('bookmark_list', 'POST', { 
            name: 'fTerm',
            account: this.credentials.account,
            ticket: this.credentials.ticket
        });

        console.log(request);

        if(request.status !== 200 || request.data.error !== '') {
            console.log(request);

            return false;
        }

        return true;
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    async requestBookmarkRemove (charName) {
        let request = await this.queryHandler.pushRequest('bookmark_remove', 'POST', { 
            account: this.credentials.account,
            ticket: this.credentials.ticket, 
            name: charName // TODO: Once the rest of the API is working, try running this with a user ID in place of the name.
        });

        

        if(request.status !== 200 || request.data.error !== '') {
            console.error(request);

            return false;
        }

        return true;
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    async requestCharacterData (charName) {
        let request = await this.queryHandler.pushRequest('character_data', 'POST', {
            account: this.credentials.account,
            ticket: this.credentials.ticket,
            name: charName
        });

        if (request.status !== 200 || request.data.error !== '') {
            console.log(request);

            return false;
        }

        return true;
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    async requestCharacterList () {
        let request = await this.queryHandler.pushRequest('character_list', 'POST', {
            account: this.credentials.account, 
            ticket: this.credentials.ticket
        });

        if (request.status !== 200 || request.data.error !== '') return false;

        this.cache.characters_user = request.data.characters;

        return true;
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    
    async requestGroupList () {
        let request = await this.queryHandler.pushRequest('group_list', 'POST', {
            account: this.credentials.account, 
            ticket: this.credentials.ticket
        });

        if (request.status !== 200 || request.data.error !== '') return false;

        this.cache.groups_global = request.data.groups;

        return true;
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    async requestIgnoreList () {
        let request = await this.queryHandler.pushRequest('ignore_list', 'POST', {
            account: this.credentials.account, 
            ticket: this.credentials.ticket
        });

        if (request.status !== 200 || request.data.error !== '') return false;

        this.cache.list_ignored = request.data.ignores;

        return true;
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    
    async requestInfoList () {
        let request = await this.queryHandler.pushRequest('info_list', 'POST', {});

        if (request.status !== 200 || request.data.error !== '') return false;

        this.cache.data_profile_fields = request.data.info; // TODO: There's probably a more useful way to store this info.

        return true;
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    async requestKinkList () {
        let request = await this.queryHandler.pushRequest('kink_list', 'POST', {});

        if (request.status !== 200 || request.data.error !== '') return false;

        this.cache.list_kinks_available = request.data.kinks; // TODO: There's probably a more useful way to store this info.

        return true;
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    async requestMappingList () {
        let request = await this.queryHandler.pushRequest('mapping_list', 'POST', {});

        if (request.status !== 200 || request.data.error !== '') return false;

        this.cache.list_map_kinks = request.data.kinks; // TODO: There's probably a more useful way to store this info.
        this.cache.list_map_kink_groups
        this.cache.list_map_infotags
        this.cache.list_map_infotag_groups
        this.cache.list_map_profile_fields

        return true;
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    async requestFriendList () {
        let request = await this.queryHandler.pushRequest('friend_list', 'POST', {
            account: this.credentials.account, 
            ticket: this.credentials.ticket
        });

        if (request.status !== 200 || request.data.error !== '') return false;

        this.cache.list_friends = request.data.friends;

        return true;
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    async requestFriendRemove (name) {
        let request = await this.queryHandler.pushRequest('friend_remove', 'POST', {
            account: this.credentials.account, 
            ticket: this.credentials.ticket,
            source_name: this.cache.character_active,
            dest_name: name
        });

        if (request.status !== 200 || request.data.error !== '') return false;

        return true;
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    async requestFriendRequestAccept (id) {
        if(!this.cache.list_friend_requests_incoming.includes(id)) return false;

        let request = await this.queryHandler.pushRequest('friend_accept', 'POST', {
            account: this.credentials.account, 
            ticket: this.credentials.ticket,
            request_id: id
        });

        if (request.status !== 200 || request.data.error !== '') return false;

        return true;
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    async requestFriendRequestCancel (id) {
        if(!this.cache.list_friend_requests_incoming.includes(id)) return false;

        let request = await this.queryHandler.pushRequest('friend_cancel', 'POST', {
            account: this.credentials.account, 
            ticket: this.credentials.ticket,
            request_id: id
        });

        if (request.status !== 200 || request.data.error !== '') return false;

        return true;
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    async requestFriendRequestDeny (id) {
        if(!this.cache.list_friend_requests_incoming.includes(id)) return false;

        let request = await this.queryHandler.pushRequest('friend_deny', 'POST', {
            account: this.credentials.account, 
            ticket: this.credentials.ticket,
            request_id: id
        });

        if (request.status !== 200 || request.data.error !== '') return false;

        return true;}

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    async requestFriendRequestList () {
        let request = await this.queryHandler.pushRequest('request_list', 'POST', {
            account: this.credentials.account, 
            ticket: this.credentials.ticket
        });

        if (request.status !== 200 || request.data.error !== '') return false;

        this.cache.list_friend_requests_incoming = request.data.requests;

        return true;
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    async requestFriendRequestPending () {
        let request = await this.queryHandler.pushRequest('request_pending', 'POST', {
            account: this.credentials.account, 
            ticket: this.credentials.ticket
        });

        if (request.status !== 200 || request.data.error !== '') return false;

        this.cache.list_friend_requests_outgoing = request.data.requests;

        return true;
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    async requestFriendRequestSend (name) {
        if(!this.cache.list_friend_requests_incoming.includes(id)) return false;

        let request = await this.queryHandler.pushRequest('rquest_send', 'POST', {
            account: this.credentials.account, 
            ticket: this.credentials.ticket,
            source_name: this.cache.character_active,
            dest_name: name
        });

        if (request.status !== 200 || request.data.error !== '') return false;

        return true;
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    getTicket() {
        return (this.credentials.ticket === null) ? false : this.credentials.ticket
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    getCharacters() {
        if(this.cache.characters_user === null) return [];

        return this.cache.characters_user;
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    getActiveCharacter() {
        return this.cache.character_active;
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    getGlobalGroups() {
        return this.cache.groups_global;
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    getIgnoredCharacters() {
        return this.cache.list_ignored;
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    setCredentials (payload) {
        if (payload.account == undefined || payload.password == undefined) {
            console.error('Invalid credential data. Expecing "account,password" but got "' + Object.keys(payload) + '". Aborting.');
            return false;
        }

        this.credentials.account = payload.account;
        this.credentials.password = payload.password;

        return true;
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    setActiveCharacter(characterId) {
        if (typeof characterId !== 'number') {
            console.error('FATAL: Invalid parameter type passed. Unable to assign Character.');
            
            return false;
        }

        this.cache.character_active = this.cache.characters_user[characterId];

        return true;
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    connect () {}
}

// Crude test set.

async function test() {
    console.log('Beginning self test.')

    const credentials = {account:'user', password:'password'} // Please don't actually use this as your password, i BEG you.

    let module = new fCoreClient();

    console.log('\nSetting credentials...');
    console.log(`\t...${module.setCredentials(credentials) ? 'Success.' : 'Fail.'}`);

    console.log('\nRequesting ticket...');
    console.log(`\t...${(await module.requestTicket()) ? 'Success.' : 'Fail.'}`);
    console.log('\t\t Ticket: ' + module.credentials.ticket);

    console.log('\nRequesting Characters...');
    console.log(`\t...${(await module.requestCharacterList()) ? 'Success.' : 'Fail.'}`);
    
    console.log(`\n\tCharacters available:\n${JSON.stringify(module.getCharacters()).replace(/,/g, '\n\t\t')}`);

    console.log(`\nSetting Active Character to last available...`);
    console.log(`\t...${module.setActiveCharacter(module.getCharacters().length - 1) ? 'Success.' : 'Fail.'}`);

    console.log(`\t...Active character set to "${module.getActiveCharacter()}"`);

    console.log(`\nAttempting to add bookmark "Fterm"...`);
    console.log(`\t...${await module.requestBookmarkAdd('fterm') ? 'Success.' : 'Fail.'}`);
    
    console.log(`\nAttempting to check bookmarks...`);
    console.log(`\t...${await module.requestBookmarkList() ? 'Success.' : 'Fail.'}`);

    console.log(`\nAttempting to remove bookmark "Fterm"...`);
    console.log(`\t...${await module.requestBookmarkRemove('fterm') ? 'Success.' : 'Fail.'}`);

    console.log(`\nAttempting to grab info for "Fterm"...`);
    console.log(`\t...${await module.requestCharacterData('fterm') ? 'Success.' : 'Fail.'}`);

    console.log(`\nAttempting to grab global group list...`);
    console.log(`\t...${await module.requestGroupList() ? 'Success.' : 'Fail.'}`);
    console.log(`\t...Groups available: ${module.getGlobalGroups().length}`);

    console.log(`\nAttempting to grab ignored users list...`);
    console.log(`\t...${await module.requestIgnoreList() ? 'Success.' : 'Fail.'}`);
    console.log(`\t...Characters ignored: ${module.getIgnoredCharacters().length}`);
}

test();
