"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { cn } from "@/lib/utils";
import { useWalletStore } from "@/store/wallet-store";
import { LockScreen } from "@/components/auth/lock-screen";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { WalletSwitcher } from "@/components/wallet/wallet-switcher";
import { TransactionWatcher } from "@/components/providers/transaction-watcher";
import { Particles } from "@/components/ui/particles";
import { PrivacyBlur } from "@/components/security/privacy-blur";

interface AppShellProps {
  children: React.ReactNode;
  hideSidebar?: boolean;
}

export default function AppShell({ children, hideSidebar }: AppShellProps) {
  const {
    wallets,
    isUnlocked,
    activeWalletId,
    lockWallet,
    autoLockTimeout,
    lastActiveTimestamp,
    updateActivity,
  } = useWalletStore();
  const [isClient, setIsClient] = useState(false);

  // Hydration fix & Initial Timeout Check
  useEffect(() => {
    setIsClient(true);

    // Check if we should autolock immediately upon load
    if (isUnlocked && autoLockTimeout > 0) {
      const now = Date.now();
      const elapsedMinutes = (now - lastActiveTimestamp) / 1000 / 60;

      if (elapsedMinutes >= autoLockTimeout) {
        console.log("Session expired while away. Locking wallet.");
        lockWallet();
      }
    }
  }, []);

  // --- Auto-Lock Logic ---
  useEffect(() => {
    if (!isUnlocked || autoLockTimeout === 0) return;

    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      updateActivity(); // Update persistent timestamp

      if (autoLockTimeout > 0) {
        timeoutId = setTimeout(() => {
          console.log("Auto-locking wallet due to inactivity");
          lockWallet();
        }, autoLockTimeout * 60 * 1000);
      }
    };

    // Events to track activity
    const events = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
    ];
    const handleActivity = () => resetTimer();

    // Throttle the activity update to avoid excessive state updates?
    // Zustand is fast, but let's be safe. Actually, debounce is better but simple reset is fine for now.

    events.forEach((event) => window.addEventListener(event, handleActivity));
    resetTimer(); // Start timer

    return () => {
      clearTimeout(timeoutId);
      events.forEach((event) =>
        window.removeEventListener(event, handleActivity)
      );
    };
  }, [isUnlocked, autoLockTimeout, lockWallet, updateActivity]);

  if (!isClient) return null; // Prevent hydration mismatch

  if (wallets.length > 0 && activeWalletId && !isUnlocked) {
    // Dynamic import to avoid circular dependency issues if any, implies split chunk
    return (
      <div className="fixed inset-0 z-[9999] bg-[#050505]">
        <LockScreen />
      </div>
    );
  }

  return (
    <div className="h-full relative min-h-screen bg-[#050505] pb-20 md:pb-0 font-sans text-slate-200 selection:bg-yellow-500/30">
      <Particles />
      <TransactionWatcher />
      {/* Background ambient noise/gradient if needed -- kept minimal for now */}

      {/* Desktop Sidebar Container */}
      <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-80">
        <Sidebar />
      </div>

      {/* Mobile Header REMOVED - Dashboard manages its own header now */}
      {/* <div className="md:hidden p-4 bg-[#050505]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between sticky top-0 z-40">
        <div className="w-48">
          <WalletSwitcher />
        </div>
        <div
          onClick={() => lockWallet()}
          className="p-2 text-slate-400 hover:text-red-400 cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" x2="9" y1="12" y2="12" />
          </svg>
        </div>
      </div> */}

      <main className="md:pl-72 h-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="h-full p-4 md:p-8 max-w-7xl mx-auto"
        >
          {children}
        </motion.div>
      </main>

      <div className="md:hidden">
        <Sidebar />
      </div>
    </div>
  );
}
