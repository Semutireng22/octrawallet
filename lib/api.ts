import { useWalletStore } from "@/store/wallet-store";
import nacl from "tweetnacl";
import {
  deriveEncryptionKey,
  deriveSharedSecret,
  encryptAESGCM,
  decryptAESGCM,
  createOctraAddress,
} from "./utils/crypto";

// --- Configuration ---
const RPC_URL = "/api/octra";
const EXPLORER_URL = "https://octrascan.io";
const MU = 1_000_000; // Multiplier for OCT (6 decimals)

export interface Transaction {
  hash: string;
  type: "send" | "receive";
  amount: number;
  timestamp: string;
  from: string;
  to: string;
  status: "success" | "pending" | "failed";
}

// Helper to encode Uint8Array to Base64
function encodeBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  const binary = String.fromCharCode(...bytes);
  return window.btoa(binary);
}

// Decode Base64
function decodeBase64(str: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(str, "base64"));
  }
  const binaryString = window.atob(str);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export const OctraApi = {
  fetchBalance: async (
    address: string
  ): Promise<{
    balance: number;
    nonce: number;
    encryptedBalance?: number;
    stagingCount?: number;
  }> => {
    try {
      // Parallel fetch for best performance
      const [publicRes, stagingRes] = await Promise.all([
        fetch(`${RPC_URL}/balance/${address}`),
        fetch(`${RPC_URL}/staging`),
      ]);

      let balance = 0;
      let nonce = 0;

      if (publicRes.ok) {
        const data = await publicRes.json();
        balance = parseFloat(data.balance || "0");
        nonce = parseInt(data.nonce || "0");
      }

      let stagingCount = 0;
      if (stagingRes.ok) {
        // If we want to account for staged nonces
        const stagingData = await stagingRes.json();
        // Basic logic to count pending txs for this address if needed
        // logic from cli.py: max(cn, max(int(tx.nonce) for tx in our))
      }

      return { balance, nonce, stagingCount };
    } catch (error) {
      console.warn("Fetch balance failed:", error);
      return { balance: 0, nonce: 0 };
    }
  },

  // NEW: Fetch Encrypted Balance Data (Requires Private Key Header per protocol)
  fetchEncryptedBalance: async (address: string, privateKey: string) => {
    try {
      const response = await fetch(
        `${RPC_URL}/view_encrypted_balance/${address}`,
        {
          headers: {
            "X-Private-Key": privateKey,
          },
        }
      );
      if (!response.ok) return null;
      const data = await response.json();
      return {
        encrypted: parseFloat(data.encrypted_balance?.split(" ")[0] || "0"),
        encryptedRaw: parseInt(data.encrypted_balance_raw || "0"),
        // The API returns encrypted blob too? No, cli.py just uses raw for math.
        // Wait, cli.py uses raw for math, but doesn't seem to DECRYPT it from server?
        // Ah, /view_encrypted_balance returns the DECRYPTED value because we sent X-Private-Key!
        // The server decrypts it for us if we send the key?
        // Checked cli.py: `req_private` sends key. `get_encrypted_balance` calls it.
        // Logic: `return { "encrypted": ..., "encrypted_raw": ... }` from result.
        // So yes, server returns the VIEWABLE balance.
      };
    } catch (e) {
      console.warn(e);
      return null;
    }
  },

  fetchTransactions: async (address: string): Promise<Transaction[]> => {
    try {
      const response = await fetch(`${RPC_URL}/address/${address}?limit=20`);
      if (!response.ok) return [];

      const data = await response.json();
      const recentTxs = data.recent_transactions || [];

      const txPromises = recentTxs.map(async (ref: any) => {
        try {
          const txRes = await fetch(`${RPC_URL}/tx/${ref.hash}`);
          if (!txRes.ok) return null;
          const txData = await txRes.json();
          const p = txData.parsed_tx;
          if (!p) return null;

          const isReceive = p.to === address;
          const rawAmt = p.amount_raw || p.amount || "0";
          const amt = parseFloat(rawAmt) / (rawAmt.includes(".") ? 1 : MU);

          return {
            hash: ref.hash,
            type: isReceive ? "receive" : "send",
            amount: amt,
            timestamp: new Date(p.timestamp * 1000).toISOString(),
            from: p.from,
            to: p.to,
            status: "success",
          } as Transaction;
        } catch (e) {
          return null;
        }
      });

      const results = await Promise.all(txPromises);
      return results.filter((tx): tx is Transaction => tx !== null);
    } catch (error) {
      return [];
    }
  },

  sendTransaction: async (toAddress: string, amount: number) => {
    const { activeKeys } = useWalletStore.getState();
    if (!activeKeys) throw new Error("Locked");

    const { nonce } = await OctraApi.fetchBalance(activeKeys.address);
    const nextNonce = nonce + 1;
    const amountRaw = Math.floor(amount * MU).toString();

    const signableObject = {
      from: activeKeys.address,
      to_: toAddress,
      amount: amountRaw,
      nonce: nextNonce,
      ou: "1000",
      timestamp: Date.now() / 1000,
    };

    const message = JSON.stringify(signableObject);
    const signature = nacl.sign.detached(
      new TextEncoder().encode(message),
      activeKeys.privateKey
    );

    const finalBody = {
      ...signableObject,
      signature: encodeBase64(signature),
      public_key: encodeBase64(activeKeys.publicKey),
    };

    const response = await fetch(`${RPC_URL}/send-tx`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(finalBody),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Failed");

    return { success: true, txHash: result.tx_hash || result.hash || "ok" };
  },

  // --- PRIVATE FEATURES IMPLEMENTATION ---

  encryptBalance: async (amount: number) => {
    const { activeKeys } = useWalletStore.getState();
    if (!activeKeys) throw new Error("Locked");

    // 1. Get current encrypted balance raw (we need this to maintain state?)
    // cli.py: gets enc_raw, adds amount * MU, then encrypts NEW total.
    // NOTE: This assumes we can fetch the current raw balance from server.

    const privKeyB64 = encodeBase64(activeKeys.privateKey);
    const encInfo = await OctraApi.fetchEncryptedBalance(
      activeKeys.address,
      privKeyB64
    );

    if (!encInfo)
      throw new Error("Could not fetch current encrypted balance state");

    const currentRaw = encInfo.encryptedRaw;
    const addRaw = Math.floor(amount * MU);
    const newTotalRaw = currentRaw + addRaw;

    // 2. Encrypt locally
    const encryptionKey = await deriveEncryptionKey(activeKeys.privateKey);
    const { nonce, ciphertext } = await encryptAESGCM(
      encryptionKey,
      newTotalRaw.toString()
    );

    // Format: v2|base64(nonce + ciphertext)
    const combined = new Uint8Array(nonce.length + ciphertext.length);
    combined.set(nonce);
    combined.set(ciphertext, nonce.length);
    const b64Blob = encodeBase64(combined);
    const encryptedValue = `v2|${b64Blob}`;

    // 3. Send
    const payload = {
      address: activeKeys.address,
      amount: addRaw.toString(),
      private_key: privKeyB64, // Protocol requires sending priv key?? (cli.py line 340)
      encrypted_data: encryptedValue,
    };

    const res = await fetch(`${RPC_URL}/encrypt_balance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const j = await res.json();
    if (!res.ok) throw new Error(j.error || "Failed to encrypt");
    return j;
  },

  decryptBalance: async (amount: number) => {
    const { activeKeys } = useWalletStore.getState();
    if (!activeKeys) throw new Error("Locked");

    const privKeyB64 = encodeBase64(activeKeys.privateKey);
    const encInfo = await OctraApi.fetchEncryptedBalance(
      activeKeys.address,
      privKeyB64
    );
    if (!encInfo)
      throw new Error("Could not fetch current encrypted balance state");

    const currentRaw = encInfo.encryptedRaw;
    const subRaw = Math.floor(amount * MU);

    if (currentRaw < subRaw) throw new Error("Insufficient encrypted balance");

    const newTotalRaw = currentRaw - subRaw;

    const encryptionKey = await deriveEncryptionKey(activeKeys.privateKey);
    const { nonce, ciphertext } = await encryptAESGCM(
      encryptionKey,
      newTotalRaw.toString()
    );

    const combined = new Uint8Array(nonce.length + ciphertext.length);
    combined.set(nonce);
    combined.set(ciphertext, nonce.length);
    const b64Blob = encodeBase64(combined);
    const encryptedValue = `v2|${b64Blob}`;

    const payload = {
      address: activeKeys.address,
      amount: subRaw.toString(),
      private_key: privKeyB64,
      encrypted_data: encryptedValue,
    };

    const res = await fetch(`${RPC_URL}/decrypt_balance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const j = await res.json();
    if (!res.ok) throw new Error(j.error || "Failed to decrypt");
    return j;
  },

  createPrivateTransfer: async (toAddr: string, amount: number) => {
    const { activeKeys } = useWalletStore.getState();
    if (!activeKeys) throw new Error("Locked");

    // 1. Get recipient public key
    const pubRes = await fetch(`${RPC_URL}/public_key/${toAddr}`);
    if (!pubRes.ok) throw new Error("Recipient public key not found");
    const pubJson = await pubRes.json();
    const remotePubB64 = pubJson.public_key;
    if (!remotePubB64) throw new Error("Recipient has no public key");

    const remotePubBytes = decodeBase64(remotePubB64);

    const payload = {
      from: activeKeys.address,
      to: toAddr,
      amount: Math.floor(amount * MU).toString(),
      from_private_key: encodeBase64(
        activeKeys.privateKey.length === 64
          ? activeKeys.privateKey.slice(0, 32)
          : activeKeys.privateKey
      ),
      to_public_key: remotePubB64,
    };

    const res = await fetch(`${RPC_URL}/private_transfer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const j = await res.json();
    if (!res.ok) throw new Error(j.error || "Private transfer failed");
    return j;
  },

  getPendingTransfers: async () => {
    const { activeKeys } = useWalletStore.getState();
    if (!activeKeys) return [];

    try {
      const privKeyBytes =
        activeKeys.privateKey.length === 64
          ? activeKeys.privateKey.slice(0, 32)
          : activeKeys.privateKey;
      const privKeyB64 = encodeBase64(privKeyBytes);
      const res = await fetch(
        `${RPC_URL}/pending_private_transfers?address=${activeKeys.address}`,
        {
          headers: { "X-Private-Key": privKeyB64 },
        }
      );
      if (!res.ok) return [];
      const j = await res.json();
      return j.pending_transfers || [];
    } catch {
      return [];
    }
  },

  claimPrivateTransfer: async (transferId: string) => {
    const { activeKeys } = useWalletStore.getState();
    if (!activeKeys) throw new Error("Locked");

    const payload = {
      recipient_address: activeKeys.address,
      private_key: encodeBase64(
        activeKeys.privateKey.length === 64
          ? activeKeys.privateKey.slice(0, 32)
          : activeKeys.privateKey
      ),
      transfer_id: transferId,
    };

    const res = await fetch(`${RPC_URL}/claim_private_transfer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const j = await res.json();
    if (!res.ok) throw new Error(j.error || "Claim failed");
    return j;
  },
};

// Aliases
export const fetchBalance = OctraApi.fetchBalance;
export const fetchTransactionHistory = OctraApi.fetchTransactions;
export const sendTransaction = OctraApi.sendTransaction;
export const encryptBalance = OctraApi.encryptBalance;
export const decryptBalance = OctraApi.decryptBalance;
export const createPrivateTransfer = OctraApi.createPrivateTransfer;
export const getPendingTransfers = OctraApi.getPendingTransfers;
export const claimPrivateTransfer = OctraApi.claimPrivateTransfer;
export const sendMultipleTransactions = async (
  recipients: { address: string; amount: number }[]
) => {
  // Basic loop implementation
  const results = [];
  for (const r of recipients) {
    try {
      const res = await OctraApi.sendTransaction(r.address, r.amount);
      results.push({ ...r, status: "success", hash: res.txHash });
    } catch (e) {
      results.push({ ...r, status: "failed", error: String(e) });
    }
  }
  return results;
};
