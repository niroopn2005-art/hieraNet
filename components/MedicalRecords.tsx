import { useState } from 'react';
import { useMedicalRecords } from '@/contexts/MedicalRecordsContext';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';

export function MedicalRecords() {
  const { account, role } = useWallet();
  const { isLoading, error, records, viewRecords, updateRecords } = useMedicalRecords();
  const [patientId, setPatientId] = useState('');
  const [privateCID, setPrivateCID] = useState('');
  const [publicCID, setPublicCID] = useState('');
  const [doctorKey, setDoctorKey] = useState('');

  const handleView = async (e: React.FormEvent) => {
    e.preventDefault();
    await viewRecords(patientId, doctorKey);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role !== 'doctor') return;
    await updateRecords(patientId, 'DOC001', privateCID, publicCID, doctorKey);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Medical Records Management</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleView} className="space-y-4">
            <Input
              placeholder="Patient ID"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
            />
            <Input
              placeholder="Doctor's Private Key"
              value={doctorKey}
              onChange={(e) => setDoctorKey(e.target.value)}
              type="password"
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Loading...' : 'View Records'}
            </Button>
          </form>

          {error && <p className="text-red-500 mt-4">{error}</p>}
          
          {records && (
            <div className="mt-4">
              <h3 className="font-bold">Current Records:</h3>
              <p>Private CID: {records.privateCID}</p>
              <p>Public CID: {records.publicCID || 'None'}</p>
            </div>
          )}

          {role === 'doctor' && (
            <form onSubmit={handleUpdate} className="mt-8 space-y-4">
              <Input
                placeholder="New Private CID"
                value={privateCID}
                onChange={(e) => setPrivateCID(e.target.value)}
              />
              <Input
                placeholder="New Public CID"
                value={publicCID}
                onChange={(e) => setPublicCID(e.target.value)}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Records'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
