"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EncryptBalance } from "@/components/encrypt-balance";
import { DecryptBalance } from "@/components/decrypt-balance";
import { Shield, Lock, Unlock } from "lucide-react";
import { useWalletStore } from "@/store/wallet-store";
import { useEffect } from "react";
import AppShell from "@/components/layout/app-shell";
import {
  useBalance,
  useEncryptedBalance,
  useOctraUtils,
} from "@/lib/hooks/use-octra-query";

export default function VaultPage() {
  const { activeKeys, isUnlocked, isBalanceHidden } = useWalletStore();

  const { data: balanceData } = useBalance();
  const { data: encData } = useEncryptedBalance();
  const { invalidateBalance } = useOctraUtils();

  const balance = {
    total: balanceData?.balance || 0,
    encrypted: encData?.encrypted || 0,
  };

  const OCT_PRICE = 0.2;

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl mx-auto h-full flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/20 mb-4 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
            <Shield className="w-8 h-8 text-yellow-500" />
          </div>
          <h1 className="text-3xl font-bold font-space text-white">
            Private Vault
          </h1>
          <p className="text-slate-400">
            Securely encrypt your assets for private transfers.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-3xl bg-gradient-to-br from-yellow-500/20 to-transparent border border-yellow-500/20 text-center space-y-2 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-yellow-400/10 blur-3xl opacity-0 group-hover:opacity-50 transition-opacity" />
            <p className="text-slate-300 font-mono text-xs uppercase tracking-widest relative z-10">
              Vault Balance
            </p>
            <div className="relative z-10">
              <h2 className="text-4xl font-bold font-space text-yellow-400">
                {isBalanceHidden ? "****" : balance.encrypted.toFixed(4)} OCT
              </h2>
              {!isBalanceHidden && (
                <p className="text-sm text-yellow-500/60 font-mono mt-1">
                  ≈ ${(balance.encrypted * OCT_PRICE).toFixed(2)} USD
                </p>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-3xl bg-white/5 border border-white/10 text-center space-y-2 relative overflow-hidden group"
          >
            <p className="text-slate-400 font-mono text-xs uppercase tracking-widest">
              Public Balance
            </p>
            <h2 className="text-4xl font-bold font-space text-white">
              {isBalanceHidden ? "****" : balance.total.toFixed(4)} OCT
            </h2>
            {!isBalanceHidden && (
              <p className="text-sm text-slate-500 font-mono mt-1">
                ≈ ${(balance.total * OCT_PRICE).toFixed(2)} USD
              </p>
            )}
          </motion.div>
        </div>

        <Tabs defaultValue="deposit" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/5 p-1 rounded-2xl border border-white/5 mb-8 h-auto">
            <TabsTrigger
              value="deposit"
              className="rounded-xl data-[state=active]:bg-yellow-500 data-[state=active]:text-black font-space font-bold py-3 transition-all w-full h-full shadow-none data-[state=active]:shadow-[0_0_20px_rgba(234,179,8,0.3)]"
            >
              <Lock className="w-4 h-4 mr-2" /> Deposit
            </TabsTrigger>
            <TabsTrigger
              value="withdraw"
              className="rounded-xl data-[state=active]:bg-white/10 data-[state=active]:text-white font-space font-bold py-3 transition-all w-full h-full shadow-none"
            >
              <Unlock className="w-4 h-4 mr-2" /> Withdraw
            </TabsTrigger>
          </TabsList>
          <TabsContent value="deposit">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <EncryptBalance
                publicBalance={balance.total}
                encryptedBalance={balance.encrypted}
                onSuccess={invalidateBalance}
              />
            </motion.div>
          </TabsContent>
          <TabsContent value="withdraw">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <DecryptBalance
                encryptedBalance={balance.encrypted}
                onSuccess={invalidateBalance}
              />
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
