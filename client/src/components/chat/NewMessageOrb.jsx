import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown } from "lucide-react";

export default function NewMessageOrb({ hasNewMessages, onClick }) {
  return (
    <AnimatePresence>
      {hasNewMessages && (
        <motion.button
          initial={{ opacity: 0, y: 20, scale: 0.8, x: "-50%" }}
          animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
          exit={{ opacity: 0, y: 20, scale: 0.8, x: "-50%" }}
          onClick={onClick}
          className="absolute bottom-6 left-1/2 z-50
                      backdrop-blur-md border border-blue-400/30
                      hover:shadow-[0_0_20px_rgba(37,99,235,0.5)] text-white
                     px-6 py-3 rounded-full 
                     flex items-center gap-2 text-sm font-bold
                     transition-colors cursor-pointer
                     animate-float-subtle shadow-xl shadow-blue-900/40"
        >
          <ArrowDown className="w-4 h-4 animate-bounce" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
