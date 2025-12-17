import privateChat from "./privateChat.js";
import { Server } from "socket.io";

export default function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ["websocket", "polling"]
  });

  console.log(" Socket.IO server initialized");

  // Initialize private chat handler
  privateChat(io);

  return io;
}