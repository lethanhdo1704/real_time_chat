import { Server } from "socket.io";

export default function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  console.log("Socket.IO initialized");

  // ⚠️ Giữ logic socket cũ của bạn ở đây (nếu có)
  // io.on('connection', (socket) => { ... });

  // ✨ Return io instance để chat socket dùng
  return io;
}
