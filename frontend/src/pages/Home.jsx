import ChatWindow from "../components/ChatWindow";
import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "../styles/Home.css";

export default function Home() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [currentRoom, setCurrentRoom] = useState(null);

  const handleLogout = () => {
    logout();          // xoá token + xoá user
    navigate("/login"); // điều hướng về login
  };

  return (
    <div className="home-container">
      {/* Header */}
      <div className="home-header">
        <div className="user-info">
          <img
            src={user?.avatar || "https://i.pravatar.cc/40"}
            alt="avatar"
            className="avatar"
          />
          <span className="username">{user?.username}</span>
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* Chat */}
      <div className="chat-container">
        <ChatWindow currentRoom={currentRoom} user={user} />
      </div>
    </div>
  );
}
