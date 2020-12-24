import { useState } from 'preact/hooks';
import Lobby from './pages/lobby/Lobby';
import Room from './pages/room/Room';
import './App.scss';

export default function App () {
    let [ screen, setScreen ] = useState('lobby');

    return (
        <div class="App">
            {screen === 'lobby' && <Lobby onScreenChange={setScreen} />}
            {screen === 'room' && <Room />}
        </div>
    )
}