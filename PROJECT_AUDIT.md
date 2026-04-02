# TalentLeague - Project Audit Report

**Date:** 2026-04-02  
**Auditor:** Claude Opus 4.6  
**Scope:** Full frontend + backend codebase review

---

## Summary

| Category | Critical | High | Medium | Low |
|----------|----------|------|--------|-----|
| Security | 2 | 2 | 3 | - |
| UI/UX | - | 2 | 3 | 1 |
| Features | - | 1 | 2 | - |
| Performance | - | - | 3 | 1 |
| Accessibility | - | - | 2 | 1 |
| Code Quality | - | - | 2 | 3 |
| Testing | - | 1 | - | - |
| **Total** | **2** | **6** | **15** | **6** |

---

## 1. CRITICAL SECURITY ISSUES

### 1.1 Exposed Secrets in .env File
- **Severity:** CRITICAL
- **Location:** `backend/.env`
- **Issue:** Real credentials committed to GitHub repository:
  - MongoDB URI with production connection string
  - GROQ API Key
  - Gemini API Key
  - Gmail credentials (email + app password)
  - Google OAuth Client ID & Secret
  - LinkedIn OAuth Client ID & Secret
- **Impact:** Anyone with repo access can steal database and API credentials
- **Fix:** Add `.env` to `.gitignore`, create `.env.example` with placeholder values, rotate all exposed keys immediately

### 1.2 CORS Allows All Origins
- **Severity:** CRITICAL
- **Location:** `backend/server.js` lines 38-42
- **Issue:** CORS fallback allows ANY origin:
  ```javascript
  } else {
      callback(null, true); // Allow all for now to debug
  }
  ```
- **Impact:** Any website can make authenticated requests to the API (CSRF attacks)
- **Fix:** Remove the fallback `callback(null, true)` and only allow specific whitelisted origins

---

## 2. HIGH PRIORITY ISSUES

### 2.1 MCQ Test Submission Endpoints Are Public
- **Location:** `backend/routes/mcqRoutes.js` lines 24-27
- **Issue:** `/mcq/submit/:token`, `/mcq/phase2-submit/:token` have no JWT auth middleware
- **Impact:** Anyone with a test token can submit answers or fake scores
- **Fix:** Add token ownership validation before accepting submissions

### 2.2 OAuth returnUrl Not Validated
- **Location:** `frontend/src/pages/OAuthCallback.tsx`
- **Issue:** `returnUrl` from query params used in `navigate()` without checking it's a safe internal URL
- **Impact:** Open redirect vulnerability - attacker could redirect users to malicious sites
- **Fix:** Validate returnUrl against a whitelist of internal routes

### 2.3 Seven Empty Placeholder Pages in Navigation
- **Pages:** Analytics, Anti-Cheating Monitor, JD Intelligence, Mission Control, Resume Intelligence, Notifications, Skill Matching
- **Issue:** All accessible from sidebar but only show "Coming soon..." text
- **Impact:** Users see broken/empty pages, hurts credibility
- **Fix:** Either implement or remove from navigation until ready

### 2.4 Placeholder Pages Break in Dark Mode
- **Pages:** Same 7 pages listed above + ErrorBoundary component
- **Issue:** Hardcoded light theme colors (`bg-gray-50`, `text-gray-900`) with no `dark:` variants
- **Impact:** Unreadable text/backgrounds when dark mode is active
- **Fix:** Add `dark:bg-slate-900 dark:text-white` variants to all placeholder pages

### 2.5 No Test Coverage
- **Issue:** Zero test files in entire project (no Jest, Vitest, or any testing framework)
- **Impact:** No way to catch regressions; critical auth/registration flows untested
- **Fix:** Add tests for auth middleware, registration validation, login flow, MCQ submission

---

## 3. MEDIUM PRIORITY ISSUES

### 3.1 alert() Used Instead of Toast Notifications
- **Location:** Login.tsx (lines 82, 89), Signup.tsx (lines 87, 93), Candidates.tsx (lines 26, 49, 52, 65)
- **Issue:** Browser `alert()` blocks entire UI and feels unprofessional
- **Fix:** Replace with in-page toast/snackbar component (e.g., react-hot-toast or custom)

