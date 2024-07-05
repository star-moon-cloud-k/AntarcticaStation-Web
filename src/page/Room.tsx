import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

const Room: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const location = useLocation();
  const [nickname, setNickname] = useState<string>('');
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const nickname = params.get('nickname') || 'Guest';
    setNickname(nickname);

    socket.emit('join', roomId);

    socket.on('enter', async ({ userId }) => {
      console.log(`${userId} entered the room`);
      await createPeerConnection(userId);
      const offer = await peerConnectionRef.current?.createOffer();
      if (offer) {
        await peerConnectionRef.current?.setLocalDescription(offer);
        socket.emit('offer', { offer, selectedRoom: roomId });
      }
    });

    socket.on('offer', async ({ userId, offer }) => {
      await createPeerConnection(userId);
      await peerConnectionRef.current?.setRemoteDescription(
        new RTCSessionDescription(offer),
      );
      const answer = await peerConnectionRef.current?.createAnswer();
      if (answer) {
        await peerConnectionRef.current?.setLocalDescription(answer);
        socket.emit('answer', { answer, selectedRoom: roomId });
      }
    });

    socket.on('answer', async ({ answer }) => {
      await peerConnectionRef.current?.setRemoteDescription(
        new RTCSessionDescription(answer),
      );
    });

    socket.on('icecandidate', async ({ candidate }) => {
      if (candidate) {
        await peerConnectionRef.current?.addIceCandidate(
          new RTCIceCandidate(candidate),
        );
      }
    });

    return () => {
      socket.off('enter');
      socket.off('offer');
      socket.off('answer');
      socket.off('icecandidate');
    };
  }, [roomId, location.search]);

  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localVideoRef.current!.srcObject = stream;
      localStreamRef.current = stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  };

  const createPeerConnection = useCallback(
    (userId: string) => {
      peerConnectionRef.current = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });

      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('icecandidate', {
            candidate: event.candidate,
            selectedRoom: roomId,
          });
        }
      };

      peerConnectionRef.current.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };

      localStreamRef.current?.getTracks().forEach((track) => {
        peerConnectionRef.current?.addTrack(track, localStreamRef.current!);
      });
    },
    [roomId],
  );

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div>
      <h2>Room: {roomId}</h2>
      <h3>Nickname: {nickname}</h3>
      <button onClick={startLocalStream}>Start Local Stream</button>
      <div>
        <video ref={localVideoRef} autoPlay muted />
        <video ref={remoteVideoRef} autoPlay />
      </div>
    </div>
  );
};

export default Room;
