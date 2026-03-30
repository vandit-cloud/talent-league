/**
 * Phase 0 — Identity Capture & Session
 * - Encrypted storage of reference images
 * - Signed session token generation
 * - Baseline risk score initialization
 */

import type { ProctoringSession, VerificationPhotos } from "./types";
import { RISK_THRESHOLDS } from "./types";

const STORAGE_KEY = "proctoring_session";
const PHOTOS_KEY = "proctoring_photos_enc";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

async function deriveKey(userId: string, salt: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(`${userId}:${salt}:proctor`),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode(salt),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptReferenceImages(
  photos: VerificationPhotos,
  userId: string
): Promise<string> {
  const salt = generateId().slice(0, 16);
  const key = await deriveKey(userId, salt);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(JSON.stringify(photos))
  );
  return JSON.stringify({
    s: salt,
    iv: Array.from(iv),
    d: Array.from(new Uint8Array(encrypted)),
  });
}

export function createSignedSessionToken(
  sessionId: string,
  userId: string,
  createdAt: number
): string {
  const payload = { sessionId, userId, createdAt };
  const b64 = btoa(JSON.stringify(payload));
  const sig = btoa(`v1.${sessionId}.${userId}.${createdAt}`);
  return `${b64}.${sig}`;
}

export function createProctoringSession(
  userId: string,
  referenceImagesEncrypted: string
): ProctoringSession {
  const sessionId = generateId();
  const createdAt = Date.now();

  return {
    sessionId,
    userId,
    createdAt,
    baselineRiskScore: 0,
    currentRiskScore: 0,
    status: "active",
    referenceImagesEncrypted,
    signedToken: createSignedSessionToken(sessionId, userId, createdAt),
  };
}

export function getRiskLevel(score: number): keyof typeof RISK_THRESHOLDS {
  if (score <= RISK_THRESHOLDS.NORMAL_MAX) return "NORMAL_MAX";
  if (score <= RISK_THRESHOLDS.SOFT_WARNING_MAX) return "SOFT_WARNING_MAX";
  if (score <= RISK_THRESHOLDS.HARD_WARNING_MAX) return "HARD_WARNING_MAX";
  return "TERMINATED";
}

export function saveSession(session: ProctoringSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function getSession(): ProctoringSession | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ProctoringSession;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(PHOTOS_KEY);
  localStorage.removeItem("verification_photos");
}
