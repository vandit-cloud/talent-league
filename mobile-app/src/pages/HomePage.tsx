import React from 'react';
import { TrendingUp, Clock, Award, Briefcase, ChevronRight, Zap, Target, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './HomePage.css';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] || 'User';

  return (
    <div className="home-page">
      {/* Gradient Hero Header */}
      <div className="home-hero">
        <div className="hero-bg-orb hero-orb-1" />
        <div className="hero-bg-orb hero-orb-2" />
        <div className="hero-content">
          <p className="hero-greeting">{getGreeting()}</p>
          <h1 className="hero-name">{firstName}</h1>
          <p className="hero-subtitle">Ready to level up your career?</p>
        </div>
        {/* Profile completion ring */}
        <div className="hero-ring">
          <svg viewBox="0 0 64 64" className="ring-svg">
            <circle cx="32" cy="32" r="28" className="ring-bg" />
            <circle cx="32" cy="32" r="28" className="ring-progress" strokeDasharray="176" strokeDashoffset="26.4" />
          </svg>
          <span className="ring-label">85%</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button className="quick-action-btn">
          <div className="qa-icon qa-icon-primary">
            <Zap size={18} />
          </div>
          <span>Quick Test</span>
        </button>
        <button className="quick-action-btn">
          <div className="qa-icon qa-icon-success">
            <Target size={18} />
          </div>
          <span>Skill Match</span>
        </button>
        <button className="quick-action-btn">
          <div className="qa-icon qa-icon-warning">
            <Briefcase size={18} />
          </div>
          <span>Find Jobs</span>
        </button>
        <button className="quick-action-btn">
          <div className="qa-icon qa-icon-cyan">
            <BookOpen size={18} />
          </div>
          <span>Resume</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card stat-card-1">
          <div className="stat-icon">
            <TrendingUp size={20} />
          </div>
          <div className="stat-info">
            <h3>85%</h3>
            <p>Profile Score</p>
          </div>
        </div>

        <div className="stat-card stat-card-2">
          <div className="stat-icon">
            <Award size={20} />
          </div>
          <div className="stat-info">
            <h3>12</h3>
            <p>Tests Done</p>
          </div>
        </div>

        <div className="stat-card stat-card-3">
          <div className="stat-icon">
            <Briefcase size={20} />
          </div>
          <div className="stat-info">
            <h3>8</h3>
            <p>Applied</p>
          </div>
        </div>

        <div className="stat-card stat-card-4">
          <div className="stat-icon">
            <Clock size={20} />
          </div>
          <div className="stat-info">
            <h3>2.5h</h3>
            <p>Test Time</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="activity-section">
        <div className="section-header">
          <h2>Recent Activity</h2>
          <button className="see-all-btn">
            See All <ChevronRight size={14} />
          </button>
        </div>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-timeline">
              <div className="activity-dot dot-success" />
              <div className="activity-line" />
            </div>
            <div className="activity-card">
              <div className="activity-card-header">
                <span className="activity-badge badge-success">Completed</span>
                <span className="activity-time">2h ago</span>
              </div>
              <p className="activity-title">React Developer Assessment</p>
              <p className="activity-desc">Scored 85% - Great performance!</p>
            </div>
          </div>

          <div className="activity-item">
            <div className="activity-timeline">
              <div className="activity-dot dot-primary" />
              <div className="activity-line" />
            </div>
            <div className="activity-card">
              <div className="activity-card-header">
                <span className="activity-badge badge-primary">Applied</span>
                <span className="activity-time">1d ago</span>
              </div>
              <p className="activity-title">Frontend Developer at TechCorp</p>
              <p className="activity-desc">Application under review</p>
            </div>
          </div>

          <div className="activity-item">
            <div className="activity-timeline">
              <div className="activity-dot dot-warning" />
            </div>
            <div className="activity-card">
              <div className="activity-card-header">
                <span className="activity-badge badge-warning">Updated</span>
                <span className="activity-time">3d ago</span>
              </div>
              <p className="activity-title">Skills Profile Updated</p>
              <p className="activity-desc">Added TypeScript & Node.js</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
