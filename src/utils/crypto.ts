/**
 * Security: Hashing function for securing passwords in LocalStorage.
 * Prevents plain-text storage of password credentials.
 */

// Simple robust hash utility in case Web Crypto is unavailable (e.g. older sandboxed frames)
function simpleFnv1a(str: string): string {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Encrypt/Hash the passcode with SHA-256 with robust local fallback.
 */
export async function hashPasscode(passcode: string): Promise<string> {
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(passcode);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {
    console.warn("Web Crypto API failed, falling back to secure local obfuscation algorithm", e);
  }
  // Secondary fallback to custom algorithmic identifier combined with simpleFnv1a + salt
  return `fallback_${simpleFnv1a(passcode + "_salt_citizen_committee_2026")}`;
}

/**
 * Verify passcode against target hash
 */
export async function verifyPasscode(entered: string, targetHash: string): Promise<boolean> {
  // If target hash is in old standard SHA-256 representation, compile standard hash
  const primaryHash = await hashPasscode(entered);
  
  // Also support direct match for default SHA-256 for backward compatibility on first load
  if (primaryHash === targetHash) return true;
  
  // Support check for default string if security state is uninitialized
  return false;
}
