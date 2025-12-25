"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPrivateTransfer } from "@/lib/api";
import { Loader2, Shield } from "lucide-react";
import { ContactPicker } from "@/components/wallet/contact-picker";

interface PrivateTransferProps {
  encryptedBalance: number;
  onSuccess: () => void;
}

export function PrivateTransfer({
  encryptedBalance,
  onSuccess,
}: PrivateTransferProps) {
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSend = async () => {
    setError("");
    setSuccess("");

    if (!toAddress || !amount) {
      setError("Please fill in all fields");
      return;
    }

    const addressRegex = /^oct[1-9A-HJ-NP-Za-km-z]{44}$/;
    if (!addressRegex.test(toAddress)) {
      setError("Invalid address format");
      return;
    }

    const amountNum = Number.parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    if (amountNum > encryptedBalance) {
      setError(`Insufficient encrypted balance`);
      return;
    }

    setIsLoading(true);
    try {
      const result = await createPrivateTransfer(toAddress, amountNum);
      const hash = result.tx_hash || result.hash || result.transaction_hash;
      setSuccess(
        hash
          ? hash
          : "Private transfer sent! Recipient can claim in next epoch."
      );
      setToAddress("");
      setAmount("");
      if (onSuccess) onSuccess();
      // Note: onSuccess prop might close modal, so maybe we want to keep success msg visible?
      // The current implementation seems to show success inline.
      // But if onSuccess closes the tab/view, user won't see it.
      // Assuming onSuccess refreshes data.
    } catch (err: any) {
      setError(err.message || "Failed to send private transfer");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold font-space text-white tracking-tight flex items-center gap-2">
          <Shield className="w-6 h-6 text-yellow-500" /> Private Transfer
        </h3>
        <p className="text-sm text-slate-400">
          Send encrypted balance privately to another address
        </p>
      </div>

      <div className="p-6 bg-[#0A0A0A] rounded-2xl border border-white/5 backdrop-blur-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-yellow-500/10 transition-colors" />
        <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-bold">
          Available in Vault
        </p>
        <p className="text-3xl font-bold font-space text-white">
          {encryptedBalance.toFixed(6)}{" "}
          <span className="text-sm text-yellow-500/50">OCT</span>
        </p>
      </div>

      {encryptedBalance <= 0 && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-start gap-3">
          <div className="text-yellow-500 text-lg">⚠️</div>
          <p className="text-sm text-yellow-500 font-medium pt-0.5">
            No encrypted balance available. Encrypt some balance first to use
            this feature.
          </p>
        </div>
      )}

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="private-to" className="text-slate-300 font-bold ml-1">
            Recipient Address
          </Label>
          <div className="relative">
            <Input
              id="private-to"
              placeholder="oct..."
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              className="bg-white/5 border-white/10 text-white font-mono placeholder:text-slate-600 focus-visible:ring-purple-500 h-12 pr-10"
              disabled={encryptedBalance <= 0}
            />
            <ContactPicker onSelect={setToAddress} />
          </div>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="private-amount"
            className="text-slate-300 font-bold ml-1"
          >
            Amount (OCT)
          </Label>
          <div className="relative">
            <Input
              id="private-amount"
              type="number"
              step="0.000001"
              placeholder="0.000000"
              min="0"
              value={amount}
              onKeyDown={(e) => {
                if (e.key === "-" || e.key === "e") e.preventDefault();
              }}
              onChange={(e) => {
                const val = e.target.value;
                if (parseFloat(val) < 0) return;
                setAmount(e.target.value);
              }}
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-purple-500 h-12 pr-16"
              disabled={encryptedBalance <= 0}
            />
            <button
              className="absolute right-3 top-3 text-xs bg-white/10 hover:bg-white/20 text-yellow-500 font-bold px-2 py-1 rounded transition-colors"
              onClick={() => setAmount(encryptedBalance.toString())}
              disabled={encryptedBalance <= 0}
            >
              MAX
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <p className="text-sm text-red-400 font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2" />
            <div className="text-sm text-green-400 font-medium">
              {success.startsWith("Private") ? (
                success
              ) : (
                <>
                  Private transfer sent! <br />
                  <a
                    href={`https://octrascan.io/tx/${success}`}
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:text-green-300"
                  >
                    View on Explorer
                  </a>
                </>
              )}
            </div>
          </div>
        )}

        <Button
          onClick={handleSend}
          disabled={isLoading || encryptedBalance <= 0}
          variant="gold"
          className="w-full h-12 text-base font-bold shadow-[0_0_20px_rgba(234,179,8,0.2)] hover:shadow-[0_0_30px_rgba(234,179,8,0.3)]"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Shield className="w-5 h-5 mr-2" />
              Send Private Transfer
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
