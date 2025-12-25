"use client";

import { useEffect, useRef } from "react";
import { useBalance } from "@/lib/hooks/use-octra-query";
import { useWalletStore } from "@/store/wallet-store";
import { toast } from "sonner";
import { usePathname } from "next/navigation";

export function TransactionWatcher() {
  const { isUnlocked } = useWalletStore();
  const { data: balanceData } = useBalance();
  const balance = balanceData?.balance;

  // Ref to track previous balance to detect increases
  const prevBalance = useRef<number | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!isUnlocked || balance === undefined) return;

    // Initialize ref on first load
    if (prevBalance.current === null) {
      prevBalance.current = balance;
      return;
    }

    const diff = balance - prevBalance.current;

    // If balance INCREASED, calculate logic
    if (diff > 0.000001) {
      // Floating point tolerance
      // Only toast if we are NOT on the receive page (to avoid redundancy if that page has its own success msg, though duplicate is fine)
      toast.success(`Incoming Transaction`, {
        description: `You received +${diff.toFixed(4)} OCT`,
        duration: 5000,
      });
    }

    prevBalance.current = balance;
  }, [balance, isUnlocked]);

  return null; // Logic only component
}
