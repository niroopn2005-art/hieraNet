import { MedicalRecords } from '@/components/MedicalRecords';

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-8">Medical Records Dashboard</h1>
      <MedicalRecords />
    </div>
  );
}
