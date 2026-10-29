/**
 * Hashing utility for administrative authentication
 * Uses native Web Crypto API (SubtleCrypto - SHA-256)
 * Prevents plain-text password exposure in the client bundle.
 */

// SHA-256 hash of "Excellence@0246"
export const ADMIN_AUTH_HASH = 'a76c32cfff9a563310755853e45f48608668e410cf6609b710a37b106796d61f';

export async function hashStringSHA256(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyAdminPasscode(inputPassword: string): Promise<boolean> {
  if (!inputPassword) return false;
  const hashedInput = await hashStringSHA256(inputPassword);
  return hashedInput === ADMIN_AUTH_HASH;
}
