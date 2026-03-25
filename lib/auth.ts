export async function validatePatientCredentials(id: string, password: string) {
  try {
    const stored = localStorage.getItem(`patient_${id}`);
    if (!stored) return false;

    const credentials = JSON.parse(stored);
    const hashedInput = await hashPassword(password);
    return credentials.password === hashedInput;
  } catch (error) {
    console.error('Validation error:', error);
    return false;
  }
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
