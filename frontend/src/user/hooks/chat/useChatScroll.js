// frontend/src/user/hooks/chat/useChatScroll.js
import { useEffect, useRef, useCallback } from "react";

export default function useChatScroll({
  messages,
  typingUsers = [],
  hasMore,
  loading,
  loadMore,
  activeConversationId,
}) {
  const messagesContainerRef = useRef(null);
  const typingIndicatorRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  const loadMoreDebounceRef = useRef(null);
  
  // State tracking refs
  const isUserScrollingRef = useRef(false);
  const isLoadingMoreRef = useRef(false);
  const isInitialLoadRef = useRef(true);
  const prevConversationIdRef = useRef(null);
  const lastBottomMessageIdRef = useRef(null);
  const scrollRestorationRef = useRef({ scrollTop: 0, scrollHeight: 0 });

  // ============================================
  // CORE SCROLL UTILITIES
  // ============================================
  const scrollToBottom = useCallback((behavior = "smooth") => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // Cancel pending scrolls
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      requestAnimationFrame(() => {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: behavior === "smooth" && !isInitialLoadRef.current 
            ? "smooth" 
            : "auto",
        });
      });
    }, behavior === "smooth" ? 100 : 0);
  }, []);

  const checkIfNearBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return false;

    const { scrollTop, scrollHeight, clientHeight } = container;
    return scrollHeight - scrollTop - clientHeight < 100;
  }, []);

  // ============================================
  // MESSAGE LOADING & SCROLL RESTORATION
  // ============================================
  const safeLoadMore = useCallback(async () => {
    if (
      isLoadingMoreRef.current ||
      loading ||
      !hasMore ||
      !messagesContainerRef.current
    ) return;

    const container = messagesContainerRef.current;
    const initialScrollTop = container.scrollTop;
    const initialScrollHeight = container.scrollHeight;

    try {
      isLoadingMoreRef.current = true;
      
      // Capture position before loading
      scrollRestorationRef.current = {
        scrollTop: initialScrollTop,
        scrollHeight: initialScrollHeight,
        timestamp: Date.now(),
      };

      await loadMore();
    } catch (error) {
      console.error("❌ Load more failed:", error);
    } finally {
      // Delayed unlock to allow DOM updates
      setTimeout(() => {
        isLoadingMoreRef.current = false;
        
        // Restore scroll position after DOM updates
        requestAnimationFrame(() => {
          const newScrollHeight = container.scrollHeight;
          const { scrollTop: prevTop, scrollHeight: prevHeight } = scrollRestorationRef.current;
          
          // Calculate new position based on added content height
          const heightDifference = newScrollHeight - prevHeight;
          container.scrollTop = prevTop + heightDifference;
        });
      }, 50);
    }
  }, [hasMore, loading, loadMore]);

  // ============================================
  // EFFECTS
  // ============================================
  // Handle conversation changes
  useEffect(() => {
    if (activeConversationId !== prevConversationIdRef.current) {
      // Reset all states
      isUserScrollingRef.current = false;
      isLoadingMoreRef.current = false;
      isInitialLoadRef.current = true;
      lastBottomMessageIdRef.current = null;
      prevConversationIdRef.current = activeConversationId;
      
      // Schedule instant scroll to bottom
      requestAnimationFrame(() => {
        scrollToBottom("auto");
      });
    }
  }, [activeConversationId, scrollToBottom]);

  // Auto-scroll for new messages
  useEffect(() => {
    if (messages.length === 0 || isLoadingMoreRef.current) return;

    const lastMessage = messages[messages.length - 1];
    const lastMessageId = lastMessage?.messageId || lastMessage?._id;
    
    // Skip if same message or during initial load
    if (
      !lastMessageId || 
      (lastBottomMessageIdRef.current === lastMessageId && !isInitialLoadRef.current)
    ) return;

    lastBottomMessageIdRef.current = lastMessageId;
    
    // Handle initial load instantly
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      scrollToBottom("auto");
      return;
    }

    // Auto-scroll if at bottom
    if (!isUserScrollingRef.current) {
      scrollToBottom("smooth");
    }
  }, [messages, scrollToBottom]);

  // Auto-scroll for typing indicators
  useEffect(() => {
    if (
      typingUsers.length > 0 && 
      !isUserScrollingRef.current && 
      !isLoadingMoreRef.current
    ) {
      const id = setTimeout(() => scrollToBottom("smooth"), 50);
      return () => clearTimeout(id);
    }
  }, [typingUsers, scrollToBottom]);

  // Scroll listener setup
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    let scrollDebounceTimer;
    let loadMoreDebounceTimer;

    const handleScroll = () => {
      const isNearBottom = checkIfNearBottom();
      isUserScrollingRef.current = !isNearBottom;
      
      // Clear existing debounces
      clearTimeout(scrollDebounceTimer);
      clearTimeout(loadMoreDebounceTimer);

      // Reset scrolling flag when settled at bottom
      scrollDebounceTimer = setTimeout(() => {
        if (checkIfNearBottom()) {
          isUserScrollingRef.current = false;
        }
      }, 200);

      // Load more when near top (with safeguards)
      if (
        container.scrollTop < 300 &&
        hasMore &&
        !loading &&
        !isLoadingMoreRef.current &&
        !isInitialLoadRef.current
      ) {
        loadMoreDebounceTimer = setTimeout(safeLoadMore, 200);
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    
    return () => {
      container.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollDebounceTimer);
      clearTimeout(loadMoreDebounceTimer);
    };
  }, [hasMore, loading, safeLoadMore, checkIfNearBottom]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeout(scrollTimeoutRef.current);
      clearTimeout(loadMoreDebounceRef.current);
    };
  }, []);

  return {
    messagesContainerRef,
    typingIndicatorRef,
    scrollToBottom,
  };
}