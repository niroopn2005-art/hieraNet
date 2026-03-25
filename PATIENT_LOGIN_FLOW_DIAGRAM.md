# Patient Login Flow Diagram

## Complete User Journey

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PATIENT LOGIN FLOW                               │
└─────────────────────────────────────────────────────────────────────────┘

START
  │
  ▼
┌─────────────────────────────────────┐
│  Navigate to /patient/login         │
│                                     │
│  ┌───────────────────────────────┐ │
│  │    Patient Login (Green)      │ │
│  ├───────────────────────────────┤ │
│  │  Patient ID                   │ │
│  │  [____________]               │ │
│  │                               │ │
│  │  Wallet Connection            │ │
│  │  [Connect MetaMask] 🔵        │ │
│  │                               │ │
│  │  [Login] (disabled) ⚫        │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
  │
  │ User enters Patient ID: "P001"
  │
  ▼
┌─────────────────────────────────────┐
│  Patient ID entered ✅              │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  Patient ID                   │ │
│  │  [P001____________]           │ │
│  │                               │ │
│  │  Wallet Connection            │ │
│  │  [Connect MetaMask] 🔵        │ │  ◄─ Click here
│  │                               │ │
│  │  [Login] (disabled) ⚫        │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
  │
  │ User clicks "Connect MetaMask"
  │
  ▼
┌──────────────────────────────────────────────────────────────┐
│  🦊 METAMASK POPUP APPEARS                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  🦊 MetaMask                                           │ │
│  │                                                        │ │
│  │  Connect with MetaMask                                │ │
│  │                                                        │ │
│  │  Select an account:                                   │ │
│  │                                                        │ │
│  │  ☐ Account 1 (Admin)                                 │ │
│  │     0x5B38...dcC2    Balance: 89.99 ETH              │ │
│  │                                                        │ │
│  │  ☐ Account 2 (Doctor)                                │ │
│  │     0x1234...5678    Balance: 45.50 ETH              │ │
│  │                                                        │ │
│  │  ☑ Account 3 (Patient) ✅ ◄─ Select this!            │ │
│  │     0xABCD...EF01    Balance: 12.30 ETH              │ │
│  │                                                        │ │
│  │  ☐ Account 4 (Test)                                  │ │
│  │     0x9999...1111    Balance: 5.00 ETH               │ │
│  │                                                        │ │
│  │                                  [Cancel]  [Next] ▶   │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
  │
  │ User selects Patient account and clicks Next → Connect
  │
  ▼
┌─────────────────────────────────────┐
│  Wallet Connected! ✅               │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  Patient ID                   │ │
│  │  [P001____________]           │ │
│  │                               │ │
│  │  Wallet Connection            │ │
│  │  ┌─────────────────────────┐ │ │
│  │  │ Connected: 0xABCD...EF01│ │ │ ◄─ Shows connected wallet
│  │  │ (green background)      │ │ │
│  │  └─────────────────────────┘ │ │
│  │                               │ │
│  │  [Login] (enabled) 🟢 ◄─────────  Click here to login
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
  │
  │ User clicks "Login"
  │
  ▼
┌──────────────────────────────────────────────────────────────┐
│  🔄 VERIFICATION PROCESS                                     │
│                                                              │
│  Step 1: Check if patient exists                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ contract.methods.isPatientRegistered("P001").call()    │ │
│  │ Result: true ✅                                         │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Step 2: Get patient data from blockchain                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ contract.methods.patients("P001").call()               │ │
│  │ Returns: {                                             │ │
│  │   isRegistered: true,                                  │ │
│  │   walletAddress: "0xABCD...EF01",                      │ │
│  │   registeredBy: "D001",                                │ │
│  │   privateCIDs: [...]                                   │ │
│  │ }                                                       │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Step 3: Verify wallet matches                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ patient.walletAddress === connectedWallet?             │ │
│  │ "0xABCD...EF01" === "0xABCD...EF01"                    │ │
│  │ Result: Match! ✅                                       │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Step 4: Store session                                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ sessionStorage.setItem('patientId', 'P001')            │ │
│  │ sessionStorage.setItem('walletAddress', '0xABCD...')   │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
  │
  │ All verifications passed ✅
  │
  ▼
┌─────────────────────────────────────┐
│  🎉 LOGIN SUCCESS!                  │
│                                     │
│  Redirecting to patient dashboard...│
└─────────────────────────────────────┘
  │
  │ router.push('/patient/dashboard')
  │
  ▼
┌─────────────────────────────────────────────────────────────┐
│  PATIENT DASHBOARD                                          │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Welcome, Patient P001! 👋                            │ │
│  │                                                        │ │
│  │  Connected Wallet: 0xABCD...EF01                      │ │
│  │                                                        │ │
│  │  ┌────────────────────────────────────────┐          │ │
│  │  │  📋 Manage Access                      │          │ │
│  │  │  Review and manage doctor access       │          │ │
│  │  └────────────────────────────────────────┘          │ │
│  │                                                        │ │
│  │  ┌────────────────────────────────────────┐          │ │
│  │  │  📁 View Records                       │          │ │
│  │  │  View your medical records             │          │ │
│  │  └────────────────────────────────────────┘          │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

END (Success Path)
```

## Error Scenarios

### Scenario A: Wrong Wallet Selected

```
User selects Account 2 (Doctor wallet) instead of Account 3 (Patient wallet)

