import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { blockchainUtils } from '@/utils/blockchain-utils'

export function useDoctor() {
  const router = useRouter()
  const [isVerifying, setIsVerifying] = useState(true)
  const [doctorId, setDoctorId] = useState<string | null>(null)

  useEffect(() => {
    const verifyDoctor = async () => {
      try {
        const storedDoctorId = sessionStorage.getItem('doctorId')
        const storedWallet = sessionStorage.getItem('doctorWallet')

        if (!storedDoctorId || !storedWallet) {
          throw new Error('Not logged in')
        }

        const contract = blockchainUtils.getContract()
        const isRegistered = await contract.methods.isDoctorRegistered(storedDoctorId).call()
        
        if (!isRegistered) {
          throw new Error('Doctor not registered')
        }

        const doctor = await contract.methods.doctors(storedDoctorId).call()
        if (doctor.walletAddress.toLowerCase() !== storedWallet.toLowerCase()) {
          throw new Error('Wallet mismatch')
        }

        setDoctorId(storedDoctorId)
      } catch (error) {
        console.error('Doctor verification failed:', error)
        sessionStorage.clear()
        router.push('/doctor/login')
      } finally {
        setIsVerifying(false)
      }
    }

    verifyDoctor()
  }, [router])

  return { isVerifying, doctorId }
}
