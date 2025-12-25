"use client";

import AppShell from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { useWalletStore } from "@/store/wallet-store";
import QRCode from "react-qr-code";
import { Copy, QrCode } from "lucide-react";
import { toast } from "sonner";

export default function ReceivePage() {
  const keys = useWalletStore((state) => state.activeKeys);
  const address = keys?.address || "";

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success("Address copied to clipboard");
    }
  };

  return (
    <AppShell>
      <div className="max-w-xl mx-auto space-y-8 pt-10">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold font-space text-white tracking-tight">
            Receive Octra
          </h1>
          <p className="text-slate-400">
            Share your wallet address to receive payments secure & instantly.
          </p>
        </div>

        <Card className="p-10 glass-premium border-white/10 shadow-2xl flex flex-col items-center space-y-10 relative overflow-hidden">
          {/* Ambient Background */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-yellow-500/5 to-transparent pointer-events-none" />

          <div className="relative group">
            <div className="p-4 bg-white rounded-3xl border-4 border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.1)] group-hover:shadow-[0_0_50px_rgba(234,179,8,0.3)] group-hover:border-yellow-500/30 transition-all duration-500">
              {address ? (
                <div className="bg-white p-2 rounded-xl">
                  <QRCode value={address} size={200} />
                </div>
              ) : (
                <div className="w-[216px] h-[216px] bg-slate-100 rounded-xl flex items-center justify-center animate-pulse">
                  <QrCode className="w-16 h-16 text-slate-300" />
                </div>
              )}
            </div>
            {/* Scan Me Label */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-bold px-3 py-1 rounded-full border border-yellow-500/50 shadow-lg">
              SCAN QR
            </div>
          </div>

          <div className="w-full space-y-4 relative z-10">
            <p className="text-xs font-bold text-slate-400 text-center uppercase tracking-widest font-space">
              Your Wallet Address
            </p>
            <div
              className="text-sm font-mono text-slate-300 break-all p-5 bg-black/40 rounded-2xl border border-white/10 flex items-center justify-between group cursor-pointer hover:border-yellow-500/50 hover:bg-black/60 hover:text-white transition-all shadow-inner"
              onClick={handleCopy}
            >
              <span className="leading-relaxed">
                {address || "Loading Address..."}
              </span>
              <div className="pl-4 border-l border-white/10 ml-2">
                <Copy className="w-5 h-5 text-slate-500 group-hover:text-yellow-400 transition-colors" />
              </div>
            </div>
            <p className="text-center text-xs text-slate-600">
              Tap the address box to copy to clipboard
            </p>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
