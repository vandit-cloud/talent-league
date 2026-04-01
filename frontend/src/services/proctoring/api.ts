import { getApiUrl } from '../../lib/api/base';

/**
 * Phase 5+ — Backend API integration
 * Syncs session, violations, risk events with backend
 */

const API_BASE = getApiUrl('/proctoring');

export async function createSessionOnBackend(session: {
  sessionId: string;
  userId: string;
  baselineRiskScore: number;
  currentRiskScore: number;
  status: string;
  referenceImagesEncrypted: string;
  signedToken: string;
}): Promise<void> {
  try {
    await fetch(`${API_BASE}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(session),
    });
  } catch {
    // Backend may be offline
  }
}

export async function recordViolationOnBackend(data: {
  sessionId: string;
  type: string;
  severity: string;
  description?: string;
}): Promise<void> {
  try {
    await fetch(`${API_BASE}/violations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch {
    // Backend may be offline
  }
}

export async function recordRiskEventOnBackend(data: {
  sessionId: string;
  signalSource: string;
  weight: number;
  scoreDelta: number;
}): Promise<void> {
  try {
    await fetch(`${API_BASE}/risk-events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch {
    // Backend may be offline
  }
}

export async function heartbeatToBackend(sessionId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/heartbeat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    const data = await res.json();
    return data?.ok === true;
  } catch {
    return false;
  }
}
