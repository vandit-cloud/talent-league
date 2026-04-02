# Security Fix Plan: Role-Based Access Control + GST/CIN Verification

## Problem

A candidate can register, then switch to recruiter side and access all recruiter data.
There is **zero authorization** on the backend - any logged-in user (or even unauthenticated users) can call any API.

---

## Solution: GST/CIN Number Verification for Recruiters

Candidates register normally. Recruiters must provide a valid **GST Number** or **Company Registration Number (CIN)** during signup. Only verified recruiters get access to recruiter features.

### Registration Flow Comparison

| Field | Candidate Signup | Recruiter Signup |
|-------|-----------------|------------------|
| Name | Required | Required |
| Email | Required | Required (company email preferred) |
| Password | Required | Required |
| Company Name | - | Required |
| GST Number | - | Required (15-digit, e.g. `22AAAAA0000A1Z5`) |
| OR CIN Number | - | Required (21-char, e.g. `U12345MH2020PTC123456`) |
| OR UDYAM Number | - | Optional (for MSMEs, e.g. `UDYAM-XX-00-0000000`) |
| Verification | Email OTP | Email OTP + GST/CIN format validation |
| Account Status | Active immediately | **Pending verification** until GST/CIN confirmed |

---

## Critical Vulnerabilities Found

| # | Issue | Severity | Where |
|---|-------|----------|-------|
| 1 | No auth middleware on any backend route | CRITICAL | All routes |
| 2 | No role check in any controller | CRITICAL | All controllers |
| 3 | Frontend route guard bypassable via localStorage | CRITICAL | App.tsx |
| 4 | Job API completely open - anyone can create/delete | CRITICAL | jobRoutes.js |
| 5 | Exam results open - anyone can submit fake scores | CRITICAL | examRoutes.js |
| 6 | Assessment templates open - anyone can CRUD | CRITICAL | assessmentTemplateRoutes.js |
| 7 | Google OAuth accepts role from client | HIGH | authController.js |
| 8 | Resume analysis has no auth | HIGH | resumeRoutes.js |
| 9 | Proctoring endpoints have no auth | HIGH | proctoringRoutes.js |
| 10 | viewRole stored in localStorage - easy to tamper | HIGH | AuthContext.tsx |
| 11 | Anyone can register as recruiter with no verification | HIGH | Signup.tsx, authController.js |

---

## Fix Plan (Step by Step)

### Step 1: Update User Model - Add Company Fields

**File:** `backend/models/User.js`

Add new fields to the User schema:

```javascript
companyName: { type: String },          // Required for recruiters
gstNumber: { type: String },            // GST: 22AAAAA0000A1Z5 (15 chars)
cinNumber: { type: String },            // CIN: U12345MH2020PTC123456 (21 chars)
udyamNumber: { type: String },          // UDYAM: UDYAM-XX-00-0000000 (optional)
companyVerified: { type: Boolean, default: false },  // False until GST/CIN verified
verificationStatus: {
  type: String,
  enum: ['not_required', 'pending', 'verified', 'rejected'],
  default: 'not_required'   // 'not_required' for candidates
}
```

**Validation Rules:**
- GST format: `/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/`
- CIN format: `/^[UL][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/`
- UDYAM format: `/^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/`

---

### Step 2: Create Separate Recruiter Signup

**New page:** `frontend/src/pages/RecruiterSignup.tsx`

Recruiter signup form with:
- Name, Email, Password (same as candidate)
- Company Name (required)
- GST Number OR CIN Number (at least one required)
- UDYAM Number (optional, for MSMEs)
- Company Address (optional)
- Company Website (optional)

**Flow:**
1. Recruiter fills form with company details + GST/CIN
2. Frontend validates GST/CIN format before sending
3. Backend validates format again + checks for duplicate GST/CIN
4. Account created with `verificationStatus: 'pending'`
5. Recruiter sees "Verification Pending" dashboard (limited access)
6. Admin/system verifies GST via API or manually
7. Once verified, `verificationStatus: 'verified'` + `companyVerified: true`
8. Full recruiter access granted

**Frontend validation (instant):**
```javascript
// GST Number validation
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

// CIN Number validation
const CIN_REGEX = /^[UL][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;

// UDYAM Number validation
const UDYAM_REGEX = /^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/;
```

