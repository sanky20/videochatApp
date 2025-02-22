import { useState, useCallback, useEffect } from "react";
import { useSocket } from "../context/SocketProvider";
import { useNavigate } from "react-router-dom";

const LobbyScreen = () => {
  const [email, setEmail] = useState("");
  const [room, setRoom] = useState("");
  const socket = useSocket();
  const navigate = useNavigate();

  const handleSubmitForm = useCallback(
    (e) => {
      e.preventDefault();

      socket.emit("room:join", { email, room });
    },
    [email, room, socket]
  );

  const handleJoinRoom = useCallback((data) => {
    const { email, room } = data;
    navigate(`/room/${room}`);
  }, []);

  useEffect(() => {
    socket.on("room:join", handleJoinRoom);
    return () => {
      socket.off("room:join", handleJoinRoom);
    };
  }, [socket, handleJoinRoom]);

  return (
    <>
      <h1>Lobby</h1>
      <form onSubmit={handleSubmitForm}>
        <label htmlFor="email">Email </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <br />
        <label htmlFor="room">Room No: </label>
        <input
          type="room"
          id="room"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          required
        />
        <br />
        <button type="submit">Join</button>
      </form>
    </>
  );
};

export default LobbyScreen;
