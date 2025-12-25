"use client";

import { motion } from "framer-motion";
import { copyWithAutoClear } from "@/lib/utils/clipboard";
import AppShell from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWalletStore } from "@/store/wallet-store";
import { useEffect, useState, useMemo } from "react";
import { OctraApi } from "@/lib/api";
import { WalletSwitcher } from "@/components/wallet/wallet-switcher";
import {
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  Shield,
  Copy,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  QrCode,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { TransactionHistory } from "@/components/dashboard/transaction-history";
import { encodeBase64 } from "@/lib/utils/crypto";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { QRCodeSVG } from "qrcode.react";
import { Check } from "lucide-react";
import { CountUp } from "@/components/ui/count-up";

import {
  useBalance,
  useOctraUtils,
  useEncryptedBalance,
  useTransactions,
} from "@/lib/hooks/use-octra-query";

export default function DashboardPage() {
  const {
    activeKeys,
    isUnlocked,
    wallets,
    activeWalletId,
    updateActivity,
    isBalanceHidden,
    toggleHideBalance,
  } = useWalletStore();
  const activeWallet = wallets.find((w) => w.id === activeWalletId);

  // React Query Hooks
  const { data: balanceData, isLoading: isLoadingBalance } = useBalance();
  const { data: transactions } = useTransactions(50);
  const { invalidateBalance } = useOctraUtils();

  const balance = {
    total: balanceData?.balance || 0,
    encrypted: 0,
  };

  const { data: encData, isLoading: isLoadingEnc } = useEncryptedBalance();
  balance.encrypted = encData?.encrypted || 0;

  const loading = isLoadingBalance || isLoadingEnc;

  const router = useRouter();

  // Exchange Rate
  const OCT_PRICE = 0.2; // $0.20 USD

  // Portfolio Data for Donut Chart
  const portfolioData = useMemo(() => {
    let sent = 0;
    let received = 0;

    if (transactions) {
      transactions.forEach((tx) => {
        if (tx.type === "send") sent += tx.amount;
        else received += tx.amount;
      });
    }

    // prevent 0/0 glitch
    if (sent === 0 && received === 0)
      return [
        { name: "Received", value: 1 }, // Placeholder
        { name: "Sent", value: 1 },
      ];

    return [
      { name: "Received", value: received },
      { name: "Sent", value: sent },
    ];
  }, [transactions]);

  const COLORS = ["#10B981", "#EF4444"]; // Green for Receive, Red for Sent

  // AUTH GUARD
  useEffect(() => {
    if (!isUnlocked || !activeKeys) {
      router.replace("/");
    }
  }, [isUnlocked, activeKeys, router]);

  // Activity Tracker
  useEffect(() => {
    if (isUnlocked) updateActivity();
  }, [isUnlocked]);

  const handleCopy = () => {
    if (activeKeys?.address) {
      navigator.clipboard.writeText(activeKeys.address);
      toast.success("Address copied to clipboard");
    }
  };

  const handleRefresh = () => {
    invalidateBalance();
    toast.success("Refreshing data...");
  };

  if (!activeWallet) return null;

  return (
    <AppShell>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
        {/* CENTER CONTENT: Header + Balance + Chart */}
        <div className="lg:col-span-8 space-y-8">
          {/* CUSTOM HEADER (Mobile & Desktop) */}
          <div className="flex items-center justify-between p-1">
            {/* ... existing header code ... */}
            {/* Skipping header code match for brevity, focusing on balance card later */}
            {/* Actually, replacing huge block is risky. Let's precise target balance display only */}

            <div className="flex items-center gap-3">
              {/* Avatar Gradient - Unique per wallet? For now random gradient */}
              <WalletSwitcher>
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-[0_0_15px_rgba(234,179,8,0.4)] flex items-center justify-center text-black font-bold font-space border-2 border-white/10 cursor-pointer hover:scale-105 transition-transform">
                  {activeWallet?.label.charAt(0).toUpperCase() || "O"}
                </div>
              </WalletSwitcher>
              <div>
                <h2 className="text-white font-bold font-space text-lg md:text-xl leading-none">
                  {activeWallet?.label || "My Wallet"}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <p
                    className="text-slate-400 text-xs md:text-sm font-mono bg-white/5 px-2 py-0.5 rounded-md border border-white/5 flex items-center gap-1.5 cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => {
                      if (activeKeys) {
                        copyWithAutoClear(activeKeys.address, "Address");
                      }
                    }}
                  >
                    {activeKeys
                      ? `${activeKeys.address.slice(
                          0,
                          6
                        )}...${activeKeys.address.slice(-4)}`
                      : "0x..."}
                    <Copy className="w-3 h-3 text-slate-500" />
                  </p>
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="p-1 hovered:bg-white/10 rounded text-slate-400 hover:text-white transition-colors">
                        <QrCode className="w-3.5 h-3.5" />
                      </button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#0A0A0A] border-white/10 sm:max-w-xs">
                      <DialogHeader>
                        <DialogTitle className="text-center text-white font-space">
                          Receive OCT
                        </DialogTitle>
                      </DialogHeader>
                      <div className="flex flex-col items-center justify-center py-6 space-y-6">
                        <div className="p-4 bg-white rounded-xl">
                          <QRCodeSVG
                            value={activeKeys?.address || ""}
                            size={180}
                          />
                        </div>
                        <div
                          className="text-center space-y-2 cursor-pointer group"
                          onClick={() => {
                            if (activeKeys) {
                              copyWithAutoClear(activeKeys.address, "Address");
                            }
                          }}
                        >
                          <p className="text-xs text-slate-500 font-mono text-center break-all px-4 group-hover:text-yellow-500 transition-colors">
                            {activeKeys?.address}
                          </p>
                          <p className="text-xs text-slate-600">Tap to copy</p>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleHideBalance}
                className="text-slate-400 hover:text-white"
              >
                {isBalanceHidden ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                className="text-slate-400 hover:text-yellow-400 transition-transform hover:rotate-180 duration-500"
              >
                <RefreshCw
                  className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
                />
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 cursor-pointer hover:bg-yellow-500/20 transition-all group outline-none"
                    title="Switch Network"
                  >
                    <div className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_10px_#FACC15] group-hover:scale-110 transition-transform animate-pulse" />
                    <span className="text-xs font-mono font-bold text-yellow-500 tracking-wider uppercase">
                      Testnet
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-40 bg-[#0A0A0A] border-white/10 p-1">
                  <div className="space-y-1">
                    <button
                      className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-white/5 text-xs font-space text-slate-400 opacity-50 cursor-not-allowed"
                      disabled
                      title="Coming Soon"
                    >
                      <span>Mainnet</span>
                      {/* <div className="w-2 h-2 rounded-full bg-green-500/20" /> */}
                    </button>
                    <button className="w-full flex items-center justify-between px-2 py-1.5 rounded bg-yellow-500/10 text-yellow-500 text-xs font-space font-bold">
                      <span>Testnet</span>
                      <Check className="w-3 h-3" />
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
              {/* Mobile Testnet Badge (Minimal) */}
              <div className="md:hidden w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_10px_#FACC15] animate-pulse" />
            </div>
          </div>

          {/* 3D BALANCE CARD */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative group perspective-1000"
          >
            <div className="absolute inset-0 bg-yellow-500/20 blur-[60px] rounded-full pointer-events-none opacity-50 group-hover:opacity-70 transition-opacity duration-700" />

            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#1a1a1a]/90 to-black/90 backdrop-blur-xl p-6 md:p-10 shadow-2xl">
              {/* Card Texture/Shine */}
              <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-gradient-to-br from-yellow-500/10 to-transparent rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full blur-[60px] translate-y-1/2 -translate-x-1/2" />

              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                <div className="space-y-2">
                  <p className="text-slate-400 font-mono text-xs md:text-sm tracking-widest uppercase flex items-center gap-2">
                    Total Balance
                    <span className="w-12 h-[1px] bg-white/10" />
                  </p>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-baseline gap-2 md:gap-3">
                      {loading ? (
                        <Skeleton className="h-12 w-48 rounded-lg bg-white/10" />
                      ) : (
                        <h1 className="text-5xl md:text-7xl font-bold font-space text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-slate-400 drop-shadow-sm min-w-[200px]">
                          {isBalanceHidden ? (
                            "****"
                          ) : (
                            <CountUp value={balance.total} duration={2500} />
                          )}
                        </h1>
                      )}
                      <span className="text-xl md:text-2xl font-bold text-slate-500 font-space">
                        OCT
                      </span>
                    </div>
                    {!isBalanceHidden &&
                      (loading ? (
                        <Skeleton className="h-6 w-32 rounded-md bg-white/5 mt-1" />
                      ) : (
                        <p className="text-lg text-slate-400 font-mono font-medium">
                          ≈ ${(balance.total * OCT_PRICE).toFixed(2)} USD
                        </p>
                      ))}
                  </div>
                  <p className="text-emerald-400 text-xs md:text-sm font-mono flex items-center gap-1 pt-2">
                    +2.4% <span className="text-slate-500">vs last week</span>
                  </p>
                </div>

                {/* Encrypted Mini Status */}
                <div className="bg-white/5 border border-white/5 rounded-2xl p-4 backdrop-blur-md flex items-center gap-4 min-w-[180px]">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                    <Shield className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-0.5">
                      Vault
                    </p>
                    <p className="text-white font-space font-bold">
                      {isBalanceHidden ? "****" : balance.encrypted.toFixed(4)}{" "}
                      OCT
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ACTION ROW (Send, Receive, Vault) */}
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                icon: ArrowUpRight,
                label: "Send",
                href: "/dashboard/send",
                variant: "gold",
                delay: 0.1,
              },
              {
                icon: ArrowDownLeft,
                label: "Receive",
                href: "/dashboard/receive",
                variant: "outline",
                delay: 0.2,
              },
              {
                icon: Shield,
                label: "Vault",
                href: "/dashboard/vault",
                variant: "outline",
                delay: 0.3,
              },
            ].map((action, i) => (
              <Link key={action.label} href={action.href}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: action.delay }}
                  className={`h-full flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all duration-300 group cursor-pointer ${
                    action.variant === "gold"
                      ? "bg-yellow-500 text-black border-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.5)] hover:-translate-y-1"
                      : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white hover:-translate-y-1"
                  }`}
                >
                  <action.icon
                    className={`w-6 h-6 ${
                      action.variant === "gold" ? "" : "text-yellow-500"
                    }`}
                  />
                  <span className="text-xs md:text-sm font-bold font-space">
                    {action.label}
                  </span>
                </motion.div>
              </Link>
            ))}
          </div>

          {/* CHART SECTION - Portfolio Insights */}
          <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-6 relative overflow-hidden h-[300px] flex items-center justify-between">
            <div className="w-1/2 h-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={portfolioData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {portfolioData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(5,5,5,0.9)",
                      borderColor: "rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      backdropFilter: "blur(10px)",
                      color: "white",
                    }}
                    itemStyle={{ color: "white", fontWeight: "bold" }}
                    formatter={(value: number) => value.toFixed(2) + " OCT"}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Text */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                  Activity
                </p>
              </div>
            </div>

            {/* Legend / Details */}
            <div className="w-1/2 pl-6 space-y-6">
              <div>
                <h3 className="text-white font-bold font-space text-lg mb-1">
                  Cash Flow
                </h3>
                <p className="text-xs text-slate-500">
                  Analysis of your recent activity (Last 50 txns)
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
                    <span className="text-sm text-slate-300">Received</span>
                  </div>
                  <span className="text-white font-bold font-mono">
                    {isBalanceHidden
                      ? "****"
                      : portfolioData[0].value.toFixed(2)}{" "}
                    OCT
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]" />
                    <span className="text-sm text-slate-300">Sent</span>
                  </div>
                  <span className="text-white font-bold font-mono">
                    {isBalanceHidden
                      ? "****"
                      : portfolioData[1].value.toFixed(2)}{" "}
                    OCT
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL (History Widget) - Desktop Only mostly, but we can stack on mobile */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-6 h-full min-h-[500px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-slate-300 font-bold font-space text-lg">
                Recent Activity
              </h3>
              <Link
                href="/dashboard/history"
                className="text-xs text-yellow-500 hover:underline"
              >
                View All
              </Link>
            </div>

            <div className="relative">
              {/* Use the new widget variant with real data */}
              <TransactionHistory limit={5} variant="widget" />
            </div>
          </div>
        </div>
      </div>

      {/* Features Tabs Removed - Moved to dedicated pages */}
    </AppShell>
  );
}