### 3.2 Console.logs in Production Code
- **Count:** 20+ instances across frontend and backend
- **Locations:**
  - `backend/authController.js` line 246: Logs registration data
  - `backend/examController.js` lines 11, 13, 47, 56: Logs questions and analysis
  - `backend/server.js` line 54: Logs every HTTP request
  - `frontend/CandidateVerification.tsx`: 11+ debug logs
  - `frontend/EnterpriseFaceEngine.tsx`: Multiple debug logs
  - `frontend/MCQTest.tsx`: Data logging
- **Fix:** Remove all console.logs or wrap with `process.env.NODE_ENV === 'development'` check

### 3.3 Test/Debug Routes Active in Production
- **Location:** `backend/server.js`
- **Routes:**
  - `GET /test` - Returns API key status (Present/Missing)
  - `GET /diagnostic` - Returns backend URLs and user agent info
  - OAuth sandbox endpoints for simulated login
- **Fix:** Disable or remove these routes in production builds

### 3.4 No Input Sanitization on Backend
- **Issue:** Name, email, company name, notes fields stored directly without sanitization
- **Risk:** NoSQL injection, stored XSS if data is rendered in HTML emails or frontend
- **Fix:** Add validation/sanitization library (joi, express-validator, or sanitize-html)

### 3.5 No Pagination on Data Endpoints
- **Endpoints affected:** `GET /api/jobs`, `GET /api/mcq/all`, `GET /api/interviews`, `GET /api/assessment-templates`
- **Issue:** All return full dataset without limit/offset
- **Impact:** Performance degrades with large datasets; slow page loads
- **Fix:** Add `?page=1&limit=20` query params to all list endpoints

### 3.6 localStorage Stores Auth Token Unencrypted
- **Location:** `frontend/src/context/AuthContext.tsx`
- **Issue:** JWT token stored in plain localStorage, accessible to any XSS attack
- **Fix:** Use httpOnly cookies for auth tokens (requires backend cookie support)

### 3.7 Missing Loading States on Several Pages
- **Pages:** RecruiterDashboard (fetches stats without spinner), Candidates page, Assessment pages
- **Issue:** Data appears suddenly after fetch completes; no visual feedback during loading
- **Fix:** Add skeleton loaders or spinner components while data loads

### 3.8 Missing Error States
- **Issue:** When API calls fail, most pages silently fail or show nothing
- **Pages affected:** Dashboard, CompanyApprovals, RecruiterCandidateDetails
- **Fix:** Add "Something went wrong. Retry?" UI for failed API calls

### 3.9 No Offline Detection
- **Issue:** Frontend doesn't detect when backend is unreachable
- **Impact:** Users see confusing errors instead of "You appear to be offline"
- **Fix:** Add network status detection with user-friendly offline banner

### 3.10 Inconsistent Error Responses from Backend
- **Issue:** Some endpoints return `{ message: error.message }` which exposes internal stack traces
- **Example:** `examController.js` line 52 returns raw error details
- **Fix:** Standardize error format; never expose raw error messages in production

### 3.11 Missing ARIA Labels
- **Elements:** Icon-only buttons (notifications bell, theme toggle, settings gear, sidebar collapse)
- **Impact:** Screen readers can't describe button purpose
- **Fix:** Add `aria-label` to all icon-only interactive elements

