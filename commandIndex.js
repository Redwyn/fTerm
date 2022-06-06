const ErrorCodes = {
    "-10": "You may not roll dice or spin the bottle in frontpage.",
    "-9": "Unknown.",
    "-8": "Unknown.",
    "-7": "Unknown.",
    "-6": "Unknown.",
    "-5": "An unknown error occurred.",
    "-4": "A connection to the login server timed out. Please try again in a moment.",
    "-3": "This command has not been implemented yet.",
    "-2": "An error occurred while processing your command",
    "-1": "Fatal internal error.",

    "0": "Operation completed successfully.",
    "1": "Syntax error.",
    "2": "There are no free slots left for you to connect to.",
    "3": "This command requires that you have logged in.",
    "4": "Identification failed.",
    "5": "You must wait one second between sending channel messages.",
    "6": "The character requested was not found.",
    "7": "You must wait ten seconds between requesting profiles.",
    "8": "Unknown command.",
    "9": "You are banned from the server.",
    "10": "This command requires that you be an administrator.",
    "11": "Already identified.",
    "12": "Unknown.",
    "13": "You must wait ten secons between requesting kinks.",
    "14": "Unknown.",
    "15": "Message exceeded the maximum length.",
    "16": "This character is already a global moderator.",
    "17": "This character is not a global moderator.",
    "18": "There were no search results.",
    "19": "This command requires that you be moderator.",
    "20": "<character name> does not wish to recieve messages from you.",
    "21": "This action can not be used on a moderator or administrator.",
    "22": "Unknown.",
    "23": "Unknown.",
    "24": "Unknown.",
    "25": "Unknown.",
    "26": "Could not locate the requested channel.",
    "27": "Unknown.",
    "28": "You are already in the requested channel.",
    "29": "Unknown.",
    "30": "There are too many connections from your IP.",
    "31": "You have been disconnected because this character has been logged in at another location.",
    "32": "That account is already banned.",
    "33": "Unknown authentication method requested.",
    "34": "Unknown.",
    "35": "Unknown.",
    "36": "There was a problem with your roll command.",
    "37": "Unknown.",
    "38": "The time given for the timeout was invalid. It must be a number between 1 and 90 minutes.",
    "39": "You have been given a time out by <moderator name> for <length> minute(s). The reason given was: <reason>",
    "40": "You have been kicked from chat.",
    "41": "This character is already banned from the channel.",
    "42": "This character is not currently banned from the channel.",
    "43": "Unknown.",
    "44": "You may only join the requested channel with an invite.",
    "45": "You must be in a channel to send messages to it.",
    "46": "Unknown.",
    "47": "You may not invite others to a public channel.",
    "48": "You are banned from the requested channel.",
    "49": "That character was not found in the channel.",
    "50": "You must wait five seconds between searches.",
    "51": "Unknown.",
    "52": "Unknown.",
    "53": "Unknown.",
    "54": "Please wait two minutes between calling moderators. If you need to make an addition or a correction to a report, please contact a moderator directly.",
    "55": "Unknown.",
    "56": "You may only post a roleplay ad to a channel every ten minutes.",
    "57": "Unknown.",
    "58": "Unknown.",
    "59": "This channel does not allow role play ads, only chat messages.",
    "60": "This channel does not allow chat messages, only role play ads.",
    "61": "There were too many search terms.",
    "62": "There are currently no free login slots.",
    "63": "Unknown.",
    "64": "Your ignore list may not exceed 300 people.",
    "65": "Unknown.",
    "66": "Unknown.",
    "67": "Channel titles may not exceed 64 characters in length.",
    "68": "Unknown.",
    "69": "Unknown.",
    "60": "Unknown.",
    "71": "Unknown.",
    "72": "There are too many search results, please narrow your search.",
    "73": "Unknown.",
    "74": "Unknown.",
    "75": "Unknown.",
    "76": "Unknown.",
    "77": "Unknown.",
    "78": "Unknown.",
    "79": "Unknown.",
    "80": "Unknown.",


}

