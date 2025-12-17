"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle } from "lucide-react"

interface WalletConnectProps {
  onConnect: () => void
}

export function WalletConnect({ onConnect }: WalletConnectProps) {
  const [privateKey, setPrivateKey] = useState("")
  const [address, setAddress] = useState("")
  const [error, setError] = useState("")

  const handleConnect = () => {
    setError("")

    if (!privateKey || !address) {
      setError("Please fill in all fields")
      return
    }

    // Validate address format (oct + 44 base58 chars)
    const addressRegex = /^oct[1-9A-HJ-NP-Za-km-z]{44}$/
    if (!addressRegex.test(address)) {
      setError("Invalid address format")
      return
    }

    // Save to localStorage
    const walletData = {
      privateKey,
      address,
      rpc: "https://octra.network",
      connectedAt: Date.now(),
    }

    localStorage.setItem("octra_wallet", JSON.stringify(walletData))
    onConnect()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-900/80 backdrop-blur border-slate-700 p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Octra Wallet</h1>
          <p className="text-slate-400">Connect your wallet to get started</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="privateKey" className="text-slate-200">
              Private Key
            </Label>
            <Input
              id="privateKey"
              type="password"
              placeholder="Enter your private key"
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="text-slate-200">
              Wallet Address
            </Label>
            <Input
              id="address"
              placeholder="oct..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white font-mono text-sm"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          <Button onClick={handleConnect} className="w-full bg-blue-600 hover:bg-blue-700 text-white" size="lg">
            Connect Wallet
          </Button>

          <div className="text-xs text-slate-500 text-center">
            <p>RPC: https://octra.network</p>
            <p className="mt-1">⚠️ Your keys are stored locally in your browser</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
