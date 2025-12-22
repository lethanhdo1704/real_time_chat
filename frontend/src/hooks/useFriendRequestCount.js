// frontend/src/hooks/useFriendRequestCount.js
import { useEffect, useState } from "react";
import { getFriendsAndRequests } from "../services/friendService";

export function useFriendRequestCount(user) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchCount = async () => {
      try {
        const data = await getFriendsAndRequests(user.uid);
        const requestCount = (data.requests || []).length;
        setCount(requestCount);
      } catch (err) {
        console.error('Error fetching initial request count:', err);
      }
    };

    fetchCount();
  }, [user]);

  return [count, setCount];
}