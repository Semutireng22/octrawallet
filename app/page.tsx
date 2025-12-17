"use client"

import { useEffect, useState } from "react"
import { WalletConnect } from "@/components/wallet-connect"
import { Dashboard } from "@/components/dashboard"

export default function Home() {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const wallet = localStorage.getItem("octra_wallet")
    setIsConnected(!!wallet)
    setIsLoading(false)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      {!isConnected ? (
        <WalletConnect onConnect={() => setIsConnected(true)} />
      ) : (
        <Dashboard onDisconnect={() => setIsConnected(false)} />
      )}
    </div>
  )
}
