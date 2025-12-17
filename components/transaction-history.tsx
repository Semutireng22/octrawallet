import { Card } from "@/components/ui/card"
import { ArrowDownLeft, ArrowUpRight, Clock, CheckCircle2 } from "lucide-react"

interface Transaction {
  time: string
  hash: string
  amt: number
  to: string
  type: "in" | "out"
  epoch?: number
  msg?: string
}

interface TransactionHistoryProps {
  transactions: Transaction[]
}

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
  return (
    <Card className="bg-slate-900/80 backdrop-blur border-slate-700 p-6">
      <h3 className="text-xl font-bold text-white mb-4">Recent Transactions</h3>

      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p>No transactions yet</p>
          </div>
        ) : (
          transactions.map((tx, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <div className={`p-2 rounded-full ${tx.type === "in" ? "bg-green-500/10" : "bg-red-500/10"}`}>
                {tx.type === "in" ? (
                  <ArrowDownLeft className="w-4 h-4 text-green-500" />
                ) : (
                  <ArrowUpRight className="w-4 h-4 text-red-500" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-semibold ${tx.type === "in" ? "text-green-500" : "text-red-500"}`}>
                    {tx.type === "in" ? "+" : "-"}
                    {tx.amt.toFixed(6)} OCT
                  </span>
                  <span className="text-xs text-slate-500">{tx.time}</span>
                </div>

                <p className="text-xs text-slate-400 truncate font-mono">{tx.to}</p>

                <div className="flex items-center gap-2 mt-1">
                  {tx.epoch ? (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Epoch {tx.epoch}
                    </span>
                  ) : (
                    <span className="text-xs text-yellow-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Pending
                    </span>
                  )}

                  {tx.msg && <span className="text-xs text-blue-400">📝 Has message</span>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
