import Link from "next/link"
import { LockIcon } from 'lucide-react'

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link href="/" className="flex items-center space-x-2">
            <LockIcon className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-semibold">
              <span className="text-blue-600">Heir</span>
              <span className="text-purple-600">Chain</span>
            </span>
          </Link>
          <nav className="ml-auto flex space-x-4">
            <Link href="/about" className="text-gray-600 hover:text-gray-900">
              About
            </Link>
            <Link href="/contact" className="text-gray-600 hover:text-gray-900">
              Contact
            </Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}

