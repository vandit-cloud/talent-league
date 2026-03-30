# Enterprise Remote Proctoring System — Architecture

## Phase 0 — Identity Capture & Trigger ✅
- **Location**: `CandidateVerification.tsx`, `services/proctoring/session.ts`
- Multi-angle face capture (front, left, right)
- Encrypted storage (AES-GCM + PBKDF2)
- Signed session token generation
- Baseline risk score = 0
- Transition to `/take-exam`

## Phase 1 — Client Monitoring Layer ✅
- **Location**: `services/proctoring/clientMonitor.ts`, `ProctoringWrapper.tsx`
- Tab switching detection
- Window blur detection
- Fullscreen enforcement
- Copy/paste blocking
- Right-click blocking
- DevTools key block (F12, Ctrl+Shift+I)
- Visibility change tracking

## Phase 2 — Network & Location Security ✅
- **Location**: `services/proctoring/networkSecurity.ts`
- Geo-IP lookup (ipify)
- IP change detection (60s interval)
- Risk +30 on IP change

## Phase 3 — Real-Time Monitoring Engine ✅
- **Location**: `services/proctoring/realtimeEngine.ts`
- WebSocket metadata transmission (when server URL provided)
- Client-side event emission
- Session start event

## Phase 4 — Weighted Risk Scoring Engine ✅
- **Location**: `services/proctoring/riskEngine.ts`, `types.ts`
- Event weights: tab_switch 15, devtools 25, fullscreen_exit 20, etc.
- Thresholds: 0–30 Normal, 31–60 Soft Warning, 61–80 Hard Warning, 81–100 Terminated
- Automatic termination at 81+

## Phase 5 — Backend Services ✅
- **Location**: `backend/`
- `POST /api/proctoring/sessions` — create session
- `GET /api/proctoring/sessions/:id` — get session
- `POST /api/proctoring/sessions/:id/risk` — update risk score
- `POST /api/proctoring/violations` — record violation
- `POST /api/proctoring/risk-events` — record risk event
- `POST /api/proctoring/heartbeat` — session heartbeat (15s)

## Phase 6 — Data Architecture ✅
- **Models**: `ProctoringSession`, `Violation`, `RiskEvent`
- Sessions: sessionId, userId, status, risk scores
- Violations: type, severity, timestamp
- Risk Events: signalSource, weight, scoreDelta

## Phase 7 — Data Flow Pipeline ✅
1. Candidate verification → encrypted photos, session created
2. Take exam → ProctoringWrapper initializes monitors
3. Events → clientMonitor emits → riskEngine updates score → API syncs
4. Threshold breach → terminated UI, redirect to results

## Phase 8 — Auth & Session Lifecycle ✅
- Session states: active, warning, suspended, terminated, completed
- Heartbeat every 15s
- Token stored in session

## Phase 9–10 — Scalability & Security
- Backend is Express + MongoDB (existing)
- CORS enabled
- For production: add rate limiting, RBAC, TLS, WebRTC server
