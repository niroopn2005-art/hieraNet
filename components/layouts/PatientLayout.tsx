"use client"
import { WalletProvider } from "@/contexts/WalletContext"

interface PatientLayoutProps {
    children: React.ReactNode
}

export default function PatientLayout({ children }: PatientLayoutProps) {
    return (
        <WalletProvider>
            <main className="min-h-screen bg-gray-100">
                {children}
            </main>
        </WalletProvider>
    )
}
