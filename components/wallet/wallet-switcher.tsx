"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, Plus, Wallet, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWalletStore } from "@/store/wallet-store";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export function WalletSwitcher({ children }: { children?: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Rename State
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [walletToRename, setWalletToRename] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [newLabel, setNewLabel] = useState("");

  const wallets = useWalletStore((state) => state.wallets);
  const activeWalletId = useWalletStore((state) => state.activeWalletId);
  const setActiveWallet = useWalletStore((state) => state.setActiveWallet);
  const renameWallet = useWalletStore((state) => state.renameWallet);

  const activeWallet = wallets.find((w) => w.id === activeWalletId);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const handleRenameClick = (
    e: React.MouseEvent,
    wallet: { id: string; label: string }
  ) => {
    e.stopPropagation(); // prevent selecting the wallet
    setWalletToRename(wallet);
    setNewLabel(wallet.label);
    setRenameDialogOpen(true);
    setOpen(false); // Close dropdown
  };

  const submitRename = () => {
    if (walletToRename && newLabel.trim()) {
      renameWallet(walletToRename.id, newLabel.trim());
      setRenameDialogOpen(false);
      setWalletToRename(null);
    }
  };

  return (
    <>
      <div className="relative w-full" ref={dropdownRef}>
        <div onClick={() => setOpen(!open)} className="cursor-pointer">
          {children ? (
            children
          ) : (
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between bg-white/5 border-white/10 hover:bg-white/10 hover:border-yellow-500/50 text-white shadow-lg backdrop-blur-md transition-all group"
            >
              <div className="flex items-center truncate">
                <div className="mr-3 h-5 w-5 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(234,179,8,0.4)] group-hover:shadow-[0_0_15px_rgba(234,179,8,0.6)] transition-shadow">
                  <Wallet className="h-3 w-3 text-black" />
                </div>
                <span className="font-space tracking-wide">
                  {activeWallet?.label || "Select Wallet"}
                </span>
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-slate-400 group-hover:text-yellow-400 transition-colors" />
            </Button>
          )}
        </div>

        {open && (
          <div className="absolute top-full left-0 z-50 mt-2 w-full min-w-[200px] bg-[#050505]/90 border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] py-2 animate-in fade-in zoom-in-95 duration-200 backdrop-blur-xl">
            <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-space border-b border-white/5 mb-1">
              My Wallets
            </div>
            {wallets.map((wallet) => (
              <div
                key={wallet.id}
                onClick={() => {
                  setActiveWallet(wallet.id);
                  setOpen(false);
                }}
                className={cn(
                  "relative flex cursor-pointer select-none items-center px-3 py-2.5 text-sm outline-none transition-all group mx-1 rounded-lg",
                  activeWalletId === wallet.id
                    ? "bg-yellow-500/10 text-yellow-400"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4 text-yellow-500",
                    activeWalletId === wallet.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="flex-1 truncate font-medium">
                  {wallet.label}
                </span>

                <div
                  className="ml-2 p-1.5 rounded-md hover:bg-white/10 text-slate-500 hover:text-yellow-400 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100"
                  onClick={(e) => handleRenameClick(e, wallet)}
                >
                  <Pencil className="w-3 h-3" />
                </div>
              </div>
            ))}

            <div className="h-px bg-white/5 my-2 mx-2" />

            <div
              onClick={() => {
                setOpen(false);
                router.push("/onboarding");
              }}
              className="relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2.5 text-sm outline-none text-yellow-500 font-bold hover:bg-yellow-500/10 mx-1 transition-all group"
            >
              <div className="mr-2 h-5 w-5 rounded-full border border-yellow-500/30 flex items-center justify-center group-hover:border-yellow-500 bg-yellow-500/5">
                <Plus className="h-3 w-3" />
              </div>
              Onboard New Wallet
            </div>
          </div>
        )}
      </div>

      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="sm:max-w-[400px] bg-[#0A0A0A] border-[#1A1A1A] shadow-2xl sm:rounded-2xl gap-0 p-0 overflow-hidden backdrop-blur-3xl">
          <DialogHeader className="bg-white/5 p-6 border-b border-white/5">
            <DialogTitle className="text-xl font-bold text-white font-space flex items-center gap-2">
              <Pencil className="w-5 h-5 text-yellow-500" /> Rename Wallet
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest font-space">
                Wallet Label
              </label>
              <Input
                id="name"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="bg-black/40 border-white/10 focus:ring-yellow-500/50 focus:border-yellow-500/50 font-medium text-white placeholder:text-slate-600 rounded-xl py-6"
                autoFocus
                placeholder="e.g. Work Wallet"
              />
            </div>
          </div>

          <DialogFooter className="bg-white/5 p-4 border-t border-white/5 flex gap-2 justify-end">
            <Button
              variant="ghost"
              onClick={() => setRenameDialogOpen(false)}
              className="hover:bg-white/10 text-slate-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={submitRename}
              variant="gold"
              className="text-black font-bold shadow-lg shadow-yellow-500/20"
              disabled={!newLabel.trim()}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
