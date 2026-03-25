# Testing the Patient Login Feature

## Prerequisites
- ✅ Next.js server running on http://localhost:3003
- ✅ MetaMask extension installed
- ✅ At least 2 accounts in MetaMask (to test account selection)
- ✅ A registered patient in the blockchain

## Test Scenarios

### Scenario 1: Successful Login ✅

**Steps:**
1. Navigate to `http://localhost:3003/patient/login`
2. Enter a valid Patient ID (e.g., "P001" or whatever ID was registered)
3. Click "Connect MetaMask" button
4. **Expected:** MetaMask popup appears showing all available accounts
5. Select the patient's registered account
6. **Expected:** Wallet address appears (e.g., "Connected: 0x1234...5678")
7. Click "Login" button
8. **Expected:** Redirects to `/patient/dashboard`
9. **Expected:** Patient dashboard shows without errors

**Success Criteria:**
- ✅ MetaMask popup shows account selection
- ✅ Can switch between accounts in popup
- ✅ Connected wallet displays on page
- ✅ Login button enables after wallet connection
- ✅ Successfully redirects to dashboard

---

### Scenario 2: Wrong Wallet Selected ❌

**Steps:**
1. Navigate to `http://localhost:3003/patient/login`
2. Enter a valid Patient ID (e.g., "P001")
3. Click "Connect MetaMask"
4. **Select a DIFFERENT account** (not the patient's registered wallet)
5. Click "Login"

**Expected Behavior:**
- ❌ Error message appears: "Connected wallet does not match registered patient"
- ❌ Does NOT redirect to dashboard
- ✅ Can try again with correct wallet

---

### Scenario 3: Invalid Patient ID ❌

**Steps:**
1. Navigate to `http://localhost:3003/patient/login`
2. Enter an invalid Patient ID (e.g., "INVALID123")
3. Click "Connect MetaMask"
4. Select any account
5. Click "Login"

**Expected Behavior:**
- ❌ Error message appears: "Patient ID not found"
- ❌ Does NOT redirect to dashboard

---

### Scenario 4: No MetaMask Installed ❌

**Steps:**
1. Disable MetaMask extension or use browser without MetaMask
2. Navigate to `http://localhost:3003/patient/login`
3. Enter Patient ID
4. Click "Connect MetaMask"

**Expected Behavior:**
- ❌ Error message appears: "Please install MetaMask first"

---

### Scenario 5: User Rejects Connection ❌

**Steps:**
1. Navigate to `http://localhost:3003/patient/login`
2. Enter valid Patient ID
3. Click "Connect MetaMask"
4. When MetaMask popup appears, click "Cancel" or "Reject"

**Expected Behavior:**
- ❌ Error message appears: "Please connect your wallet to continue"
- ✅ Wallet address NOT shown
- ✅ Login button remains disabled

---

### Scenario 6: Empty Patient ID ❌

**Steps:**
1. Navigate to `http://localhost:3003/patient/login`
2. Leave Patient ID field empty
3. Click "Connect MetaMask"
4. Connect wallet
5. Try to click "Login"

**Expected Behavior:**
- ❌ Browser validation shows "Please fill out this field"
- ❌ Form does not submit

---

### Scenario 7: Account Switching ✅

**Steps:**
1. Navigate to `http://localhost:3003/patient/login`
2. Enter Patient ID
3. Click "Connect MetaMask"
4. Select Account 1
5. Click "Connect MetaMask" again
6. **Expected:** New popup appears (can select different account)
7. Select Account 2

**Expected Behavior:**
- ✅ Wallet address updates to new account
- ✅ Can switch accounts before logging in
- ✅ Login uses the latest selected account

---

## UI/UX Checklist

### Visual Elements:
- [ ] Page has green theme (bg-green-50, text-green-800)
- [ ] "Patient Login" title is visible and styled
- [ ] Patient ID input field is labeled
- [ ] Wallet Connection section is labeled
- [ ] Connect MetaMask button is green (bg-green-600)
- [ ] Connected wallet address is truncated (0x1234...5678)
- [ ] Connected wallet has green background (bg-green-100)
- [ ] Error messages have red background (bg-red-50)
- [ ] Login button is disabled when no wallet connected
- [ ] Login button shows "Verifying..." during login process

### Responsive Design:
- [ ] Looks good on desktop (max-w-md centered)
- [ ] Looks good on mobile (responsive padding)
- [ ] Card is properly centered
- [ ] Buttons are full width

### Accessibility:
- [ ] Input has proper label (htmlFor="patientId")
- [ ] Form can be submitted with Enter key
- [ ] Tab navigation works correctly
- [ ] Error messages are clearly visible

---

## Comparison with Doctor/Admin Login

### Test the Same Flow:

1. **Doctor Login**: Navigate to `/doctor/login`
   - Same MetaMask popup behavior ✅
   - Same wallet display ✅
   - Same error handling ✅

2. **Admin Login**: Navigate to `/admin/login`
   - Same MetaMask popup behavior ✅
   - Same wallet display ✅
   - Same error handling ✅

3. **Patient Login**: Navigate to `/patient/login`
   - Same MetaMask popup behavior ✅
   - Same wallet display ✅
   - Same error handling ✅

**All three should behave identically!**

---

## Browser Console Testing

Open browser DevTools (F12) and check:

### Successful Login:
```
✅ No errors in console
✅ "Login successful" or similar message
✅ Session storage contains:
   - patientId
   - walletAddress
```

### Failed Login:
```
❌ Error logged with clear message
❌ "Login error:" followed by reason
✅ Session storage is empty
```

---

## MetaMask Popup Behavior

### What Should Happen:

1. **First Click on "Connect MetaMask":**
   ```
   MetaMask Popup Shows:
   - "Connect with MetaMask"
   - List of all available accounts
   - Checkbox for each account
   - "Next" button
   - "Cancel" button
   ```

2. **Account Selection:**
   ```
   - Can scroll through accounts
   - Can select multiple accounts
   - Selected account(s) highlighted
   - Click "Next" → Click "Connect"
   ```

3. **Subsequent Clicks:**
   ```
   - Shows same popup
   - Allows changing account selection
   - Updates wallet address on selection
   ```

---

## Test Data Needed

You need at least one registered patient:

```javascript
// Example registered patient data:
{
  patientId: "P001",
  walletAddress: "0x1234...5678", // Must match MetaMask account
  registered: true
}
```

### How to Register Test Patient (Admin Dashboard):
1. Login as admin
2. Go to "Register Doctor" (if not already done)
3. Go to "Register Patient"
4. Enter:
   - Patient ID: P001
   - Doctor ID: (registered doctor)
   - Patient Wallet: (copy from MetaMask)
   - Other required fields
5. Submit

---

## Quick Test Commands

### Check Session Storage (Browser Console):
```javascript
// After successful login:
console.log(sessionStorage.getItem('patientId'))
// Should show: "P001" or your patient ID

console.log(sessionStorage.getItem('walletAddress'))
// Should show: "0x1234567890abcdef..."

// Clear session (to test login again):
sessionStorage.clear()
```

### Check Connected Account (Browser Console):
```javascript
// Check currently connected MetaMask account:
window.ethereum.request({ method: 'eth_accounts' })
  .then(accounts => console.log('Connected:', accounts[0]))
```

---

## Expected Error Messages

| Scenario | Error Message |
|----------|---------------|
| No MetaMask | "Please install MetaMask first" |
| User rejects | "Please connect your wallet to continue" |
| No wallet | "Please connect your wallet first" |
| Invalid ID | "Patient ID not found" |
| Wrong wallet | "Connected wallet does not match registered patient" |
| General error | "Login failed" |

---

## Performance Checklist

- [ ] Page loads quickly (< 1 second)
- [ ] MetaMask popup appears immediately on click
- [ ] Wallet connection is instant (< 0.5 seconds)
- [ ] Login verification completes in < 3 seconds
- [ ] No UI freezing during verification
- [ ] Redirect to dashboard is smooth

---

## Success Metrics

✅ **All tests pass** = Patient login is working correctly!

### Minimum Requirements:
1. ✅ MetaMask popup appears with account selection
2. ✅ Can select specific patient account
3. ✅ Wallet address displays after connection
4. ✅ Login succeeds with correct credentials
5. ✅ Login fails with wrong credentials
6. ✅ Redirects to patient dashboard on success
7. ✅ No changes to admin/doctor workflows

---

## Troubleshooting

### Issue: MetaMask popup doesn't appear
**Solution:** Check if MetaMask is installed and unlocked

### Issue: "Cannot read property 'walletAddress'"
**Solution:** Patient ID doesn't exist in blockchain - register first

### Issue: Login succeeds but dashboard shows error
**Solution:** Check sessionStorage has both patientId and walletAddress

### Issue: Wrong account auto-selected
**Solution:** That's why we added wallet_requestPermissions - it forces selection popup!

---

## Next Steps After Testing

Once all tests pass:
1. ✅ Patient login is complete
2. ✅ Ensure patient dashboard reads sessionStorage
3. ✅ Test full patient workflow (view records, manage access)
4. ✅ Test switching between different patient accounts

---

## Demo Video Script

**Ideal demonstration:**
1. Show login page with green theme
2. Enter patient ID "P001"
3. Click "Connect MetaMask"
4. Show MetaMask popup with multiple accounts
5. Select wrong account first → Show error
6. Click "Connect MetaMask" again
7. Select correct patient account
8. Show connected wallet address
9. Click "Login"
10. Show successful redirect to dashboard
11. Show sessionStorage with patient data

**Narration:**
"The patient login now works exactly like doctor and admin login, with a MetaMask popup that lets you choose the specific patient account before logging in. This ensures security and prevents using the wrong wallet by accident."
