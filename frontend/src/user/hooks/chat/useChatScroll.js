import { useEffect, useRef, useCallback } from "react";

/**
 * useChatScroll - Chat Scroll Management Hook (CURSOR-BASED PAGINATION)
 * 
 * ✅ FIXED: No auto-scroll during prepend
 * ✅ FIXED: Conversation change effect separated from messages update
 * ✅ FIXED: Smooth scroll on first load (50 messages)
 * ✅ Track LAST message (bottom) to detect append vs prepend
 * ✅ Unlock with RAF instead of timeout
 */
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
  const isUserScrollingRef = useRef(false);
  const isFirstLoadRef = useRef(true);
  const prevConversationIdRef = useRef(null);
  
  // 🔥 CRITICAL: Lock for load more operations
  const isLoadingMoreRef = useRef(false);
  const isPrependingRef = useRef(false);
  
  // 🔥 Track LAST message (bottom) to detect append
  const lastBottomMessageIdRef = useRef(null);
  
  // 🔥 FIX: Prevent loadMore during initial auto-scroll
  const hasReachedBottomOnceRef = useRef(false);
  
  // Debounce timers
  const scrollTimeoutRef = useRef(null);
  const loadMoreDebounceRef = useRef(null);

  // ============================================
  // SCROLL TO BOTTOM FUNCTION
  // ============================================
  const scrollToBottom = useCallback((behavior = "smooth") => {
    const container = messagesContainerRef.current;
    if (!container) return;

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // 🔥 FIX: Always use RAF to ensure DOM is ready
    scrollTimeoutRef.current = setTimeout(
      () => {
        requestAnimationFrame(() => {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: behavior === "smooth" ? "smooth" : "auto",
          });
          console.log('🎬 [useChatScroll] Scroll animation started:', {
            scrollHeight: container.scrollHeight,
            behavior
          });
        });
      },
      behavior === "smooth" ? 200 : 0 // Tăng delay lên 200ms
    );
  }, []);

  // ============================================
  // 🔥 LOAD MORE WITH SCROLL RESTORATION
  // ============================================
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMoreRef.current || isPrependingRef.current || loading || !hasMore) {
      return;
    }

    const container = messagesContainerRef.current;
    if (!container) return;

    try {
      // 🔥 SET LOCKS
      isLoadingMoreRef.current = true;
      isPrependingRef.current = true;
      
      // 🔥 CAPTURE STATE BEFORE LOAD
      const prevScrollHeight = container.scrollHeight;
      const prevScrollTop = container.scrollTop;

      console.log('📥 [useChatScroll] Loading more messages...', {
        prevScrollHeight,
        prevScrollTop
      });
      
      // 🔥 LOAD MORE MESSAGES
      await loadMore();

      // 🔥 WAIT FOR DOM UPDATE - Poll until scrollHeight changes
      let attempts = 0;
      const maxAttempts = 30; // 30 * 50ms = 1.5s max wait
      
      const waitForDomUpdate = () => {
        attempts++;
        const newScrollHeight = container.scrollHeight;
        const heightDiff = newScrollHeight - prevScrollHeight;
        
        console.log(`🔍 [useChatScroll] Attempt ${attempts}: heightDiff=${heightDiff}`);
        
        // Check if DOM has updated (height increased significantly)
        if (heightDiff > 50 || attempts >= maxAttempts) {
          // 🔥 RESTORE SCROLL POSITION
          container.scrollTop = prevScrollTop + heightDiff;
          
          console.log('✅ [useChatScroll] Scroll restored', {
            heightDiff,
            newScrollTop: container.scrollTop,
            attempts
          });
          
          // 🔥 UNLOCK WITH DELAY to ensure effect has run
          setTimeout(() => {
            isPrependingRef.current = false;
            isLoadingMoreRef.current = false;
            console.log('🔓 [useChatScroll] Locks released');
          }, 100);
        } else {
          // DOM not ready yet, wait more
          requestAnimationFrame(waitForDomUpdate);
        }
      };
      
      // Start polling after small delay
      setTimeout(() => {
        requestAnimationFrame(waitForDomUpdate);
      }, 50);
      
    } catch (error) {
      console.error('❌ [useChatScroll] Load more error:', error);
      isPrependingRef.current = false;
      isLoadingMoreRef.current = false;
    }
  }, [loading, hasMore, loadMore]);

  // ============================================
  // 🔥 SCROLL LISTENER
  // ============================================
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    let scrollDebounceTimeout;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      
      // 1. Detect if user is at bottom
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      isUserScrollingRef.current = !isAtBottom;

      // 🔥 FIX: Mark as reached bottom (for first load)
      if (isAtBottom && !hasReachedBottomOnceRef.current) {
        hasReachedBottomOnceRef.current = true;
        console.log('✅ [useChatScroll] Reached bottom for first time');
      }

      // 2. Mark first load as complete
      if (isFirstLoadRef.current && scrollTop > 0) {
        isFirstLoadRef.current = false;
      }

      // 3. 🔥 INFINITE SCROLL - ONLY after reached bottom once
      const isNearTop = scrollTop < 200;
      
      if (
        isNearTop && 
        hasMore && 
        !loading && 
        !isLoadingMoreRef.current && 
        !isPrependingRef.current &&
        hasReachedBottomOnceRef.current // 🔥 KEY FIX
      ) {
        clearTimeout(loadMoreDebounceRef.current);
        loadMoreDebounceRef.current = setTimeout(() => {
          handleLoadMore();
        }, 300);
      }

      // 4. Reset user scrolling flag (debounced)
      clearTimeout(scrollDebounceTimeout);
      scrollDebounceTimeout = setTimeout(() => {
        if (isAtBottom) {
          isUserScrollingRef.current = false;
        }
      }, 150);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    
    return () => {
      container.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollDebounceTimeout);
      clearTimeout(loadMoreDebounceRef.current);
    };
  }, [hasMore, loading, handleLoadMore]);

  // ============================================
  // 🔥 FIX: CONVERSATION CHANGE - SEPARATED EFFECT
  // ============================================
  useEffect(() => {
    // Only trigger on conversation ID change
    if (activeConversationId !== prevConversationIdRef.current) {
      console.log('🔄 [useChatScroll] Conversation changed');
      
      // Reset all flags
      isFirstLoadRef.current = true;
      isUserScrollingRef.current = false;
      isLoadingMoreRef.current = false;
      isPrependingRef.current = false;
      lastBottomMessageIdRef.current = null;
      hasReachedBottomOnceRef.current = false;
      
      prevConversationIdRef.current = activeConversationId;
      
      // ✅ DON'T scroll here - let AUTO SCROLL effect handle it with smooth animation
      console.log('✅ [useChatScroll] Conversation switched - waiting for messages');
    }
  }, [activeConversationId]);

  // ============================================
  // 🔥 AUTO SCROLL - Only on NEW message at bottom
  // ============================================
  useEffect(() => {
    if (!messages.length) return;

    const container = messagesContainerRef.current;
    if (!container) return;

    // 🔥 CRITICAL: Skip during prepend (load more)
    if (isPrependingRef.current || isLoadingMoreRef.current) {
      console.log('⏭️ [useChatScroll] Skipping auto-scroll (loading more)', {
        isPrepending: isPrependingRef.current,
        isLoadingMore: isLoadingMoreRef.current
      });
      return;
    }

    // 🔥 Check if LAST message changed (append detection)
    const lastMsg = messages[messages.length - 1];
    const lastMsgId = lastMsg?.messageId || lastMsg?._id;

    console.log('🔍 [useChatScroll] Check last message:', {
      currentLastId: lastMsgId,
      savedLastId: lastBottomMessageIdRef.current,
      isSame: lastBottomMessageIdRef.current === lastMsgId,
      messagesCount: messages.length
    });

    if (lastBottomMessageIdRef.current === lastMsgId) {
      // Same last message → no new append → skip scroll
      console.log('⏭️ [useChatScroll] Same last message, skip scroll');
      return;
    }

    // New message at bottom detected
    console.log('🆕 [useChatScroll] New bottom message detected:', lastMsgId);
    lastBottomMessageIdRef.current = lastMsgId;

    // First load → INSTANT scroll (no animation - UX standard)
    if (isFirstLoadRef.current) {
      console.log('📍 [useChatScroll] First load - instant scroll');
      
      // ✅ Poll để đợi messages render xong
      const waitForRender = () => {
        const container = messagesContainerRef.current;
        if (!container) return;
        
        // Đợi scrollHeight > clientHeight (có nội dung để scroll)
        if (container.scrollHeight > container.clientHeight) {
          // 🔥 INSTANT scroll - KHÔNG smooth (UX chuẩn)
          container.scrollTop = container.scrollHeight;
          console.log('✅ [useChatScroll] Instant scrolled to bottom');
        } else {
          // Chưa render xong, đợi thêm
          requestAnimationFrame(waitForRender);
        }
      };
      
      // Delay nhỏ để messages bắt đầu render
      setTimeout(() => {
        requestAnimationFrame(waitForRender);
      }, 50);
      
      isFirstLoadRef.current = false;
      return;
    }

    // Normal scroll behavior - only if user is at bottom
    if (!isUserScrollingRef.current) {
      console.log('📍 [useChatScroll] New message - auto scroll');
      scrollToBottom("smooth");
    }
  }, [messages.length, scrollToBottom]);

  // ============================================
  // SCROLL WHEN TYPING INDICATOR APPEARS
  // ============================================
  useEffect(() => {
    if (typingUsers.length > 0 && !isUserScrollingRef.current && !isPrependingRef.current) {
      setTimeout(() => {
        scrollToBottom("smooth");
      }, 100);
    }
  }, [typingUsers.length, scrollToBottom]);

  // ============================================
  // CLEANUP
  // ============================================
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      if (loadMoreDebounceRef.current) clearTimeout(loadMoreDebounceRef.current);
    };
  }, []);

  return {
    messagesContainerRef,
    typingIndicatorRef,
    scrollToBottom,
  };
}