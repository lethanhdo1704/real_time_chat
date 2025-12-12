import ChatWindow from "../components/ChatWindow";
import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Home() {
  const { user, logout } = useContext(AuthContext);

  // room / user mà bạn đang chat
  const [currentRoom, setCurrentRoom] = useState(null);

  return (
    <div className="chat-container">
      <ChatWindow currentRoom={currentRoom} user={user} />
    </div>
  );
}
