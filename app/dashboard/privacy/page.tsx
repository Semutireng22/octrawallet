"use client";

import AppShell from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

export default function PrivacyPage() {
  return (
    <AppShell>
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            Privacy & Encryption
          </h1>
          <p className="text-slate-500">
            Manage your encrypted balances and private transfers.
          </p>
        </div>

        <Card className="p-8 bg-white border-slate-200 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            Encrypted Balance
          </h3>
          <p className="text-slate-500">
            This feature allows you to hide your balance on the blockchain. Only
            you can view it with your private key.
          </p>

          <div className="mt-6 p-4 bg-slate-50 rounded-lg text-sm text-slate-600 border border-slate-200">
            Status: <strong>Active</strong>
            <br />
            Encryption Scheme: <strong>AES-GCM + Ed25519 Shared Secret</strong>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
