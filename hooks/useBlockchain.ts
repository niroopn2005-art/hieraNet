import { useState, useCallback } from 'react';
import { blockchainUtils } from '@/utils/blockchain-utils';
import { useWallet } from '@/contexts/WalletContext';

export function useBlockchain() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { account } = useWallet();

  const checkAccess = useCallback(
    async (patientId: string, doctorId: string) => {
      try {
        setIsLoading(true);
        setError(null);
        const contract = blockchainUtils.getContract();
        const [viewAccess, updateAccess] = await Promise.all([
          contract.methods.checkViewAccess(patientId, doctorId).call(),
          contract.methods.checkUpdateAccess(patientId, doctorId).call(),
        ]);
        return { viewAccess, updateAccess };
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error checking access');
        return { viewAccess: false, updateAccess: false };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    isLoading,
    error,
    checkAccess,
    getRecords: blockchainUtils.getRecords,
    updateRecords: blockchainUtils.updateMedicalRecords,
  };
}
