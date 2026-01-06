// frontend/src/user/components/Chat/MessageItem/MessageReactions.jsx

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import AvatarImage from "../../common/AvatarImage";

/**
 * MessageReactions Component - WITH MAX 3 DISPLAY + EXPAND
 *
 * Displays reactions below message bubble
 * Shows max 3 reactions, then +N button to expand
 * Grouped by emoji with count and user avatars on hover
 * Clickable to toggle own reaction
 *
 * Features:
 * - Group reactions by emoji
 * - Show max 3 reactions by default
 * - +N button to show all reactions
 * - Show count per emoji
 * - Highlight user's own reactions
 * - Tooltip with user list on hover
 * - Clickable to toggle
 * - Uses uid for comparison
 * - Uses AvatarImage component
 *
 * @param {object} props
 * @param {Array} props.reactions - Reactions array from message
 * @param {string} props.currentUserUid - Current user's uid (NOT _id)
 * @param {Function} props.onReactionClick - Callback when clicking reaction
 * @param {boolean} props.isMe - Is current user's message?
 */
export default function MessageReactions({
  reactions = [],
  currentUserUid,
  onReactionClick,
  isMe = false,
}) {
  const { t } = useTranslation("chat");
  const [hoveredEmoji, setHoveredEmoji] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const tooltipRef = useRef(null);

  // ============================================
  // GROUP REACTIONS BY EMOJI
  // ============================================
  const groupedReactions = reactions.reduce((acc, reaction) => {
    const emoji = reaction.emoji;

    if (!acc[emoji]) {
      acc[emoji] = {
        emoji,
        count: 0,
        users: [],
        hasCurrentUser: false,
      };
    }

    acc[emoji].count++;
    acc[emoji].users.push({
      _id: reaction.user._id,
      uid: reaction.user.uid,
      nickname: reaction.user.nickname,
      avatar: reaction.user.avatar,
    });

    // Compare by uid
    if (reaction.user.uid === currentUserUid) {
      acc[emoji].hasCurrentUser = true;
    }

    return acc;
  }, {});

  // Sort by count (descending) for better display
  const allReactionGroups = Object.values(groupedReactions).sort(
    (a, b) => b.count - a.count
  );

  // ============================================
  // 🆕 LIMIT TO 3 REACTIONS
  // ============================================
  const MAX_VISIBLE = 3;
  const visibleReactions = showAll
    ? allReactionGroups
    : allReactionGroups.slice(0, MAX_VISIBLE);

  const hiddenCount = allReactionGroups.length - MAX_VISIBLE;
  const shouldShowMoreButton = !showAll && hiddenCount > 0;

  // ============================================
  // HANDLERS
  // ============================================
  const handleReactionClick = (emoji) => {
    console.log("🎭 [MessageReactions] Reaction clicked:", emoji);
    onReactionClick(emoji);
  };

  const handleToggleExpand = () => {
    console.log(
      showAll
        ? "➖ [MessageReactions] Collapsing reactions"
        : "➕ [MessageReactions] Showing all reactions"
    );
    setShowAll(!showAll);
  };

  // ============================================
  // TOOLTIP POSITIONING
  // ============================================
  useEffect(() => {
    if (hoveredEmoji && tooltipRef.current) {
      const tooltip = tooltipRef.current;
      const rect = tooltip.getBoundingClientRect();

      // Check if tooltip overflows viewport
      if (rect.bottom > window.innerHeight) {
        tooltip.style.bottom = "100%";
        tooltip.style.top = "auto";
        tooltip.style.marginBottom = "8px";
        tooltip.style.marginTop = "0";
      }
    }
  }, [hoveredEmoji]);

  if (!reactions || reactions.length === 0) {
    return null;
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div
      className={`
        flex flex-wrap gap-1.5 mt-1 px-1
        ${isMe ? "justify-end" : "justify-start"}
      `}
    >
      {/* Visible Reactions */}
      {visibleReactions.map((group) => (
        <div key={group.emoji} className="relative">
          {/* Reaction Bubble */}
          <button
            onClick={() => handleReactionClick(group.emoji)}
            onMouseEnter={() => setHoveredEmoji(group.emoji)}
            onMouseLeave={() => setHoveredEmoji(null)}
            className={`
                inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                text-xs font-medium transition-all duration-200
                border
                ${
                group.hasCurrentUser
                    ? "bg-blue-100 border-blue-400 hover:bg-blue-200"
                    : "bg-gray-100 border-gray-300 hover:bg-gray-200"
                }
                hover:scale-110 active:scale-95
                cursor-pointer
            `}
          >
            <span className="text-base leading-none">{group.emoji}</span>
            <span
              className={
                group.hasCurrentUser ? "text-blue-700" : "text-gray-700"
              }
            >
              {group.count}
            </span>
          </button>

          {/* Tooltip (Desktop) - With avatars */}
          {hoveredEmoji === group.emoji && (
            <div
              ref={tooltipRef}
              className="
                absolute left-1/2 transform -translate-x-1/2
                bottom-full mb-2 z-50
                bg-gray-900 text-white text-xs rounded-lg
                px-3 py-2 shadow-xl
                whitespace-nowrap
                pointer-events-none
                hidden sm:block
              "
              style={{ animation: "fadeIn 0.15s ease-out" }}
            >
              {/* Arrow */}
              <div
                className="
                  absolute left-1/2 transform -translate-x-1/2
                  top-full
                  w-0 h-0 border-l-4 border-r-4 border-t-4
                  border-transparent border-t-gray-900
                "
              />

              {/* User List with Avatars */}
              <div className="flex flex-col gap-1.5 max-w-xs">
                {group.users.slice(0, 10).map((user, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    {/* Avatar */}
                    <AvatarImage
                      avatar={user.avatar}
                      nickname={user.nickname}
                      size="mini"
                      className="shrink-0"
                    />

                    {/* Nickname */}
                    <span className="text-xs">
                      {user.nickname || user.uid}
                      {user.uid === currentUserUid && " (You)"}
                    </span>
                  </div>
                ))}

                {/* Show more indicator */}
                {group.users.length > 10 && (
                  <span className="text-[10px] text-gray-400 mt-1">
                    +{group.users.length - 10} {t("reactions.more", "more")}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* 🆕 "+N More" / "Collapse" Button */}
      {allReactionGroups.length > MAX_VISIBLE && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="
            inline-flex items-center gap-1 px-2 py-0.5 rounded-full
            text-xs font-medium transition-all duration-200
            bg-gray-100 border border-gray-300 hover:bg-gray-200
            hover:scale-110 active:scale-95
            cursor-pointer text-gray-600
          "
          title={
            showAll
              ? t("reactions.showLess")
              : t("reactions.showAll")
          }
        >
          {showAll ? (
            <span className="text-sm leading-none">−</span>
          ) : (
            <span className="text-sm leading-none">+{hiddenCount}</span>
          )}
        </button>
      )}

      {/* Animation CSS */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: translateX(-50%) translateY(4px);
              }
              to {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
              }
            }
          `,
        }}
      />
    </div>
  );
}
