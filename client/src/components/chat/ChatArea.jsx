import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import MessageBubble from "./MessageBubble";
import NewMessageOrb from "./NewMessageOrb";

export default function ChatArea({ 
  messages, 
  user, 
  selectedChat, 
  isTyping, 
  hasNewMessages,
  setHasNewMessages,
  updateStatus,
  fetchMessages,
  fetchMoreMessages,
  hasMore,
  isLoadingMore,
  justSentRef,
  justOpenedChatRef,
  isAtBottomRef,
  wasAtBottomRef,
  onUnsend,
  onImageClick,
  isMobile
}) {
  const chatContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const prevMessageCountRef = useRef(0);
  const scrollHeightRef = useRef(0);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    isFetchingRef.current = isLoadingMore;
  }, [isLoadingMore]);

  // Smart auto-scroll and scroll preservation logic
  useEffect(() => {
    const el = chatContainerRef.current;
    if (!el) return;

    const isNewMessage = messages.length > prevMessageCountRef.current;
    const addedCount = messages.length - prevMessageCountRef.current;
    
    if (isNewMessage) {
      if (isFetchingRef.current || (addedCount > 1 && !justOpenedChatRef.current)) {
        // We loaded older messages -> Restore scroll position
        const newScrollHeight = el.scrollHeight;
        el.scrollTop = newScrollHeight - scrollHeightRef.current;
      } else {
        // Normal new message or just opened chat
        if (justOpenedChatRef.current) {
          messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
          justOpenedChatRef.current = false;
        } else if (justSentRef.current) {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          justSentRef.current = false;
        } else if (isAtBottomRef.current) {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
      }
    }

    prevMessageCountRef.current = messages.length;
    scrollHeightRef.current = el.scrollHeight;
  }, [messages, justOpenedChatRef, justSentRef, isAtBottomRef]);

  const handleScroll = (e) => {
    const el = e.target;
    // Allow a 150px buffer for "at bottom" calculation
    const atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 150;
    isAtBottomRef.current = atBottom;

    if (atBottom && !wasAtBottomRef.current) {
      setHasNewMessages(false);
      if (selectedChat) {
        updateStatus(selectedChat._id, "seen");
      }
    }
    wasAtBottomRef.current = atBottom;

    // Detect scrolling to the top to load older messages
    if (el.scrollTop === 0 && hasMore && !isLoadingMore) {
      scrollHeightRef.current = el.scrollHeight;
      fetchMoreMessages();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setHasNewMessages(false);
  };

  const formatDateDivider = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    
    const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const diffTime = today - msgDay;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    } else {
      return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
    }
  };

  return (
    <div className="flex-1 relative overflow-hidden min-h-0">
      <div 
        className="h-full overflow-y-auto overflow-x-hidden scrollbar-hide p-4 md:p-8"
        ref={chatContainerRef}
        onScroll={handleScroll}
      >
        <motion.div 
          className="max-w-4xl mx-auto flex flex-col min-h-full"
          drag={isMobile ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={{ left: 0.2, right: 0 }}
          dragDirectionLock
        >
          <div className="flex-1 shrink-0 min-h-0"></div>
          
          {isLoadingMore && (
            <div className="flex justify-center py-4">
              <span className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
            </div>
          )}

          {messages.map((msg, index) => {
            const currentMsgDate = new Date(msg.createdAt);
            const prevMsgDate = index > 0 ? new Date(messages[index - 1].createdAt) : null;
            
            let showDivider = false;
            if (!prevMsgDate) {
              showDivider = true;
            } else {
              showDivider = 
                currentMsgDate.getDate() !== prevMsgDate.getDate() ||
                currentMsgDate.getMonth() !== prevMsgDate.getMonth() ||
                currentMsgDate.getFullYear() !== prevMsgDate.getFullYear();
            }

            return (
              <React.Fragment key={msg._id || index}>
                {showDivider && (
                  <div className="flex justify-center my-4 pb-2">
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest bg-zinc-800/30 px-3 py-1.5 rounded-full border border-white/5">
                      {formatDateDivider(msg.createdAt)}
                    </span>
                  </div>
                )}
                <MessageBubble 
                  msg={msg} 
                  isOwnMessage={msg.sender?._id === user._id}
                  isLatest={index === messages.length - 1}
                  onUnsend={onUnsend}
                  onImageClick={onImageClick}
                  isMobile={isMobile}
                />
              </React.Fragment>
            );
          })}

          {isTyping && (
            <div className="flex justify-start mb-4">
              <div className="bg-zinc-800/80 backdrop-blur-md px-5 py-3 rounded-3xl rounded-tl-sm border border-white/5 flex gap-1.5 items-center shadow-lg">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} className="h-4"></div>
        </motion.div>
      </div>

      <NewMessageOrb 
        hasNewMessages={hasNewMessages} 
        onClick={scrollToBottom} 
      />
    </div>
  );
}
