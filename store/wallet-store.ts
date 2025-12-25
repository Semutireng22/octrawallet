import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { EncryptedWalletData } from "@/lib/wallet-security";
import { deriveAccountZero } from "@/lib/utils/crypto";

// Types
export interface Contact {
  id: string;
  name: string;
  address: string;
}

export interface WalletMetadata {
  id: string; // UUID or timestamp
  label: string; // User friendly name (e.g., "Personal", "Trading")
  encryptedData: EncryptedWalletData;
}

interface WalletKeys {
  privateKey: Uint8Array;
  publicKey: Uint8Array;
  address: string;
}

interface WalletState {
  // --- Persistent State ---
  wallets: WalletMetadata[];
  contacts: Contact[]; // Address Book
  activeWalletId: string | null;

  // --- Volatile State (Memory Only) ---
  isUnlocked: boolean; // Global lock state for the ACTIVE wallet
  sessionPassword: string | null; // Cached password for the session
  activeKeys: WalletKeys | null; // Keys for the ACTIVE wallet
  autoLockTimer: NodeJS.Timeout | null; // Internal timer ref
  lastActiveTimestamp: number; // For tracking inactivity across refreshes

  // Preferences
  autoLockTimeout: number; // in minutes. 0 = never.
  isBalanceHidden: boolean;

  // --- Actions ---
  // Management
  addWallet: (wallet: WalletMetadata, makeActive?: boolean) => void;
  removeWallet: (id: string) => void;
  renameWallet: (id: string, label: string) => void;
  addContact: (contact: Contact) => void;
  removeContact: (id: string) => void;
  setActiveWallet: (id: string) => Promise<void>;
  setAutoLockTimeout: (minutes: number) => void;
  toggleHideBalance: () => void;
  updateActivity: () => void;

  // Security
  unlockWallet: (mnemonic: string, password?: string) => Promise<void>;
  lockWallet: () => void;

  // Helpers
  getEncryptedData: (id?: string) => EncryptedWalletData | null;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      // Initial State
      wallets: [],
      contacts: [],
      activeWalletId: null,
      isUnlocked: false,
      sessionPassword: null,
      activeKeys: null,
      autoLockTimer: null,
      autoLockTimeout: 15, // Default 15 minutes
      isBalanceHidden: false,
      lastActiveTimestamp: Date.now(),

      addWallet: (wallet, makeActive = true) => {
        set((state) => {
          const exists = state.wallets.find((w) => w.id === wallet.id);
          // Handle duplicates if needed, or update
          const newWallets = exists
            ? state.wallets.map((w) => (w.id === wallet.id ? wallet : w))
            : [...state.wallets, wallet];

          return {
            wallets: newWallets,
            // If it's the first wallet or requested, make active
            activeWalletId:
              makeActive || !state.activeWalletId
                ? wallet.id
                : state.activeWalletId,
          };
        });
      },

      removeWallet: (id) => {
        set((state) => {
          const newWallets = state.wallets.filter((w) => w.id !== id);
          // If we removed the active wallet, switch to another or null
          let newActive = state.activeWalletId;
          if (state.activeWalletId === id) {
            newActive = newWallets.length > 0 ? newWallets[0].id : null;
          }

          return {
            wallets: newWallets,
            activeWalletId: newActive,
            isUnlocked: false,
            activeKeys: null,
            sessionPassword: null,
          };
        });
      },

      renameWallet: (id, label) => {
        set((state) => ({
          wallets: state.wallets.map((w) =>
            w.id === id ? { ...w, label } : w
          ),
        }));
      },

      addContact: (contact) => {
        set((state) => ({
          contacts: [...state.contacts, contact],
        }));
      },

      removeContact: (id) => {
        set((state) => ({
          contacts: state.contacts.filter((c) => c.id !== id),
        }));
      },

