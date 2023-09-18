const WebSocket = require('ws');
const https = require('https');
const fs = require('fs');
const fileName = '/var/www/html/jobs.json';
var file = require(fileName);
const request = require('request');


const server = https.createServer({
    cert: fs.readFileSync('/etc/letsencrypt/live/domain.com/fullchain.pem'),
    key: fs.readFileSync('/etc/letsencrypt/live/domain.com/privkey.pem')
});


const wss = new WebSocket.Server({
    server: server
});

server.listen(8080)

console.log("WebSocket online")

var connections = 0;

wss.on('connection', (ws) => {
    console.log('attempted connect.');
    connections++;
    console.log(connections + ' clients connected');
    //ws.send('pl' + connections)
    var aliveCheck = setInterval(check, 1000);
    function check() {
        if (ws.readyState !== 1) {
            connections--;
            ws.close();
            console.log(connections + ' clients connected');
            clearInterval(aliveCheck);
        }
    };

    // runs a callback on message event
    ws.on('message', (data) => {
        console.log('recieved websocket message: ' + data)
        data = JSON.parse(data);
        console.log(data);
        if (data.rqType == 'meetRecord') {
            //Generate new client ID
            id = makeid(10);
            console.log(id);
            file = {};
            file[id] = {};
            file[id]['name'] = data.name;
            file[id]['link'] = data.link;
            fs.writeFile(fileName, JSON.stringify(file), function writeJSON(err) {
                if (err) return console.log(err);
                console.log(JSON.stringify(file));
                console.log('writing to ' + fileName);
            });
            console.log(file);
            ws.send(id);
        } else if (data.rqType == 'ping') {
            request('https://firebasestorage.googleapis.com/v0/b/quicktemplate-ba238.appspot.com/o/' + data.id + '.json?alt=media', function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var importedJSON = JSON.parse(body);
                    console.log(importedJSON);
                    ws.send(importedJSON.status);
                    

                }
            })
        }
    });
});

function makeid(length) {
    var result = '';
    var characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
