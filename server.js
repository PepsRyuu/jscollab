let http = require('http');
let express = require('express');
let expressws = require('express-ws');

let app = express();
let server = http.createServer(app);
expressws(app, server);

require('./server-middleware')(app);

app.use(express.static('./dist'));
server.listen(process.env.PORT || 80, () => {
    console.log('Listening...');
});

process.on('uncaughtException', e => {
    console.error(e);
});