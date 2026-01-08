import crypto from "crypto";

// Zego Token Generation - Official Implementation
export function generateToken04(
  appId: number,
  userId: string,
  serverSecret: string,
  effectiveTimeInSeconds: number,
  payloadExpireTimeInSeconds: number,
  payload: string
): string {
  try {
    // Header
    const header = {
      alg: "HS256",
      typ: "JWT"
    };

    // Payload
    const now = Math.floor(Date.now() / 1000);
    const jwtPayload = {
      iss: appId,
      exp: payloadExpireTimeInSeconds,
      iat: now,
      aud: "zegocloud",
      jti: generateRandomString(32),
      payload: payload
    };

    // Encode
    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(jwtPayload));
    
    // Sign
    const signature = crypto
      .createHmac('sha256', serverSecret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  } catch (error) {
    console.error('Token generation error:', error);
    throw new Error(`Failed to generate token: ${error}`);
  }
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}