"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock } from "lucide-react";

export function PrivacyBlur() {
  const [isBlurred, setIsBlurred] = useState(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsBlurred(true);
      } else {
        setIsBlurred(false);
      }
    };

    const handleBlur = () => setIsBlurred(true);
    const handleFocus = () => setIsBlurred(false);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  return (
    <AnimatePresence>
      {isBlurred && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center pointer-events-none"
        >
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Lock className="w-8 h-8 text-yellow-500" />
            </div>
            <h2 className="text-2xl font-bold font-space text-white">
              OctraWallet Secure
            </h2>
            <p className="text-slate-400">Content hidden for privacy</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