class ClientCommandProcessor {
    constructor () {
        let elevations = ['admin', 'chatop', 'chanop', 'standard'];

        this.cliCommands = {
            "ACB": {"implemented": false, "level": 1, "payload": '', "callback": null, "desc":'Requests a characters account be banned from the server.'},
            "AOP": {"implemented": false, "level": 0, "payload": '', "callback": null, "desc":'Promotes a user to chatop.'},
            "AWC": {"implemented": false, "level": 1, "payload": '', "callback": null, "desc":'requests a list of currently connected alts for a characters account.'},
            "BRO": {"implemented": false, "level": 0, "payload": '', "callback": null, "desc":'Broadcasts a message to all connections.'},
            "CBL": {"implemented": false, "level": 2, "payload": '', "callback": null, "desc":'Requests the channel banlist.'},
            "CBU": {"implemented": false, "level": 2, "payload": '', "callback": null, "desc":'Bans a character from a channel.'},
            "CCR": {"implemented": false, "level": 0, "payload": '', "callback": null, "desc":'Creates a private, invite-only channel.'},
            "CDS": {"implemented": false, "level": 2, "payload": '', "callback": null, "desc":'Changes a channels description.'},
            "CHA": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Requests a list of all public channels.'},
            "CIU": {"implemented": false, "level": 2, "payload": '', "callback": null, "desc":'Sends a channel invitation to a user.'},
            "CKU": {"implemented": false, "level": 2, "payload": '', "callback": null, "desc":'Kicks a user from a channel.'},
            "COA": {"implemented": false, "level": 2, "payload": '', "callback": null, "desc":'Request a character be promoted to channel operator.'},
            "COL": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Requests a list of channel ops.'},
            "COR": {"implemented": false, "level": 2, "payload": '', "callback": null, "desc":'Demotes a channel operator.'},
            "CRC": {"implemented": false, "level": 0, "payload": '', "callback": null, "desc":'Creates an official channel.'},
            "CSO": {"implemented": false, "level": 2, "payload": '', "callback": null, "desc":'Sets a new channel owner.'},
            "CTU": {"implemented": false, "level": 2, "payload": '', "callback": null, "desc":'Temporarily bans a user from the channel for 1 to 90 minutes. Aka a channel timeout.'},
            "CUB": {"implemented": false, "level": 2, "payload": '', "callback": null, "desc":'Unbans a user from a channel.'},
            "DOP": {"implemented": false, "level": 0, "payload": '', "callback": null, "desc":'Demotes a chatop'},
            "FKS": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Submits a search query for characters fitting the users selections. Only required parameter is kinks.'},
            "IDN": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Identifies with the server.'},
            "IGN": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'A command for handling all action related to the ignore list. It is the clients responsibility to handle message rejections.'},
            "JCH": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Sends a channel join request.'},
            "KIC": {"implemented": false, "level": 1, "payload": '', "callback": null, "desc":'Deletes a channel from the server.'},
            "KIK": {"implemented": false, "level": 1, "payload": '', "callback": null, "desc":'Requests for a character to be kicked from the server.'},
            "KIN": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Requests a list of a users kinks'},
            "LCH": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Requests to leave a channel.'},
            "LRP": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Sends a chat ad to all other users in a channel.'},
            "MSG": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Sends a message to all other users in a channel.'},
            "ORS": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Requests a list of open private rooms.'},
            "PIN": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Sends a ping response to the server. Serves as a form of timeout detection and keeps connection alive.'},
            "PRI": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Sends a private message to another user.'},
            "PRO": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Requests some of the profile tags of a character, such as preferred position or language preference.'},
            "RLL": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Rolls dice of spins a bottle.'},
            "RLD": {"implemented": false, "level": 1, "payload": '', "callback": null, "desc":'Reloads specific server config files.'},
            "RMO": {"implemented": false, "level": 2, "payload": '', "callback": null, "desc":'Changes room mode to accept chat, ads, or both.'},
            "RST": {"implemented": false, "level": 2, "payload": '', "callback": null, "desc":'Changes room status to either closed or open.'},
            "RWD": {"implemented": false, "level": 0, "payload": '', "callback": null, "desc":'Rewards a user, setting their status to crown until they change it or log out.'},
            "SFC": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Alerts admins and chatops of an issue.'},
            "STA": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Requests a new status be set for your character.'},
            "TMO": {"implemented": false, "level": 1, "payload": '', "callback": null, "desc":'Times out a user for anywhere from 1 to 90 minutes.'},
            "TPN": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Updates your typing status for private messages.'},
            "UNB": {"implemented": false, "level": 1, "payload": '', "callback": null, "desc":'Unbans a characters account from the server.'},
            "UPT": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Requests info about how long the server has been running, and some stats about usage.'},
        };

