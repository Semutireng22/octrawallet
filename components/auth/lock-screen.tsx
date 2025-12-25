"use client";

import { useState } from "react";
import {
  ShieldCheck,
  ArrowRight,
  Loader2,
  Wallet,
  AlertTriangle,
  Keyboard,
} from "lucide-react";
import { VirtualKeypad } from "@/components/security/virtual-keypad";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWalletStore } from "@/store/wallet-store";
import { decryptWallet, encryptWallet } from "@/lib/wallet-security";
import { validateMnemonic } from "@/lib/utils/crypto";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Logo } from "@/components/logo";

export function LockScreen() {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showKeypad, setShowKeypad] = useState(false);

  // Forgot Password State
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetMnemonic, setResetMnemonic] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  const wallets = useWalletStore((state) => state.wallets);
  const activeWalletId = useWalletStore((state) => state.activeWalletId);
  const unlockWallet = useWalletStore((state) => state.unlockWallet);
  const addWallet = useWalletStore((state) => state.addWallet);

  // Find active wallet meta
  const activeWallet =
    wallets.find((w) => w.id === activeWalletId) || wallets[0];

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (!activeWallet) throw new Error("No wallet found");

      const { encryptedData } = activeWallet;

      // 1. Decrypt the wallet blob
      const mnemonic = await decryptWallet(encryptedData, password);

      // 2. Unlock the store (derives keys in memory)
      await unlockWallet(mnemonic, password);
    } catch (err) {
      setError("Incorrect password");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    setResetError("");
    setIsResetting(true);
    try {
      if (!validateMnemonic(resetMnemonic)) {
        throw new Error("Invalid Recovery Phrase");
      }
      if (newPassword.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }
      if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      // Re-encrypt wallet for the CURRENT active wallet ID
      const newEncryptedData = await encryptWallet(resetMnemonic, newPassword);

      // Update store (overwrites existing wallet if ID matches)
      addWallet({
        ...activeWallet,
        encryptedData: newEncryptedData,
      });

      // Unlock immediately
      await unlockWallet(resetMnemonic, newPassword);
      setIsResetOpen(false);
    } catch (e: any) {
      setResetError(e.message || "Failed to reset wallet");
    } finally {
      setIsResetting(false);
    }
  };

  if (!activeWallet)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white">
        <p className="font-space text-slate-400">
          No active wallet found. Please clear cache or restart.
        </p>
      </div>
    );

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505]/90 backdrop-blur-md p-4 animate-in fade-in duration-500">
      <div className="w-full max-w-md space-y-8 glass-premium p-10 rounded-3xl shadow-2xl relative border-white/10">
        <div className="text-center space-y-4">
          <div className="mx-auto mb-6 relative hover:scale-105 transition-transform duration-500">
            <div className="absolute inset-0 bg-yellow-400/30 blur-2xl rounded-full" />
            <Logo width={80} height={80} className="relative z-10" />
          </div>
          <h2 className="text-3xl font-bold font-space text-white tracking-tight">
            Unlock Wallet
          </h2>
          <div className="flex items-center justify-center gap-2 text-sm text-slate-400 bg-white/5 py-1.5 px-4 rounded-full w-fit mx-auto border border-white/5">
            <Wallet className="w-4 h-4 text-yellow-500" />
            <span className="font-medium truncate max-w-[150px] font-space text-slate-300">
              {activeWallet.label}
            </span>
          </div>
        </div>

        <form onSubmit={handleUnlock} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <Input
                type="password"
                placeholder="Enter Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-yellow-500 focus-visible:border-yellow-500/50 h-14 text-center text-xl tracking-[0.3em] rounded-xl transition-all hover:bg-white/10"
                autoFocus
                readOnly={undefined} // Could set readOnly if virtual keypad is strict, but let's allow both
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowKeypad(!showKeypad)}
                className="absolute right-2 top-2 h-10 w-10 text-slate-400 hover:text-white"
              >
                <Keyboard className="w-5 h-5" />
              </Button>
            </div>

            <VirtualKeypad
              isVisible={showKeypad}
              onInput={(char) => setPassword((prev) => prev + char)}
              onDelete={() => setPassword((prev) => prev.slice(0, -1))}
              onClear={() => setPassword("")}
            />
            {error && (
              <p className="text-sm text-red-400 font-medium text-center animate-pulse flex items-center justify-center gap-2 bg-red-500/10 py-2 rounded-lg border border-red-500/20">
                <AlertTriangle className="w-4 h-4" /> {error}
              </p>
            )}
          </div>

          <Button
            type="submit"
            variant="gold"
            className="w-full h-12 text-lg font-bold shadow-[0_0_20px_rgba(234,179,8,0.2)] hover:shadow-[0_0_30px_rgba(234,179,8,0.4)] rounded-xl"
            disabled={isLoading || !password}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-black" />
            ) : (
              <>
                Unlock Access <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>

          <div className="text-center pt-2">
            <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="link"
                  className="text-slate-500 hover:text-yellow-400 text-sm font-space transition-colors"
                >
                  Forgot Password?
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg bg-[#0A0A0A] border-white/10 sm:rounded-3xl shadow-2xl backdrop-blur-xl">
                <DialogHeader className="space-y-3 pb-4 border-b border-white/5">
                  <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-2 border border-red-500/20">
                    <ShieldCheck className="w-8 h-8 text-red-500" />
                  </div>
                  <DialogTitle className="text-center text-2xl font-space text-white">
                    Reset Wallet Access
                  </DialogTitle>
                  <DialogDescription className="text-center text-slate-400 font-sans">
                    Enter your 12-word Recovery Phrase to set a new password.
                    <br />
                    <span className="text-red-400 font-bold text-xs bg-red-500/10 px-2 py-1 rounded-md mt-2 inline-block border border-red-500/20">
                      WARNING: Without phrase, funds are lost forever.
                    </span>
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-300 font-space ml-1">
                      Recovery Phrase (12 Words)
                    </label>
                    <Textarea
                      placeholder="apple banana cherry..."
                      className="min-h-[120px] w-full bg-white/5 border-white/10 focus:border-yellow-500/50 focus:ring-yellow-500/20 font-mono text-sm leading-relaxed p-4 resize-none rounded-xl text-yellow-100/90 placeholder:text-slate-700"
                      value={resetMnemonic}
                      onChange={(e) => setResetMnemonic(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-300 font-space ml-1">
                        New Password
                      </label>
                      <Input
                        type="password"
                        className="bg-white/5 border-white/10 focus:ring-yellow-500 rounded-xl"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-300 font-space ml-1">
                        Confirm
                      </label>
                      <Input
                        type="password"
                        className="bg-white/5 border-white/10 focus:ring-yellow-500 rounded-xl"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  {resetError && (
                    <div className="p-4 bg-red-500/10 text-red-400 text-sm rounded-xl flex items-center justify-center font-medium border border-red-500/20">
                      <AlertTriangle className="w-4 h-4 mr-2" /> {resetError}
                    </div>
                  )}

                  <Button
                    onClick={handleReset}
                    className="w-full bg-red-600 hover:bg-red-700 text-white h-12 font-bold shadow-[0_0_15px_rgba(220,38,38,0.4)] rounded-xl font-space tracking-wide"
                    disabled={isResetting || !resetMnemonic || !newPassword}
                  >
                    {isResetting ? (
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      "Reset Password & Unlock"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </form>
      </div>
    </div>
  );
}
