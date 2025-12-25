"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { OctraApi, Transaction } from "@/lib/api";
import { useWalletStore } from "@/store/wallet-store";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Copy, Share2 } from "lucide-react";
import { toast } from "sonner";
import { copyWithAutoClear } from "@/lib/utils/clipboard";

export function TransactionHistory({
  limit,
  variant = "default",
}: {
  limit?: number;
  variant?: "default" | "widget";
}) {
  const { activeKeys } = useWalletStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!activeKeys?.address) return;
      // Prevent loop if already loading
      // if (isLoading) return; // Actually this might block legit reloads.

      setIsLoading(true);
      try {
        const data = await OctraApi.fetchTransactions(activeKeys.address);

        // Safety: only update if mounted/valid? React handles set state on unmount warning usually.
        // Sort
        const sorted = data.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setTransactions(limit ? sorted.slice(0, limit) : sorted);
      } catch (e) {
        console.error("Failed to load txs", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [activeKeys?.address, limit]);

  if (isLoading) {
    return (
      <div
        className={`flex justify-center ${
          variant === "widget" ? "p-4" : "p-8"
        }`}
      >
        <Loader2 className="animate-spin h-6 w-6 text-yellow-500" />
      </div>
    );
  }

  if (transactions.length === 0) {
    if (variant === "widget") {
      return (
        <div className="text-center p-4 text-slate-500 text-xs">
          No recent activity.
        </div>
      );
    }
    return (
      <div className="text-center p-12 text-slate-500 bg-white/5 rounded-3xl border border-dashed border-white/10">
        <p className="font-space">No transactions found.</p>
      </div>
    );
  }

  // WIDGET VIEW
  if (variant === "widget") {
    return (
      <div className="space-y-4">
        {transactions.map((tx, i) => (
          <div
            key={tx.hash}
            className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors cursor-pointer group"
            onClick={() => setSelectedTx(tx)}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border border-white/5 ${
                  tx.type === "receive"
                    ? "bg-green-500/10 text-green-500"
                    : "bg-red-500/10 text-red-500" // Red for sent in widget per original design, or use neutral? Let's stick to red/green for contrast
                }`}
              >
                {tx.type === "receive" ? (
                  <ArrowDownLeft className="w-5 h-5" />
                ) : (
                  <ArrowUpRight className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="text-white font-bold text-sm truncate max-w-[120px]">
                  {tx.type === "receive" ? "Received OCT" : "Sent OCT"}
                </p>
                <p className="text-slate-500 text-xs text-mono">
                  {format(new Date(tx.timestamp), "MMM dd, HH:mm")}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p
                className={`text-sm font-bold ${
                  tx.type === "receive" ? "text-green-400" : "text-white"
                }`}
              >
                {tx.type === "receive" ? "+" : "-"}
                {tx.amount} OCT
              </p>
              <p className="text-[10px] text-slate-600 font-mono flex items-center justify-end gap-1">
                Completed{" "}
                <ExternalLink className="w-2 h-2 opacity-0 group-hover:opacity-100 transition-opacity" />
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // DEFAULT VIEW (Grouped)
  const groupedTransactions = transactions.reduce((acc, tx) => {
    const date = new Date(tx.timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    let key = format(date, "MMMM dd, yyyy");
    if (date.toDateString() === today.toDateString()) key = "Today";
    else if (date.toDateString() === yesterday.toDateString())
      key = "Yesterday";

    if (!acc[key]) acc[key] = [];
    acc[key].push(tx);
    return acc;
  }, {} as Record<string, Transaction[]>);

  const groups = Object.keys(groupedTransactions);

  return (
    <div className="space-y-6">
      {groups.map((date) => (
        <div key={date} className="space-y-3">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 font-space">
            {date}
          </h4>
          <div className="space-y-3">
            {groupedTransactions[date].map((tx, index) => (
              <motion.div
                key={tx.hash}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="p-4 flex items-center justify-between hover:bg-white/10 transition-all group border border-white/5 hover:border-yellow-500/30 bg-transparent shadow-none cursor-pointer"
                  onClick={() => setSelectedTx(tx)}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
                        tx.type === "receive"
                          ? "bg-green-500/10 text-green-400 ring-1 ring-green-500/20"
                          : "bg-white/5 text-slate-400 ring-1 ring-white/10 group-hover:text-yellow-400 group-hover:ring-yellow-500/30 transition-colors"
                      }`}
                    >
                      {tx.type === "receive" ? (
                        <ArrowDownLeft className="w-5 h-5" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-200 text-sm font-space">
                        {tx.type === "receive" ? "Received OCT" : "Sent OCT"}
                      </p>
                      <a
                        href={`https://octrascan.io/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-slate-500 hover:text-yellow-400 flex items-center gap-1 group-hover:underline font-mono transition-colors"
                      >
                        {tx.hash.substring(0, 6)}...
                        {tx.hash.substring(tx.hash.length - 4)}
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold text-sm font-space tracking-tight ${
                        tx.type === "receive"
                          ? "text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.3)]"
                          : "text-white group-hover:text-yellow-400 transition-colors"
                      }`}
                    >
                      {tx.type === "receive" ? "+" : "-"} {tx.amount} OCT
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {format(new Date(tx.timestamp), "HH:mm")}
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      ))}

      {/* RECEIPT MODAL */}
      <Dialog
        open={!!selectedTx}
        onOpenChange={(open) => !open && setSelectedTx(null)}
      >
        <DialogContent className="bg-[#0A0A0A] border-white/10 sm:max-w-md p-0 overflow-hidden gap-0">
          <div className="bg-yellow-500 h-2 w-full" />
          <div className="p-6 space-y-6 relative">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('/noise.png')] opacity-5 pointer-events-none" />

            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <DialogTitle className="text-xl font-bold font-space text-white">
                Payment Successful
              </DialogTitle>
              <p className="text-sm text-slate-500 font-mono">
                {selectedTx &&
                  format(
                    new Date(selectedTx.timestamp),
                    "MMM dd, yyyy • HH:mm a"
                  )}
              </p>
            </div>

            {/* Amount */}
            <div className="text-center py-6 border-y border-white/5 bg-white/5 rounded-2xl">
              <p className="text-sm text-slate-400 font-mono mb-1 uppercase tracking-widest">
                Amount
              </p>
              <h1 className="text-4xl font-bold font-space text-white">
                {selectedTx?.amount.toFixed(2)}{" "}
                <span className="text-xl text-yellow-500">OCT</span>
              </h1>
            </div>

            {/* Details */}
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Status</span>
                <span className="text-green-400 font-bold bg-green-500/10 px-2 py-0.5 rounded text-xs uppercase tracking-wider border border-green-500/20">
                  Success
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Transaction ID</span>
                <div
                  className="flex items-center gap-2 text-slate-300 font-mono text-xs bg-white/5 px-2 py-1 rounded cursor-pointer hover:bg-white/10 hover:text-white transition-colors"
                  onClick={() =>
                    selectedTx && copyWithAutoClear(selectedTx.hash, "Tx ID")
                  }
                >
                  {selectedTx &&
                    `${selectedTx.hash.slice(0, 8)}...${selectedTx.hash.slice(
                      -8
                    )}`}
                  <Copy className="w-3 h-3" />
                </div>
              </div>
              {/* From / To can be added here if we parsed sender */}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10"
                variant="outline"
                onClick={() => {
                  if (selectedTx)
                    window.open(
                      `https://octrascan.io/tx/${selectedTx.hash}`,
                      "_blank"
                    );
                }}
              >
                View on Explorer <ExternalLink className="w-3 h-3 ml-2" />
              </Button>
              <Button
                className="w-full bg-yellow-500 text-black hover:bg-yellow-400 font-bold"
                onClick={() => {
                  toast.success("Receipt saved to image (Mock)");
                }}
              >
                Share Receipt <Share2 className="w-3 h-3 ml-2" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
