"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from 'next/navigation';

export default function VerifyOTP() {
  const router = useRouter();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [patientData, setPatientData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const storedData = sessionStorage.getItem('patientData');
    if (!storedData) {
      router.push('/doctor/register-patient');
    } else {
      setPatientData(JSON.parse(storedData));
    }
  }, [router]);

  const handleVerifyOTP = async () => {
    if (!otp) {
      setError('Please enter the OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/send-verification', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          otp,
          email: patientData?.email
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        router.push('/doctor/register-patient');
      } else {
        setError(data.error || 'Verification failed. Please try again.');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!patientData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-md mx-auto space-y-4 p-6">
      <h1 className="text-2xl font-bold text-blue-800">Verify OTP</h1>
      
      <div className="space-y-4">
        {patientData?.email && (
          <p className="text-gray-600">
            Enter the verification code sent to: {patientData.email}
          </p>
        )}

        <div>
          <label className="text-blue-600 block mb-2">Enter OTP</label>
          <Input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter 6-digit OTP"
            maxLength={6}
            className="w-full"
            required
          />
        </div>

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        <Button 
          className="w-full"
          onClick={handleVerifyOTP}
          disabled={loading}
        >
          {loading ? 'Verifying...' : 'Verify OTP'}
        </Button>
      </div>
    </div>
  );
} 