**Backend validation (on registration):**
```javascript
// 1. Validate format
// 2. Check not already registered by another recruiter
// 3. (Optional) Verify via GST API: https://apisetu.gov.in/catalog/gst
// 4. Create account with pending status
```

---

### Step 3: Create Auth Middleware (Backend)

**New file:** `backend/middleware/auth.js`

Three middleware functions:

1. **`protect`** - Verifies JWT token, attaches `req.user` to request. Returns 401 if invalid.

2. **`authorize(...roles)`** - Checks `req.user.role` against allowed roles. Returns 403 if not allowed.

3. **`requireVerified`** - For recruiter-only routes, checks `req.user.companyVerified === true`. Returns 403 "Company verification pending" if not verified.

```javascript
// Usage examples:

// Any authenticated user
router.get('/jobs', protect, getJobs);

// Only verified recruiters
router.post('/jobs', protect, authorize('recruiter'), requireVerified, createJob);

// Only candidates
router.post('/exams/submit', protect, authorize('candidate'), submitResult);
```

---

### Step 4: Protect All Backend Routes

**File:** `backend/routes/jobRoutes.js`
- `POST /` - protect + authorize('recruiter') + requireVerified
- `GET /` - protect (any authenticated user can view)
- `DELETE /:id` - protect + authorize('recruiter') + requireVerified

**File:** `backend/routes/assessmentTemplateRoutes.js`
- `POST /` - protect + authorize('recruiter') + requireVerified
- `GET /` - protect
- `DELETE /:id` - protect + authorize('recruiter') + requireVerified

**File:** `backend/routes/examRoutes.js`
- `POST /generate` - protect
- `POST /submit` - protect + authorize('candidate')
- `GET /questions` - protect

**File:** `backend/routes/resumeRoutes.js`
- `POST /analyze` - protect

**File:** `backend/routes/proctoringRoutes.js`
- All routes - protect

**File:** `backend/routes/mcqRoutes.js`
- Send MCQ: protect + authorize('recruiter') + requireVerified
- Take MCQ: protect + authorize('candidate')

---

### Step 5: Add Ownership Checks in Controllers

**File:** `backend/controllers/jobController.js`
- `createJob` - Set `recruiterId` from `req.user._id` (NOT from request body)
- `deleteJob` - Verify `job.recruiterId === req.user._id` before deleting

**File:** `backend/controllers/assessmentTemplateController.js`
- `createTemplate` - Set recruiterId from `req.user._id`
- `deleteTemplate` - Verify ownership before deleting

**File:** `backend/controllers/examController.js`
- `submitResult` - Set candidateId from `req.user._id` (not request body)

---

### Step 6: Fix Frontend Route Guards

**File:** `frontend/src/App.tsx`

```tsx
function RecruiterRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'recruiter' && user.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }
  // Block unverified recruiters from full features
  if (!user.companyVerified) {
    return <Navigate to="/recruiter/verification-pending" />;
  }
  return children;
}

function CandidateRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'recruiter') {
    return <Navigate to="/recruiter/dashboard" />;
  }
  return children;
}
```

Key: Use `user.role` from JWT/server, NOT `viewRole` from localStorage.

---

### Step 7: Fix AuthContext

**File:** `frontend/src/context/AuthContext.tsx`

- Never use `viewRole` for access control decisions
- On app load, call `GET /api/auth/me` to verify token and get fresh role
- If token expired or role tampered, force logout
- Store `companyVerified` status in user object

---

### Step 8: Fix Signup Pages

**File:** `frontend/src/pages/Signup.tsx`
- Remove recruiter role option
- Only creates candidate accounts
- Add link: "Are you a recruiter? Register your company here"

**New file:** `frontend/src/pages/RecruiterSignup.tsx`
- Separate page for recruiter registration
- Company Name + GST/CIN fields
- Real-time GST/CIN format validation
- Shows verification status after registration

**File:** `frontend/src/pages/Login.tsx`
- Keep role selector for login (candidate vs recruiter)
- Backend validates role matches registered role
- If candidate tries recruiter login, show: "No recruiter account found. Register as recruiter first."

---

### Step 9: Fix Google/LinkedIn OAuth

**File:** `backend/controllers/authController.js`

