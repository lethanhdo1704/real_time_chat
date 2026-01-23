// admin/routes/AdminIpGuard.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import NotFound from "../../user/pages/NotFound";

export default function AdminIpGuard({ children }) {
  const [status, setStatus] = useState("loading");
  // loading | allowed | denied

  useEffect(() => {
    axios
      .get("/api/admin/auth/ip-check")
      .then(() => setStatus("allowed"))
      .catch(() => setStatus("denied"));
  }, []);

  if (status === "loading") return null;

  if (status === "denied") {
    return <NotFound />;
  }

  return children;
}
