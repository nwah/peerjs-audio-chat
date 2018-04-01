const path = require('path');
const https = require('https');
const fs = require('fs');

const express = require('express');
const routes = require('./routes');
const app = express();

const options = {
    key: fs.readFileSync('ssl/server.key'),
    cert: fs.readFileSync('ssl/server.crt'),
};

https.createServer(options, app).listen(6767);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));
app.use('/', routes);

var PeerServer = require('peer').PeerServer;

var server = PeerServer({
  port: 9000,
  ssl: options
});

console.log('Listening on 6767');