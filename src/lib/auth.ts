import { jwtVerify, SignJWT } from "jose";

interface JwtPayload {
  userId: string;
  role: string;
}

export const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET_KEY || "super-secret-key-for-spacemanager-2026";
  return new TextEncoder().encode(secret);
};

export async function verifyJwtToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    return payload as unknown as JwtPayload;
  } catch (error) {
    return null;
  }
}

export async function signJwtToken(payload: JwtPayload) {
  const secret = getJwtSecretKey();
  const alg = 'HS256';
  
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime('1d')
    .sign(secret);
}
