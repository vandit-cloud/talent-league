import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Zap, User as UserIcon, Briefcase, ShieldCheck } from 'lucide-react';
import { useAuth, UserRole } from '../context/AuthContext';
import './AuthPages.css';

interface LoginPageProps {
  onNavigateToSignup: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onNavigateToSignup }) => {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('candidate');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password, role);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Top gradient background */}
      <div className="auth-bg">
        <div className="auth-bg-circle auth-bg-circle-1" />
        <div className="auth-bg-circle auth-bg-circle-2" />
        <div className="auth-bg-circle auth-bg-circle-3" />
      </div>

      <div className="auth-scroll">
        {/* Logo & Welcome */}
        <div className="auth-header">
          <div className="auth-logo-wrap">
            <div className="auth-logo">
              <Zap size={26} strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to continue to TalentLeague</p>
        </div>

        {/* Card */}
        <div className="auth-card">
          {/* Role Selector */}
          <div className="auth-role-section">
            <p className="auth-section-label">I am a</p>
            <div className="auth-role-picker">
              <button
                type="button"
                className={`auth-role-card ${role === 'candidate' ? 'active' : ''}`}
                onClick={() => setRole('candidate')}
              >
                <div className="auth-role-icon">
                  <UserIcon size={20} />
                </div>
                <span className="auth-role-name">Candidate</span>
                <span className="auth-role-desc">Take tests & find jobs</span>
              </button>
              <button
                type="button"
                className={`auth-role-card ${role === 'recruiter' ? 'active' : ''}`}
                onClick={() => setRole('recruiter')}
              >
                <div className="auth-role-icon">
                  <Briefcase size={20} />
                </div>
                <span className="auth-role-name">Recruiter</span>
                <span className="auth-role-desc">Hire verified talent</span>
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
              <div className="auth-label-row">
                <label className="auth-label">Password</label>
                <button type="button" className="auth-forgot-btn">Forgot?</button>
              </div>
              <div className="auth-input-wrap">
                <Lock size={18} className="auth-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="auth-input has-toggle"
                  autoComplete="current-password"
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

            <button type="submit" disabled={isLoading} className="auth-btn-primary">
              {isLoading ? (
                <span className="auth-btn-loading">
                  <span className="auth-spinner" />
                  Signing in...
                </span>
              ) : (
                <span className="auth-btn-content">
                  Sign In
                  <ArrowRight size={18} />
                </span>
              )}
            </button>
          </form>

          {/* Security note */}
          <div className="auth-security-note">
            <ShieldCheck size={14} />
            <span>Your data is encrypted and secure</span>
          </div>
        </div>

        {/* Bottom link */}
        <div className="auth-bottom">
          <p>
            Don't have an account?{' '}
            <button type="button" className="auth-switch-btn" onClick={onNavigateToSignup}>
              Create Account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
