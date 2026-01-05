import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits

// Get encryption key from environment variable
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }
  
  // If key is hex string, convert to buffer
  if (key.length === 64) {
    return Buffer.from(key, 'hex');
  }
  
  // Otherwise, hash the key to get consistent 32-byte key
  return crypto.createHash('sha256').update(key).digest();
}

/**
 * Encrypt message content
 */
export function encryptMessage(content: string): { content: string; contentIv: string } {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(content, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return {
    content: encrypted,
    contentIv: iv.toString('hex')
  };
}

/**
 * Decrypt message content
 */
export function decryptMessage(encryptedContent: string, iv: string): string {
  const key = getEncryptionKey();
  const ivBuffer = Buffer.from(iv, 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer);
  let decrypted = decipher.update(encryptedContent, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Encrypt file URL
 */
export function encryptFileUrl(url: string): { fileUrl: string; fileUrlIv: string } {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(url, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return {
    fileUrl: encrypted,
    fileUrlIv: iv.toString('hex')
  };
}

/**
 * Decrypt file URL
 */
export function decryptFileUrl(encryptedUrl: string, iv: string): string {
  const key = getEncryptionKey();
  const ivBuffer = Buffer.from(iv, 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer);
  let decrypted = decipher.update(encryptedUrl, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Decrypt file URL with combined format (iv:encrypted)
 */
export function decryptCombinedFileUrl(combinedUrl: string): string {
  const [ivHex, encryptedData] = combinedUrl.split(':');
  return decryptFileUrl(encryptedData, ivHex);
}

/**
 * Encrypt filename
 */
export function encryptFileName(fileName: string): { fileName: string; fileNameIv: string } {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(fileName, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return {
    fileName: encrypted,
    fileNameIv: iv.toString('hex')
  };
}

/**
 * Decrypt filename
 */
export function decryptFileName(encryptedFileName: string, iv: string): string {
  const key = getEncryptionKey();
  const ivBuffer = Buffer.from(iv, 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer);
  let decrypted = decipher.update(encryptedFileName, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Decrypt message content (simplified version for API compatibility)
 */
export function decrypt(encryptedContent: string, iv: string): string {
  return decryptMessage(encryptedContent, iv);
}
/**
 * Generate a new encryption key (for setup)
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}