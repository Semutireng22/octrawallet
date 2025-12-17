"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WalletInfo } from "./wallet-info"
import { TransactionHistory } from "./transaction-history"
import { SendTransaction } from "./send-transaction"
import { MultiSend } from "./multi-send"
import { EncryptBalance } from "./encrypt-balance"
import { DecryptBalance } from "./decrypt-balance"
import { PrivateTransfer } from "./private-transfer"
import { ClaimTransfers } from "./claim-transfers"
import { LogOut, RefreshCw, AlertCircle } from "lucide-react"
import { getWalletData } from "@/lib/wallet"
import { fetchBalance, fetchTransactionHistory } from "@/lib/api"

interface DashboardProps {
  onDisconnect: () => void
}

export function Dashboard({ onDisconnect }: DashboardProps) {
  const [balance, setBalance] = useState<number | null>(null)
  const [nonce, setNonce] = useState<number | null>(null)
  const [encryptedBalance, setEncryptedBalance] = useState<number>(0)
  const [transactions, setTransactions] = useState<any[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wallet = getWalletData()

  const refreshData = async () => {
    if (!wallet) return

    setIsRefreshing(true)
    setError(null)
    try {
      console.log("[v0] Starting data refresh...")
      const balanceData = await fetchBalance(wallet.address)
      console.log("[v0] Balance data received:", balanceData)

      setBalance(balanceData.balance)
      setNonce(balanceData.nonce)
      setEncryptedBalance(balanceData.encryptedBalance || 0)
      setPendingCount(balanceData.stagingCount || 0)

      const txHistory = await fetchTransactionHistory(wallet.address)
      setTransactions(txHistory)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to refresh data"
      console.error("[v0] Refresh error:", errorMsg)
      setError(errorMsg)
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    refreshData()
    const interval = setInterval(refreshData, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  const handleDisconnect = () => {
    localStorage.removeItem("octra_wallet")
    onDisconnect()
  }

  if (!wallet) {
    handleDisconnect()
    return null
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Octra Wallet</h1>
            <p className="text-slate-400 text-sm">Private transactions enabled</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={refreshData}
              disabled={isRefreshing}
              className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
            <Button
              variant="outline"
              onClick={handleDisconnect}
              className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Disconnect
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-950/50 border border-red-700 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 text-sm font-medium">Connection Error</p>
              <p className="text-red-300 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Wallet Info */}
        <WalletInfo
          address={wallet.address}
          balance={balance}
          nonce={nonce}
          encryptedBalance={encryptedBalance}
          pendingCount={pendingCount}
        />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2">
            <Card className="bg-slate-900/80 backdrop-blur border-slate-700">
              <Tabs defaultValue="send" className="w-full">
                <TabsList className="w-full grid grid-cols-4 lg:grid-cols-8 bg-slate-800 border-b border-slate-700">
                  <TabsTrigger value="send">Send</TabsTrigger>
                  <TabsTrigger value="multi">Multi</TabsTrigger>
                  <TabsTrigger value="encrypt">Encrypt</TabsTrigger>
                  <TabsTrigger value="decrypt">Decrypt</TabsTrigger>
                  <TabsTrigger value="private">Private</TabsTrigger>
                  <TabsTrigger value="claim">Claim</TabsTrigger>
                </TabsList>

                <TabsContent value="send" className="p-6">
                  <SendTransaction onSuccess={refreshData} />
                </TabsContent>

                <TabsContent value="multi" className="p-6">
                  <MultiSend onSuccess={refreshData} />
                </TabsContent>

                <TabsContent value="encrypt" className="p-6">
                  <EncryptBalance
                    publicBalance={balance || 0}
                    encryptedBalance={encryptedBalance}
                    onSuccess={refreshData}
                  />
                </TabsContent>

                <TabsContent value="decrypt" className="p-6">
                  <DecryptBalance encryptedBalance={encryptedBalance} onSuccess={refreshData} />
                </TabsContent>

                <TabsContent value="private" className="p-6">
                  <PrivateTransfer encryptedBalance={encryptedBalance} onSuccess={refreshData} />
                </TabsContent>

                <TabsContent value="claim" className="p-6">
                  <ClaimTransfers onSuccess={refreshData} />
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <TransactionHistory transactions={transactions} />
          </div>
        </div>
      </div>
    </div>
  )
}
