import { useRef, useState, useEffect } from 'preact/hooks';
import SocketManager from '../../SocketManager';
import { performEditorChange } from '../../ChangeHandler';
import Editor from './Editor';
import Modal from './Modal';
import './Room.scss';

function setEditorValue (type, value) {
    let editor = window.__editors[type];
    let scrollPos = editor.getScrollInfo();
    editor.setValue(value);
    editor.scrollTo(scrollPos.left, scrollPos.top);
}

export default function Room () {
    let [ loaded, setLoaded ] = useState(false);
    let [ showDisconnected, setShowDisconnected ] = useState(false);
    let socketCallback = useRef();
    let socketCloseCallback = useRef();
    let iframe = useRef();
    let [ roomState, setRoomState ] = useState({ 
        me: '',
        roomId: '',
        members: [],
        inControl: '',
        editors: { javascript: '', css: '', html: '' } 
    });

    let readonly = roomState.members.findIndex(m => m.name === roomState.me) !== roomState.inControl;

    function onRun () {
        let editors = Object.entries(window.__editors).reduce((acc, val) => {
            acc[val[0]] = val[1].getValue();
            return acc;
        }, {});

        SocketManager.sendMessage({ type: 'run-code', editors });
    }

    function onTakeControl () {
        SocketManager.sendMessage({ type: 'take-control' });
    }

    function onEditorChange(type, changes) {
        SocketManager.sendMessage({ type: 'editor-changes', editor: type, changes });
    }

    socketCallback.current = msg => {
        if (msg.type === 'echo') {
            SocketManager.sendMessage({ type: 'echo-response', timestamp: msg.timestamp });
        }

        if (msg.type === 'ping-sync') {
            setRoomState({
                ...roomState,
                members: msg.members
            });
        }

        if (msg.type === 'state-sync') {
            setRoomState(msg.state);

            if (!loaded) {
                for (let key in msg.state.editors) {
                    setEditorValue(key, msg.state.editors[key]);
                }
                setLoaded(true);
            }

        }

        if (msg.type === 'editor-changes') {
            if (readonly) {
                let output = window.__editors[msg.editor].getValue();
                for (let i = 0; i < msg.changes.length; i++) {
                    output = performEditorChange(output, msg.changes[i]);
                }
                setEditorValue(msg.editor, output);
            }
        }

        if (msg.type === 'run-code') {
            for (let type in msg.editors) {
                setEditorValue(type, msg.editors[type]);
            }

            iframe.current.srcdoc = `
                <html>
                    <head>
                        <style>
                            ${msg.editors.css}
                        </style>
                    </head>
                    <body>
                        ${msg.editors.html}
                        <script>
                            ${msg.editors.javascript}
                        </script>
                    </body>
                </html>
            `
        }
    };

    socketCloseCallback.current = () => {
        setShowDisconnected(true);
    };

    useEffect(() => {
        let handle = SocketManager.onMessage(msg => {
            socketCallback.current(msg);
        });

        SocketManager.onClose(() => {
            socketCloseCallback.current();
        });

        SocketManager.sendMessage({ type: 'trigger-state-sync' });

        return () => {
            handle.remove();
        }
    }, []);

    return (
        <div class="Room">
            <div class="Room-header">
                <h2>JSCollab</h2>
                <div class="Room-actions">
                    {readonly && <button onClick={onTakeControl}>Take Control</button>}
                    {!readonly && <button onClick={onRun}>Run</button>}
                </div>
            </div>
            <div class="Room-body">
                <div class="Room-sidebar">
                    <h4>Room</h4>
                    <p>{roomState.roomId}</p>
                    <h4>Participants</h4>
                    {roomState.members.map((m, i) => (
                        <div class="participant" data-incontrol={roomState.inControl === i}>
                            <div class="left">
                                {m.name}
                            </div>
                            <div class="right">
                                {Math.round(m.ping)}ms
                            </div>
                        </div>
                    ))}
                </div>
                <div class="Room-editors">
                    <div>
                        <div class="Room-html">
                            <Editor 
                                mode="html" 
                                readonly={readonly}
                                onChange={onEditorChange}
                            />
                            <div class="tag">HTML</div>
                        </div>
                        <div class="Room-css">
                            <Editor 
                                mode="css" 
                                readonly={readonly}
                                onChange={onEditorChange} 
                            />
                            <div class="tag">CSS</div>
                        </div>
                    </div>
                    <div>
                        <div class="Room-javascript">
                            <Editor 
                                mode="javascript" 
                                readonly={readonly} 
                                onChange={onEditorChange}
                            />
                            <div class="tag">JavaScript</div>
                        </div>
                        <div class="Room-result">
                            <iframe ref={iframe} />
                            <div class="tag">Result</div>
                        </div>
                    </div>
                </div>
            </div>
            {showDisconnected && (
                <Modal>
                    <p>You have disconnected. Please refresh and rejoin the room if you wish to resume.</p>
                </Modal>
            )}
        </div>
    );
}