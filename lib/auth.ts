import { EncryptJWT, jwtDecrypt } from 'jose';

const getSecretKey = (): Uint8Array => {
  const keyString = process.env.STUDENTVUE_ENCRYPTION_KEY;
  if (!keyString) {
    throw new Error('STUDENTVUE_ENCRYPTION_KEY environment variable is required');
  }
  
  if (keyString.length > 32 && keyString.includes('=') || keyString.includes('+') || keyString.includes('/')) {
    try {
      const decoded = Buffer.from(keyString, 'base64');
      if (decoded.length !== 32) {
        throw new Error(`Invalid key length: expected 32 bytes, got ${decoded.length} bytes`);
      }
      return new Uint8Array(decoded);
    } catch (error) {
      throw new Error(`Failed to decode base64 key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  const encoded = new TextEncoder().encode(keyString);
  if (encoded.length !== 32) {
    throw new Error(`Invalid key length: expected 32 bytes, got ${encoded.length} bytes`);
  }
  return encoded;
};

const SECRET_KEY = getSecretKey();

const COOKIE_NAME = '__Host-sv_auth';
const ALGORITHM = 'A256GCM';

const TOKEN_EXPIRY = 2 * 24 * 60 * 60;

export interface StudentCredentials {
  username: string;
  password: string;
  district_url: string;
}

export interface TokenPayload {
  username: string;
  password: string;
  district_url: string;
  iat: number;
  exp: number;
  jti: string;
}

function generateJTI(): string {
  return crypto.randomUUID();
}

export async function encryptCredentials(credentials: StudentCredentials): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    username: credentials.username,
    password: credentials.password,
    district_url: credentials.district_url,
    iat: now,
    exp: now + TOKEN_EXPIRY,
    jti: generateJTI(),
  };

  const jwt = await new EncryptJWT(payload)
    .setProtectedHeader({ alg: 'dir', enc: ALGORITHM })
    .setIssuedAt(now)
    .setExpirationTime(now + TOKEN_EXPIRY)
    .setJti(payload.jti)
    .encrypt(SECRET_KEY);

  return jwt;
}

export async function decryptCredentials(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtDecrypt(token, SECRET_KEY);
    
    if (!payload.username || !payload.password || !payload.district_url) {
      return null;
    }

    return {
      username: payload.username as string,
      password: payload.password as string,
      district_url: payload.district_url as string,
      iat: payload.iat as number,
      exp: payload.exp as number,
      jti: payload.jti as string,
    };
  } catch (error) {
    console.warn('Token decryption failed:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

export function createAuthCookie(token: string): string {
  const maxAge = TOKEN_EXPIRY;
  return `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
}

export function createLogoutCookie(): string {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}

export async function getCredentialsFromRequest(request: Request): Promise<StudentCredentials | null> {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [name, value] = cookie.trim().split('=');
    acc[name] = value;
    return acc;
  }, {} as Record<string, string>);

  const token = cookies[COOKIE_NAME];
  if (!token) {
    return null;
  }

  const payload = await decryptCredentials(token);
  if (!payload) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) {
    return null;
  }

  return {
    username: payload.username,
    password: payload.password,
    district_url: payload.district_url,
  };
}

export async function rotateToken(credentials: StudentCredentials): Promise<string> {
  return await encryptCredentials(credentials);
}