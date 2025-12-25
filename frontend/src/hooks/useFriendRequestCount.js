// frontend/src/hooks/useFriendRequestCount.js
import { useEffect, useState } from "react";
import { getFriendsAndRequests } from "../services/friendService";

export function useFriendRequestCount(user) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // ✅ Chỉ chạy khi có user.uid (primitive value, không phải object)
    if (!user?.uid) {
      setCount(0);
      return;
    }

    const fetchCount = async () => {
      setLoading(true);
      try {
        const data = await getFriendsAndRequests(); // ✅ Không cần truyền uid
        const requestCount = (data.requests || []).length;
        setCount(requestCount);
      } catch (err) {
        console.error('Error fetching initial request count:', err);
        setCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchCount();
  }, [user?.uid]); // ✅ CHỈ depend vào user.uid (string), KHÔNG phải user (object)

  return { count, setCount, loading };
}