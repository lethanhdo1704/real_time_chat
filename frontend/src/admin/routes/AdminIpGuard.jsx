// admin/routes/AdminIpGuard.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import NotFound from "../../user/pages/NotFound";

const API_URL = import.meta.env.VITE_API_URL; 
// ví dụ: https://realtimechat-production.up.railway.app

export default function AdminIpGuard({ children }) {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    axios
      .get(`${API_URL}/api/admin/auth/ip-check`, {
        withCredentials: true,
      })
      .then(() => setStatus("allowed"))
      .catch(() => setStatus("denied"));
  }, []);

  if (status === "loading") return null;

  if (status === "denied") {
    return <NotFound />;
  }

  return children;
}
