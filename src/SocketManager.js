let ws;

function fetch (url, options = {}) {
    // Common metadata
    options.headers = options.headers || {};
    options.headers['X-Requested-With'] = 'XMLHttpRequest'; // Allows server to check for CSRF.
    options.credentials = 'same-origin'; // append cookies

    // Transform body into something consumable by server.
    if (options.body) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(options.body);
    }
    return window.fetch(url, options).then(res => {
        if (res.status >= 400) {
            return res.text().then(msg => {
                throw new Error(`Server Error: ` + msg);
            });
        }

        let contentType = res.headers.get('Content-Type');
        if (contentType && contentType.indexOf('application/json') > -1) {
            return res.json();
        }
    });
}

let messageCallbacks = [];

export default class SocketManager {
    static canJoinRoom (roomId) {
        return fetch('/api/rooms/' + roomId);
    }

    static createRoom () {
        return fetch('/api/create-room').then(res => {
            return res.roomId;
        });
    }

    static joinRoom (name, roomId) {
        return new Promise(resolve => {
            let protocol = window.location.protocol === 'https:'? 'wss:' : 'ws:';
            ws = new WebSocket(protocol + '//' + window.location.host + '/api/ws/' + roomId + '/' + name);
            ws.addEventListener('open', resolve);
            ws.addEventListener('message', e => {
                e = JSON.parse(e.data);
                messageCallbacks.forEach(cb => cb(e));
            });
        });
    }

    static sendMessage (data) {
        ws.send(JSON.stringify(data));
    }

    static onMessage (cb) {
        messageCallbacks.push(cb);

        return {
            remove: () => {
                let index = messageCallbacks.indexOf(cb);
                messageCallbacks.splice(index, 1);
            }
        }
    }
}