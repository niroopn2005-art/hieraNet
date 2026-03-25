import './globals.css'
import { WalletProvider } from '@/contexts/WalletContext';
import { MedicalRecordsProvider } from '@/contexts/MedicalRecordsContext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main>
          <WalletProvider>
            <MedicalRecordsProvider>
              {children}
            </MedicalRecordsProvider>
          </WalletProvider>
        </main>
      </body>
    </html>
  );
}

