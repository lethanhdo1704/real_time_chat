// frontend/src/components/FriendFeature/AddFriend.jsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import friendService from "../../services/friendService";
import useFriendActions from "../../hooks/friends/useFriendActions";
import AvatarImage from "../common/AvatarImage";

/**
 * AddFriend Component - ✅ REDESIGNED UI
 */
export default function AddFriend({ currentUser }) {
  const { t } = useTranslation("friendFeature");
  const [uid, setUid] = useState("");
  const [result, setResult] = useState(null);
  const [friendStatus, setFriendStatus] = useState(null);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [searching, setSearching] = useState(false);

  const {
    loading,
    sendFriendRequest,
    checkFriendStatus
  } = useFriendActions();

  // ============================================
  // HELPER: CHECK STATUS
  // ============================================
  
  const checkStatus = async (friendUid) => {
    try {
      const status = await checkFriendStatus(friendUid);
      setFriendStatus(status);
      return status;
    } catch (err) {
      console.error("Error checking friend status:", err);
      setFriendStatus(null);
      return null;
    }
  };

  // ============================================
  // SEARCH USER
  // ============================================
  
  const handleSearch = async () => {
    if (!uid.trim()) {
      setMessage({ text: t("addFriend.messages.emptyUID"), type: "error" });
      return;
    }
    
    setSearching(true);
    setMessage({ text: "", type: "" });
    setFriendStatus(null);
    
    try {
      const response = await friendService.getFriendStatus(uid.trim());
      
      console.log("📥 Friend status response:", response);
      
      if (!response || !response.user) {
        throw new Error("Invalid response: missing user information");
      }
      
      const user = {
        uid: response.user.uid,
        nickname: response.user.nickname || response.user.fullName || response.user.uid,
        avatar: response.user.avatar,
        avatarUpdatedAt: response.user.avatarUpdatedAt
      };
      
      console.log("✅ Processed user data:", user);
      
      if (user.uid === currentUser.uid) {
        setResult(null);
        setFriendStatus(null);
        setMessage({ text: t("addFriend.messages.cannotAddSelf"), type: "error" });
        return;
      }
      
      setResult(user);
      setFriendStatus(response.status);
      
      if (response.status === "friends") {
        setMessage({ text: t("addFriend.messages.alreadyFriends"), type: "info" });
      } else if (response.status === "request_sent") {
        setMessage({ text: t("addFriend.messages.requestAlreadySent"), type: "info" });
      } else if (response.status === "request_received") {
        setMessage({ text: t("addFriend.messages.requestAlreadyReceived"), type: "info" });
      } else {
        setMessage({ text: "", type: "" });
      }
      
    } catch (err) {
      console.error("❌ Search error:", err);
      setResult(null);
      setFriendStatus(null);
      
      let errorMessage = t("addFriend.messages.userNotFound");
      
      if (err.message === "USER_NOT_FOUND" || err.message.includes("USER_NOT_FOUND")) {
        errorMessage = t("addFriend.messages.userNotFound");
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setMessage({ 
        text: errorMessage, 
        type: "error" 
      });
    } finally {
      setSearching(false);
    }
  };

  // ============================================
  // SEND REQUEST
  // ============================================
  
  const handleSend = async () => {
    if (!result) return;
    
    try {
      await sendFriendRequest(result.uid);
      const newStatus = await checkStatus(result.uid);
      setMessage({ text: t("addFriend.messages.requestSentSuccess"), type: "success" });
    } catch (err) {
      const errorMessage = err.message || t("addFriend.messages.requestFailed");
      let displayMessage = errorMessage;
      
      if (errorMessage.includes("ALREADY_FRIENDS") || errorMessage.includes("already friends")) {
        displayMessage = t("addFriend.messages.alreadyFriends");
        await checkStatus(result.uid);
      } else if (errorMessage.includes("REQUEST_ALREADY_SENT") || errorMessage.includes("already sent")) {
        displayMessage = t("addFriend.messages.requestAlreadySent");
        await checkStatus(result.uid);
      } else if (errorMessage.includes("REQUEST_ALREADY_RECEIVED") || errorMessage.includes("already received")) {
        displayMessage = t("addFriend.messages.requestAlreadyReceived");
        await checkStatus(result.uid);
      }
      
      setMessage({ text: displayMessage, type: "error" });
    }
  };

  // ============================================
  // GET STATUS BADGE
  // ============================================
  
  const getStatusBadge = () => {
    if (!friendStatus) return null;
    
    const badges = {
      friends: { text: t("addFriend.status.friends"), color: "bg-green-100 text-green-700" },
      request_sent: { text: t("addFriend.status.requestSent"), color: "bg-yellow-100 text-yellow-700" },
      request_received: { text: t("addFriend.status.requestReceived"), color: "bg-blue-100 text-blue-700" }
    };
    
    const badge = badges[friendStatus];
    if (!badge) return null;
    
    return (
      <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  // ============================================
  // CAN SEND REQUEST
  // ============================================
  
  const canSendRequest = () => {
    return result && (!friendStatus || friendStatus === "none");
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-4">
      {/* Search Form */}
      <div className="bg-linear-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-linear-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-800">{t("addFriend.title")}</h3>
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder={t("addFriend.inputPlaceholder")}
            value={uid}
            onChange={(e) => setUid(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-400 text-gray-900 font-medium shadow-sm"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        
        <button 
          onClick={handleSearch}
          disabled={searching}
          className="w-full mt-3 px-6 py-3.5 bg-linear-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {searching ? (
            <>
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-3 border-white border-t-transparent"></div>
              <span>{t("addFriend.searching")}</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>{t("addFriend.searchButton")}</span>
            </>
          )}
        </button>
      </div>

      {/* Search Result - ✅ NEW LAYOUT: Avatar beside nickname */}
      {result && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1.5 h-6 bg-linear-to-b from-blue-500 to-indigo-600 rounded-full"></div>
            <p className="text-sm font-bold text-gray-700 uppercase tracking-wide">{t("addFriend.resultTitle")}</p>
          </div>
          
          {/* ✅ NEW LAYOUT: Avatar on left, info on right */}
          <div className="flex items-center gap-4 mb-6">
            {/* Avatar */}
            <div className="shrink-0">
              <AvatarImage
                avatar={result.avatar}
                nickname={result.nickname}
                avatarUpdatedAt={result.avatarUpdatedAt}
                size="xl"
                showOnlineStatus={true}
                isOnline={true}
              />
            </div>
            
            {/* User Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-gray-900 mb-2 truncate">
                {result.nickname}
              </h3>
              {getStatusBadge()}
            </div>
          </div>
          
          {/* Action Button */}
          <div className="w-full">
            {canSendRequest() ? (
              <button 
                onClick={handleSend}
                disabled={loading}
                className="w-full px-6 py-3.5 bg-linear-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <span>{t("addFriend.sendRequest")}</span>
              </button>
            ) : (
              <button 
                disabled
                className="w-full px-6 py-3.5 bg-gray-200 text-gray-500 font-bold rounded-xl cursor-not-allowed shadow-md flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>
                  {friendStatus === "friends" 
                    ? t("addFriend.status.friends") 
                    : friendStatus === "request_sent"
                    ? t("addFriend.status.requestSent")
                    : t("addFriend.status.requestReceived")}
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-xl border-2 ${
          message.type === "error"
            ? 'bg-red-50 border-red-200'
            : message.type === "success"
            ? 'bg-green-50 border-green-200'
            : 'bg-blue-50 border-blue-200'
        } shadow-sm`}>
          <div className="flex items-center gap-3">
            {message.type === "error" ? (
              <div className="shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
            ) : message.type === "success" ? (
              <div className="shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            ) : (
              <div className="shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            <p className={`text-sm font-semibold flex-1 ${
              message.type === "error" 
                ? "text-red-700" 
                : message.type === "success" 
                ? "text-green-700" 
                : "text-blue-700"
            }`}>
              {message.text}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}