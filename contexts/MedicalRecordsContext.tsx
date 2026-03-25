"use client";

import { createContext, useContext, useState, ReactNode } from 'react';
import { blockchainUtils } from '@/utils/blockchain-utils';

interface MedicalRecordsContextType {
  isLoading: boolean;
  error: string | null;
  records: {
    privateCID: string;
    publicCID: string | null;
  } | null;
  getRecords: (patientId: string) => Promise<void>;
  updateRecords: (
    patientId: string,
    doctorId: string,
    privateCID: string,
    publicCID: string,
    doctorAddress: string
  ) => Promise<void>;
}

const MedicalRecordsContext = createContext<MedicalRecordsContextType | undefined>(undefined);

export function MedicalRecordsProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<{
    privateCID: string;
    publicCID: string | null;
  } | null>(null);

  const getRecords = async (patientId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await blockchainUtils.getRecords(patientId);
      setRecords(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch records');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateRecords = async (
    patientId: string,
    doctorId: string,
    privateCID: string,
    publicCID: string,
    doctorAddress: string
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      await blockchainUtils.updateMedicalRecords(
        patientId,
        doctorId,
        privateCID,
        publicCID,
        doctorAddress
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update records');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    isLoading,
    error,
    records,
    getRecords,
    updateRecords,
  };

  return (
    <MedicalRecordsContext.Provider value={value}>
      {children}
    </MedicalRecordsContext.Provider>
  );
}

export function useMedicalRecords() {
  const context = useContext(MedicalRecordsContext);
  if (context === undefined) {
    throw new Error('useMedicalRecords must be used within a MedicalRecordsProvider');
  }
  return context;
}
