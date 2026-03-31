import React from 'react';
import { User, Mail, Phone, MapPin, Briefcase, Award, Settings, Camera, FileText, ChevronRight, Shield, Bell, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './ProfilePage.css';

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const skills = [
    { name: 'React', color: '#3b82f6' },
    { name: 'JavaScript', color: '#f59e0b' },
    { name: 'TypeScript', color: '#6366f1' },
    { name: 'CSS', color: '#06b6d4' },
    { name: 'HTML', color: '#ef4444' },
    { name: 'Node.js', color: '#10b981' },
    { name: 'Git', color: '#8b5cf6' },
    { name: 'Redux', color: '#764ba2' },
  ];

  return (
    <div className="profile-page">
      {/* Profile Hero */}
      <div className="profile-hero">
        <div className="profile-hero-bg" />
        <div className="profile-avatar-section">
          <div className="avatar-wrapper">
            <div className="avatar-circle">
              <User size={36} />
            </div>
            <button className="edit-avatar-btn">
              <Camera size={14} />
            </button>
          </div>
          <h2 className="profile-name">{user?.name || 'User'}</h2>
          <p className="profile-role">{user?.role === 'recruiter' ? 'Recruiter' : 'Candidate'}</p>
          <div className="profile-badges">
            <span className="profile-badge badge-level">Level 3</span>
            <span className="profile-badge badge-streak">12 Tests</span>
          </div>
        </div>

        {/* Completion Bar */}
        <div className="completion-bar">
          <div className="completion-header">
            <span className="completion-label">Profile Completion</span>
            <span className="completion-percent">85%</span>
          </div>
          <div className="completion-track">
            <div className="completion-fill" style={{ width: '85%' }} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="profile-content">
        {/* Personal Info */}
        <div className="profile-card">
          <div className="card-title">
            <h3>Personal Information</h3>
          </div>
          <div className="info-list">
            <div className="info-row">
              <div className="info-icon-wrap icon-primary">
                <Mail size={14} />
              </div>
              <div className="info-text">
                <span className="info-label">Email</span>
                <span className="info-value">{user?.email || 'Not set'}</span>
              </div>
            </div>
            <div className="info-row">
              <div className="info-icon-wrap icon-success">
                <Phone size={14} />
              </div>
              <div className="info-text">
                <span className="info-label">Phone</span>
                <span className="info-value">+1 (555) 123-4567</span>
              </div>
            </div>
            <div className="info-row">
              <div className="info-icon-wrap icon-warning">
                <MapPin size={14} />
              </div>
              <div className="info-text">
                <span className="info-label">Location</span>
                <span className="info-value">San Francisco, CA</span>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Info */}
        <div className="profile-card">
          <div className="card-title">
            <h3>Professional</h3>
          </div>
          <div className="info-list">
            <div className="info-row">
              <div className="info-icon-wrap icon-cyan">
                <Briefcase size={14} />
              </div>
              <div className="info-text">
                <span className="info-label">Experience</span>
                <span className="info-value">5 years</span>
              </div>
            </div>
            <div className="info-row">
              <div className="info-icon-wrap icon-accent">
                <Award size={14} />
              </div>
              <div className="info-text">
                <span className="info-label">Top Skills</span>
                <span className="info-value">React, JavaScript, TypeScript</span>
              </div>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="profile-card">
          <div className="card-title">
            <h3>Skills</h3>
            <span className="skill-count">{skills.length} skills</span>
          </div>
          <div className="skills-grid">
            {skills.map((skill) => (
              <span
                key={skill.name}
                className="skill-chip"
                style={{
                  background: `${skill.color}14`,
                  color: skill.color,
                  borderColor: `${skill.color}30`,
                }}
              >
                {skill.name}
              </span>
            ))}
          </div>
        </div>

        {/* Resume */}
        <div className="profile-card">
          <div className="card-title">
            <h3>Resume</h3>
          </div>
          <div className="resume-row">
            <div className="resume-icon-wrap">
              <FileText size={20} />
            </div>
            <div className="resume-text">
              <p className="resume-name">John_Doe_Resume.pdf</p>
              <p className="resume-date">Updated 2 days ago</p>
            </div>
            <button className="resume-update-btn">Update</button>
          </div>
        </div>

        {/* Settings */}
        <div className="profile-card">
          <div className="card-title">
            <h3>Settings</h3>
          </div>
          <div className="settings-list">
            <button className="settings-row">
              <div className="settings-left">
                <div className="info-icon-wrap icon-primary">
                  <Settings size={14} />
                </div>
                <span>Account Settings</span>
              </div>
              <ChevronRight size={16} className="chevron-icon" />
            </button>
            <button className="settings-row">
              <div className="settings-left">
                <div className="info-icon-wrap icon-success">
                  <Shield size={14} />
                </div>
                <span>Privacy & Security</span>
              </div>
              <ChevronRight size={16} className="chevron-icon" />
            </button>
            <button className="settings-row">
              <div className="settings-left">
                <div className="info-icon-wrap icon-warning">
                  <Bell size={14} />
                </div>
                <span>Notifications</span>
              </div>
              <ChevronRight size={16} className="chevron-icon" />
            </button>
            <button className="settings-row logout-row" onClick={logout}>
              <div className="settings-left">
                <div className="info-icon-wrap icon-danger">
                  <LogOut size={14} />
                </div>
                <span>Log Out</span>
              </div>
              <ChevronRight size={16} className="chevron-icon" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
