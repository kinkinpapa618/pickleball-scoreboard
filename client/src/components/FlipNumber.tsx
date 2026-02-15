import { motion, AnimatePresence } from "framer-motion";

interface FlipNumberProps {
  number: number;
}

export function FlipNumber({ number }: FlipNumberProps) {
  return (
    <div className="relative h-24 w-20 bg-black rounded-xl border-1 border-slate-200 overflow-hidden shadow-lg shadow-blue-700/30">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={number}
          initial={{ rotateX: -90, opacity: 0 }}
          animate={{ rotateX: 0, opacity: 1 }}
          exit={{ rotateX: 90, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="absolute inset-0 flex items-center justify-center"
          style={{ transformStyle: "preserve-3d" }}
        >
          <span className="text-5xl font-black text-white tabular-nums">
            {number}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
