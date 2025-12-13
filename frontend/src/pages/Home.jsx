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
    logout();
    navigate("/login");
  };

  return (
    <div className="home-container">
      {/* Sidebar bên trái - PHẦN MỚI */}
      <div className="home-sidebar">
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
        
        <div className="chat-list">
          {/* Danh sách chat sẽ thêm sau */}
        </div>
      </div>

      {/* Main chat area bên phải */}
      <div className="home-main">
        <div className="home-chat-container">
          <ChatWindow currentRoom={currentRoom} user={user} />
        </div>
      </div>
    </div>
  );
}
