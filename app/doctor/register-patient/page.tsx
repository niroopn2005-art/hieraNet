"use client"

import { useState, FormEvent, ChangeEvent, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useWallet } from "@/contexts/WalletContext" // Fix import path
import { blockchainUtils } from "@/utils/blockchain-utils" // Fix import path and name
import { toast } from "react-hot-toast"

export default function RegisterPatientPage() {
  const { account, role, connectWallet } = useWallet()
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [sentOtp, setSentOtp] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    patientId: '', // Add this field
    walletAddress: '',
    password: '', // Add password field
    confirmPassword: '', // Add confirm password field
    name: "",
    phone: "",
    email: "",
    otp: "",
    // Additional Information
    aadhar: "",
    gender: "male",
    dob: "",
    address: "",
    // Medical Device Data
    TEMPF: "",
    PULSE: "",
    RESPR: "",
    BPSYS: "",
    BPDIAS: "",
    POPCT: "",
    // Medical Conditions
    Pregnancies: "",
    Glucose: "",
    BloodPressure: "",
    Insulin: "",
    BMI: "",
    DiabetesPedigreeFunction: "",
    Age: "",
    Smoker: "no",
    Stroke: "no",
    Alcohol: "no",
    // Physical Information
    Height: "",
    Weight: "",
    Bmi: "",
    BmiClass: "normal",
    emergencyEmail: "",
    emergencyPhone: "",
    emergencyOtp: "",
  })

  // Add validation helper
  const validatePatientId = (id: string) => {
    // Format: PAT + YearMonth + 5 digits (e.g., PAT202312-00001)
    const pattern = /^PAT\d{6}-\d{5}$/;
    return pattern.test(id);
  };

  // Generate formatted patient ID
  const generatePatientId = () => {
    const date = new Date();
    const yearMonth = date.getFullYear().toString().slice(-2) + 
                     (date.getMonth() + 1).toString().padStart(2, '0') +
                     date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return `PAT${yearMonth}-${random}`;
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> | string, 
    selectName?: string
  ) => {
    if (typeof e === 'string' && selectName) {
      setFormData(prev => ({
        ...prev,
        [selectName]: e
      }));
    } else if (typeof e === 'object' && 'target' in e) {
      const { name, value } = e.target;
      if (name === 'patientId') {
        // Auto-generate if empty, otherwise validate format
        const newValue = value === '' ? generatePatientId() : value;
        if (!validatePatientId(newValue)) {
          toast.error('Invalid Patient ID format. Use format: PAT202312-00001');
          return;
        }
        setFormData(prev => ({ ...prev, patientId: newValue.toUpperCase() }));
      } else {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    }
  };

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/patient/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      if (data.success) {
        setSentOtp(data.otp);
        setStep(2);
      } else {
        throw new Error(data.error || 'Failed to send OTP');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to send OTP');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Verify OTP locally
      if (formData.otp !== sentOtp) {
        throw new Error('Invalid OTP');
      }

      setStep(3);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmergencySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await fetch('/api/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.emergencyEmail,
          phone: formData.emergencyPhone,
          isEmergencyContact: true
        }),
      })
      
      const data = await response.json()
      if (data.success) {
        setStep(4)
      } else {
        alert('Failed to send verification code to emergency contact')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error sending verification code')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmergencyOTPSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await fetch('/api/send-verification', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          otp: formData.emergencyOtp,
          email: formData.emergencyEmail,
          isEmergencyContact: true
        }),
      })

      const data = await response.json()
      if (data.success) {
        setStep(5)
      } else {
        alert(data.error || 'Invalid Emergency Contact OTP')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error verifying OTP')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFinalSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
        // Check wallet connection
        if (!account) {
            try {
                await connectWallet();
            } catch (error) {
                throw new Error('Failed to connect wallet. Please make sure MetaMask is installed and unlocked.');
            }
        }

        if (!account) {
            throw new Error('Please connect your wallet first');
        }

        // Validate doctor login
        const doctorId = sessionStorage.getItem('doctorId');
        if (!doctorId) {
            throw new Error('Doctor not logged in');
        }

        // Validate and normalize wallet address
        if (!formData.walletAddress || !formData.walletAddress.startsWith('0x')) {
            throw new Error('Invalid wallet address format');
        }
        
        // Normalize wallet address to lowercase for consistent encryption
        const normalizedWallet = formData.walletAddress.toLowerCase();

        // Format data for IPFS
        const patientData = {
            patientId: formData.patientId,
            walletAddress: normalizedWallet,
            personalInfo: {
                name: formData.name,
                phone: formData.phone,
                email: formData.email,
                address: formData.address,
                dob: formData.dob,
                aadhar: formData.aadhar,
                gender: formData.gender,
                emergencyPhone: formData.emergencyPhone,
                emergencyEmail: formData.emergencyEmail
            },
            medicalData: {
                TEMPF: parseFloat(formData.TEMPF) || 0,
                PULSE: parseFloat(formData.PULSE) || 0,
                RESPR: parseFloat(formData.RESPR) || 0,
                BPSYS: parseFloat(formData.BPSYS) || 0,
                BPDIAS: parseFloat(formData.BPDIAS) || 0,
                POPCT: parseFloat(formData.POPCT) || 0,
                Height: parseFloat(formData.Height) || 0,
                Weight: parseFloat(formData.Weight) || 0,
                Bmi: parseFloat(formData.Bmi) || 0,
                BmiClass: formData.BmiClass
            },
            conditions: {
                Pregnancies: parseFloat(formData.Pregnancies) || 0,
                DiabetesPedigreeFunction: parseFloat(formData.DiabetesPedigreeFunction) || 0,
                Glucose: parseFloat(formData.Glucose) || 0,
                BloodPressure: parseFloat(formData.BloodPressure) || 0,
                Insulin: parseFloat(formData.Insulin) || 0,
                Age: parseFloat(formData.Age) || 0,
                Smoker: formData.Smoker === 'yes',
                Stroke: formData.Stroke === 'yes',
                Alcohol: formData.Alcohol === 'yes'
            },
            timestamp: new Date().toISOString()
        };

        console.log('🔐 Encrypting and uploading to IPFS...', patientData);
        
        const classifyResponse = await fetch('/api/classify-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patientData)
        });

        const responseData = await classifyResponse.json();
        if (!classifyResponse.ok) {
            throw new Error('Failed to upload to IPFS: ' + (responseData.error || 'Unknown error'));
        }

        if (!responseData.success || !responseData.data?.privateCID || !responseData.data?.publicCID) {
            console.error('Invalid IPFS response:', responseData);
            throw new Error('Invalid IPFS response structure');
        }

        // Store CIDs in blockchain with normalized wallet address
        await blockchainUtils.handleCIDUpload(
            formData.patientId,
            doctorId,
            normalizedWallet,
            responseData.data.privateCID,
            responseData.data.publicCID,
            account
        );

        toast.success('Patient registered successfully!');
        router.push('/doctor/dashboard');

    } catch (error) {
        console.error("Registration error:", error);
        setError(error instanceof Error ? error.message : 'Registration failed');
        toast.error(error instanceof Error ? error.message : 'Registration failed');
    } finally {
        setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate passwords match
      if (formData.password !== formData.confirmPassword) {
        throw new Error("Passwords don't match");
      }

      // Hash the password before storing
      const hashedPassword = await hashPassword(formData.password);

      // Store patient credentials with normalized wallet address
      const patientCredentials = {
        id: formData.patientId,
        password: hashedPassword,
        walletAddress: formData.walletAddress.toLowerCase()
      };

      // Store in localStorage
      localStorage.setItem(`patient_${formData.patientId}`, JSON.stringify(patientCredentials));

      // Register on blockchain
      const doctorId = sessionStorage.getItem('doctorId');
      if (!doctorId) throw new Error('Doctor ID not found');

      const contract = blockchainUtils.getContract();
      await contract.methods.registerPatient(
        formData.patientId,
        doctorId,
        formData.walletAddress.toLowerCase(),
        'initial' // Initial CID
      ).send({
        from: account,
        gas: '3000000'
      });

      router.push('/doctor/dashboard');
    } catch (error) {
      console.error("Registration error:", error);
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to hash password
  async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Add useEffect for wallet connection check
  useEffect(() => {
    const checkWallet = async () => {
      if (!account) {
        try {
          await connectWallet()
        } catch (error) {
          console.error('Wallet connection error:', error)
        }
      }
    }
    checkWallet()
  }, [account, connectWallet])

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-200 px-4 py-8">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/doctor/dashboard" className="text-blue-600 hover:text-blue-700">
              ← Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-blue-800">Register New Patient</h1>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}

        {/* Wallet Connection Card */}
        {!account && (
          <Card className="mx-auto max-w-md mb-4">
            <CardContent className="p-4">
              <Button 
                onClick={connectWallet}
                className="w-full bg-yellow-600 hover:bg-yellow-700"
              >
                Connect Wallet
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Registration Steps */}
        {step === 1 && (
          <Card className="mx-auto max-w-md bg-white">
            <CardHeader>
              <CardTitle className="text-blue-800">Patient Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInitialSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-blue-700">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="border-blue-300 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-blue-700">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="border-blue-300 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-blue-700">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="border-blue-300 focus:border-blue-500"
                  />
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
                  {isLoading ? "Sending OTP..." : "Send OTP"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="mx-auto max-w-md bg-white">
            <CardHeader>
              <CardTitle className="text-blue-800">OTP Verification</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleOTPSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-blue-700">Enter OTP</Label>
                  <Input
                    id="otp"
                    name="otp"
                    value={formData.otp}
                    onChange={handleChange}
                    required
                    className="border-blue-300 focus:border-blue-500"
                  />
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
                  {isLoading ? "Verifying..." : "Verify OTP"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card className="mx-auto max-w-md bg-white">
            <CardHeader>
              <CardTitle className="text-blue-800">Emergency Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEmergencySubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone" className="text-blue-700">Emergency Contact Number</Label>
                  <Input
                    id="emergencyPhone"
                    name="emergencyPhone"
                    type="tel"
                    value={formData.emergencyPhone}
                    onChange={handleChange}
                    required
                    className="border-blue-300 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyEmail" className="text-blue-700">Emergency Contact Email</Label>
                  <Input
                    id="emergencyEmail"
                    name="emergencyEmail"
                    type="email"
                    value={formData.emergencyEmail}
                    onChange={handleChange}
                    required
                    className="border-blue-300 focus:border-blue-500"
                  />
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
                  {isLoading ? "Sending OTP..." : "Send OTP to Emergency Contact"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 4 && (
          <Card className="mx-auto max-w-md bg-white">
            <CardHeader>
              <CardTitle className="text-blue-800">Emergency Contact Verification</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEmergencyOTPSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyOtp" className="text-blue-700">Enter Emergency Contact OTP</Label>
                  <Input
                    id="emergencyOtp"
                    name="emergencyOtp"
                    value={formData.emergencyOtp}
                    onChange={handleChange}
                    required
                    className="border-blue-300 focus:border-blue-500"
                  />
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
                  {isLoading ? "Verifying..." : "Verify Emergency Contact"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 5 && (
          <form onSubmit={handleFinalSubmit} className="space-y-8">
            {/* Blockchain Information Card */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-blue-800">Blockchain Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {/* Patient ID Field */}
                  <div className="mb-4">
                    <Label htmlFor="patientId" className="text-blue-700">Patient ID</Label>
                    <div className="flex gap-2">
                      <Input
                        id="patientId"
                        name="patientId"
                        value={formData.patientId}
                        onChange={handleChange}
                        placeholder="PAT202312-00001"
                        required
                        className="border-blue-300 focus:border-blue-500"
                      />
                      <Button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, patientId: generatePatientId() }))}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700"
                      >
                        Generate ID
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Format: PAT + YYMMDD + 5 digits (e.g., PAT231214-00001)
                    </p>
                  </div>

                  {/* Wallet Address Field */}
                  <Label htmlFor="walletAddress" className="text-blue-700">Patient Wallet Address</Label>
                  <div className="flex gap-2">
                    <Input
                      id="walletAddress"
                      name="walletAddress"
                      value={formData.walletAddress}
                      onChange={handleChange}
                      placeholder="0x..."
                      required
                      className="border-blue-300 focus:border-blue-500"
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    Enter the patient's Ethereum wallet address
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Verified Information Display */}
            <Card className="bg-blue-50 shadow-md">
              <CardHeader>
                <CardTitle className="text-blue-800">Verified Patient Information</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-blue-700">Name</Label>
                  <p className="font-medium text-blue-900">{formData.name}</p>
                </div>
                <div>
                  <Label className="text-blue-700">Phone Number</Label>
                  <p className="font-medium text-blue-900">{formData.phone}</p>
                </div>
                <div>
                  <Label className="text-blue-700">Email</Label>
                  <p className="font-medium text-blue-900">{formData.email}</p>
                </div>
                <div>
                  <Label className="text-blue-700">Emergency Contact Number</Label>
                  <p className="font-medium text-blue-900">{formData.emergencyPhone}</p>
                </div>
                <div>
                  <Label className="text-blue-700">Emergency Contact Email</Label>
                  <p className="font-medium text-blue-900">{formData.emergencyEmail}</p>
                </div>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-blue-800">Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="aadhar" className="text-blue-700">Aadhar Number</Label>
                  <Input
                    id="aadhar"
                    name="aadhar"
                    value={formData.aadhar}
                    onChange={handleChange}
                    required
                    className="border-blue-300 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-blue-700">Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => handleChange(value, 'gender')}
                  >
                    <SelectTrigger className="border-blue-300 focus:border-blue-500">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob" className="text-blue-700">Date of Birth</Label>
                  <Input
                    id="dob"
                    name="dob"
                    type="date"
                    value={formData.dob}
                    onChange={handleChange}
                    required
                    className="border-blue-300 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address" className="text-blue-700">Address</Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    className="border-blue-300 focus:border-blue-500"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Medical Device Data */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-blue-800">Medical Device Data</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {["TEMPF", "PULSE", "RESPR", "BPSYS", "BPDIAS", "POPCT"].map((field) => (
                  <div key={field} className="space-y-2">
                    <Label htmlFor={field} className="text-blue-700">{field}</Label>
                    <Input
                      id={field}
                      name={field}
                      type="number"
                      step="0.01"
                      value={formData[field as keyof typeof formData]}
                      onChange={handleChange}
                      className="border-blue-300 focus:border-blue-500"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Medical Conditions */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-blue-800">Medical Conditions and Practices</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {["Pregnancies", "Glucose", "BloodPressure", "Insulin" , "DiabetesPedigreeFunction", "Age"].map((field) => (
                  <div key={field} className="space-y-2">
                    <Label htmlFor={field} className="text-blue-700">{field}</Label>
                    <Input
                      id={field}
                      name={field}
                      type="number"
                      step="0.01"
                      value={formData[field as keyof typeof formData]}
                      onChange={handleChange}
                      className="border-blue-300 focus:border-blue-500"
                    />
                  </div>
                ))}
                {["Smoker", "Stroke", "Alcohol"].map((field) => (
                  <div key={field} className="space-y-2">
                    <Label htmlFor={field} className="text-blue-700">{field}</Label>
                    <Select
                      value={formData[field as keyof typeof formData]}
                      onValueChange={(value) => handleChange(value, field)}
                    >
                      <SelectTrigger className="border-blue-300 focus:border-blue-500">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Physical Information */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-blue-800">Physical Information</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                {["Height", "Weight", "Bmi", "BmiClass"].map((field) => (
                  <div key={field} className="space-y-2">
                    <Label htmlFor={field} className="text-blue-700">{field}</Label>
                    <Input
                      id={field}
                      name={field}
                      type={field === "BmiClass" ? "text" : "number"}
                      step="0.01"
                      value={formData[field as keyof typeof formData]}
                      onChange={handleChange}
                      className="border-blue-300 focus:border-blue-500"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
                {isLoading ? "Registering..." : "Register Patient"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Layout>
  )
}



