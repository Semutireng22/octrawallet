import { Card } from "@/components/ui/card"
import { Wallet, Hash, Lock } from "lucide-react"

interface WalletInfoProps {
  address: string
  balance: number | null
  nonce: number | null
  encryptedBalance: number
  pendingCount: number
}

export function WalletInfo({ address, balance, nonce, encryptedBalance, pendingCount }: WalletInfoProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-slate-900/80 backdrop-blur border-slate-700 p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-slate-400 text-sm mb-1">Address</p>
            <p className="text-white font-mono text-xs">{address.slice(0, 12)}...</p>
            <p className="text-white font-mono text-xs">{address.slice(-12)}</p>
          </div>
          <Wallet className="w-8 h-8 text-blue-500" />
        </div>
      </Card>

      <Card className="bg-slate-900/80 backdrop-blur border-slate-700 p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-slate-400 text-sm mb-1">Public Balance</p>
            <p className="text-2xl font-bold text-green-500">{balance !== null ? `${balance.toFixed(6)}` : "---"}</p>
            <p className="text-slate-500 text-xs mt-1">OCT</p>
          </div>
          <Wallet className="w-8 h-8 text-green-500" />
        </div>
      </Card>

      <Card className="bg-slate-900/80 backdrop-blur border-slate-700 p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-slate-400 text-sm mb-1">Encrypted Balance</p>
            <p className="text-2xl font-bold text-yellow-500">{encryptedBalance.toFixed(6)}</p>
            <p className="text-slate-500 text-xs mt-1">OCT</p>
          </div>
          <Lock className="w-8 h-8 text-yellow-500" />
        </div>
      </Card>

      <Card className="bg-slate-900/80 backdrop-blur border-slate-700 p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-slate-400 text-sm mb-1">Nonce</p>
            <p className="text-2xl font-bold text-blue-500">{nonce !== null ? nonce : "---"}</p>
            {pendingCount > 0 && <p className="text-yellow-500 text-xs mt-1">{pendingCount} pending</p>}
          </div>
          <Hash className="w-8 h-8 text-blue-500" />
        </div>
      </Card>
    </div>
  )
}
