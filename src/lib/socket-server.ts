import { Server } from "socket.io";

const io = new Server(3001, {
  cors: {
    origin: "*",
  },
});

console.log("🔌 New Socket.io server listening on port 3001");

io.on("connection", (socket) => {
  console.log("🚛 Client connected:", socket.id);

  socket.on("location:update", (data) => {
    // Broadcast to all clients except the sender
    socket.broadcast.emit("location:update", data);
  });

  socket.on("disconnect", () => {
    console.log("🔥 Client disconnected:", socket.id);
  });
});