```javascript
// NEVER accept role from client during OAuth
const { token } = req.body;
// Always create as candidate
user = await User.create({ role: 'candidate' });
// Recruiters must go through separate company registration
```

---

### Step 10: Create Verification Pending Page

**New file:** `frontend/src/pages/RecruiterVerificationPending.tsx`

For recruiters who registered but aren't verified yet:
- Shows "Company Verification Pending" message
- Displays submitted GST/CIN number
- Shows verification status (pending/verified/rejected)
- Limited access: can view profile, update info, but can't create jobs or assessments
- Once admin verifies, page redirects to full recruiter dashboard

---

### Step 11: Admin Verification Panel (Optional)

**New file:** `frontend/src/pages/AdminVerification.tsx`

For admin users to:
- View pending recruiter registrations
- See GST/CIN numbers submitted
- Verify or reject recruiters
- Auto-verify using GST API (if integrated)

---

### Step 12: GST API Integration (Optional Enhancement)

**New file:** `backend/utils/gstVerifier.js`

Auto-verify GST numbers using government APIs:
- **GST Search API:** `https://apisetu.gov.in/catalog/gst`
- **What it returns:** Company name, address, registration status, filing status
- **Cross-check:** Verify company name from GST API matches what recruiter entered
- **Auto-approve:** If GST is valid and active, auto-set `companyVerified: true`

