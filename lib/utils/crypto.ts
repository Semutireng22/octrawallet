import { sign } from "tweetnacl";
import * as bip39 from "bip39";
import bs58 from "bs58";
import { sha256 } from "js-sha256";

// Constants
const BASE58_ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

/**
 * Generates a new random mnemonic (12 words)
 */
export function generateMnemonic(): string {
  return bip39.generateMnemonic(128); // 128 / 32 * 3 = 12 words
}

/**
 * Validates a mnemonic phrase
 */
export function validateMnemonic(mnemonic: string): boolean {
  return bip39.validateMnemonic(mnemonic);
}

/**
 * Derives the master private key and chain code from a mnemonic phrase using "Octra seed" salt (HMAC-SHA512)
 * Ported from wallet-gen/src/server.ts
 */
export async function deriveMasterKey(
  mnemonic: string
): Promise<{ masterPrivateKey: Uint8Array; masterChainCode: Uint8Array }> {
  const seed = await bip39.mnemonicToSeed(mnemonic);

  // HMAC-SHA512
  const key = new TextEncoder().encode("Octra seed");
  const cryptoKey = await window.crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );

  const mac = await window.crypto.subtle.sign("HMAC", cryptoKey, seed as any);
  const macBytes = new Uint8Array(mac);

  const masterPrivateKey = macBytes.slice(0, 32);
  const masterChainCode = macBytes.slice(32, 64);

  return { masterPrivateKey, masterChainCode };
}

/**
 * Generates an Ed25519 keypair from a seed (private key)
 */
export function generateKeyPair(seed: Uint8Array): {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
} {
  return sign.keyPair.fromSeed(seed);
}

/**
 * Creates an Octra Address from a Public Key
 * Format: "oct" + Base58(SHA256(publicKey))
 */
export function createOctraAddress(publicKey: Uint8Array): string {
  const hash = sha256.digest(publicKey);
  const base58Hash = bs58.encode(new Uint8Array(hash));
  return "oct" + base58Hash;
}

/**
 * Derives a child key using Hardened Ed25519 derivation (Mock/Simplified for now as deep HD wallet logic is complex in browser without huge deps)
 * For MVP/PoC we will use the Master Key directly as the Account 0 key, which is common in simple implementations.
 * TODO: Implement full BIP32-Ed25519 if multiple accounts are needed.
 */
export async function deriveAccountZero(mnemonic: string) {
  const { masterPrivateKey } = await deriveMasterKey(mnemonic);
  const keyPair = generateKeyPair(masterPrivateKey);
  const address = createOctraAddress(keyPair.publicKey);

  return {
    privateKey: keyPair.secretKey, // Return FULL 64-byte Secret Key for signing
    publicKey: keyPair.publicKey,
    address,
  };
}

// --- Encryption / Decryption for Private Transfers and Encrypted Balance ---

// --- Encryption Logic for Encrypted Balance ---

/**
 * Derives the symmetric encryption key for the client's encrypted balance
 * Logic: SHA256("octra_encrypted_balance_v2" + privateKeyBytes)
 */
export async function deriveEncryptionKey(
  privateKey: Uint8Array
): Promise<Uint8Array> {
  // Ensure we use the 32-byte SEED if a 64-byte key is passed
  const keyBytes =
    privateKey.length === 64 ? privateKey.slice(0, 32) : privateKey;

  const salt = new TextEncoder().encode("octra_encrypted_balance_v2");
  const combined = new Uint8Array(salt.length + keyBytes.length);
  combined.set(salt);
  combined.set(keyBytes, salt.length);

  const hash = sha256.digest(combined);
  return new Uint8Array(hash);
}

/**
 * Derives a shared secret for claiming private transfers
 * Ported from octra_pre_client/cli.py -> derive_shared_secret_for_claim
 */
export async function deriveSharedSecret(
  myPrivateKey: Uint8Array,
  theirPublicKey: Uint8Array
): Promise<Uint8Array> {
  // Ensure we use the 32-byte SEED to reconstruct the keypair
  const seed =
    myPrivateKey.length === 64 ? myPrivateKey.slice(0, 32) : myPrivateKey;
  const myKeyPair = sign.keyPair.fromSeed(seed);
  const myPublicKey = myKeyPair.publicKey;

  // Sort keys to ensure same combined buffer on both ends
  // logic: if eph < my => eph + my else my + eph
  // Using string comparison or byte comparison

  let first = theirPublicKey;
  let second = myPublicKey;

  // Simple byte comparison
  for (let i = 0; i < 32; i++) {
    if (theirPublicKey[i] < myPublicKey[i]) {
      first = theirPublicKey;
      second = myPublicKey;
      break;
    } else if (theirPublicKey[i] > myPublicKey[i]) {
      first = myPublicKey;
      second = theirPublicKey;
      break;
    }
  }

  const combined = new Uint8Array(64);
  combined.set(first);
  combined.set(second, 32);

  // Round 1: SHA256(combined)
  const round1 = sha256.digest(combined);

  // Round 2: SHA256(round1 + "OCTRA_SYMMETRIC_V1")
  const salt = new TextEncoder().encode("OCTRA_SYMMETRIC_V1");
  const round2Input = new Uint8Array(32 + salt.length);
  round2Input.set(new Uint8Array(round1));
  round2Input.set(salt, 32);

  const round2 = sha256.digest(round2Input);
  return new Uint8Array(round2);
}

/**
 * Encrypts data using AES-GCM (browser native)
 */
export async function encryptAESGCM(
  key: Uint8Array,
  plaintext: string
): Promise<{ nonce: Uint8Array; ciphertext: Uint8Array }> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // Nonce
  const encodedPlaintext = new TextEncoder().encode(plaintext);

  if (!window.crypto.subtle) {
    throw new Error(
      "Secure Context Required: window.crypto.subtle is undefined. Use HTTPS or Localhost."
    );
  }

  const cryptoKey = await window.crypto.subtle.importKey(
    "raw",
    key as any,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv as any,
    },
    cryptoKey,
    encodedPlaintext as any
  );

  return {
    nonce: iv,
    ciphertext: new Uint8Array(ciphertextBuffer),
  };
}

/**
 * Decrypts data using AES-GCM (browser native)
 */
export async function decryptAESGCM(
  key: Uint8Array,
  nonce: Uint8Array,
  ciphertext: Uint8Array
): Promise<string> {
  const cryptoKey = await window.crypto.subtle.importKey(
    "raw",
    key as any,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  const plaintextBuffer = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: nonce as any,
    },
    cryptoKey,
    ciphertext as any
  );

  return new TextDecoder().decode(plaintextBuffer);
}

export function encodeBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  const binary = String.fromCharCode(...bytes);
  return window.btoa(binary);
}
