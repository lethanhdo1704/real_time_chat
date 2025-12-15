import ChatWindow from "../components/ChatWindow";
import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "../styles/Home.css";

export default function Home() {
  const { user, logout, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [currentRoom, setCurrentRoom] = useState(null);

  // Chưa load xong user → tránh render lỗi
  if (loading) {
    return <div className="home-loading">Loading...</div>;
  }

  // Chưa login → về login
  if (!user) {
    navigate("/login");
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="home-container">
      {/* Sidebar */}
      <div className="home-sidebar">
        <div className="home-header">
          <div className="user-info">
            <img
              src={user.avatar || "https://i.pravatar.cc/40"}
              alt="avatar"
              className="avatar"
            />
            <span className="username">{user.nickname}</span>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>

        <div className="chat-list">
          {/* TODO: danh sách phòng / user chat */}
        </div>
      </div>

      {/* Main chat */}
      <div className="home-main">
        <ChatWindow
          currentRoom={currentRoom}
          user={{
            uid: user.uid,
            nickname: user.nickname,
            avatar: user.avatar,
          }}
        />
      </div>
    </div>
  );
}
