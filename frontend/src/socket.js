import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  transports: ["websocket", "polling"]
});


export default socket;