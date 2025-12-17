"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { sendTransaction } from "@/lib/api"
import { Loader2, Send } from "lucide-react"

interface SendTransactionProps {
  onSuccess: () => void
}

export function SendTransaction({ onSuccess }: SendTransactionProps) {
  const [toAddress, setToAddress] = useState("")
  const [amount, setAmount] = useState("")
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleSend = async () => {
    setError("")
    setSuccess("")

    if (!toAddress || !amount) {
      setError("Please fill in all required fields")
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

    setIsLoading(true)
    try {
      const result = await sendTransaction(toAddress, amountNum, message || undefined)
      setSuccess(`Transaction sent! Hash: ${result.txHash}`)
      setToAddress("")
      setAmount("")
      setMessage("")
      onSuccess()
    } catch (err: any) {
      setError(err.message || "Failed to send transaction")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-white">Send Transaction</h3>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="to" className="text-slate-200">
            To Address
          </Label>
          <Input
            id="to"
            placeholder="oct..."
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
            className="bg-slate-800 border-slate-700 text-white font-mono"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount" className="text-slate-200">
            Amount (OCT)
          </Label>
          <Input
            id="amount"
            type="number"
            step="0.000001"
            placeholder="0.000000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-slate-800 border-slate-700 text-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="message" className="text-slate-200">
            Message (Optional)
          </Label>
          <Textarea
            id="message"
            placeholder="Add a message to your transaction..."
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 1024))}
            className="bg-slate-800 border-slate-700 text-white resize-none"
            rows={3}
          />
          <p className="text-xs text-slate-500">{message.length}/1024 characters</p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-sm text-green-500 break-all">{success}</p>
          </div>
        )}

        <Button onClick={handleSend} disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700">
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Send Transaction
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
