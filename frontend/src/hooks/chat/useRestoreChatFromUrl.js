import { useEffect } from "react";
import { useParams } from "react-router-dom";
import useChatStore from "../../store/chatStore";
import api from "../../services/api";

export default function useRestoreChatFromUrl() {
  const { friendId } = useParams();

  const setActiveFriend = useChatStore(s => s.setActiveFriend);
  const setActiveConversation = useChatStore(s => s.setActiveConversation);

  useEffect(() => {
    if (!friendId) return;

    let cancelled = false;

    const restore = async () => {
      try {
        // 1️⃣ Lấy friend info
        const friendRes = await api.get(`/friends/${friendId}`);
        if (cancelled) return;

        const friend = friendRes.data;
        setActiveFriend(friend);

        // 2️⃣ Lấy / tạo conversation
        const convRes = await api.post("/conversations/private", {
          friendUid: friend.uid,
        });

        if (cancelled) return;
        setActiveConversation(convRes.data.conversationId);

      } catch (err) {
        console.error("❌ Restore chat failed:", err);
      }
    };

    restore();

    return () => {
      cancelled = true;
    };
  }, [friendId]);
}
