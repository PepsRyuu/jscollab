module.exports = function (app) {
    require = require("esm")(module)

    let { performance } = require('perf_hooks');
    let { performEditorChange } = require('./src/ChangeHandler');

    let rooms = {};

    function generateRoomId () {
        const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';

        return ['', '', '', '', '', ''].map(() => {
            return chars.charAt(Math.floor(Math.random() * chars.length));
        }).join('');
    }

    function createRoom (roomId) {
        return {
            roomId,
            sockets: [],
            members: [],
            inControl: 0,
            editors: {
                javascript: '',
                css: '',
                html: ''
            }
        };
    }

    function getStateForMember (room, member) {
        return {
            me: member.name,
            roomId: room.roomId,
            inControl: room.inControl,
            members: room.members,
            editors: room.editors
        };
    }

    app.get('/api/create-room', (req, res) => {
        let roomId = '';
        do { roomId = generateRoomId(); } while (rooms[roomId]);
        rooms[roomId] = createRoom(roomId);
        res.status(200).send({ roomId });
    });

    app.get('/api/rooms/:roomId', (req, res) => {
        let room = rooms[req.params.roomId];

        res.status(200).send({ 
            exists: room !== undefined,
            members: room? room.members.map(m => m.name) : []
        });
    });

    app.ws('/api/ws/:roomId/:name', (ws, req) => {
        let { roomId, name } = req.params;
        let room = rooms[roomId];
        let member = { name, ping: 0 };

        if (name.length > 10) {
            ws.send('Invalid name.');
            ws.close();
            return;
        }

        room.sockets.push(ws);
        room.members.push(member);

        broadcast(room, member => ({ type: 'state-sync', state: getStateForMember(room, member) }));

        let state_interval = setInterval(() => {
            broadcast(room, member => ({ type: 'state-sync', state: getStateForMember(room, member) }));
        }, 30000);

        let ping_interval = setInterval(() => {
            ws.send(JSON.stringify({ type: 'echo', timestamp: performance.now() }));
        }, 5000);

        ws.on('message', e => {
            e = JSON.parse(e);
            onMessage(e, ws, member, room);
        });

        ws.on('close', () => {
            let index = room.sockets.indexOf(ws);
            if (room.inControl > 0 && room.inControl === index) {
                room.inControl--;
            }

            room.sockets.splice(index, 1);
            room.members.splice(index, 1);

            clearInterval(state_interval);
            clearInterval(ping_interval);

            if (room.members.length === 0) {
                delete rooms[roomId];
            } else {
                return broadcast(room, member => ({ type: 'state-sync', state: getStateForMember(room, member) }));
            }

        });
    });

    function onMessage(e, ws, member, room) {
        if (e.type === 'echo-response') {
            member.ping = performance.now() - e.timestamp;
            return broadcast(room, member => ({ type: 'ping-sync', members: room.members }));
        }

        if (e.type === 'take-control') {
            room.inControl = room.members.findIndex(m => m === member);
            return broadcast(room, member => ({ type: 'state-sync', state: getStateForMember(room, member) }));
        }

        if (e.type === 'trigger-state-sync') {
            return broadcast(room, member => ({ type: 'state-sync', state: getStateForMember(room, member) }));
        }

        if (e.type === 'editor-changes') {
            for (let i = 0; i < e.changes.length; i++) {
                room.editors[e.editor] = performEditorChange(room.editors[e.editor], e.changes[i]);
            }
            
            return broadcast(room, member => e);
        }

        if (e.type === 'run-code') {
            Object.keys(e.editors).forEach(type => {
                room.editors[type] = e.editors[type];
            });
            return broadcast(room, member => e); 
        }

    }

    function broadcast (room, callback) {
        room.sockets.forEach((ws, index) => {
            let member = room.members[index];
            ws.send(JSON.stringify(callback(member)));
        });
    }
};