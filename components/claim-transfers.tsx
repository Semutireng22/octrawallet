"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { getPendingTransfers, claimPrivateTransfer } from "@/lib/api"
import { Loader2, Gift } from "lucide-react"

interface ClaimTransfersProps {
  onSuccess: () => void
}

export function ClaimTransfers({ onSuccess }: ClaimTransfersProps) {
  const [transfers, setTransfers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const loadTransfers = async () => {
    setIsLoading(true)
    setError("")
    try {
      const data = await getPendingTransfers()
      setTransfers(data)
    } catch (err: any) {
      setError(err.message || "Failed to load pending transfers")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTransfers()
  }, [])

  const handleClaim = async (transferId: string) => {
    setIsClaiming(true)
    setError("")
    setSuccess("")
    try {
      await claimPrivateTransfer(transferId)
      setSuccess(`Transfer claimed successfully!`)
      await loadTransfers()
      onSuccess()
    } catch (err: any) {
      setError(err.message || "Failed to claim transfer")
    } finally {
      setIsClaiming(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Claim Transfers</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={loadTransfers}
          disabled={isLoading}
          className="bg-slate-800 border-slate-700 text-white"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
        </Button>
      </div>

      <p className="text-sm text-slate-400">Claim private transfers sent to you</p>

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

      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
          </div>
        ) : transfers.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Gift className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No pending transfers</p>
          </div>
        ) : (
          transfers.map((transfer, idx) => (
            <div key={idx} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs text-slate-400 mb-1">From</p>
                  <p className="text-sm font-mono text-white">{transfer.sender}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 mb-1">Amount</p>
                  <p className="text-lg font-bold text-green-500">
                    {transfer.amount ? `${transfer.amount} OCT` : "[encrypted]"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                <span>Epoch: {transfer.epoch_id || "?"}</span>
                <span>ID: #{transfer.id}</span>
              </div>

              <Button
                onClick={() => handleClaim(transfer.id)}
                disabled={isClaiming}
                className="w-full bg-green-600 hover:bg-green-700"
                size="sm"
              >
                {isClaiming ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Claiming...
                  </>
                ) : (
                  <>
                    <Gift className="w-4 h-4 mr-2" />
                    Claim Transfer
                  </>
                )}
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
