import { Server } from "socket.io";
import type { Vehicle } from "./types";

const io = new Server(3001, {
  cors: {
    origin: "*",
  },
});

console.log("🔌 Socket.io server listening on port 3001");

io.on("connection", (socket) => {
  console.log("🚛 Client connected:", socket.id);

  socket.on("location:update", (data: Vehicle) => {
    // Broadcast to all clients including the sender for this specific event
    io.emit("location:update", data);
  });

  socket.on("disconnect", () => {
    console.log("🔥 Client disconnected:", socket.id);
  });
});
