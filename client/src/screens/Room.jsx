import { useCallback, useEffect, useState } from "react";
import { useSocket } from "../context/SocketProvider";
import peer from "../service/peer";
import ReactPlayer from "react-player";

const RoomPage = () => {
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const handleUserJoined = useCallback(({ email, id }) => {
    console.log(`Email ${email} joined room`);
    setRemoteSocketId(id);
  }, []);

  const handleIncommingCall = useCallback(
    async ({ from, offer }) => {
      setRemoteSocketId(from);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setMyStream(stream);
      console.log(`Incoming call`, from, offer);
      const ans = await peer.getAnswer(offer);
      socket.emit("call:accepted", { to: from, ans });
    },
    [socket]
  );

  const sendStreams = useCallback(() => {
    for (const track of myStream.getTracks()) {
      peer.peer.addTrack(track, myStream);
    }
  }, [myStream]);

  const handleCallAccepted = useCallback(
    async (from, ans) => {
      peer.setLocalDescription(ans);
      console.log("call accepted");
      sendStreams();
    },
    [sendStreams]
  );

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [socket, remoteSocketId]);

  const handleNegoNeedIncomming = useCallback(async ({ from, offer }) => {
    const ans = await peer.getAnswer(offer);
    socket.emit("peer:nego:done", { to: from, ans });
  }, []);

  const handleNegoNeedFinal = useCallback(async ({ ans }) => {
    await peer.setLocalDescription(ans);
  }, []);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);

    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  useEffect(() => {
    peer.peer.addEventListener("track", async (ev) => {
      const remoteStream = ev.streams;
      console.log("GOT TRACKS !!!")
      setRemoteStream(remoteStream[0]);
    });
  }, [remoteStream]);

  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incomming:call", handleIncommingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegoNeedIncomming);
    socket.on("peer:nego:final", handleNegoNeedFinal);

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incomming:call", handleIncommingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegoNeedIncomming);
      socket.off("peer:nego:final", handleNegoNeedFinal);
    };
  }, [
    socket,
    handleUserJoined,
    handleIncommingCall,
    handleCallAccepted,
    handleNegoNeedIncomming,
    handleNegoNeedFinal,
  ]);

  const handleCallUser = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    const offer = await peer.getOffer(); // apni stream kaa offer bana rhe hai
    socket.emit("user:call", { to: remoteSocketId, offer }); // uss offer ko dusre ko send kr diye taaki wo use accept krke meri stream ko dekh sake
    setMyStream(stream);
  }, [socket, remoteSocketId]);

  return (
    <div>
      <h1>Room</h1>
      <h4>{remoteSocketId ? "Connected" : "No one in Room"}</h4>
      {myStream && <button onClick={sendStreams}>Send Stream</button>}
      {remoteSocketId && <button onClick={handleCallUser}>Call</button>}
      {myStream && (
        <>
          <h1>My Stream</h1>
          <ReactPlayer
            playing
         
            height="100px"
            width="200px"
            url={myStream}
          />
        </>
      )}
      {remoteStream && (
        <>
          <h1>Remote Stream</h1>
          <ReactPlayer
            playing
       
            height="100px"
            width="200px"
            url={remoteStream}
          />
        </>
      )}
    </div>
  );
};

export default RoomPage;
