import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { OctraApi, Transaction } from "@/lib/api";
import { useWalletStore } from "@/store/wallet-store";
import { encodeBase64 } from "@/lib/utils/crypto";

// --- HOOKS ---

export function useBalance() {
  const { activeKeys } = useWalletStore();
  const address = activeKeys?.address;

  return useQuery({
    queryKey: ["balance", address],
    queryFn: async () => {
      if (!address) return { balance: 0, nonce: 0 };
      return await OctraApi.fetchBalance(address);
    },
    enabled: !!address,
    refetchInterval: 10000, // Real-time feel: 10s
  });
}

export function useEncryptedBalance() {
  const { activeKeys } = useWalletStore();
  const address = activeKeys?.address;
  const privateKey = activeKeys?.privateKey;

  return useQuery({
    queryKey: ["encryptedBalance", address],
    queryFn: async () => {
      if (!address || !privateKey) return { encrypted: 0, encryptedRaw: 0 };

      const privKeyBytes =
        privateKey.length === 64 ? privateKey.slice(0, 32) : privateKey;
      const privKeyB64 = encodeBase64(privKeyBytes);

      const data = await OctraApi.fetchEncryptedBalance(address, privKeyB64);
      return data || { encrypted: 0, encryptedRaw: 0 };
    },
    enabled: !!address && !!privateKey,
    refetchInterval: 15000,
  });
}

export function useTransactions(limit: number = 20) {
  const { activeKeys } = useWalletStore();
  const address = activeKeys?.address;

  return useQuery<Transaction[]>({
    queryKey: ["transactions", address, limit],
    queryFn: async () => {
      if (!address) return [];
      const txs = await OctraApi.fetchTransactions(address);
      // Sort desc
      return txs.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    },
    enabled: !!address,
    refetchInterval: 15000, // Refresh history every 15s
  });
}

export function useOctraUtils() {
  const queryClient = useQueryClient();
  const { activeKeys } = useWalletStore();

  const invalidateBalance = () => {
    queryClient.invalidateQueries({
      queryKey: ["balance", activeKeys?.address],
    });
    queryClient.invalidateQueries({
      queryKey: ["encryptedBalance", activeKeys?.address],
    });
    queryClient.invalidateQueries({
      queryKey: ["transactions", activeKeys?.address],
    });
  };

  return { invalidateBalance };
}
