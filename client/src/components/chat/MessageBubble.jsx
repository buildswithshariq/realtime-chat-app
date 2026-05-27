import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

export default function MessageBubble({ msg, isOwnMessage }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "flex w-full mb-4",
        isOwnMessage ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[75%] sm:max-w-[60%] p-4 rounded-3xl shadow-lg relative group",
          isOwnMessage
            ? "bg-blue-600 text-white rounded-tr-sm shadow-blue-900/20"
            : "bg-zinc-800/80 backdrop-blur-md border border-white/5 text-zinc-100 rounded-tl-sm"
        )}
      >
        {!isOwnMessage && (
          <p className="text-[11px] font-bold tracking-wide mb-1 text-zinc-400 uppercase">
            {msg.sender?.name}
          </p>
        )}

        <p className="text-[15px] leading-relaxed">{msg.content || msg.text}</p>
        
        <div className={cn(
          "flex items-center gap-1.5 mt-2",
          isOwnMessage ? "justify-end" : "justify-start"
        )}>
          <span className={cn(
            "text-[10px] font-medium",
            isOwnMessage ? "text-blue-200" : "text-zinc-500"
          )}>
            {new Date(msg.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>

          {isOwnMessage && (
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-wider ml-1",
              msg.status === "seen"
                ? "text-green-300"
                : msg.status === "inchat"
                ? "text-blue-300"
                : "text-blue-200/50"
            )}>
              {msg.status === "seen"
                ? "Seen"
                : msg.status === "inchat"
                ? "In Chat"
                : "Sent"}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
