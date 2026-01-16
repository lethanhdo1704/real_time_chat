// frontend/src/components/FriendFeature/CreateGroupModal.jsx - NEW

import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { X, Search, Check, Users } from "lucide-react";
import useFriendStore from "../../store/friendStore";
import useGroupActions from "../../hooks/chat/useGroupActions";
import AvatarImage from "../common/AvatarImage";

/**
 * CreateGroupModal Component
 * 
 * ✅ Select friends to add
 * ✅ Set group name
 * ✅ Optional: Set group avatar
 * ✅ Call createGroup API
 * ✅ Handle errors
 */
export default function CreateGroupModal({ onClose, onSuccess }) {
  const { t } = useTranslation("friendFeature");
  
  const [groupName, setGroupName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFriends, setSelectedFriends] = useState(new Set());
  
  // Get friends from store
  const friends = useFriendStore((state) => state.friends);
  
  // Group actions
  const { createGroup, loading, error } = useGroupActions();

  // ============================================
  // FILTER & SEARCH
  // ============================================

  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return friends;
    
    const query = searchQuery.toLowerCase();
    return friends.filter((friend) =>
      friend.nickname?.toLowerCase().includes(query) ||
      friend.fullName?.toLowerCase().includes(query) ||
      friend.uid?.toLowerCase().includes(query)
    );
  }, [friends, searchQuery]);

  // ============================================
  // HANDLERS
  // ============================================

  const toggleFriend = (friendUid) => {
    const newSelected = new Set(selectedFriends);
    if (newSelected.has(friendUid)) {
      newSelected.delete(friendUid);
    } else {
      newSelected.add(friendUid);
    }
    setSelectedFriends(newSelected);
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      return;
    }

    if (selectedFriends.size === 0) {
      return;
    }

    try {
      const result = await createGroup({
        name: groupName.trim(),
        memberUids: Array.from(selectedFriends),
        // Optional: avatar, messagePermission
      });

      console.log('✅ [CreateGroupModal] Group created:', result);

      // Call success callback
      if (onSuccess) {
        onSuccess(result.conversation);
      }

      // Close modal
      onClose();
    } catch (err) {
      console.error('❌ [CreateGroupModal] Create failed:', err);
      // Error is displayed in error state
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (groupName.trim() && selectedFriends.size > 0) {
        handleCreate();
      }
    }
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-9999 p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {t("groupList.createModal.title")}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Group Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("groupList.createModal.groupName")} *
            </label>
            <input
              type="text"
              placeholder={t("groupList.createModal.inputPlaceholder")}
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              onKeyPress={handleKeyPress}
              maxLength={50}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              {groupName.length}/50
            </p>
          </div>

          {/* Selected Count */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700 font-medium">
              {t("groupList.createModal.selectedMembers")}
            </span>
            <span className="text-blue-600 font-semibold">
              {selectedFriends.size} {t("groupList.createModal.selected")}
            </span>
          </div>

          {/* Search Friends */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t("groupList.createModal.searchFriends")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Friends List */}
          {friends.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500 text-sm">
                {t("groupList.createModal.noFriends")}
              </p>
            </div>
          ) : filteredFriends.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">
                {t("groupList.createModal.noResults")}
              </p>
            </div>
          ) : (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {filteredFriends.map((friend) => {
                const isSelected = selectedFriends.has(friend.uid);

                return (
                  <button
                    key={friend.uid}
                    onClick={() => toggleFriend(friend.uid)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                      isSelected
                        ? 'bg-blue-50 border-2 border-blue-500'
                        : 'bg-white hover:bg-gray-50 border-2 border-transparent'
                    }`}
                  >
                    <AvatarImage
                      avatar={friend.avatar}
                      nickname={friend.nickname}
                      avatarUpdatedAt={friend.avatarUpdatedAt}
                      size="sm"
                      showOnlineStatus={true}
                      isOnline={friend.isOnline}
                    />

                    <div className="flex-1 text-left min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {friend.nickname || friend.fullName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        @{friend.uid}
                      </p>
                    </div>

                    {isSelected && (
                      <div className="shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Footer - Actions */}
        <div className="flex gap-3 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
          >
            {t("groupList.createModal.cancel")}
          </button>
          <button
            onClick={handleCreate}
            disabled={!groupName.trim() || selectedFriends.size === 0 || loading}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors font-medium flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{t("groupList.createModal.creating")}</span>
              </>
            ) : (
              t("groupList.createModal.create")
            )}
          </button>
        </div>
      </div>
    </div>
  );
}