```javascript
// Example GST verification
const verifyGST = async (gstNumber) => {
  // 1. Validate format
  if (!GST_REGEX.test(gstNumber)) return { valid: false, error: 'Invalid format' };

  // 2. Call GST API
  const response = await fetch(`https://gst-api.example.com/verify/${gstNumber}`);
  const data = await response.json();

  // 3. Check if active
  if (data.status === 'Active') {
    return {
      valid: true,
      companyName: data.tradeName,
      address: data.address,
      registrationDate: data.registrationDate
    };
  }

  return { valid: false, error: 'GST number is not active' };
};
```

---

### Step 13: Add API Endpoint for Role Verification

**New endpoint:** `GET /api/auth/me`
- Requires valid JWT token
- Returns current user data with role and companyVerified status from database
- Frontend calls this on app load to verify nothing is tampered

**New endpoint:** `POST /api/auth/verify-company`
- Admin only
- Takes userId, sets companyVerified = true

---

### Step 14: Add Audit Logging

**New file:** `backend/middleware/auditLog.js`

Log all sensitive actions:
- Recruiter registration attempts (with GST/CIN)
- Company verification approvals/rejections
- Job create/delete
- Assessment create/delete
- Unauthorized access attempts (403s)
- Login failures

---

## Implementation Priority

| Priority | Task | Files | Effort |
|----------|------|-------|--------|
| **P0** | Create auth middleware (protect + authorize + requireVerified) | New: middleware/auth.js | Small |
| **P0** | Add middleware to all backend routes | All route files | Small |
| **P0** | Fix frontend route guards (use user.role, not viewRole) | App.tsx | Small |
| **P1** | Update User model with company fields | User.js | Small |
| **P1** | Create separate RecruiterSignup page with GST/CIN | New: RecruiterSignup.tsx | Medium |
| **P1** | Update backend registration to validate GST/CIN | authController.js | Medium |
| **P1** | Add ownership checks in controllers | All controllers | Medium |
| **P1** | Fix AuthContext - don't trust localStorage | AuthContext.tsx | Small |
| **P1** | Fix OAuth - don't accept role from client | authController.js | Small |
| **P2** | Create RecruiterVerificationPending page | New page | Small |
| **P2** | Add /auth/me endpoint | authController.js | Small |
| **P2** | Remove recruiter option from candidate Signup | Signup.tsx | Small |
| **P2** | Fix Login page role validation | Login.tsx | Small |
| **P3** | GST API integration for auto-verification | New: gstVerifier.js | Medium |
| **P3** | Admin verification panel | New page | Medium |
| **P3** | Add audit logging | New: middleware/auditLog.js | Medium |

---

## Database Changes

### User Model (Updated)

```
name            String    Required
email           String    Required, Unique
password        String    Required
role            String    'candidate' | 'recruiter' | 'admin'
companyName     String    Required if recruiter
gstNumber       String    Unique, validated format (15 chars)
cinNumber       String    Unique, validated format (21 chars)
udyamNumber     String    Optional, validated format
companyVerified Boolean   Default: false
verificationStatus String 'not_required' | 'pending' | 'verified' | 'rejected'
verificationNote String   Admin notes on verification
verifiedAt      Date      When company was verified
verifiedBy      ObjectId  Admin who verified
```

---

## Page Flow After Implementation

### Candidate Flow
```
Signup Page (/signup)
  -> Enter name, email, password
  -> Account created (role: candidate)
  -> Redirect to Login
  -> Login -> Candidate Dashboard
  -> Can access: Jobs, Resume, Assessments, Exams, Profile
  -> CANNOT access: /recruiter/* routes (redirected)
  -> CANNOT call recruiter APIs (403 from backend)
```

### Recruiter Flow
```
Recruiter Signup Page (/recruiter-signup)
  -> Enter name, email, password
  -> Enter Company Name
  -> Enter GST Number OR CIN Number
  -> Frontend validates format instantly
  -> Backend validates format + checks duplicate
  -> Account created (role: recruiter, verificationStatus: pending)
  -> Redirect to Login
  -> Login -> Verification Pending Page
  -> Admin verifies GST/CIN (or auto-verify via API)
  -> verificationStatus: verified, companyVerified: true
  -> Full recruiter dashboard access
  -> Can access: Job posting, Assessments, Candidates, Analytics
  -> CANNOT access: /candidate/* routes
```

### Blocked Scenarios
```
1. Candidate tries /recruiter/dashboard
   -> Frontend: Redirected to /dashboard
   -> Backend: 403 if API called directly

2. Candidate tries to register as recruiter without GST
   -> Must go to /recruiter-signup
   -> GST/CIN required - cannot skip

3. Unverified recruiter tries to post job
   -> Frontend: Redirected to verification-pending page
   -> Backend: 403 "Company verification pending"

4. Someone tampers localStorage viewRole
   -> Frontend checks user.role from server, not localStorage
   -> Backend rejects with 403 regardless

5. Direct API call with curl/Postman
   -> protect middleware checks JWT
   -> authorize middleware checks role
   -> requireVerified checks companyVerified
   -> Ownership check prevents accessing other users' data
```

---

## Validation Regex Reference

```javascript
// GST Number: 22AAAAA0000A1Z5
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

// CIN Number: U12345MH2020PTC123456
const CIN_REGEX = /^[UL][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;

// UDYAM Number: UDYAM-MH-00-0000001
const UDYAM_REGEX = /^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/;

// Example valid numbers:
// GST:   27AAPFU0939F1ZV
// CIN:   U72200MH2020PTC345678
// UDYAM: UDYAM-MH-26-0123456
```

---

## Quick Test After Full Implementation

| # | Test | Expected Result |
|---|------|-----------------|
| 1 | Register as candidate, try `/recruiter/dashboard` | Redirected to `/dashboard` |
| 2 | `localStorage.setItem('viewRole','recruiter')` then refresh | Still redirected (checks server role) |
| 3 | `curl -X POST /api/jobs` with candidate token | 403 Forbidden |
| 4 | `curl -X DELETE /api/jobs/:id` with candidate token | 403 Forbidden |
| 5 | Register as recruiter without GST | Validation error |
| 6 | Register as recruiter with invalid GST format | Format error |
| 7 | Register as recruiter with valid GST | Account created as pending |
| 8 | Unverified recruiter tries to create job | 403 "Verification pending" |
| 9 | Admin verifies recruiter | Status changes to verified |
| 10 | Verified recruiter creates job | Success |
| 11 | Google OAuth sign-in | Always creates candidate account |
| 12 | Submit exam results for another user | 403 Forbidden |
| 13 | Recruiter tries to delete another recruiter's job | 403 Forbidden |

---

## Summary

**Root cause:** No backend authorization + no recruiter identity verification.

**Solution:** 
1. Backend auth middleware (protect + authorize + requireVerified)
2. GST/CIN number verification for recruiter registration
3. Separate signup flows for candidates and recruiters
4. Pending verification state for new recruiters
5. Frontend route guards using server-validated role (not localStorage)
6. Ownership checks so users can only modify their own data
