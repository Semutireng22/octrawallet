"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendMultipleTransactions } from "@/lib/api";
import { Loader2, Send, Plus, X } from "lucide-react";
import { ContactPicker } from "@/components/wallet/contact-picker";

interface Recipient {
  address: string;
  amount: string;
}

interface MultiSendProps {
  onSuccess: () => void;
}

export function MultiSend({ onSuccess }: MultiSendProps) {
  const [recipients, setRecipients] = useState<Recipient[]>([
    { address: "", amount: "" },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const addRecipient = () => {
    setRecipients([...recipients, { address: "", amount: "" }]);
  };

  const removeRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const updateRecipient = (
    index: number,
    field: "address" | "amount",
    value: string
  ) => {
    if (field === "amount") {
      if (value.includes("-")) return; // double check
      const num = parseFloat(value);
      if (num < 0) return;
    }

    const updated = [...recipients];
    updated[index][field] = value;
    setRecipients(updated);
  };

  const getTotalAmount = () => {
    return recipients.reduce((sum, r) => {
      const amt = Number.parseFloat(r.amount);
      return sum + (isNaN(amt) ? 0 : amt);
    }, 0);
  };

  const handleSend = async () => {
    setError("");
    setSuccess("");

    const validRecipients = recipients.filter((r) => r.address && r.amount);
    if (validRecipients.length === 0) {
      setError("Please add at least one recipient");
      return;
    }

    const addressRegex = /^oct[1-9A-HJ-NP-Za-km-z]{44}$/;
    for (const r of validRecipients) {
      if (!addressRegex.test(r.address)) {
        setError(`Invalid address: ${r.address}`);
        return;
      }
      const amt = Number.parseFloat(r.amount);
      if (isNaN(amt) || amt <= 0) {
        setError(`Amount must be greater than 0 for address ${r.address}`);
        return;
      }
    }

    setIsLoading(true);
    try {
      const results = await sendMultipleTransactions(
        validRecipients.map((r) => ({
          address: r.address,
          amount: Number.parseFloat(r.amount),
        }))
      );

      const successCount = results.filter(
        (r: any) => r.status === "success"
      ).length;
      const failedCount = results.filter(
        (r: any) => r.status === "failed"
      ).length;

      setSuccess(
        `Sent to ${successCount} addresses! ${
          failedCount > 0 ? `${failedCount} failed.` : ""
        }`
      );
      setRecipients([{ address: "", amount: "" }]);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to send transactions");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold font-space text-white tracking-tight">
            Multi Send
          </h3>
          <p className="text-sm text-slate-400">
            Batch multiple transactions in one go
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={addRecipient}
          className="border-yellow-500/20 text-yellow-500 hover:bg-yellow-500/10 hover:border-yellow-500/50 hover:text-yellow-400 font-bold"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Recipient
        </Button>
      </div>

      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {recipients.map((recipient, index) => (
          <div
            key={index}
            className="flex gap-3 items-end p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors"
          >
            <div className="flex-1 space-y-2">
              <Label className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                Address
              </Label>
              <div className="relative">
                <Input
                  placeholder="oct..."
                  value={recipient.address}
                  onChange={(e) =>
                    updateRecipient(index, "address", e.target.value)
                  }
                  className="bg-black/20 border-white/10 text-white font-mono text-sm pr-10 focus:ring-yellow-500/50"
                />
                <ContactPicker
                  onSelect={(addr) => updateRecipient(index, "address", addr)}
                />
              </div>
            </div>
            <div className="w-32 space-y-2">
              <Label className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                Amount
              </Label>
              <Input
                type="number"
                step="0.000001"
                placeholder="0.0"
                value={recipient.amount}
                min="0"
                onKeyDown={(e) => {
                  if (e.key === "-" || e.key === "e") e.preventDefault();
                }}
                onChange={(e) =>
                  updateRecipient(index, "amount", e.target.value)
                }
                className="bg-black/20 border-white/10 text-white focus:ring-yellow-500/50"
              />
            </div>
            {recipients.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeRecipient(index)}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-10 w-10"
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <div className="p-6 bg-[#0A0A0A] rounded-2xl border border-yellow-500/20 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-yellow-500/10 transition-colors" />
        <div className="flex justify-between items-center relative z-10">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-xs">
            Total Amount Required
          </span>
          <span className="text-2xl font-bold font-space text-gold-gradient flex items-center gap-2">
            {getTotalAmount().toFixed(6)}{" "}
            <span className="text-sm text-yellow-500/50">OCT</span>
          </span>
        </div>
        <div className="flex justify-between items-center mt-4 border-t border-white/5 pt-4 relative z-10">
          <span className="text-slate-500 text-sm font-medium">
            Recipients Count
          </span>
          <span className="text-white font-mono font-bold bg-white/10 px-2 py-0.5 rounded">
            {recipients.filter((r) => r.address && r.amount).length}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
          <p className="text-sm text-red-500 font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
          <p className="text-sm text-green-400 font-medium">{success}</p>
        </div>
      )}

      <Button
        onClick={handleSend}
        disabled={isLoading}
        variant="gold"
        className="w-full h-12 text-base font-bold shadow-lg shadow-yellow-500/10"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin text-black" />
            Sending Batch...
          </>
        ) : (
          <>
            <Send className="w-5 h-5 mr-2" />
            Send to All
          </>
        )}
      </Button>
    </div>
  );
}
