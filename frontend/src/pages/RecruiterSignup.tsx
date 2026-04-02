import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  Building2,
  Check,
  Eye,
  EyeOff,
  FileText,
  Globe,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { isValidPassword, PASSWORD_RULE_TEXT } from '../utils/passwordValidation';

const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const CIN_REGEX = /^[UL][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;
const UDYAM_REGEX = /^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/;
const EMAIL_REGEX = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;

const passwordChecks = (password: string) => [
  { label: 'At least 8 characters', passed: password.length >= 8 },
  { label: 'One uppercase letter', passed: /[A-Z]/.test(password) },
  { label: 'One lowercase letter', passed: /[a-z]/.test(password) },
  { label: 'One number', passed: /\d/.test(password) },
  { label: 'One special character', passed: /[^A-Za-z\d]/.test(password) }
];

const getStrengthState = (password: string) => {
  const passedCount = passwordChecks(password).filter((item) => item.passed).length;
  if (!password) return { label: 'Not started', width: '0%', tone: 'bg-slate-300 dark:bg-slate-700' };
  if (passedCount <= 2) return { label: 'Weak', width: '30%', tone: 'bg-rose-500' };
  if (passedCount <= 4) return { label: 'Medium', width: '68%', tone: 'bg-amber-500' };
  return { label: 'Strong', width: '100%', tone: 'bg-emerald-500' };
};

const STEPS = [
  { num: 1, label: 'You', icon: User },
  { num: 2, label: 'Company', icon: Building2 },
  { num: 3, label: 'Verify', icon: ShieldCheck },
] as const;

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '500+'] as const;
const INDUSTRIES = [
  'Technology', 'Finance & Banking', 'Healthcare', 'Education',
  'E-commerce', 'Manufacturing', 'Consulting', 'Media & Entertainment',
  'Real Estate', 'Logistics', 'Other'
] as const;

