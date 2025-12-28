// frontend/src/hooks/chat/useChatScroll.js
import { useEffect, useRef } from "react";

/**
 * useChatScroll - Chat Scroll Management Hook
 * 
 * Responsibilities:
 * ✅ Auto-scroll when new message arrives
 * ✅ Auto-scroll when typing indicator appears
 * ✅ Infinite scroll (load more on scroll up)
 * ✅ Detect user manual scrolling
 * ✅ Instant scroll on first load (no animation)
 */
export default function useChatScroll({
  messages,
  typingUsers,
  hasMore,
  loading,
  loadMore,
  activeConversationId,
}) {
  const messagesContainerRef = useRef(null);
  const typingIndicatorRef = useRef(null);
  const prevScrollHeightRef = useRef(0);
  const isUserScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef(null);
  const isFirstLoadRef = useRef(true);  // 🔥 Track first load
  const prevConversationIdRef = useRef(null);  // 🔥 Track conversation changes

  // ============================================
  // SCROLL TO BOTTOM FUNCTION
  // ============================================
  const scrollToBottom = (behavior = "smooth") => {
    const container = messagesContainerRef.current;
    if (!container) return;

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(
      () => {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: behavior === "smooth" ? "smooth" : "auto",
        });
      },
      behavior === "smooth" ? 100 : 0
    );
  };

  // ============================================
  // DETECT USER MANUAL SCROLLING
  // ============================================
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    let scrollTimeout;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;

      isUserScrollingRef.current = !isAtBottom;

      // 🔥 After user scrolls, no longer first load
      if (isFirstLoadRef.current && scrollTop > 0) {
        isFirstLoadRef.current = false;
      }

      clearTimeout(scrollTimeout);

      scrollTimeout = setTimeout(() => {
        if (isAtBottom) {
          isUserScrollingRef.current = false;
        }
      }, 150);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  // ============================================
  // AUTO SCROLL WHEN NEW MESSAGE OR TYPING
  // ============================================
  useEffect(() => {
    if (!messages.length && !typingUsers.length) return;

    const container = messagesContainerRef.current;
    if (!container) return;

    // 🔥 If first load or conversation changed, scroll instantly
    if (isFirstLoadRef.current) {
      scrollToBottom("auto");
      return;
    }

    // Normal scroll behavior
    if (!isUserScrollingRef.current) {
      scrollToBottom("smooth");
    }
  }, [messages.length, typingUsers.length]);

  // ============================================
  // SCROLL TO BOTTOM WHEN TYPING INDICATOR APPEARS
  // ============================================
  useEffect(() => {
    if (typingUsers.length > 0 && !isUserScrollingRef.current) {
      // Small delay to ensure typing indicator is rendered
      setTimeout(() => {
        scrollToBottom("smooth");
      }, 100);
    }
  }, [typingUsers.length]);

  // ============================================
  // 🔥 INSTANT SCROLL WHEN CONVERSATION CHANGES
  // ============================================
  useEffect(() => {
    // Check if conversation changed
    if (activeConversationId !== prevConversationIdRef.current) {
      isFirstLoadRef.current = true;  // Mark as first load
      prevConversationIdRef.current = activeConversationId;
    }

    if (activeConversationId && messages.length) {
      isUserScrollingRef.current = false;
      
      // 🔥 Instant scroll (no animation) on first load or conversation change
      setTimeout(() => {
        scrollToBottom("auto");
        // Mark as loaded after scroll completes
        setTimeout(() => {
          isFirstLoadRef.current = false;
        }, 100);
      }, 0);
    }
  }, [activeConversationId, messages.length]);

  // ============================================
  // INFINITE SCROLL (LOAD MORE ON SCROLL UP)
  // ============================================
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || !hasMore) return;

    const handleScroll = async () => {
      const { scrollTop, scrollHeight } = container;
      const isNearTop = scrollTop < 100;

      if (isNearTop && hasMore && !loading) {
        prevScrollHeightRef.current = scrollHeight;

        await loadMore();

        setTimeout(() => {
          const newScrollHeight = container.scrollHeight;
          const scrollDiff = newScrollHeight - prevScrollHeightRef.current;
          container.scrollTop = scrollTop + scrollDiff;
        }, 50);
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [hasMore, loading, loadMore]);

  // ============================================
  // CLEANUP ON UNMOUNT
  // ============================================
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // ============================================
  // RETURN REFS & FUNCTION
  // ============================================
  return {
    messagesContainerRef,
    typingIndicatorRef,
    scrollToBottom,
  };
}