        this.srvCommands = {
            "ADL": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Sends current list of chatops.'},
            "AOP": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'The given character has been promoted to chatop.'},
            "BRO": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Incoming admin broadcast.'},
            "CDS": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Alerts the client that the channels description has been changed. Sent in response to JCH.'},
            "CHA": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Sends the client a list of all public channels'},
            "CIU": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Invites a user to a channel'},
            "CBU": {"implemented": false, "level": 2, "payload": '', "callback": null, "desc":'Removes a user from a channel, and prevents them from entering.'},
            "CKU": {"implemented": false, "level": 2, "payload": '', "callback": null, "desc":'Kicks a user from a channel.'},
            "COA": {"implemented": false, "level": 2, "payload": '', "callback": null, "desc":'Promotes a user to channel operator.'},
            "COL": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Sends the current list of channel ops. Sent in response to JCH'},
            "CON": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Returns number of connected users on server.'},
            "COR": {"implemented": false, "level": 2, "payload": '', "callback": null, "desc":'Removes a channel operator.'},
            "CSO": {"implemented": false, "level": 2, "payload": '', "callback": null, "desc":'Sets the owner of the channel provided'},
            "CTU": {"implemented": false, "level": 1, "payload": '', "callback": null, "desc":'Temporarily bans a user from the channel for 1 to 90 minutes.'},
            "DOP": {"implemented": false, "level": 0, "payload": '', "callback": null, "desc":'The provided character has been stripped of chatop status.'},
            "ERR": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Indicates an error has occured'},
            "FKS": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Sent in response to client FKS command. Contains search results.'},
            "FLN": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Informs client that a character went offline.'},
            "HLO": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Server hello command, returns server version and who wrote it.'},
            "ICH": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Initial Channel data. Response to JCH and CDS.'},
            "IDN": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Used to inform client that they have successfully identified, returns their character name as well.'},
            "JCH": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Indicates that the provided user has choined the given channel. This may also be the clients character.'},
            "KID": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Sends kink data in response to KIN client command'},
            "LCH": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Indicates the given character has left the channel. May also be the clients character.'},
            "LIS": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Sends a list of all online characters, along with their gender, status, and status message. Often sent out in baches.'},
            "NLN": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'A user has connected.'},
            "IGN": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Handles all aspects of ignore list'},
            "FRL": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Sends the initial Friends List.'},
            "ORS": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Sends a list of open private rooms.'},
            "PIN": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Ping command from the server. Requires response in the form of a ping command from the client.'},
            "PRD": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Profile data commands. Send in response to a PRO client command'},
            "PRI": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Informs client that a private message has been sent.'},
            "MSG": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Informs client that a message was sent in a channel.'},
            "LRP": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Informs client that an ad was recieved from a user in a channel.'},
            "RLL": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Rolls dice or spins the bottle'},
            "RMO": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Informs client that a rooms mode has been changed to accept ads, chat, or both.'},
            "RTB": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Real-Time Bridge. Indicates the user recieved a note or message. Right at the same moment it is recieved.'},
            "SFC": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Alerts, admins, and chatops of an issue.'},
            "STA": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Informs client that a user has changed their status.'},
            "SYS": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'An informative message from the server. Sometimes sent in response to commands such as RST, CIU, CBL, COL, and CUB. May also be sent after a response command such as SFC, COA, and COR.'},
            "TPN": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Informs a client of a users typing status.'},
            "UPT": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Informs the client of the servers self-tracked time along with some other information.'},
            "VAR": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Informs the client of specific server variables.'},
        };
    }

    assignClientCallback(header, callback) {
        if(this.cliCommands[header] != undefined && this.cliCommands[header] != null)
        {
            this.cliCommands[header].callback = callback;    
        }
    }

    assignServerCallback(header, callback) {
        if(this.srvCommands[header] != undefined && this.srvCommands[header] != null)
        {
            this.srvCommands[header].callback = callback;    
        }
    }

    processClientCommand(header, payload) {
        if(this.cliCommands[header] != undefined && this.cliCommands[header] != null)
        {
            const command = this.cliCommands[header];
            if(command.implemented && command.callback != undefined && command.callback != null)
            {
                this.cliCommands[header].callback();

                return true;
            }
        }
    }

      

    processServerCommand(header, payload) {
        if(this.cliCommands[header] != undefined && this.cliCommands[header] != null)
        {
            const command = this.cliCommands[header];
            if(command.implemented && command.callback != undefined && command.callback != null)
            {
                this.cliCommands[header].callback();

                return true;
            }
        }

        return false;
    }
}

