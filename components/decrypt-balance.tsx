"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { decryptBalance } from "@/lib/api"
import { Loader2, Unlock } from "lucide-react"

interface DecryptBalanceProps {
  encryptedBalance: number
  onSuccess: () => void
}

export function DecryptBalance({ encryptedBalance, onSuccess }: DecryptBalanceProps) {
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleDecrypt = async () => {
    setError("")
    setSuccess("")

    const amountNum = Number.parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Invalid amount")
      return
    }

    if (amountNum > encryptedBalance) {
      setError(`Maximum decryptable: ${encryptedBalance.toFixed(6)} OCT`)
      return
    }

    setIsLoading(true)
    try {
      const result = await decryptBalance(amountNum)
      setSuccess(`Balance decrypted! Processing in next epoch.`)
      setAmount("")
      onSuccess()
    } catch (err: any) {
      setError(err.message || "Failed to decrypt balance")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-white">Decrypt Balance</h3>
      <p className="text-sm text-slate-400">Convert encrypted (private) balance back to public balance</p>

      <div className="p-4 bg-slate-800/50 rounded-lg">
        <p className="text-xs text-slate-400 mb-1">Encrypted Balance</p>
        <p className="text-2xl font-semibold text-yellow-500">{encryptedBalance.toFixed(6)} OCT</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="decrypt-amount" className="text-slate-200">
            Amount to Decrypt
          </Label>
          <Input
            id="decrypt-amount"
            type="number"
            step="0.000001"
            placeholder="0.000000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-slate-800 border-slate-700 text-white"
          />
          <p className="text-xs text-slate-500">Max: {encryptedBalance.toFixed(6)} OCT</p>
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
          onClick={handleDecrypt}
          disabled={isLoading || encryptedBalance <= 0}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Decrypting...
            </>
          ) : (
            <>
              <Unlock className="w-4 h-4 mr-2" />
              Decrypt Balance
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
