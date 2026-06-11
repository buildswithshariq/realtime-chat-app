import { useEffect, useRef } from "react";
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
  justSentRef,
  justOpenedChatRef,
  isAtBottomRef,
  wasAtBottomRef,
  onUnsend,
  onImageClick
}) {
  const chatContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const prevMessageCountRef = useRef(0);

  // Smart auto-scroll logic — only scroll when new messages arrive
  useEffect(() => {
    const isNewMessage = messages.length > prevMessageCountRef.current;
    prevMessageCountRef.current = messages.length;

    if (justOpenedChatRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
      justOpenedChatRef.current = false;
      return;
    }
    if (justSentRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      justSentRef.current = false;
      return;
    }
    // Only auto-scroll for actual new messages, not status refetches
    if (isNewMessage && isAtBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
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
        fetchMessages(selectedChat._id);
      }
    }
    wasAtBottomRef.current = atBottom;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setHasNewMessages(false);
  };

  return (
    <div className="flex-1 relative overflow-hidden min-h-0">
      <div 
        className="h-full overflow-y-auto scrollbar-hide p-4 md:p-8"
        ref={chatContainerRef}
        onScroll={handleScroll}
      >
        <div className="max-w-4xl mx-auto flex flex-col min-h-full">
          <div className="flex-1 shrink-0 min-h-0"></div>
          {messages.map((msg, index) => (
            <MessageBubble 
              key={msg._id || index} 
              msg={msg} 
              isOwnMessage={msg.sender?._id === user._id}
              onUnsend={onUnsend}
              onImageClick={onImageClick}
            />
          ))}

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
        </div>
      </div>

      <NewMessageOrb 
        hasNewMessages={hasNewMessages} 
        onClick={scrollToBottom} 
      />
    </div>
  );
}
