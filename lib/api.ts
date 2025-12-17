import { getWalletData } from "./wallet"

const MICRO = 1_000_000

async function fetchAPI(endpoint: string, options: RequestInit = {}, customHeaders?: Record<string, string>) {
  const wallet = getWalletData()
  if (!wallet) throw new Error("Wallet not connected")

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    // Add custom headers like X-Private-Key
    if (customHeaders) {
      Object.assign(headers, customHeaders)
    }

    const response = await fetch("/api/proxy", {
      method: "POST",
      headers,
      body: JSON.stringify({
        endpoint,
        method: options.method || "GET",
        data: options.body ? JSON.parse(options.body as string) : undefined,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const result = await response.json()

    if (!result.ok) {
      const errorMsg = result.data?.error || result.raw || `HTTP ${result.status}`
      throw new Error(errorMsg)
    }

    return result.data || {}
  } catch (error) {
    console.error("[v0] fetchAPI error:", error)
    throw error
  }
}

export async function fetchBalance(address: string) {
  try {
    console.log("[v0] Fetching balance for:", address)
    const data = await fetchAPI(`/balance/${address}`)

    const balance = Number.parseFloat(data.balance || "0")
    const nonce = Number.parseInt(data.nonce || "0")

    let encryptedBalance = 0
    try {
      const wallet = getWalletData()
      const encData = await fetchAPI(
        `/view_encrypted_balance/${address}`,
        { method: "GET" },
        { "X-Private-Key": wallet?.privateKey || "" },
      )

      if (encData.encrypted_balance) {
        encryptedBalance = Number.parseFloat(encData.encrypted_balance.split(" ")[0] || "0")
      }
    } catch (error) {
      console.log("[v0] Failed to fetch encrypted balance:", error)
    }

    // Get staging info
    let stagingCount = 0
    try {
      const staging = await fetchAPI("/staging")
      const stagedTxs = staging.staged_transactions || []
      stagingCount = stagedTxs.filter((tx: any) => tx.from === address).length
    } catch (error) {
      console.log("[v0] Failed to fetch staging info:", error)
    }

    console.log("[v0] Balance data:", { balance, nonce, encryptedBalance, stagingCount })
    return {
      balance,
      nonce,
      encryptedBalance,
      stagingCount,
    }
  } catch (error) {
    console.error("[v0] Failed to fetch balance:", error)
    return {
      balance: 0,
      nonce: 0,
      encryptedBalance: 0,
      stagingCount: 0,
    }
  }
}

export async function fetchTransactionHistory(address: string) {
  try {
    console.log("[v0] Fetching transaction history for:", address)
    const data = await fetchAPI(`/address/${address}?limit=20`)
    const txRefs = data.recent_transactions || []

    const transactions = await Promise.all(
      txRefs.map(async (ref: any) => {
        try {
          const txData = await fetchAPI(`/tx/${ref.hash}`)
          const parsed = txData.parsed_tx
          const isIncoming = parsed.to === address

          let amount = 0
          const amountRaw = parsed.amount_raw || parsed.amount || "0"
          if (typeof amountRaw === "string" && amountRaw.includes(".")) {
            amount = Number.parseFloat(amountRaw)
          } else {
            amount = Number.parseInt(amountRaw) / MICRO
          }

          let message = null
          if (txData.data) {
            try {
              const dataObj = JSON.parse(txData.data)
              message = dataObj.message
            } catch {}
          }

          return {
            time: new Date(parsed.timestamp * 1000).toLocaleTimeString(),
            hash: ref.hash,
            amt: amount,
            to: isIncoming ? parsed.from : parsed.to,
            type: isIncoming ? "in" : "out",
            epoch: ref.epoch,
            msg: message,
          }
        } catch (error) {
          console.log("[v0] Failed to parse transaction:", error)
          return null
        }
      }),
    )

    return transactions.filter(Boolean)
  } catch (error) {
    console.error("[v0] Failed to fetch transaction history:", error)
    return []
  }
}

export async function sendTransaction(toAddress: string, amount: number, message?: string) {
  const wallet = getWalletData()
  if (!wallet) throw new Error("Wallet not connected")

  const balanceData = await fetchBalance(wallet.address)
  if (balanceData.balance < amount) {
    throw new Error(`Insufficient balance (${balanceData.balance} < ${amount})`)
  }

  const tx: any = {
    from: wallet.address,
    to_: toAddress,
    amount: String(Math.floor(amount * MICRO)),
    nonce: balanceData.nonce + 1,
    ou: amount < 1000 ? "1" : "3",
    timestamp: Date.now() / 1000,
  }

  if (message) {
    tx.message = message
  }

  // Create signature (simplified - in production use proper crypto library)
  const txForSig = JSON.stringify(
    {
      from: tx.from,
      to_: tx.to_,
      amount: tx.amount,
      nonce: tx.nonce,
      ou: tx.ou,
      timestamp: tx.timestamp,
    },
    Object.keys(tx).sort(),
  )

  // Note: This is a mock signature. In production, implement proper Ed25519 signing
  tx.signature = "MOCK_SIGNATURE_" + Date.now()
  tx.public_key = "MOCK_PUBLIC_KEY"

  const result = await fetchAPI("/send-tx", {
    method: "POST",
    body: JSON.stringify(tx),
  })

  return {
    success: true,
    txHash: result.tx_hash || "unknown",
  }
}

export async function sendMultipleTransactions(recipients: { address: string; amount: number }[]) {
  let success = 0
  let failed = 0

  for (const recipient of recipients) {
    try {
      await sendTransaction(recipient.address, recipient.amount)
      success++
    } catch {
      failed++
    }
  }

  return { success, failed }
}

export async function encryptBalance(amount: number) {
  const wallet = getWalletData()
  if (!wallet) throw new Error("Wallet not connected")

  const data = {
    address: wallet.address,
    amount: String(Math.floor(amount * MICRO)),
    private_key: wallet.privateKey,
    encrypted_data: "v2|MOCK_ENCRYPTED_DATA",
  }

  const result = await fetchAPI("/encrypt_balance", {
    method: "POST",
    body: JSON.stringify(data),
  })

  return result
}

export async function decryptBalance(amount: number) {
  const wallet = getWalletData()
  if (!wallet) throw new Error("Wallet not connected")

  const data = {
    address: wallet.address,
    amount: String(Math.floor(amount * MICRO)),
    private_key: wallet.privateKey,
    encrypted_data: "v2|MOCK_ENCRYPTED_DATA",
  }

  const result = await fetchAPI("/decrypt_balance", {
    method: "POST",
    body: JSON.stringify(data),
  })

  return result
}

export async function createPrivateTransfer(toAddress: string, amount: number) {
  const wallet = getWalletData()
  if (!wallet) throw new Error("Wallet not connected")

  // Get recipient public key
  const pubKeyData = await fetchAPI(`/public_key/${toAddress}`)
  const toPublicKey = pubKeyData.public_key

  if (!toPublicKey) {
    throw new Error("Recipient has no public key")
  }

  const data = {
    from: wallet.address,
    to: toAddress,
    amount: String(Math.floor(amount * MICRO)),
    from_private_key: wallet.privateKey,
    to_public_key: toPublicKey,
  }

  const result = await fetchAPI("/private_transfer", {
    method: "POST",
    body: JSON.stringify(data),
  })

  return result
}

export async function getPendingTransfers() {
  const wallet = getWalletData()
  if (!wallet) throw new Error("Wallet not connected")

  const result = await fetchAPI(
    `/pending_private_transfers?address=${wallet.address}`,
    { method: "GET" },
    { "X-Private-Key": wallet.privateKey },
  )

  return result.pending_transfers || []
}

export async function claimPrivateTransfer(transferId: string) {
  const wallet = getWalletData()
  if (!wallet) throw new Error("Wallet not connected")

  const data = {
    recipient_address: wallet.address,
    private_key: wallet.privateKey,
    transfer_id: transferId,
  }

  const result = await fetchAPI("/claim_private_transfer", {
    method: "POST",
    body: JSON.stringify(data),
  })

  return result
}
