"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { decryptBalance } from "@/lib/api";
import { Loader2, Unlock } from "lucide-react";

interface DecryptBalanceProps {
  encryptedBalance: number;
  onSuccess: () => void;
}

export function DecryptBalance({
  encryptedBalance,
  onSuccess,
}: DecryptBalanceProps) {
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleDecrypt = async () => {
    setError("");
    setSuccess("");

    const amountNum = Number.parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    if (amountNum > encryptedBalance) {
      setError(`Maximum decryptable: ${encryptedBalance.toFixed(6)} OCT`);
      return;
    }

    setIsLoading(true);
    try {
      const result = await decryptBalance(amountNum);
      setSuccess(`Funds withdrawn! Processing in next epoch.`);
      setAmount("");
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to decrypt balance");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold font-space text-white tracking-tight">
          Withdraw from Vault
        </h3>
        <p className="text-sm text-slate-400">
          Decrypt and move funds back to your spending wallet
        </p>
      </div>

      <div className="p-6 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-yellow-500/10 transition-colors" />
        <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-bold relative z-10">
          Vault Balance Available
        </p>
        <p className="text-3xl font-bold font-space text-gold-gradient relative z-10">
          {encryptedBalance.toFixed(6)}{" "}
          <span className="text-sm text-white/50">OCT</span>
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <Label
            htmlFor="decrypt-amount"
            className="text-slate-300 font-bold ml-1"
          >
            Amount to Withdraw
          </Label>
          <div className="relative">
            <Input
              id="decrypt-amount"
              type="number"
              step="0.000001"
              placeholder="0.000000"
              value={amount}
              min="0"
              onKeyDown={(e) => {
                if (e.key === "-" || e.key === "e") e.preventDefault();
              }}
              onChange={(e) => {
                const val = e.target.value;
                if (parseFloat(val) < 0) return;
                setAmount(e.target.value);
              }}
              className="bg-white/5 border-white/10 text-white font-mono placeholder:text-slate-600 focus-visible:ring-yellow-500 h-12 pr-16"
            />
            <button
              onClick={() => setAmount(encryptedBalance.toString())}
              disabled={encryptedBalance <= 0}
              className="absolute right-2 top-2 bottom-2 text-yellow-500 text-xs font-bold font-mono border border-yellow-500/20 px-3 rounded hover:bg-yellow-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
            >
              MAX
            </button>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between text-xs font-mono text-slate-500 mb-2">
              <span>0%</span>
              <span>100%</span>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={
                amount && encryptedBalance > 0
                  ? (parseFloat(amount) / encryptedBalance) * 100
                  : 0
              }
              onChange={(e) => {
                const pct = parseFloat(e.target.value);
                const val = (pct / 100) * encryptedBalance;
                setAmount(val > 0 ? val.toFixed(6) : "");
              }}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-yellow-500"
            />

            <div className="grid grid-cols-4 gap-2">
              {[25, 50, 75, 100].map((pct) => (
                <Button
                  key={pct}
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setAmount(((encryptedBalance * pct) / 100).toFixed(6))
                  }
                  className="border-white/10 hover:bg-yellow-500/10 hover:text-yellow-400 hover:border-yellow-500/30 text-slate-400 text-xs font-mono"
                >
                  {pct === 100 ? "MAX" : `${pct}%`}
                </Button>
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-500 text-right">
            Max withdrawable: {encryptedBalance.toFixed(6)} OCT
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <p className="text-sm text-red-400 font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <p className="text-sm text-green-400 font-medium">{success}</p>
          </div>
        )}

        <Button
          onClick={handleDecrypt}
          disabled={isLoading || encryptedBalance <= 0}
          variant="outline"
          className="w-full h-12 text-base font-bold border-white/10 text-white hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 shadow-lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Withdrawing...
            </>
          ) : (
            <>
              <Unlock className="w-5 h-5 mr-2" />
              Withdraw Funds
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
