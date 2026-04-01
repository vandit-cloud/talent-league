/**
 * Enterprise Remote Proctoring System — Types
 * Phase 0+ architecture
 */

export type RiskLevel = "normal" | "soft_warning" | "hard_warning" | "terminated";

export interface VerificationPhotos {
  front: string;
  left: string;
  right: string;
}

export interface ProctoringSession {
  sessionId: string;
  userId: string;
  createdAt: number;
  baselineRiskScore: number;
  currentRiskScore: number;
  status: "active" | "warning" | "suspended" | "terminated" | "completed";
  referenceImagesEncrypted: string;
  signedToken: string;
}

export const RISK_THRESHOLDS = {
  NORMAL_MAX: 30,
  SOFT_WARNING_MAX: 60,
  HARD_WARNING_MAX: 80,
  TERMINATED: 100,
} as const;
