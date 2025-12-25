"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWalletStore } from "@/store/wallet-store";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/logo";

export default function AuthGuard() {
  const router = useRouter();
  const { wallets, activeWalletId, isUnlocked } = useWalletStore();

  useEffect(() => {
    // Allow hydration
    const timer = setTimeout(() => {
      // 1. No wallets? -> Onboarding
      if (wallets.length === 0) {
        router.replace("/onboarding");
        return;
      }

      // 2. Has wallets but none active? -> Set first as active (should happen in store but safety check)
      if (!activeWalletId) {
        // If we have wallets but no active ID, we can't unlock.
        // Logic in store likely sets it, but if not:
        router.replace("/onboarding");
        return;
      }

      // 3. Locked? -> Lock Screen
      if (!isUnlocked) {
        // Check if we are already on lock screen?
        // Actually this component IS the root page.
        // So we render lock screen component OR redirect.
        // But strict routing: /dashboard is protected.
        // This is the ROOT path /.
        // We usually redirect / to /dashboard and let dashboard guard?
        // OR we show lock screen here.

        // Let's redirect to /dashboard which will likely have a layout guard?
        // Wait, AppShell doesn't guard.
        // Let's simply render Lock Screen logic here or redirect to a dedicated auth page?
        // Convention: If locked, everything redirects to /.
        // So / should show LockScreen if wallets exist.
        return;
      }

      // 4. Unlocked -> Dashboard
      router.replace("/dashboard");
    }, 500); // Small delay for hydration
    return () => clearTimeout(timer);
  }, [wallets, activeWalletId, isUnlocked, router]);

  // If we are here and have wallets but locked, we show LockScreen?
  // Current architecture: app/page.tsx redirects.
  // LockScreen is a component.

  if (wallets.length > 0 && !isUnlocked) {
    // In Next.js, we might want to redirect to a dedicated /auth/lock or render here.
    // Reuse LockScreen component here for cleaner URL?
    // Or just return null and the effect will redirect?
    // Actually, if I redirect to /dashboard, /dashboard needs to check lock status.
    // If /dashboard checks lock status and finds locked, it redirects to /?
    // Infinite loop.

    // Better: / only redirects to /dashboard if UNLOCKED.
    // If LOCKED, / renders <LockScreen />.

    // Dynamic import to avoid SSR issues if needed, but client comp is fine.
    const LockScreen = require("@/components/auth/lock-screen").LockScreen;
    return <LockScreen />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505]">
      <div className="flex flex-col items-center gap-6 relative">
        {/* Ambient Glow */}
        <div className="absolute inset-0 bg-yellow-500/20 blur-3xl rounded-full opacity-20 animate-pulse" />

        <div className="relative z-10 animate-pulse">
          <Logo width={80} height={80} />
        </div>
        <p className="text-slate-400 text-sm font-space tracking-widest uppercase animate-pulse">
          Loading OctraWallet...
        </p>
      </div>
    </div>
  );
}
