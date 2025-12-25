"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/app-shell";
import { OctraApi } from "@/lib/api";
import { useWalletStore } from "@/store/wallet-store";
import { TransactionHistory } from "@/components/dashboard/transaction-history";

export default function HistoryPage() {
  const { activeKeys } = useWalletStore();

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto h-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-space text-white">
            Transaction History
          </h1>
          <p className="text-slate-400">View all your past transactions.</p>
        </div>

        <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-6 min-h-[600px]">
          {/* Using the existing TransactionHistory component which handles fetching and display */}
          {activeKeys?.address ? (
            <TransactionHistory limit={50} />
          ) : (
            <p className="text-slate-500">Please connect a wallet.</p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
