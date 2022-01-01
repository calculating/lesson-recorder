// WebSocket connection
console.log('Javascript running.');
const connection = new WebSocket('wss://ignui.com:8080');
var rqst = {};
var id;
var connected = false;
// Getting messages back from vps
connection.onmessage = (event) => {
    if (!location.search) {
        console.log("WebSocket recieved message: " + event.data);
        window.location.replace(window.location.href + '?id=' + event.data);
    } else {
        document.getElementById('link').innerHTML = event.data;
    }
};

function requestRecord() {
    rqst = {};
    rqst.name = document.getElementsByName('fname')[0].value;
    rqst.link = document.getElementsByName('flink')[0].value;
    rqst.rqType = 'meetRecord';
    connection.send(JSON.stringify(rqst));
}


function linkCheck() {
    if (connected = true) {
        rqst = {};
        rqst.rqType = 'ping';
        rqst.id = id;
        connection.send(JSON.stringify(rqst));
        console.log('pingy');
    }
    setTimeout(linkCheck, 5000);
}


function setup() {
    if (location.search) {
        id = location.search.split('=')[1]
        document.getElementById('inputArea').innerHTML = ''
        document.getElementById('info').innerHTML = 'The bot will stop recording when everyone has left the meeting, and a link to the video file will appear here. You can copy the URL for this page and return to it later to retrieve the video file.'
        console.log('starting link ping')
        setTimeout(linkCheck, 5000);
    }
}

//Console log
connection.onopen = (event) => {
    console.log('WebSocket is sucessfully connected.');
    connected = true;
};

connection.onclose = (event) => {
    console.log('WebSocket has closed.');
};

connection.onerror = (event) => {
    console.error('WebSocket error:', event);
};
