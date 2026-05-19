import { SignJWT, jwtVerify } from "jose";
import type { Bindings } from "../types/bindings";

const encoder = new TextEncoder();
const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 256;

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
};

type JwtUserPayload = {
  sub?: string;
  email?: string;
  name?: string | null;
};

const toBase64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const fromBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "="
  );
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
};

const constantTimeEqual = (left: Uint8Array, right: Uint8Array) => {
  if (left.length !== right.length) {
    return false;
  }

  let diff = 0;

  for (let index = 0; index < left.length; index += 1) {
    diff |= left[index] ^ right[index];
  }

  return diff === 0;
};

const derivePasswordHash = async (password: string, salt: Uint8Array) => {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations: PBKDF2_ITERATIONS,
    },
    keyMaterial,
    KEY_LENGTH
  );

  return new Uint8Array(derivedBits);
};

const getJwtKey = (secret: string) => encoder.encode(secret);

export const hashPassword = async (password: string) => {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePasswordHash(password, salt);

  return `pbkdf2_sha256$${PBKDF2_ITERATIONS}$${toBase64Url(salt)}$${toBase64Url(hash)}`;
};

export const verifyPassword = async (
  password: string,
  storedHash: string
) => {
  const parts = storedHash.split("$");

  if (parts.length !== 4 || parts[0] !== "pbkdf2_sha256") {
    return false;
  }

  const [, iterationString, encodedSalt, encodedHash] = parts;
  const iterations = Number.parseInt(iterationString, 10);

  if (iterations !== PBKDF2_ITERATIONS) {
    return false;
  }

  const salt = fromBase64Url(encodedSalt);
  const expectedHash = fromBase64Url(encodedHash);
  const actualHash = await derivePasswordHash(password, salt);

  return constantTimeEqual(actualHash, expectedHash);
};

export const createAuthToken = async (
  user: AuthUser,
  env: Pick<Bindings, "JWT_SECRET_KEY" | "JWT_ISSUER" | "JWT_EXPIRES_IN">
) => {
  return new SignJWT({
    email: user.email,
    name: user.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuer(env.JWT_ISSUER)
    .setIssuedAt()
    .setExpirationTime(env.JWT_EXPIRES_IN || "7d")
    .sign(getJwtKey(env.JWT_SECRET_KEY));
};

export const verifyAuthToken = async (
  token: string,
  env: Pick<Bindings, "JWT_SECRET_KEY" | "JWT_ISSUER">
) => {
  const { payload } = await jwtVerify<JwtUserPayload>(
    token,
    getJwtKey(env.JWT_SECRET_KEY),
    {
      issuer: env.JWT_ISSUER,
    }
  );

  if (!payload.sub || !payload.email) {
    throw new Error("Token payload is missing required claims");
  }

  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name ?? null,
  };
};
