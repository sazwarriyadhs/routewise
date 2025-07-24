import { Server } from "socket.io";

const io = new Server(4000, {
  cors: {
    origin: "*",
  },
});

console.log("🔌 New Socket.io server listening on port 4000");

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
