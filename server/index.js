const { Server } = require("socket.io");

const io = new Server(8000, {
  // we are creating a server on port 8000
  cors: true,
});

const emailToSocketIdMap = new Map();
const socketIdToEmailMap = new Map();

io.on("connection", (socket) => {
  console.log(`Socket Connected`, socket.id);
  socket.on("room:join", (data) => {
    // we are listening to the event room:join
    // console.log(`Room Join: ${email} ${room}`);
    const { email, room } = data;
    emailToSocketIdMap.set(email, socket.id);
    socketIdToEmailMap.set(socket.id, email);

    io.to(room).emit("user:joined", { email, id: socket.id });
    socket.join(room); // we are joining the room

    io.to(socket.id).emit("room:join", data); //
  });

  socket.on("user:call", ({ to, offer }) => {
    io.to(to).emit("incomming:call", { from: socket.id, offer });
  });
  socket.on("user:accepted", ({ to, ans }) => {
    io.to(to).emit("incomming:call", { from: socket.id, ans });
  });

  socket.on("peer:nego:needed", ({ to, offer }) => {
    io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  });

  socket.on("peer:nego:done", ({ to, ans }) => {
    io.to(to).emit("peer:nego:final", { from: socket.id, ans });
  });
});
