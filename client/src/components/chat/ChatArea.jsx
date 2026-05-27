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
  wasAtBottomRef
}) {
  const chatContainerRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Smart auto-scroll logic
  useEffect(() => {
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
    if (isAtBottomRef.current) {
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
    <div 
      className="flex-1 overflow-y-auto scrollbar-hide p-4 md:p-8 relative"
      ref={chatContainerRef}
      onScroll={handleScroll}
    >
      <div className="max-w-4xl mx-auto flex flex-col justify-end min-h-full">
        {messages.map((msg, index) => (
          <MessageBubble 
            key={msg._id || index} 
            msg={msg} 
            isOwnMessage={msg.sender?._id === user._id} 
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

      <NewMessageOrb 
        hasNewMessages={hasNewMessages} 
        onClick={scrollToBottom} 
      />
    </div>
  );
}
