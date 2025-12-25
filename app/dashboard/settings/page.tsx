"use client";

import { useState, useMemo } from "react";
import AppShell from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWalletStore } from "@/store/wallet-store";
import { encodeBase64 } from "@/lib/utils/crypto";
import { copyWithAutoClear } from "@/lib/utils/clipboard";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function SettingsPage() {
  const [showKey, setShowKey] = useState(false);

  const activeKeys = useWalletStore((state) => state.activeKeys);
  const removeWallet = useWalletStore((state) => state.removeWallet);
  const activeWalletId = useWalletStore((state) => state.activeWalletId);

  const router = useRouter();

  // Safe Hex conversion
  const toHex = (bytes: Uint8Array | undefined) => {
    if (!bytes) return "";
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  };

  const handleDelete = () => {
    if (
      confirm(
        "Are you sure? This will delete the wallet from this device. If you don't have your mnemonic, funds are lost forever."
      )
    ) {
      if (activeWalletId) {
        removeWallet(activeWalletId);
        toast.success("Wallet deleted");
        // Store logic will switch active wallet or empty list.
        // AuthGuard in page/dashboard will handle redirection if locked/empty.
        router.refresh();
      }
    }
  };

  const privKeyBase64 = useMemo(() => {
    if (!activeKeys?.privateKey) return "";
    // Standard Ed25519 "Seed" is 32 bytes.
    // TweetNaCl returns 64 bytes (Seed + PubKey).
    // We export only the Seed (first 32 bytes) for compatibility.
    const seed =
      activeKeys.privateKey.length === 64
        ? activeKeys.privateKey.slice(0, 32)
        : activeKeys.privateKey;
    return encodeBase64(seed);
  }, [activeKeys]);

  const handleCopyKey = () => {
    if (privKeyBase64) {
      copyWithAutoClear(privKeyBase64, "Private Key");
    }
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-8 pt-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-space text-white mb-2">
              Settings
            </h1>
            <p className="text-slate-400 text-sm">
              Manage your wallet preferences, security, and keys.
            </p>
          </div>
        </div>

        {/* Security Settings */}
        <Card className="p-8 glass-premium border-white/10 shadow-2xl relative overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
              <ShieldCheck className="w-6 h-6 text-yellow-500" />
            </div>
            <h3 className="text-xl font-bold text-white font-space">
              Security Preferences
            </h3>
          </div>

          <div className="flex items-center justify-between py-6 border-b border-white/5">
            <div>
              <p className="font-bold text-slate-200">Auto-lock Timeout</p>
              <p className="text-xs text-slate-500 mt-1">
                Automatically lock wallet after inactivity.
              </p>
            </div>
            <select
              className="bg-black/40 border border-white/10 rounded-xl text-sm px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/50 cursor-pointer hover:bg-white/5 transition-colors"
              value={useWalletStore((s) => s.autoLockTimeout)}
              onChange={(e) =>
                useWalletStore
                  .getState()
                  .setAutoLockTimeout(Number(e.target.value))
              }
            >
              <option value={0} className="text-black">
                Never
              </option>
              <option value={5} className="text-black">
                5 Minutes
              </option>
              <option value={15} className="text-black">
                15 Minutes
              </option>
              <option value={30} className="text-black">
                30 Minutes
              </option>
              <option value={60} className="text-black">
                1 Hour
              </option>
            </select>
          </div>

          <div className="flex items-center justify-between py-6">
            <div>
              <p className="font-bold text-slate-200">
                Biometric Authentication
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Use fingerprint or FaceID to unlock.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-mono tracking-wider">
                (COMING SOON)
              </span>
              <div className="w-12 h-6 rounded-full bg-white/5 border border-white/10 relative cursor-not-allowed opacity-50">
                <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-slate-500" />
              </div>
            </div>
          </div>
        </Card>

        {/* Private Key Export */}
        <Card className="p-8 glass-premium border-white/10 shadow-lg group hover:border-white/20 transition-all">
          <h3 className="text-xl font-bold text-white font-space mb-6">
            Export Private Key
          </h3>

          <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl mb-6 flex gap-4 items-start">
            <AlertCircle className="w-6 h-6 text-orange-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-orange-200 font-bold text-sm mb-1">
                Warning: Highly Sensitive
              </p>
              <p className="text-orange-400/80 text-xs leading-relaxed">
                Never share your private key. Anyone with this key can fully
                control your assets.
              </p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <label className="text-sm font-bold text-slate-400 ml-1 uppercase tracking-wider text-[10px]">
              Eksport Mnemonic / Seed Phrase
            </label>
            <div className="p-4 bg-black/40 border border-white/10 rounded-xl">
              <p className="text-slate-500 text-xs italic">
                Mnemonic export is under development (requires password
                re-entry for extra security). Please use the Private Key below
                for now.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-400 ml-1 uppercase tracking-wider text-[10px]">
              Ed25519 Private Key
            </label>
            <div className="relative group/input">
              <Input
                type={showKey ? "text" : "password"}
                readOnly
                value={privKeyBase64}
                className="bg-black/40 border-white/10 font-mono text-xs pr-24 py-6 text-slate-300 focus:ring-orange-500/50 rounded-xl"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-slate-400 hover:text-white hover:bg-white/10 rounded-md"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
                <div className="w-[1px] h-4 bg-white/10 mx-0.5" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-slate-400 hover:text-white hover:bg-white/10 rounded-md"
                  onClick={handleCopyKey}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="p-8 bg-red-950/20 border border-red-500/20 shadow-none hover:bg-red-950/30 transition-colors backdrop-blur-sm">
          <h3 className="text-xl font-bold text-red-500 font-space mb-2">
            Danger Zone
          </h3>
          <p className="text-sm text-red-400/70 mb-8">
            Deleting your wallet removes it from this device. Without your
            backup phrase, your funds are lost forever.
          </p>

          <Button
            variant="destructive"
            className="w-full bg-red-600/80 hover:bg-red-600 text-white font-bold h-12 shadow-lg shadow-red-500/20 rounded-xl border border-red-500/50"
            onClick={handleDelete}
          >
            <Trash2 className="w-5 h-5 mr-2" />
            Delete Wallet Permanently
          </Button>
        </Card>
      </div>
    </AppShell>
  );
}