      setActiveWallet: async (id) => {
        const { activeWalletId, wallets } = get();
        let { sessionPassword } = get();

        if (activeWalletId === id) return;

        // Try to recover password from sessionStorage if missing in memory (page refresh case)
        if (!sessionPassword && typeof window !== "undefined") {
          // OLD: sessionPassword = sessionStorage.getItem("octra_session_pw");
          // NEW: Decrypt Secure Session
          const secureSession = sessionStorage.getItem("octra_secure_session");
          if (secureSession) {
            try {
              const { k, iv, d } = JSON.parse(secureSession);
              const fromB64 = (s: string) =>
                Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

              const keyBytes = fromB64(k);
              const ivBytes = fromB64(iv);
              const dataBytes = fromB64(d);

              const keyCrypto = await window.crypto.subtle.importKey(
                "raw",
                keyBytes,
                "AES-GCM",
                false,
                ["decrypt"]
              );

              const decrypted = await window.crypto.subtle.decrypt(
                { name: "AES-GCM", iv: ivBytes },
                keyCrypto,
                dataBytes
              );

              sessionPassword = new TextDecoder().decode(decrypted);
              set({ sessionPassword }); // Restore to memory
            } catch (e) {
              console.warn("Session decryption failed", e);
              sessionStorage.removeItem("octra_secure_session");
            }
          }
        }

        // Try to auto-unlock with session password
        let keys = null;
        let unlocked = false;

        if (sessionPassword) {
          const targetWallet = wallets.find((w) => w.id === id);
          if (targetWallet) {
            try {
              const { decryptWallet } = await import("@/lib/wallet-security");
              const mnemonic = await decryptWallet(
                targetWallet.encryptedData,
                sessionPassword
              );
              const derived = await deriveAccountZero(mnemonic);
              keys = {
                privateKey: derived.privateKey,
                publicKey: derived.publicKey,
                address: derived.address,
              };
              unlocked = true;
            } catch (e) {
              console.warn("Auto-unlock failed for wallet switch:", e);
              // If failed, we might want to clear the invalid password?
              // But maybe it's valid for other wallets. Keep it for now.
            }
          }
        }

        set({
          activeWalletId: id,
          isUnlocked: unlocked,
          activeKeys: keys,
        });

        // If we failed to unlock, we might should redirect or show lock screen.
        // The Dashboard auth guard will handle the redirect if isUnlocked becomes false.
      },

      setAutoLockTimeout: (minutes) => {
        set({ autoLockTimeout: minutes });
      },

      toggleHideBalance: () => {
        set((state) => ({ isBalanceHidden: !state.isBalanceHidden }));
      },

      unlockWallet: async (mnemonic, password) => {
        // Derive keys
        const keys = await deriveAccountZero(mnemonic);

        if (password && typeof window !== "undefined") {
          // SECURITY UPGRADE: Encrypted Session Storage
          // Instead of storing plaintext password, we generate a random session key,
          // encrypt the password with it, and store the bundle.
          try {
            const sessionKey = window.crypto.getRandomValues(
              new Uint8Array(32)
            );
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            const enc = new TextEncoder();

            const keyCrypto = await window.crypto.subtle.importKey(
              "raw",
              sessionKey,
              "AES-GCM",
              false,
              ["encrypt"]
            );

            const encrypted = await window.crypto.subtle.encrypt(
              { name: "AES-GCM", iv },
              keyCrypto,
              enc.encode(password)
            );

            // Bundle: key + iv + ciphertext (Base64 encoded parts)
            // Helper to b64
            const toB64 = (b: Uint8Array) => btoa(String.fromCharCode(...b));

            const sessionData = JSON.stringify({
              k: toB64(sessionKey),
              iv: toB64(iv),
              d: toB64(new Uint8Array(encrypted)),
            });

            sessionStorage.setItem("octra_secure_session", sessionData);
            sessionStorage.removeItem("octra_session_pw"); // Cleanup old
          } catch (e) {
            console.error("Session encryption failed", e);
          }
        }

        set({
          isUnlocked: true,
          activeKeys: {
            privateKey: keys.privateKey,
            publicKey: keys.publicKey,
            address: keys.address,
          },
          sessionPassword: password || null,
        });
      },

      lockWallet: () => {
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("octra_session_pw");
          sessionStorage.removeItem("octra_secure_session");
        }
        set({
          isUnlocked: false,
          activeKeys: null,
          sessionPassword: null,
        });
      },

      getEncryptedData: (id) => {
        const { wallets, activeWalletId } = get();
        const targetId = id || activeWalletId;
        const w = wallets.find((w) => w.id === targetId);
        return w ? w.encryptedData : null;
      },

      updateActivity: () => {
        set({ lastActiveTimestamp: Date.now() });
      },
    }),
    {
      name: "octra-wallet-storage-v2",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        wallets: state.wallets,
        activeWalletId: state.activeWalletId,
        contacts: state.contacts,
        autoLockTimeout: state.autoLockTimeout,
        isBalanceHidden: state.isBalanceHidden,
        // Persist security state to survive refreshes
        isUnlocked: state.isUnlocked,
        activeKeys: state.activeKeys,
        lastActiveTimestamp: state.lastActiveTimestamp,
      }),
      // Custom merge to rehydrate Uint8Arrays from JSON
      merge: (persistedState: any, currentState: WalletState) => {
        if (!persistedState) return currentState;

        const merged = { ...currentState, ...persistedState };

        // Restore activeKeys if they exist and are not Uint8Array
        if (merged.activeKeys) {
          if (!(merged.activeKeys.privateKey instanceof Uint8Array)) {
            // Handle {0: x, 1: y} or [x, y]
            const privValues = Object.values(merged.activeKeys.privateKey);
            merged.activeKeys.privateKey = new Uint8Array(
              privValues as number[]
            );
          }
          if (!(merged.activeKeys.publicKey instanceof Uint8Array)) {
            const pubValues = Object.values(merged.activeKeys.publicKey);
            merged.activeKeys.publicKey = new Uint8Array(pubValues as number[]);
          }
        }

        return merged;
      },
    }
  )
);
