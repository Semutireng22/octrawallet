"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { encryptBalance } from "@/lib/api";
import { Loader2, Lock } from "lucide-react";

interface EncryptBalanceProps {
  publicBalance: number;
  encryptedBalance: number;
  onSuccess: () => void;
}

export function EncryptBalance({
  publicBalance,
  encryptedBalance,
  onSuccess,
}: EncryptBalanceProps) {
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const maxEncrypt = Math.max(0, publicBalance - 1);

  const handleEncrypt = async () => {
    setError("");
    setSuccess("");

    const amountNum = Number.parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    if (amountNum > maxEncrypt) {
      setError(
        `Maximum encryptable: ${maxEncrypt.toFixed(
          6
        )} OCT (need 1 OCT for fees)`
      );
      return;
    }

    setIsLoading(true);
    try {
      const result = await encryptBalance(amountNum);
      setSuccess(`Funds deposited to vault! Processing in next epoch.`);
      setAmount("");
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to encrypt balance");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold font-space text-white tracking-tight">
          Deposit to Private Vault
        </h3>
        <p className="text-sm text-slate-400">
          Securely encrypt and move funds to your private vault
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-md">
        <div>
          <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-bold">
            Spending Wallet
          </p>
          <p className="text-lg font-bold font-space text-white truncate">
            {publicBalance.toFixed(6)}{" "}
            <span className="text-sm text-slate-500">OCT</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-yellow-500/80 mb-1 uppercase tracking-wider font-bold">
            Private Vault
          </p>
          <p className="text-lg font-bold font-space text-gold-gradient truncate">
            {encryptedBalance.toFixed(6)}{" "}
            <span className="text-sm text-yellow-500/50">OCT</span>
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <Label
            htmlFor="encrypt-amount"
            className="text-slate-300 font-bold ml-1"
          >
            Amount to Deposit
          </Label>
          <div className="relative">
            <Input
              id="encrypt-amount"
              type="number"
              step="0.000001"
              placeholder="0.000000"
              value={amount}
              onChange={(e) => {
                const val = e.target.value;
                if (parseFloat(val) < 0) return;
                setAmount(val);
              }}
              className="bg-white/5 border-white/10 text-white font-mono placeholder:text-slate-600 focus-visible:ring-yellow-500 h-12 pr-16"
            />
            <button
              onClick={() => setAmount(maxEncrypt.toString())}
              disabled={maxEncrypt <= 0}
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
                amount && maxEncrypt > 0
                  ? (parseFloat(amount) / maxEncrypt) * 100
                  : 0
              }
              onChange={(e) => {
                const pct = parseFloat(e.target.value);
                const val = (pct / 100) * maxEncrypt;
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
                    setAmount(((maxEncrypt * pct) / 100).toFixed(6))
                  }
                  className="border-white/10 hover:bg-yellow-500/10 hover:text-yellow-400 hover:border-yellow-500/30 text-slate-400 text-xs font-mono"
                >
                  {pct === 100 ? "MAX" : `${pct}%`}
                </Button>
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-500 text-right">
            Available to encrypt: {maxEncrypt.toFixed(6)} OCT
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
          onClick={handleEncrypt}
          disabled={isLoading || maxEncrypt <= 0}
          variant="gold"
          className="w-full h-12 text-base font-bold shadow-[0_0_20px_rgba(234,179,8,0.2)] hover:shadow-[0_0_30px_rgba(234,179,8,0.3)]"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin text-black" />
              Depositing...
            </>
          ) : (
            <>
              <Lock className="w-5 h-5 mr-2" />
              Deposit to Vault
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