┌──────────────────────────────────────────────────────────────┐
│  ❌ VERIFICATION FAILS                                       │
│                                                              │
│  Step 3: Verify wallet matches                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ patient.walletAddress === connectedWallet?             │ │
│  │ "0xABCD...EF01" === "0x1234...5678"                    │ │
│  │ Result: NO MATCH! ❌                                    │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│  ❌ ERROR DISPLAYED                 │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ ⚠️ Error (red background)    │ │
│  │ Connected wallet does not    │ │
│  │ match registered patient     │ │
│  └───────────────────────────────┘ │
│                                     │
│  [Try Again] ← Click to reconnect  │
└─────────────────────────────────────┘

Solution: Click "Connect MetaMask" again and select correct account
```

### Scenario B: Invalid Patient ID

```
User enters "INVALID123" (not in blockchain)

┌──────────────────────────────────────────────────────────────┐
│  ❌ VERIFICATION FAILS                                       │
│                                                              │
│  Step 1: Check if patient exists                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ contract.methods.isPatientRegistered("INVALID123")     │ │
│  │ Result: false ❌                                        │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│  ❌ ERROR DISPLAYED                 │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ ⚠️ Error (red background)    │ │
│  │ Patient ID not found         │ │
│  └───────────────────────────────┘ │
│                                     │
│  [Try Again] ← Enter valid ID      │
└─────────────────────────────────────┘

Solution: Enter a valid registered patient ID
```

## State Diagram

```
┌──────────────┐
│   INITIAL    │ ← Page loads
│   STATE      │
└──────┬───────┘
       │
       │ User enters Patient ID
       ▼
┌──────────────┐
│  ID ENTERED  │
│  (waiting)   │
└──────┬───────┘
       │
       │ Click "Connect MetaMask"
       ▼
┌──────────────┐
│  CONNECTING  │ ← MetaMask popup shows
│   WALLET     │
└──────┬───────┘
       │
       │ User selects account
       ▼
┌──────────────┐
│   WALLET     │
│  CONNECTED   │ ← Wallet address displayed
└──────┬───────┘
       │
       │ Click "Login"
       ▼
┌──────────────┐
│  VERIFYING   │ ← Shows "Verifying..." on button
│              │
└──────┬───────┘
       │
       ├─── Success ──────► ┌──────────────┐
       │                    │  REDIRECTING │
       │                    │  to dashboard│
       │                    └──────────────┘
       │
       └─── Failure ──────► ┌──────────────┐
                            │ ERROR STATE  │
                            │ (show error) │
                            └──────┬───────┘
                                   │
                                   │ User fixes issue
                                   │
                                   ▼
                            Back to appropriate state
```

## Component State Flow

```javascript
// Initial State
{
  patientId: '',
  walletAddress: '',
  loading: false,
  error: ''
}

// After entering Patient ID
{
  patientId: 'P001',
  walletAddress: '',
  loading: false,
  error: ''
}

// After connecting wallet
{
  patientId: 'P001',
  walletAddress: '0xABCD...EF01',
  loading: false,
  error: ''
}

// During verification
{
  patientId: 'P001',
  walletAddress: '0xABCD...EF01',
  loading: true,  ← Button shows "Verifying..."
  error: ''
}

// Success - redirects immediately
// (no state change, navigates away)

// Error
{
  patientId: 'P001',
  walletAddress: '0xABCD...EF01',
  loading: false,
  error: 'Connected wallet does not match registered patient'
}
```

## Session Storage After Login

```javascript
// Browser Session Storage:
{
  'patientId': 'P001',
  'walletAddress': '0xABCDEF0123456789ABCDEF0123456789ABCDEF01'
}

// Patient Dashboard reads this:
const patientId = sessionStorage.getItem('patientId')  // 'P001'
const wallet = sessionStorage.getItem('walletAddress') // '0xABCD...'

// Used for all patient operations:
- View medical records
- Manage doctor access
- Update information
```

## Security Flow

```
┌─────────────────────────────────────────────────────────────┐
│  SECURITY CHECKPOINTS                                       │
└─────────────────────────────────────────────────────────────┘

Checkpoint 1: MetaMask Installed?
  │
  ├─ Yes → Continue
  └─ No  → Error: "Please install MetaMask first"

Checkpoint 2: User Connects Wallet?
  │
  ├─ Yes → Continue
  └─ No  → Error: "Please connect your wallet to continue"

Checkpoint 3: Patient ID Exists on Blockchain?
  │
  ├─ Yes → Continue
  └─ No  → Error: "Patient ID not found"

Checkpoint 4: Wallet Matches Registered Wallet?
  │
  ├─ Yes → LOGIN SUCCESS ✅
  └─ No  → Error: "Connected wallet does not match registered patient"

All 4 checkpoints must pass for successful login!
```

## Comparison: Doctor vs Patient Login Flow

```
DOCTOR LOGIN                         PATIENT LOGIN
═══════════════                      ═══════════════

Enter Doctor ID                      Enter Patient ID
       │                                    │
       ▼                                    ▼
Connect Wallet ──────────────────── Connect Wallet
(MetaMask popup)                     (MetaMask popup)
       │                                    │
       ▼                                    ▼
Verify Doctor Exists                 Verify Patient Exists
       │                                    │
       ▼                                    ▼
Check Wallet Match                   Check Wallet Match
       │                                    │
       ▼                                    ▼
Doctor Dashboard                     Patient Dashboard

IDENTICAL FLOW! ✅
```

This ensures consistency and makes the system easier to understand and maintain!
