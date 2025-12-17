"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { sendMultipleTransactions } from "@/lib/api"
import { Loader2, Send, Plus, X } from "lucide-react"

interface Recipient {
  address: string
  amount: string
}

interface MultiSendProps {
  onSuccess: () => void
}

export function MultiSend({ onSuccess }: MultiSendProps) {
  const [recipients, setRecipients] = useState<Recipient[]>([{ address: "", amount: "" }])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const addRecipient = () => {
    setRecipients([...recipients, { address: "", amount: "" }])
  }

  const removeRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index))
  }

  const updateRecipient = (index: number, field: "address" | "amount", value: string) => {
    const updated = [...recipients]
    updated[index][field] = value
    setRecipients(updated)
  }

  const getTotalAmount = () => {
    return recipients.reduce((sum, r) => {
      const amt = Number.parseFloat(r.amount)
      return sum + (isNaN(amt) ? 0 : amt)
    }, 0)
  }

  const handleSend = async () => {
    setError("")
    setSuccess("")

    const validRecipients = recipients.filter((r) => r.address && r.amount)
    if (validRecipients.length === 0) {
      setError("Please add at least one recipient")
      return
    }

    const addressRegex = /^oct[1-9A-HJ-NP-Za-km-z]{44}$/
    for (const r of validRecipients) {
      if (!addressRegex.test(r.address)) {
        setError(`Invalid address: ${r.address}`)
        return
      }
      const amt = Number.parseFloat(r.amount)
      if (isNaN(amt) || amt <= 0) {
        setError(`Invalid amount for ${r.address}`)
        return
      }
    }

    setIsLoading(true)
    try {
      const result = await sendMultipleTransactions(
        validRecipients.map((r) => ({
          address: r.address,
          amount: Number.parseFloat(r.amount),
        })),
      )
      setSuccess(`Sent to ${result.success} addresses! ${result.failed > 0 ? `${result.failed} failed.` : ""}`)
      setRecipients([{ address: "", amount: "" }])
      onSuccess()
    } catch (err: any) {
      setError(err.message || "Failed to send transactions")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Multi Send</h3>
        <Button variant="outline" size="sm" onClick={addRecipient} className="bg-slate-800 border-slate-700 text-white">
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {recipients.map((recipient, index) => (
          <div key={index} className="flex gap-2 items-end">
            <div className="flex-1 space-y-2">
              <Label className="text-slate-200 text-xs">Address</Label>
              <Input
                placeholder="oct..."
                value={recipient.address}
                onChange={(e) => updateRecipient(index, "address", e.target.value)}
                className="bg-slate-800 border-slate-700 text-white font-mono text-sm"
              />
            </div>
            <div className="w-32 space-y-2">
              <Label className="text-slate-200 text-xs">Amount</Label>
              <Input
                type="number"
                step="0.000001"
                placeholder="0.0"
                value={recipient.amount}
                onChange={(e) => updateRecipient(index, "amount", e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            {recipients.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeRecipient(index)}
                className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <div className="p-4 bg-slate-800/50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-slate-400">Total Amount:</span>
          <span className="text-xl font-bold text-white">{getTotalAmount().toFixed(6)} OCT</span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-slate-400 text-sm">Recipients:</span>
          <span className="text-slate-300">{recipients.filter((r) => r.address && r.amount).length}</span>
        </div>
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

      <Button onClick={handleSend} disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700">
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            Send to All
          </>
        )}
      </Button>
    </div>
  )
}
