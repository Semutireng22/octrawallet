"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Send,
  Loader2,
  ArrowRight,
  Scan,
  Users,
  ShieldCheck,
} from "lucide-react";
import { OctraApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useWalletStore } from "@/store/wallet-store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MultiSend } from "@/components/multi-send";
import { PrivateTransfer } from "@/components/private-transfer";
import { motion } from "framer-motion";
import { ContactPicker } from "@/components/wallet/contact-picker";
import { usePasteGuard } from "@/components/security/paste-guard";

export default function SendPage() {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState({ total: 0, encrypted: 0 });
  const [sliderValue, setSliderValue] = useState([0]); // 0-100
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState(""); // error message
  const [txHash, setTxHash] = useState(""); // success hash

  const { activeKeys } = useWalletStore();
  const router = useRouter();
  const { confirmPaste, PasteGuardModal } = usePasteGuard();

  // Fetch Balance on Mount
  const loadData = async () => {
    if (activeKeys?.address) {
      OctraApi.fetchBalance(activeKeys.address)
        .then(async (data) => {
          // Also fetch encrypted for Private Transfer context
          // (Though PrivateTransfer component fetches its own, it's good to have top level if needed)
          setBalance({ total: data.balance, encrypted: 0 });
        })
        .catch(console.error);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeKeys]);

  const handleSliderChange = (value: number[]) => {
    setSliderValue(value);
    const percentage = value[0] / 100;
    const calculatedAmount = Math.max(0, balance.total * percentage - 0.000001); // Deduct fee estimate if max
    const finalAmount = calculatedAmount > 0 ? calculatedAmount : 0;
    setAmount(finalAmount.toFixed(6));
  };

  const setPercentage = (percent: number) => {
    handleSliderChange([percent]);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && balance.total > 0) {
      setSliderValue([Math.min(100, (val / balance.total) * 100)]);
    } else {
      setSliderValue([0]);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus("");

    try {
      if (!recipient || !amount) return;

      const val = parseFloat(amount);
      if (isNaN(val) || val <= 0) {
        throw new Error("Amount must be greater than 0");
      }

      if (val > balance.total) {
        throw new Error("Insufficient balance");
      }

      // Self-send Check
      if (recipient === activeKeys?.address) {
        throw new Error("Cannot send to your own address");
      }

      // Basic validation
      if (!recipient.startsWith("oct")) {
        throw new Error("Invalid Octra address (must start with 'oct')");
      }

      const res = await OctraApi.sendTransaction(recipient, val);

      if (res && res.txHash) {
        setTxHash(res.txHash);
        setStatus("");
        loadData(); // Refresh balance
      } else {
        setTxHash("unknown_hash"); // Fallback
      }
    } catch (error: any) {
      console.error(error);
      setStatus(error.message || "Transaction failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (txHash) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-full max-h-[80vh] space-y-6 animate-in zoom-in duration-500">
          <div className="w-24 h-24 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(34,197,94,0.2)] border border-green-500/20">
            <Send className="w-10 h-10" />
          </div>
          <h2 className="text-4xl font-bold text-white font-space tracking-tight">
            Transaction Sent!
          </h2>
          <p className="text-slate-400 font-space text-lg text-center max-w-md">
            Your transaction has been broadcast to the network.
          </p>

          <a
            href={`https://octrascan.io/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
            className="text-yellow-500 hover:text-yellow-400 underline font-mono text-sm break-all"
          >
            {txHash}
          </a>

          <Button
            onClick={() => {
              setTxHash("");
              setAmount("");
              setRecipient("");
            }}
            variant="outline"
            className="mt-8 px-8 py-6 text-lg rounded-xl border-white/20 text-white hover:bg-white/10"
          >
            Send Another
          </Button>
          <Button
            onClick={() => router.push("/dashboard")}
            variant="ghost"
            className="text-slate-500 hover:text-white"
          >
            Return to Dashboard
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6 pt-0 md:pt-4">
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl font-bold text-white font-space tracking-tight">
            Send Hub
          </h1>
          <p className="text-slate-400">Choose your transfer method.</p>
        </div>

        <Tabs defaultValue="standard" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/5 p-1 rounded-2xl border border-white/5 mb-8 h-auto">
            <TabsTrigger
              value="standard"
              className="py-3 rounded-xl gap-2 font-space data-[state=active]:bg-yellow-500 data-[state=active]:text-black transition-all"
            >
              <Scan className="w-4 h-4" />{" "}
              <span className="hidden md:inline">Standard</span>
            </TabsTrigger>
            <TabsTrigger
              value="multi"
              className="py-3 rounded-xl gap-2 font-space data-[state=active]:bg-yellow-500 data-[state=active]:text-black transition-all"
            >
              <Users className="w-4 h-4" />{" "}
              <span className="hidden md:inline">Multi-Send</span>
            </TabsTrigger>
            <TabsTrigger
              value="private"
              className="py-3 rounded-xl gap-2 font-space data-[state=active]:bg-yellow-500 data-[state=active]:text-black transition-all"
            >
              <ShieldCheck className="w-4 h-4" />{" "}
              <span className="hidden md:inline">Private</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="standard">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-8 glass-premium border-white/10 shadow-2xl relative overflow-hidden">
                {/* Glow Effect */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />

                <form
                  onSubmit={handleSend}
                  className="space-y-10 relative z-10"
                >
                  {/* Giant Amount Input */}
                  <div className="space-y-6 text-center">
                    <label className="text-sm font-bold text-yellow-500/80 uppercase tracking-widest font-space">
                      Amount to Send
                    </label>

                    <div className="relative flex justify-center items-center">
                      <input
                        type="number"
                        placeholder="0.00"
                        step="0.000001"
                        min="0"
                        value={amount}
                        onChange={handleAmountChange}
                        className="w-full bg-transparent border-none text-center text-7xl md:text-8xl font-bold font-space text-gold-gradient focus:outline-none placeholder:text-white/5 caret-yellow-400 py-4"
                        autoFocus
                      />
                    </div>

                    <div className="text-white/30 font-bold text-xl font-space uppercase tracking-[0.2em] transform -translate-y-4">
                      OCT
                    </div>

                    {/* Slider & Quick Select */}
                    <div className="space-y-6 px-4 md:px-10">
                      <div className="flex justify-between text-xs font-mono text-slate-500 mb-2">
                        <span>0%</span>
                        <span>Available: {balance.total.toFixed(4)} OCT</span>
                        <span>100%</span>
                      </div>

                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={sliderValue[0]}
                        onChange={(e) =>
                          handleSliderChange([parseFloat(e.target.value)])
                        }
                        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                      />

                      <div className="grid grid-cols-4 gap-2">
                        {[25, 50, 75, 100].map((pct) => (
                          <Button
                            key={pct}
                            type="button"
                            variant="outline"
                            onClick={() => setPercentage(pct)}
                            className="border-white/10 hover:bg-yellow-500/10 hover:text-yellow-400 hover:border-yellow-500/30 text-slate-400 text-xs font-mono"
                          >
                            {pct === 100 ? "MAX" : `${pct}%`}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Recipient Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400 ml-1">
                      Recipient Address
                    </label>
                    <div className="relative group">
                      <Input
                        placeholder="oct123..."
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        onPaste={async (e) => {
                          e.preventDefault();
                          const text = e.clipboardData.getData("text");
                          if (await confirmPaste(text)) {
                            setRecipient(text);
                          }
                        }}
                        className="bg-black/30 border-white/10 font-mono text-slate-300 h-14 pl-4 pr-12 focus:ring-yellow-500/50 rounded-xl transition-all"
                      />
                      <ContactPicker onSelect={setRecipient} />
                    </div>
                  </div>

                  {status && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium flex items-center justify-center animate-pulse">
                      <p>{status}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="gold"
                    className="w-full h-14 text-xl rounded-xl shadow-[0_0_30px_rgba(234,179,8,0.2)] hover:shadow-[0_0_50px_rgba(234,179,8,0.4)] transition-all transform hover:-translate-y-1"
                    disabled={isLoading || !amount || !recipient}
                  >
                    {isLoading ? (
                      <Loader2 className="animate-spin w-6 h-6 text-black" />
                    ) : (
                      <span className="flex items-center">
                        Confirm Transaction{" "}
                        <ArrowRight className="ml-2 w-6 h-6" />
                      </span>
                    )}
                  </Button>

                  <p className="text-center text-xs text-slate-600 font-mono">
                    Network Fee:{" "}
                    <span className="text-slate-400">0.000001 OCT</span>
                  </p>
                </form>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="multi">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="glass-premium border-white/10">
                <MultiSend onSuccess={loadData} />
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="private">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="glass-premium border-white/10">
                {/* Note: PrivateTransfer likely requires fetching encrypted balance again or passing it down */}
                <PrivateTransfer encryptedBalance={0} onSuccess={loadData} />
                {/* TODO: Pass actual encrypted balance if component needs it for UI validaton, though component usually handles its own or we need to fetch it in loadData.*/}
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
      <PasteGuardModal />
    </AppShell>
  );
}
