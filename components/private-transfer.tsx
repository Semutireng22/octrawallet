"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createPrivateTransfer } from "@/lib/api"
import { Loader2, Shield } from "lucide-react"

interface PrivateTransferProps {
  encryptedBalance: number
  onSuccess: () => void
}

export function PrivateTransfer({ encryptedBalance, onSuccess }: PrivateTransferProps) {
  const [toAddress, setToAddress] = useState("")
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleSend = async () => {
    setError("")
    setSuccess("")

    if (!toAddress || !amount) {
      setError("Please fill in all fields")
      return
    }

    const addressRegex = /^oct[1-9A-HJ-NP-Za-km-z]{44}$/
    if (!addressRegex.test(toAddress)) {
      setError("Invalid address format")
      return
    }

    const amountNum = Number.parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Invalid amount")
      return
    }

    if (amountNum > encryptedBalance) {
      setError(`Insufficient encrypted balance`)
      return
    }

    setIsLoading(true)
    try {
      const result = await createPrivateTransfer(toAddress, amountNum)
      setSuccess(`Private transfer sent! Recipient can claim in next epoch.`)
      setToAddress("")
      setAmount("")
      onSuccess()
    } catch (err: any) {
      setError(err.message || "Failed to send private transfer")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-white">Private Transfer</h3>
      <p className="text-sm text-slate-400">Send encrypted balance privately to another address</p>

      <div className="p-4 bg-slate-800/50 rounded-lg">
        <p className="text-xs text-slate-400 mb-1">Available Encrypted Balance</p>
        <p className="text-2xl font-semibold text-yellow-500">{encryptedBalance.toFixed(6)} OCT</p>
      </div>

      {encryptedBalance <= 0 && (
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-sm text-yellow-500">⚠️ No encrypted balance available. Encrypt some balance first.</p>
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="private-to" className="text-slate-200">
            Recipient Address
          </Label>
          <Input
            id="private-to"
            placeholder="oct..."
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
            className="bg-slate-800 border-slate-700 text-white font-mono"
            disabled={encryptedBalance <= 0}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="private-amount" className="text-slate-200">
            Amount (OCT)
          </Label>
          <Input
            id="private-amount"
            type="number"
            step="0.000001"
            placeholder="0.000000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-slate-800 border-slate-700 text-white"
            disabled={encryptedBalance <= 0}
          />
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-sm text-green-500">{success}</p>
          </div>
        )}

        <Button
          onClick={handleSend}
          disabled={isLoading || encryptedBalance <= 0}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Shield className="w-4 h-4 mr-2" />
              Send Private Transfer
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
