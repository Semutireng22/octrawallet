export interface WalletData {
  privateKey: string
  address: string
  rpc: string
}

export function getWalletData(): WalletData | null {
  if (typeof window === "undefined") return null

  const data = localStorage.getItem("octra_wallet")
  if (!data) return null

  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}

export function clearWallet() {
  if (typeof window === "undefined") return
  localStorage.removeItem("octra_wallet")
}
