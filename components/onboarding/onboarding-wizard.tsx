"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { generateMnemonic, validateMnemonic } from "@/lib/utils/crypto";
import { encryptWallet } from "@/lib/wallet-security";
import { useWalletStore } from "@/store/wallet-store";
import { Logo } from "@/components/logo";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Copy,
  Download,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  Wallet,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type Step =
  | "CHOICE"
  | "CREATE_MNEMONIC"
  | "VERIFY_MNEMONIC"
  | "IMPORT_INPUT"
  | "SET_PASSWORD"
  | "SUCCESS";

export function OnboardingWizard() {
  const [step, setStep] = useState<Step>("CHOICE");
  const [mnemonic, setMnemonic] = useState("");
  const [password, setPassword] = useState("");
  const [walletName, setWalletName] = useState("Main Wallet");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Verification State
  const [verifyIndices, setVerifyIndices] = useState<number[]>([]);
  const [verifyInputs, setVerifyInputs] = useState<{ [key: number]: string }>(
    {}
  );

  const { addWallet, unlockWallet, wallets } = useWalletStore();
  const router = useRouter();

  const defaultName = `Wallet ${wallets.length + 1}`;

  const handleCreate = () => {
    const newMnemonic = generateMnemonic();
    setMnemonic(newMnemonic);
    setWalletName(defaultName);
    setIsImporting(false);

    // Generate 3 unique random indices for verification (0-11)
    const indices = new Set<number>();
    while (indices.size < 3) {
      indices.add(Math.floor(Math.random() * 12));
    }
    setVerifyIndices(Array.from(indices).sort((a, b) => a - b));
    setVerifyInputs({});

    setStep("CREATE_MNEMONIC");
  };

  const handleImport = () => {
    setMnemonic("");
    setWalletName(defaultName);
    setIsImporting(true);
    setStep("IMPORT_INPUT");
  };

  const handleMnemonicCreateNext = () => {
    setStep("VERIFY_MNEMONIC");
    setError("");
  };

  const handleVerificationSubmit = () => {
    const words = mnemonic.split(" ");
    let isValid = true;

    for (const idx of verifyIndices) {
      if (verifyInputs[idx]?.trim() !== words[idx]) {
        isValid = false;
        break;
      }
    }

    if (!isValid) {
      setError("Incorrect words. Please check your backup and try again.");
      return;
    }

    setError("");
    setStep("SET_PASSWORD");
  };

  const handleMnemonicImportConfirm = () => {
    if (!validateMnemonic(mnemonic)) {
      setError("Invalid mnemonic phrase");
      return;
    }
    setError("");
    setStep("SET_PASSWORD");
  };

  const checkPasswordStrength = (pass: string) => {
    const strongRegex = new RegExp(
      "(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])(?=.{8,})"
    );
    return strongRegex.test(pass);
  };

  const handleComplete = async () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!checkPasswordStrength(password)) {
      setError(
        "Password is too weak. Must be 8+ chars, include Uppercase, Lowercase, Number, and Special Char."
      );
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // 1. Encrypt wallet
      const encryptedData = await encryptWallet(mnemonic, password);

      // 2. Add to Multi-Wallet Store
      const newWalletId = crypto.randomUUID();
      addWallet(
        {
          id: newWalletId,
          label: walletName || defaultName,
          encryptedData,
        },
        true
      );

      // 3. Unlock immediately (Memory)
      await unlockWallet(mnemonic, password);

      // 4. Success state
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Failed to secure wallet. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadMnemonic = () => {
    const element = document.createElement("a");
    const file = new Blob([mnemonic], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "octra_wallet_backup.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const copyMnemonic = () => {
    navigator.clipboard.writeText(mnemonic);
  };

  const BackButton = () => (
    <Button
      variant="ghost"
      className="flex-1 text-slate-400 hover:text-white"
      onClick={() => {
        if (step === "SET_PASSWORD") {
          setStep(isImporting ? "IMPORT_INPUT" : "VERIFY_MNEMONIC");
        } else if (step === "VERIFY_MNEMONIC") {
          setStep("CREATE_MNEMONIC");
        } else {
          setStep("CHOICE");
        }
      }}
    >
      Back
    </Button>
  );

  // --- RENDERERS ---

  if (step === "CHOICE") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-6 w-full max-w-2xl mx-auto"
      >
        <div className="text-center space-y-2">
          <div className="mx-auto mb-6 relative hover:scale-105 transition-transform duration-500">
            <div className="absolute inset-0 bg-yellow-400/30 blur-2xl rounded-full" />
            <Logo width={120} height={120} className="relative z-10" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold font-space text-white tracking-tight">
            Welcome to OctraWallet
          </h1>
          <p className="text-slate-400 font-space tracking-wide">
            Secure. Fast. Private.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-8">
          <Card
            className="p-8 bg-white/5 border-white/10 hover:bg-white/10 hover:border-yellow-500/50 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(234,179,8,0.1)] group relative overflow-hidden backdrop-blur-sm"
            onClick={handleCreate}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="h-14 w-14 rounded-full bg-yellow-500/20 flex items-center justify-center mb-6 border border-yellow-500/20 group-hover:border-yellow-500/50 transition-colors">
              <RefreshCw className="h-7 w-7 text-yellow-500" />
            </div>
            <h3 className="text-xl font-bold font-space text-white mb-2">
              Create New Wallet
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Generate a new 12-word recovery seed. Best for new users.
            </p>
          </Card>

          <Card
            className="p-8 bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-500/50 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(168,85,247,0.1)] group relative overflow-hidden backdrop-blur-sm"
            onClick={handleImport}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="h-14 w-14 rounded-full bg-purple-500/20 flex items-center justify-center mb-6 border border-purple-500/20 group-hover:border-purple-500/50 transition-colors">
              <DownloadIcon className="h-7 w-7 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold font-space text-white mb-2">
              Import Wallet
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Restore using an existing recovery phrase from another device.
            </p>
          </Card>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="w-full max-w-lg mx-auto bg-[#0A0A0A]/80 border-white/10 shadow-2xl p-6 md:p-10 backdrop-blur-xl relative overflow-hidden">
        {/* Glow Accent */}
        <div
          className={`absolute top-0 left-0 w-full h-1 ${
            step === "SET_PASSWORD"
              ? "bg-gradient-to-r from-green-500 to-emerald-500"
              : "bg-gradient-to-r from-yellow-500 to-amber-600"
          }`}
        />

        <div className="mb-8 text-center md:text-left">
          {step === "CREATE_MNEMONIC" && (
            <div className="flex items-start gap-4 justify-center md:justify-start">
              <Button
                variant="ghost"
                size="icon"
                className="mt-1 h-8 w-8 text-slate-400 hover:text-white -ml-2"
                onClick={() => setStep("CHOICE")}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h2 className="text-2xl font-bold font-space text-white mb-2">
                  Backup Phrase
                </h2>
                <p className="text-slate-400 text-sm">
                  Write these down in order.
                </p>
              </div>
            </div>
          )}
          {step === "VERIFY_MNEMONIC" && (
            <>
              <h2 className="text-2xl font-bold font-space text-white mb-2">
                Verify Backup
              </h2>
              <p className="text-slate-400 text-sm">
                Confirm you saved your phrase.
              </p>
            </>
          )}
          {step === "IMPORT_INPUT" && (
            <>
              <h2 className="text-2xl font-bold font-space text-white mb-2">
                Import Wallet
              </h2>
              <p className="text-slate-400 text-sm">
                Enter your 12-word mnemonic phrase.
              </p>
            </>
          )}
          {step === "SET_PASSWORD" && (
            <>
              <h2 className="text-2xl font-bold font-space text-white mb-2">
                Secure Your Wallet
              </h2>
              <p className="text-slate-400 text-sm">
                Set a password for this device.
              </p>
            </>
          )}
        </div>

        <div className="space-y-6">
          {step === "CREATE_MNEMONIC" && (
            <div className="space-y-6">
              <div className="relative p-6 bg-black/40 rounded-xl border border-white/10 font-mono text-sm leading-relaxed text-yellow-500 select-all">
                <div className="grid grid-cols-3 gap-3">
                  {mnemonic.split(" ").map((word, i) => (
                    <div
                      key={i}
                      className="flex gap-2 bg-white/5 px-2 py-1.5 rounded border border-white/5"
                    >
                      <span className="text-slate-500 select-none text-[10px] mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-white font-medium">{word}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={copyMnemonic}
                  className="flex-1 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white"
                >
                  <Copy className="w-4 h-4 mr-2" /> Copy
                </Button>
                <Button
                  variant="outline"
                  onClick={downloadMnemonic}
                  className="flex-1 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white"
                >
                  <Download className="w-4 h-4 mr-2" /> Save File
                </Button>
              </div>

              <div className="flex items-start gap-3 text-red-400 text-xs bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="leading-relaxed">
                  <strong className="block mb-1 text-red-300 uppercase tracking-wider font-bold">
                    Warning
                  </strong>
                  If you lose these words, your funds are lost forever. We
                  cannot recover them for you.
                </span>
              </div>

              <Button
                className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold h-12 text-base transition-transform active:scale-95"
                onClick={handleMnemonicCreateNext}
              >
                I have saved them <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          )}

          {step === "VERIFY_MNEMONIC" && (
            <div className="space-y-6">
              <div className="space-y-4">
                {verifyIndices.map((idx) => (
                  <div key={idx} className="space-y-2">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-widest pl-1">
                      Word #{idx + 1}
                    </label>
                    <Input
                      autoComplete="off"
                      className="bg-black/40 border-white/10 text-white h-12 focus:ring-yellow-500/50"
                      placeholder={`Enter word #${idx + 1}`}
                      value={verifyInputs[idx] || ""}
                      onChange={(e) => {
                        setVerifyInputs((prev) => ({
                          ...prev,
                          [idx]: e.target.value,
                        }));
                        setError("");
                      }}
                    />
                  </div>
                ))}
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 text-red-400 text-sm rounded-lg border border-red-500/20 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-white/5">
                <BackButton />
                <Button
                  className="flex-[2] bg-yellow-500 hover:bg-yellow-400 text-black font-bold"
                  onClick={handleVerificationSubmit}
                  disabled={Object.keys(verifyInputs).length < 3}
                >
                  Verify & Continue <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {step === "IMPORT_INPUT" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <textarea
                  className="w-full h-40 bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-yellow-500/50 outline-none resize-none font-mono text-sm leading-relaxed"
                  placeholder="apple banana cherry..."
                  value={mnemonic}
                  onChange={(e) => {
                    setMnemonic(e.target.value);
                    setError("");
                  }}
                />
                {error && (
                  <p className="text-red-400 text-sm font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> {error}
                  </p>
                )}
              </div>
              <div className="flex gap-3 pt-4 border-t border-white/5">
                <BackButton />
                <Button
                  className="flex-[2] bg-purple-500 hover:bg-purple-400 text-white font-bold h-12"
                  onClick={handleMnemonicImportConfirm}
                >
                  Continue <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {step === "SET_PASSWORD" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-400 uppercase tracking-widest pl-1">
                  Wallet Name
                </label>
                <Input
                  type="text"
                  value={walletName}
                  onChange={(e) => setWalletName(e.target.value)}
                  className="bg-black/40 border-white/10 text-white focus:ring-yellow-500/50 h-12"
                  placeholder="e.g. Main Wallet"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-400 uppercase tracking-widest pl-1">
                  New Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    className={cn(
                      "bg-black/40 border-white/10 text-white pr-10 focus:ring-yellow-500/50 h-12 font-mono",
                      checkPasswordStrength(password)
                        ? "border-green-500/50 focus:ring-green-500/50"
                        : ""
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-slate-500 hover:text-white transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] mt-2 font-mono">
                  <RequirementItem
                    met={password.length >= 8}
                    label="8+ Characters"
                  />
                  <RequirementItem
                    met={/[A-Z]/.test(password)}
                    label="Uppercase"
                  />
                  <RequirementItem
                    met={/[a-z]/.test(password)}
                    label="Lowercase"
                  />
                  <RequirementItem
                    met={/[0-9]/.test(password)}
                    label="Number"
                  />
                  <RequirementItem
                    met={/[^A-Za-z0-9]/.test(password)}
                    label="Symbol"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-400 uppercase tracking-widest pl-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError("");
                    }}
                    className={cn(
                      "bg-black/40 border-white/10 text-white focus:ring-yellow-500/50 h-12 font-mono",
                      confirmPassword && password === confirmPassword
                        ? "border-green-500/50 focus:ring-green-500/50"
                        : confirmPassword &&
                            "border-red-500/50 focus:ring-red-500/50"
                    )}
                  />
                  {confirmPassword && (
                    <div className="absolute right-3 top-3.5">
                      {password === confirmPassword ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 text-red-400 text-sm rounded-lg border border-red-500/20 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-6 border-t border-white/5">
                <BackButton />

                <Button
                  className="flex-[2] bg-yellow-500 hover:bg-yellow-400 text-black font-bold h-12"
                  onClick={handleComplete}
                  disabled={isLoading || !password}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Finish & Unlock"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

function RequirementItem({ met, label }: { met: boolean; label: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 transition-colors p-1.5 rounded bg-white/5 border border-transparent",
        met
          ? "text-green-400 border-green-500/30 bg-green-500/10"
          : "text-slate-500"
      )}
    >
      <div
        className={cn(
          "w-3 h-3 rounded-full border flex items-center justify-center",
          met
            ? "bg-green-500 border-green-500"
            : "bg-transparent border-slate-600"
        )}
      >
        {met && <CheckCircle2 className="w-2.5 h-2.5 text-black" />}
      </div>
      <span>{label}</span>
    </div>
  );
}

function DownloadIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  );
}