### 3.12 Color Contrast Concerns
- **Issue:** Light gray text (#94a3b8) on white backgrounds may not meet WCAG 2.1 AA contrast ratio (4.5:1)
- **Locations:** Muted text across Dashboard, CompanyApprovals, RecruiterDashboard
- **Fix:** Run WCAG contrast checker; darken muted text colors

---

## 4. LOW PRIORITY ISSUES

### 4.1 Sidebar Doesn't Work on Mobile (Touch Devices)
- **Location:** `CandidateLayout.tsx`, `RecruiterLayout.tsx`
- **Issue:** Uses `hover:w-72` to expand sidebar, which doesn't work on touch screens
- **Fix:** Add hamburger menu toggle for mobile viewports

### 4.2 Inconsistent Export Patterns
- **Issue:** Some pages use `export function Foo()`, others use `export default`
- **Impact:** Inconsistent import syntax across the app
- **Fix:** Standardize to named exports throughout

### 4.3 Magic Numbers Scattered Throughout Code
- **Examples:**
  - `360` - max image side in Profile.tsx
  - `0.86` - JPEG quality in Profile.tsx
  - `30` - JWT expiry days in authController.js
  - `10` - bcrypt salt rounds in User.js
  - `50 * 1024 * 1024` - file upload limit in resumeRoutes.js
- **Fix:** Define as named constants (e.g., `const MAX_IMAGE_SIZE = 360`)

### 4.4 Mock/Sample Data in Production Code
- **Locations:**
  - `Interview.tsx` lines 45-99: `sampleInterviews` array
  - `CompanyApprovals.tsx`: `sampleApprovals` array
- **Issue:** Fake data shown to users when API returns empty
- **Fix:** Show proper empty state instead of fake data, or gate behind `NODE_ENV === 'development'`

### 4.5 Unused Imports in Several Files
- **Issue:** Various components import icons/modules that aren't used
- **Impact:** Minor bundle size increase, code clutter
- **Fix:** Run `npx tsc --noEmit` and clean up all TS6133 warnings

### 4.6 No API Documentation
- **Issue:** No Swagger/OpenAPI docs; backend routes lack JSDoc comments
- **Impact:** Hard for new developers to understand available endpoints
- **Fix:** Add swagger-jsdoc + swagger-ui-express for auto-generated API docs

---

## 5. QUICK WINS (Easy to Fix, Big Impact)

| # | Fix | Effort | Impact |
|---|-----|--------|--------|
| 1 | Add `.env` to `.gitignore` + rotate keys | 5 min | Prevents credential leak |
| 2 | Fix CORS (remove fallback allow-all) | 1 min | Closes security hole |
| 3 | Add dark mode classes to 7 placeholder pages | 15 min | Fixes broken dark theme |
| 4 | Replace `alert()` with toast component | 30 min | Much better UX |
| 5 | Remove `console.log` statements | 10 min | Cleaner production |
| 6 | Remove empty pages from sidebar | 5 min | Less user confusion |
| 7 | Add `aria-label` to icon buttons | 10 min | Better accessibility |

---

## 6. RECOMMENDED IMPLEMENTATION ORDER

### Phase 1: Security Hardening (Do First)
1. Remove `.env` from git, add to `.gitignore`, rotate all keys
2. Fix CORS to only allow specific origins
3. Add auth to MCQ submission endpoints
4. Validate OAuth returnUrl
5. Add input sanitization library

### Phase 2: UX Polish
6. Replace all `alert()` with toast notifications
7. Add dark mode to placeholder pages
8. Add loading spinners to all data-fetching pages
9. Add error states with retry buttons
10. Fix mobile sidebar with hamburger menu

### Phase 3: Feature Completion
11. Implement or remove the 7 empty pages
12. Remove mock/sample data from production
13. Add pagination to list endpoints
14. Remove debug routes and console.logs

### Phase 4: Quality & Testing
15. Add unit tests for auth, registration, MCQ flows
16. Add API documentation (Swagger)
17. Fix accessibility (ARIA labels, contrast)
18. Standardize code patterns (exports, constants)

---

## 7. ARCHITECTURE NOTES

### What's Working Well
- Clean separation of backend routes/controllers/models
- JWT-based auth with role middleware (protect/authorize/requireVerified)
- GST/CIN verification flow for recruiters is well-designed
- Dark/light theme system in frontend is consistent
- Lazy loading of page components in App.tsx
- Offline fallback mode for backend (JSON file storage)

### What Needs Improvement
- No state management library (all prop drilling + context)
- No caching layer for API responses
- No rate limiting on any endpoint
- No request validation middleware (should use joi/zod schemas)
- No health check endpoint for monitoring
- No structured logging (should use winston/pino)

---

*This audit covers the codebase as of 2026-04-02. Issues should be re-evaluated after fixes are applied.*
