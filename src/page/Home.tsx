import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

const Home: React.FC = () => {
  const [nickname, setNickname] = useState('');
  const [room, setRoom] = useState('');
  const [rooms, setRooms] = useState<{ id: string }[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    socket.emit('getRooms');
    socket.on('roomList', (rooms) => {
      setRooms(rooms);
    });

    return () => {
      socket.off('roomList');
    };
  }, []);

  const createRoom = () => {
    if (nickname && room) {
      socket.emit('createRoom', room);
      navigate(`/room/${room}?nickname=${nickname}`);
    }
  };

  const joinRoom = (roomId: string) => {
    if (nickname) {
      navigate(`/room/${roomId}?nickname=${nickname}`);
    }
  };

  return (
    <div>
      <div>room list</div>
      <ul>
        {rooms.map((r) => (
          <li key={r.id}>
            <span>{r.id} </span>
            <button onClick={() => joinRoom(r.id)}>Join</button>
          </li>
        ))}
      </ul>
      <input
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        placeholder="Enter your nickname"
      />
      <input
        value={room}
        onChange={(e) => setRoom(e.target.value)}
        placeholder="Enter room name"
      />
      <button onClick={createRoom}>Create Room</button>
      <div>
        {rooms.map((r) => (
          <div key={r.id}>
            <span>{r.id}</span>
            <button onClick={() => joinRoom(r.id)}>Join</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
