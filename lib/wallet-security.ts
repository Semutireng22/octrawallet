import { scrypt } from "scrypt-js";
import { encryptAESGCM, decryptAESGCM } from "./utils/crypto";

// Security Constants
const SCRYPT_PARAMS = {
  N: 16384, // CPU/Memory cost parameter
  r: 8, // Block size parameter
  p: 1, // Parallelization parameter
  dkLen: 32, // Derived key length (256 bits for AES-256)
};

const SALT_STRING = "OCTRA_WALLET_V2_SALT_"; // Application specific salt prefix

export interface EncryptedWalletData {
  ciphertext: string; // Base64 encoded
  nonce: string; // Base64 encoded
  salt: string; // Base64 encoded (random salt per user)
}

/**
 * Derives a robust encryption key from a user password using Scrypt
 */
async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array
): Promise<Uint8Array> {
  const passwordBytes = new TextEncoder().encode(password);
  return await scrypt(
    passwordBytes,
    salt,
    SCRYPT_PARAMS.N,
    SCRYPT_PARAMS.r,
    SCRYPT_PARAMS.p,
    SCRYPT_PARAMS.dkLen
  );
}

/**
 * Encrypts a mnemonic phrase using a password
 */
export async function encryptWallet(
  mnemonic: string,
  password: string
): Promise<EncryptedWalletData> {
  // Generate a random salt for this encryption
  const salt = window.crypto.getRandomValues(new Uint8Array(16));

  // Derive key
  const derivedKey = await deriveKeyFromPassword(password, salt);

  // Encrypt
  const { nonce, ciphertext } = await encryptAESGCM(derivedKey, mnemonic);

  // Convert to Base64 for storage
  return {
    ciphertext: btoa(String.fromCharCode(...ciphertext)),
    nonce: btoa(String.fromCharCode(...nonce)),
    salt: btoa(String.fromCharCode(...salt)),
  };
}

/**
 * Decrypts a wallet using a password
 * Throws error if password is wrong (decryption fails)
 */
export async function decryptWallet(
  encryptedData: EncryptedWalletData,
  password: string
): Promise<string> {
  try {
    const salt = new Uint8Array(
      atob(encryptedData.salt)
        .split("")
        .map((c) => c.charCodeAt(0))
    );
    const nonce = new Uint8Array(
      atob(encryptedData.nonce)
        .split("")
        .map((c) => c.charCodeAt(0))
    );
    const ciphertext = new Uint8Array(
      atob(encryptedData.ciphertext)
        .split("")
        .map((c) => c.charCodeAt(0))
    );

    const derivedKey = await deriveKeyFromPassword(password, salt);

    return await decryptAESGCM(derivedKey, nonce, ciphertext);
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Invalid password or corrupted data");
  }
}

/**
 * Sanitizes input to prevent basic injection attacks
 * - Trims whitespace
 * - Removes some control characters
 */
export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, "");
}