class ServerCommandProcessor {
    constructor () {
        let elevations = ['admin', 'chatop', 'chanop', 'standard'];

        this.commands = {
            "ADL": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Sends current list of chatops.'},
            "AOP": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'The given character has been promoted to chatop.'},
            "BRO": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Incoming admin broadcast.'},
            "CDS": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Alerts the client that the channels description has been changed. Sent in response to JCH.'},
            "CHA": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Sends the client a list of all public channels'},
            "CIU": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Invites a user to a channel'},
            "CBU": {"implemented": false, "level": 2, "payload": '', "callback": null, "desc":'Removes a user from a channel, and prevents them from entering.'},
            "CKU": {"implemented": false, "level": 2, "payload": '', "callback": null, "desc":'Kicks a user from a channel.'},
            "COA": {"implemented": false, "level": 2, "payload": '', "callback": null, "desc":'Promotes a user to channel operator.'},
            "COL": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Sends the current list of channel ops. Sent in response to JCH'},
            "CON": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Returns number of connected users on server.'},
            "COR": {"implemented": false, "level": 2, "payload": '', "callback": null, "desc":'Removes a channel operator.'},
            "CSO": {"implemented": false, "level": 2, "payload": '', "callback": null, "desc":'Sets the owner of the channel provided'},
            "CTU": {"implemented": false, "level": 1, "payload": '', "callback": null, "desc":'Temporarily bans a user from the channel for 1 to 90 minutes.'},
            "DOP": {"implemented": false, "level": 0, "payload": '', "callback": null, "desc":'The provided character has been stripped of chatop status.'},
            "ERR": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Indicates an error has occured'},
            "FKS": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Sent in response to client FKS command. Contains search results.'},
            "FLN": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Informs client that a character went offline.'},
            "HLO": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Server hello command, returns server version and who wrote it.'},
            "ICH": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Initial Channel data. Response to JCH and CDS.'},
            "IDN": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Used to inform client that they have successfully identified, returns their character name as well.'},
            "JCH": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Indicates that the provided user has choined the given channel. This may also be the clients character.'},
            "KID": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Sends kink data in response to KIN client command'},
            "LCH": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Indicates the given character has left the channel. May also be the clients character.'},
            "LIS": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Sends a list of all online characters, along with their gender, status, and status message. Often sent out in baches.'},
            "NLN": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'A user has connected.'},
            "IGN": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Handles all aspects of ignore list'},
            "FRL": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Sends the initial Friends List.'},
            "ORS": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Sends a list of open private rooms.'},
            "PIN": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Ping command from the server. Requires response in the form of a ping command from the client.'},
            "PRD": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Profile data commands. Send in response to a PRO client command'},
            "PRI": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'A private message is recieve'},
            "MSG": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Informs client that a message was sent in a channel'},
            "LRP": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Informs client that an ad was recieved from a user in a channel.'},
            "RLL": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Rolls dice of spins the bottle'},
            "RMO": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Informs client that a rooms mode has been changed to accept ads, chat, or both.'},
            "RTB": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Real-Time Bridge. Indicates the user recieved a note or message. Right at the same moment it is recieved.'},
            "SFC": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Alerts, admins, and chatops of an issue.'},
            "STA": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Informs client that a user has changed their status.'},
            "SYS": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'An informative message from the server. Sometimes sent in response to commands such as RST, CIU, CBL, COL, and CUB. May also be sent after a response command such as SFC, COA, and COR.'},
            "TPN": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Informs a client of a users typing status.'},
            "UPT": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Informs the client of the servers self-tracked time along with some other information.'},
            "VAR": {"implemented": false, "level": 3, "payload": '', "callback": null, "desc":'Informs the client of specific server variables.'},
        };
    }

    assignCallback(header, callback) {
        if(this.commands[header] != undefined && this.commands[header] != null)
        {
            this.commands[header].callback = callback;    
        }
    }

    processCommand(header, payload) {
        if(this.commands[header] != undefined && this.commands[header] != null)
        {
            const command = this.commands[header];
            if(command.implemented && command.callback != undefined && command.callback != null)
            {
                this.commands[header].callback();

                return true;
            }
        }

        return false;
    }
}

function testCommandProcessor(processor) {
    let typeClient = processor instanceof ClientCommandProcessor;
    let typeServer = processor instanceof ServerCommandProcessor;    

    if(!typeClient || !typeServer) {
        console.error('ERROR: Invalid parameter provided for testing. Not an instance of ClientCommandProcessor or ServerCommandProcessor.');
        return false;
    }

    if(typeServer) {
        
    }
}

module.exports = {
	"ErrorCodes" : ErrorCodes,
	"ClientCommandProcessor": ClientCommandProcessor,
	"ServerCommandProcessor": ServerCommandProcessor
}
