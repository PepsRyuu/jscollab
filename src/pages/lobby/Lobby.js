import { useState } from 'preact/hooks';
import SocketManager from '../../SocketManager';
import './Lobby.scss';

export default function Lobby (props) {
    let [ name, setName ] = useState('');
    let [ room, setRoom ] = useState('');
    let [ error, setError ] = useState('');
    let [ processing, setProcessing ] = useState(false);

    function onNameInput (e) {
        setName(e.target.value.trim());
    }

    function onRoomInput (e) {
        setRoom(e.target.value.trim());
    }

    function onCreateRoom () {
        if (!name) {
            return setError('Missing name.');
        }

        if (room) {
            return setError('Did you mean to join room?');
        }

        setProcessing(true);

        SocketManager.createRoom().then(roomId => {
            SocketManager.joinRoom(name, roomId).then(() => {
                props.onScreenChange('room');
            });
        });
    }

    function onJoinRoom () {
        if (!name || !room) {
            return setError('Missing name or room.');
        }

        if (name.length > 10) {
            return setError('Name must be less than 10 characters.');
        }

        setProcessing(true);

        SocketManager.canJoinRoom(room).then(res => {
            if (res.exists) {
                if (res.members.indexOf(name) > -1) {
                    setProcessing(false);
                    return setError('Name already taken.');
                }

                SocketManager.joinRoom(name, room).then(() => {
                    props.onScreenChange('room');
                });
            } else {
                setProcessing(false);
                setError('Room does not exist.');
            }
        });
    }

    return (
        <div class="Lobby">
            <div>
                <h2>JSCollab</h2>
                <div>
                    <p>
                        <span>Name</span>
                        <input readonly={processing} type="text" onInput={onNameInput} />
                    </p>
                    <p> 
                        <span>Room</span>
                        <input readonly={processing} type="text" onInput={onRoomInput} />
                    </p>
                    <p class="buttons">
                        <button disabled={processing} onClick={onCreateRoom}>Create Room</button>
                        <button disabled={processing} onClick={onJoinRoom}>Join Room</button>
                    </p>
                    {error && <p class="error">{error}</p>}
                </div>
            </div>
            <div class="attribution">
                <a href="https://github.com/PepsRyuu" target="_blank" noopener>© PepsRyuu (2020)</a>
            </div>
        </div>
    )
}