import React, { useState, useMemo } from 'react';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, Zap, Check, Briefcase } from 'lucide-react';
import { useAuth, UserRole } from '../context/AuthContext';
import './AuthPages.css';

interface SignupPageProps {
  onNavigateToLogin: () => void;
}

const passwordChecks = (pw: string) => [
  { label: '8+ chars', passed: pw.length >= 8 },
  { label: 'Uppercase', passed: /[A-Z]/.test(pw) },
  { label: 'Lowercase', passed: /[a-z]/.test(pw) },
  { label: 'Number', passed: /\d/.test(pw) },
  { label: 'Special', passed: /[^A-Za-z\d]/.test(pw) },
];

const isValidPassword = (pw: string) => passwordChecks(pw).every((c) => c.passed);

const getStrength = (pw: string) => {
  const passed = passwordChecks(pw).filter((c) => c.passed).length;
  if (!pw) return { label: '', pct: 0, cls: '' };
  if (passed <= 2) return { label: 'Weak', pct: 30, cls: 'str-weak' };
  if (passed <= 4) return { label: 'Medium', pct: 65, cls: 'str-medium' };
  return { label: 'Strong', pct: 100, cls: 'str-strong' };
};

const SignupPage: React.FC<SignupPageProps> = ({ onNavigateToLogin }) => {
  const { signup } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('candidate');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const rules = useMemo(() => passwordChecks(password), [password]);
  const strength = useMemo(() => getStrength(password), [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!isValidPassword(password)) {
      setError('Password must meet all requirements.');
      return;
    }

    setIsLoading(true);
    try {
      await signup(name, email, password, role);
      setSuccess(true);
      setTimeout(() => onNavigateToLogin(), 1500);
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-bg">
          <div className="auth-bg-circle auth-bg-circle-1" />
          <div className="auth-bg-circle auth-bg-circle-2" />
        </div>
        <div className="auth-success-screen">
          <div className="auth-success-icon">
            <Check size={36} strokeWidth={3} />
          </div>
          <h2 className="auth-success-title">Account Created!</h2>
          <p className="auth-success-text">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      {/* Background */}
      <div className="auth-bg">
        <div className="auth-bg-circle auth-bg-circle-1" />
        <div className="auth-bg-circle auth-bg-circle-2" />
        <div className="auth-bg-circle auth-bg-circle-3" />
      </div>

      <div className="auth-scroll">
        {/* Logo & Title */}
        <div className="auth-header auth-header-sm">
          <div className="auth-logo-wrap">
            <div className="auth-logo">
              <Zap size={26} strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join TalentLeague today</p>
        </div>

        {/* Card */}
        <div className="auth-card">
          {/* Role Selector */}
          <div className="auth-role-section">
            <p className="auth-section-label">I want to</p>
            <div className="auth-role-picker">
              <button
                type="button"
                className={`auth-role-card ${role === 'candidate' ? 'active' : ''}`}
                onClick={() => setRole('candidate')}
              >
                <div className="auth-role-icon">
                  <User size={20} />
                </div>
                <span className="auth-role-name">Find Work</span>
                <span className="auth-role-desc">As a candidate</span>
              </button>
              <button
                type="button"
                className={`auth-role-card ${role === 'recruiter' ? 'active' : ''}`}
                onClick={() => setRole('recruiter')}
              >
                <div className="auth-role-icon">
                  <Briefcase size={20} />
                </div>
                <span className="auth-role-name">Hire Talent</span>
                <span className="auth-role-desc">As a recruiter</span>
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="auth-error-banner">
              <span className="auth-error-dot" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label className="auth-label">Full Name</label>
              <div className="auth-input-wrap">
                <User size={18} className="auth-input-icon" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="auth-input"
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label">Email</label>
              <div className="auth-input-wrap">
                <Mail size={18} className="auth-input-icon" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="auth-input"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label">Password</label>
              <div className="auth-input-wrap">
                <Lock size={18} className="auth-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="auth-input has-toggle"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Password Strength */}
            {password.length > 0 && (
              <div className="auth-strength-box">
                <div className="auth-strength-bar">
                  <div className={`auth-strength-fill ${strength.cls}`} style={{ width: `${strength.pct}%` }} />
                </div>
                <div className="auth-strength-meta">
                  <span className="auth-strength-text">{strength.label || 'Too short'}</span>
                </div>
                <div className="auth-rules-row">
                  {rules.map((r) => (
                    <span key={r.label} className={`auth-rule-chip ${r.passed ? 'done' : ''}`}>
                      {r.passed && <Check size={10} strokeWidth={3} />}
                      {r.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="auth-field">
              <label className="auth-label">Confirm Password</label>
              <div className="auth-input-wrap">
                <Lock size={18} className="auth-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="auth-input"
                  autoComplete="new-password"
                />
              </div>
              {confirmPassword && password !== confirmPassword && (
                <span className="auth-field-error">Passwords don't match</span>
              )}
            </div>

            <button type="submit" disabled={isLoading} className="auth-btn-primary">
              {isLoading ? (
                <span className="auth-btn-loading">
                  <span className="auth-spinner" />
                  Creating account...
                </span>
              ) : (
                <span className="auth-btn-content">
                  Create Account
                  <ArrowRight size={18} />
                </span>
              )}
            </button>
          </form>
        </div>

        {/* Bottom link */}
        <div className="auth-bottom">
          <p>
            Already have an account?{' '}
            <button type="button" className="auth-switch-btn" onClick={onNavigateToLogin}>
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
