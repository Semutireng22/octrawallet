"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { encryptBalance } from "@/lib/api"
import { Loader2, Lock } from "lucide-react"

interface EncryptBalanceProps {
  publicBalance: number
  encryptedBalance: number
  onSuccess: () => void
}

export function EncryptBalance({ publicBalance, encryptedBalance, onSuccess }: EncryptBalanceProps) {
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const maxEncrypt = Math.max(0, publicBalance - 1)

  const handleEncrypt = async () => {
    setError("")
    setSuccess("")

    const amountNum = Number.parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Invalid amount")
      return
    }

    if (amountNum > maxEncrypt) {
      setError(`Maximum encryptable: ${maxEncrypt.toFixed(6)} OCT (need 1 OCT for fees)`)
      return
    }

    setIsLoading(true)
    try {
      const result = await encryptBalance(amountNum)
      setSuccess(`Balance encrypted! Processing in next epoch.`)
      setAmount("")
      onSuccess()
    } catch (err: any) {
      setError(err.message || "Failed to encrypt balance")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-white">Encrypt Balance</h3>
      <p className="text-sm text-slate-400">Convert public balance to encrypted (private) balance</p>

      <div className="grid grid-cols-2 gap-4 p-4 bg-slate-800/50 rounded-lg">
        <div>
          <p className="text-xs text-slate-400 mb-1">Public Balance</p>
          <p className="text-lg font-semibold text-white">{publicBalance.toFixed(6)} OCT</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-1">Encrypted Balance</p>
          <p className="text-lg font-semibold text-yellow-500">{encryptedBalance.toFixed(6)} OCT</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="encrypt-amount" className="text-slate-200">
            Amount to Encrypt
          </Label>
          <Input
            id="encrypt-amount"
            type="number"
            step="0.000001"
            placeholder="0.000000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-slate-800 border-slate-700 text-white"
          />
          <p className="text-xs text-slate-500">Max: {maxEncrypt.toFixed(6)} OCT</p>
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
          onClick={handleEncrypt}
          disabled={isLoading || maxEncrypt <= 0}
          className="w-full bg-yellow-600 hover:bg-yellow-700"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Encrypting...
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 mr-2" />
              Encrypt Balance
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
