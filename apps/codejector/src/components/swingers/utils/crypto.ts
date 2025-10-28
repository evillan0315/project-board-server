import CryptoJS from 'crypto-js';

const SECRET_PASSPHRASE: string = `${import.meta.env.VITE_SLS_API_KEY}`;

/**
 * Encrypts a plaintext string using AES-256 and the shared passphrase.
 * @param text The string to encrypt.
 * @returns The encrypted string (includes IV, Salt, and Ciphertext).
 */
export function encrypt(text: string): string {
  // Use AES for encryption. The result is a 'CipherParams' object, 
  // which when converted to a string, includes the IV and Salt.
  const encrypted: CryptoJS.lib.CipherParams = CryptoJS.AES.encrypt(
    text, 
    SECRET_PASSPHRASE
  );
  
  // Return the string representation (Base64-encoded by default)
  return encrypted.toString();
}

/**
 * Decrypts a string that was encrypted with the `encrypt` function 
 * using the same passphrase.
 * @param encryptedText The encrypted string (CipherParams object as a string).
 * @returns The original plaintext string.
 */
export function decrypt(encryptedText: string): string {
  // 1. Decrypt the text. crypto-js automatically extracts the IV and Salt 
  // from the input string for decryption.
  const bytes: CryptoJS.lib.WordArray = CryptoJS.AES.decrypt(
    encryptedText, 
    SECRET_PASSPHRASE
  );
  
  // 2. Convert the resulting WordArray (bytes) back to a UTF-8 string.
  const decryptedText: string = bytes.toString(CryptoJS.enc.Utf8);
  
  return decryptedText;
}

// --- Usage Example ---
/*
const originalData: string = 'This message must be kept secret.';
const ciphertext: string = encrypt(originalData);

console.log('Original:', originalData);
console.log('Encrypted:', ciphertext);

const plaintext: string = decrypt(ciphertext);
console.log('Decrypted:', plaintext); // Should be 'This message must be kept secret.'
*/