// frontend/src/hooks/useInitFriends.js
import useFriendSocket from '../socket/useFriendSocket';

/**
 * Hook để khởi tạo friend system
 * 
 * 🔥 SIMPLIFIED:
 * - CHỈ setup socket listeners
 * - Fetching được handle BỞI useFriendSocket khi socket connected
 * - KHÔNG có logic fetch riêng
 */
export default function useInitFriends(user) {
  // 🔥 CHỈ setup socket listeners - fetching tự động xảy ra trong useFriendSocket
  useFriendSocket();
  
  // That's it! Mọi thứ khác được handle tự động:
  // 1. useFriendSocket chờ socket connected
  // 2. Khi connected → tự động fetch friends
  // 3. Register socket listeners cho realtime updates
}