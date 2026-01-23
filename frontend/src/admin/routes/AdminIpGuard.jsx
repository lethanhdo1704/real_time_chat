// frontend/src/admin/routes/AdminIpGuard.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import NotFound from "../../user/pages/NotFound";

const API_URL = import.meta.env.VITE_API_URL;

export default function AdminIpGuard({ children }) {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    axios
      .get(`${API_URL}/admin/auth/ip-check`, {
        withCredentials: true,
      })
      .then(() => setStatus("allowed"))
      .catch(() => setStatus("denied"));
  }, []);

  // KHÔNG hiển thị gì khi đang check
  if (status === "loading") {
    return null;
  }

  // IP sai → 404 ngay lập tức
  if (status === "denied") {
    return <NotFound />;
  }

  // IP đúng → vào admin
  return children;
}