export function RecruiterSignup() {
  const [step, setStep] = useState(1);
  const [slideDir, setSlideDir] = useState<'left' | 'right'>('left');

  // Step 1 — Personal
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 2 — Company
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [industry, setIndustry] = useState('');

  // Step 3 — Verification
  const [gstNumber, setGstNumber] = useState('');
  const [cinNumber, setCinNumber] = useState('');
  const [udyamNumber, setUdyamNumber] = useState('');
  const [agreed, setAgreed] = useState(false);

  // Shared
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const { signupRecruiter } = useAuth();
  const { resolvedTheme } = useTheme();
  const navigate = useNavigate();

  const isDark = resolvedTheme === 'dark';
  const passwordRules = useMemo(() => passwordChecks(password), [password]);
  const strengthState = useMemo(() => getStrengthState(password), [password]);

  const gstValid = !gstNumber || GST_REGEX.test(gstNumber);
  const cinValid = !cinNumber || CIN_REGEX.test(cinNumber);
  const udyamValid = !udyamNumber || UDYAM_REGEX.test(udyamNumber);

  /* ── Per-step validation ── */
  const validateStep1 = (): string | null => {
    if (!name.trim()) return 'Full name is required.';
    if (!email.trim()) return 'Email address is required.';
    if (!EMAIL_REGEX.test(email.trim())) return 'Please enter a valid email address.';
    if (!isValidPassword(password)) return PASSWORD_RULE_TEXT;
    if (password !== confirmPassword) return 'Passwords do not match.';
    return null;
  };

  const validateStep2 = (): string | null => {
    if (!companyName.trim()) return 'Company name is required.';
    return null;
  };

  const validateStep3 = (): string | null => {
    if (!gstNumber && !cinNumber) return 'Either GST Number or CIN Number is required.';
    if (gstNumber && !gstValid) return 'Invalid GST number format. Example: 27AAPFU0939F1ZV';
    if (cinNumber && !cinValid) return 'Invalid CIN number format. Example: U72200MH2020PTC345678';
    if (udyamNumber && !udyamValid) return 'Invalid UDYAM number format. Example: UDYAM-MH-26-0123456';
    if (!agreed) return 'Please agree to the Terms and Conditions.';
    return null;
  };

  const goNext = () => {
    setFormError('');
    const err = step === 1 ? validateStep1() : step === 2 ? validateStep2() : null;
    if (err) { setFormError(err); return; }
    setSlideDir('left');
    setStep((s) => Math.min(s + 1, 3));
  };

  const goBack = () => {
    setFormError('');
    setSlideDir('right');
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async () => {
    setFormError('');
    const err = validateStep3();
    if (err) { setFormError(err); return; }

    setIsLoading(true);
    try {
      const result = await signupRecruiter({
        name: name.trim(),
        email: email.trim(),
        password,
        companyName: companyName.trim(),
        gstNumber: gstNumber || undefined,
        cinNumber: cinNumber || undefined,
        udyamNumber: udyamNumber || undefined,
      });

      if (result?.emailVerificationPending) {
        navigate(`/verify-email?email=${encodeURIComponent(email)}&role=recruiter`);
      } else {
        navigate(`/login?registered=1&role=recruiter&email=${encodeURIComponent(email)}`);
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Helpers ── */
  const inputClass = `block w-full rounded-2xl pl-12 pr-4 py-3.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${isDark ? 'border border-white/10 bg-white/5 text-white placeholder:text-slate-500' : 'border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400'}`;

  const selectClass = `block w-full rounded-2xl pl-12 pr-4 py-3.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 appearance-none cursor-pointer ${isDark ? 'border border-white/10 bg-white/5 text-white' : 'border border-slate-200 bg-white text-slate-900'}`;

  /* ================================================================ */
  return (
    <div className={`relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8 ${isDark
      ? 'bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.28),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(236,72,153,0.16),_transparent_28%),linear-gradient(135deg,#020617_0%,#111827_44%,#1e1b4b_100%)]'
      : 'bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.16),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(236,72,153,0.10),_transparent_30%),linear-gradient(135deg,#eff6ff_0%,#ffffff_48%,#ecfeff_100%)]'
    }`}>
      {/* Slide animation styles */}
      <style>{`
        @keyframes slideInLeft  { from { opacity:0; transform:translateX(60px); }  to { opacity:1; transform:translateX(0); } }
        @keyframes slideInRight { from { opacity:0; transform:translateX(-60px); } to { opacity:1; transform:translateX(0); } }
        .slide-left  { animation: slideInLeft  0.4s cubic-bezier(0.16,1,0.3,1) both; }
        .slide-right { animation: slideInRight 0.4s cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>

      {/* Grid background */}
      <div className="absolute inset-0 opacity-30">
        <div className="h-full w-full" style={{
          backgroundImage: "linear-gradient(rgba(148,163,184,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.12) 1px, transparent 1px)",
          backgroundSize: '42px 42px'
        }} />
      </div>

      <div className="absolute right-4 top-4 z-10"><ThemeToggle /></div>

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-xl items-center justify-center">
        <div className={`w-full rounded-[2rem] border p-6 shadow-2xl backdrop-blur-2xl sm:p-8 ${isDark ? 'border-white/10 bg-slate-950/60' : 'border-white/70 bg-white/90'}`}>

          {/* ── Header ── */}
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>TalentLeague</p>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Recruiter Registration</p>
            </div>
          </div>

          {/* ── Progress Bar ── */}
          <div className="my-8">
            <div className="flex items-center justify-between">
              {STEPS.map((s, i) => {
                const StepIcon = s.icon;
                const done = step > s.num;
                const active = step === s.num;
                return (
                  <div key={s.num} className="flex flex-1 items-center">
                    {/* Circle */}
                    <div className="flex flex-col items-center">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all duration-500 ${
                        done
                          ? 'border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                          : active
                            ? 'border-indigo-500 bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                            : isDark
                              ? 'border-white/15 bg-white/5 text-slate-500'
                              : 'border-slate-200 bg-slate-50 text-slate-400'
                      }`}>
                        {done ? <Check className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
                      </div>
                      <span className={`mt-2 text-xs font-semibold ${
                        done ? 'text-emerald-500' : active ? 'text-indigo-500' : isDark ? 'text-slate-500' : 'text-slate-400'
                      }`}>{s.label}</span>
                    </div>
                    {/* Connector line */}
                    {i < STEPS.length - 1 && (
                      <div className={`mx-2 h-0.5 flex-1 rounded-full transition-all duration-500 ${
                        step > s.num
                          ? 'bg-emerald-500'
                          : isDark ? 'bg-white/10' : 'bg-slate-200'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Error ── */}
          {formError && (
            <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${isDark ? 'border-rose-400/30 bg-rose-500/10 text-rose-200' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
              {formError}
            </div>
          )}

          {/* ── Step Content ── */}
          <div key={step} className={slideDir === 'left' ? 'slide-left' : 'slide-right'}>

            {/* ======== STEP 1 — Personal Info ======== */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>About you</h2>
                  <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Let's start with your personal details.</p>
                </div>

                {/* Name */}
                <div className="group">
                  <label htmlFor="name" className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Full name</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4"><User className="h-5 w-5 text-slate-400" /></div>
                    <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Enter your full name" />
                  </div>
                </div>

                {/* Email */}
                <div className="group">
                  <label htmlFor="email" className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Email address</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4"><Mail className="h-5 w-5 text-slate-400" /></div>
                    <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="Company email preferred" />
                  </div>
                </div>

                {/* Password */}
                <div className="group">
                  <label htmlFor="password" className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Password</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4"><Lock className="h-5 w-5 text-slate-400" /></div>
                    <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputClass} !pr-12`} placeholder="Create a strong password" />
                    <button type="button" className={`absolute inset-y-0 right-0 pr-4 ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-900'}`} onClick={() => setShowPassword((p) => !p)}>
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="group">
                  <label htmlFor="confirmPassword" className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Confirm password</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4"><Lock className="h-5 w-5 text-slate-400" /></div>
                    <input id="confirmPassword" type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} placeholder="Confirm your password" />
                  </div>
                </div>

                {/* Password strength */}
                <div className={`rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50/80'}`}>
                  <div className="mb-3 flex items-center justify-between">
                    <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Password strength</p>
                    <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{strengthState.label}</span>
                  </div>
                  <div className={`h-2 overflow-hidden rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                    <div className={`h-full rounded-full transition-all duration-300 ${strengthState.tone}`} style={{ width: strengthState.width }} />
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {passwordRules.map((item) => (
                      <div key={item.label} className={`flex items-center gap-2 text-sm ${item.passed ? 'text-emerald-500' : isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <div className={`flex h-5 w-5 items-center justify-center rounded-full ${item.passed ? 'bg-emerald-500/15' : isDark ? 'bg-white/8' : 'bg-slate-200'}`}>
                          <Check className="h-3.5 w-3.5" />
                        </div>
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ======== STEP 2 — Company Details ======== */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Your company</h2>
                  <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Tell us about the company you represent.</p>
                </div>

                {/* Company Name */}
                <div className="group">
                  <label htmlFor="companyName" className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Company name <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4"><Building2 className="h-5 w-5 text-slate-400" /></div>
                    <input id="companyName" type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputClass} placeholder="Your company name" />
                  </div>
                </div>

                {/* Industry */}
                <div className="group">
                  <label htmlFor="industry" className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Industry</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4"><Sparkles className="h-5 w-5 text-slate-400" /></div>
                    <select id="industry" value={industry} onChange={(e) => setIndustry(e.target.value)} className={selectClass}>
                      <option value="">Select industry</option>
                      {INDUSTRIES.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
                    </select>
                  </div>
                </div>

                {/* Company Size */}
                <div className="group">
                  <label htmlFor="companySize" className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Company size</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4"><Users className="h-5 w-5 text-slate-400" /></div>
                    <select id="companySize" value={companySize} onChange={(e) => setCompanySize(e.target.value)} className={selectClass}>
                      <option value="">Select size</option>
                      {COMPANY_SIZES.map((s) => <option key={s} value={s}>{s} employees</option>)}
                    </select>
                  </div>
                </div>

                {/* Company Website */}
                <div className="group">
                  <label htmlFor="companyWebsite" className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Company website <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>(optional)</span></label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4"><Globe className="h-5 w-5 text-slate-400" /></div>
                    <input id="companyWebsite" type="url" value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} className={inputClass} placeholder="https://yourcompany.com" />
                  </div>
                </div>

                {/* Info card */}
                <div className={`rounded-2xl border p-4 ${isDark ? 'border-indigo-400/20 bg-indigo-500/10' : 'border-indigo-200 bg-indigo-50'}`}>
                  <p className={`text-sm ${isDark ? 'text-indigo-200' : 'text-indigo-700'}`}>
                    Only company name is required. Other details help speed up the verification process.
                  </p>
                </div>
              </div>
            )}

            {/* ======== STEP 3 — Verification ======== */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Verify your company</h2>
                  <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Provide at least one government-issued company ID.</p>
                </div>

                {/* GST Number */}
                <div className="group">
                  <label htmlFor="gstNumber" className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    GST number {!cinNumber && <span className="text-rose-500">*</span>}
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4"><FileText className="h-5 w-5 text-slate-400" /></div>
                    <input
                      id="gstNumber" type="text" value={gstNumber}
                      onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                      className={`${inputClass} ${gstNumber && !gstValid ? 'ring-2 ring-rose-500/40' : gstNumber && gstValid ? 'ring-2 ring-emerald-500/40' : ''}`}
                      placeholder="e.g. 27AAPFU0939F1ZV"
                      maxLength={15}
                    />
                  </div>
                  {gstNumber && !gstValid && <p className="mt-1 text-xs text-rose-500">Invalid format. Must be 15 characters like 22AAAAA0000A1Z5</p>}
                  {gstNumber && gstValid && <p className="mt-1 flex items-center gap-1 text-xs text-emerald-500"><Check className="h-3 w-3" /> Valid GST format</p>}
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className={`h-px flex-1 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                  <span className={`text-xs font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>OR</span>
                  <div className={`h-px flex-1 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                </div>

                {/* CIN Number */}
                <div className="group">
                  <label htmlFor="cinNumber" className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    CIN number {!gstNumber && <span className="text-rose-500">*</span>}
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4"><FileText className="h-5 w-5 text-slate-400" /></div>
                    <input
                      id="cinNumber" type="text" value={cinNumber}
                      onChange={(e) => setCinNumber(e.target.value.toUpperCase())}
                      className={`${inputClass} ${cinNumber && !cinValid ? 'ring-2 ring-rose-500/40' : cinNumber && cinValid ? 'ring-2 ring-emerald-500/40' : ''}`}
                      placeholder="e.g. U72200MH2020PTC345678"
                      maxLength={21}
                    />
                  </div>
                  {cinNumber && !cinValid && <p className="mt-1 text-xs text-rose-500">Invalid format. Must be 21 characters like U12345MH2020PTC123456</p>}
                  {cinNumber && cinValid && <p className="mt-1 flex items-center gap-1 text-xs text-emerald-500"><Check className="h-3 w-3" /> Valid CIN format</p>}
                </div>

                {/* UDYAM Number */}
                <div className="group">
                  <label htmlFor="udyamNumber" className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    UDYAM number <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>(optional, for MSMEs)</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4"><FileText className="h-5 w-5 text-slate-400" /></div>
                    <input
                      id="udyamNumber" type="text" value={udyamNumber}
                      onChange={(e) => setUdyamNumber(e.target.value.toUpperCase())}
                      className={`${inputClass} ${udyamNumber && !udyamValid ? 'ring-2 ring-rose-500/40' : udyamNumber && udyamValid ? 'ring-2 ring-emerald-500/40' : ''}`}
                      placeholder="e.g. UDYAM-MH-26-0123456"
                      maxLength={19}
                    />
                  </div>
                  {udyamNumber && !udyamValid && <p className="mt-1 text-xs text-rose-500">Invalid format. Must be like UDYAM-MH-00-0000000</p>}
                </div>

                {/* Terms */}
                <label className="group flex cursor-pointer items-start">
                  <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-400" />
                  <span className={`ml-3 text-sm leading-6 transition-colors ${isDark ? 'text-slate-400 group-hover:text-slate-200' : 'text-slate-600 group-hover:text-slate-900'}`}>
                    I agree to the <a href="#" className="font-medium text-indigo-500 hover:text-indigo-400">Terms and Conditions</a> and <a href="#" className="font-medium text-indigo-500 hover:text-indigo-400">Privacy Policy</a>
                  </span>
                </label>

                {/* Summary card */}
                <div className={`rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
                  <p className={`mb-3 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Registration summary</p>
                  <div className={`space-y-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <div className="flex justify-between"><span className={isDark ? 'text-slate-500' : 'text-slate-400'}>Name</span><span className="font-medium">{name || '—'}</span></div>
                    <div className="flex justify-between"><span className={isDark ? 'text-slate-500' : 'text-slate-400'}>Email</span><span className="font-medium">{email || '—'}</span></div>
                    <div className="flex justify-between"><span className={isDark ? 'text-slate-500' : 'text-slate-400'}>Company</span><span className="font-medium">{companyName || '—'}</span></div>
                    {industry && <div className="flex justify-between"><span className={isDark ? 'text-slate-500' : 'text-slate-400'}>Industry</span><span className="font-medium">{industry}</span></div>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Navigation Buttons ── */}
          <div className="mt-8 flex items-center gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={goBack}
                className={`flex items-center gap-2 rounded-2xl border px-5 py-3.5 text-sm font-semibold transition-all ${isDark
                  ? 'border-white/10 bg-white/5 text-white hover:bg-white/10'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={goNext}
                className="group flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 px-5 py-3.5 text-sm font-semibold text-white shadow-xl shadow-indigo-500/25 transition-all hover:translate-y-[-1px] hover:shadow-indigo-500/35"
              >
                Continue
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading || !agreed}
                className="group flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 px-5 py-3.5 text-sm font-semibold text-white shadow-xl shadow-indigo-500/25 transition-all hover:translate-y-[-1px] hover:shadow-indigo-500/35 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    Register Company
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            )}
          </div>

          {/* ── Footer links ── */}
          <div className="mt-6 text-center">
            <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
              Already have an account?{' '}
              <button onClick={() => navigate('/login?role=recruiter')} className={`font-semibold transition-colors ${isDark ? 'text-indigo-300 hover:text-white' : 'text-indigo-600 hover:text-indigo-700'}`}>Sign in</button>
              <span className={`mx-2 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>|</span>
              <button onClick={() => navigate('/signup')} className={`font-semibold transition-colors ${isDark ? 'text-indigo-300 hover:text-white' : 'text-indigo-600 hover:text-indigo-700'}`}>Candidate signup</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
