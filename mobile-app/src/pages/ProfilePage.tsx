import React from 'react';
import { User, Mail, Phone, MapPin, Briefcase, Award, Settings, Edit, FileText } from 'lucide-react';
import './ProfilePage.css';

const ProfilePage: React.FC = () => {
  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar">
          <div className="avatar-circle">
            <User size={32} />
          </div>
          <button className="edit-avatar-button">
            <Edit size={16} />
          </button>
        </div>
        
        <div className="profile-info">
          <h2>John Doe</h2>
          <p>Frontend Developer</p>
          <div className="profile-stats">
            <span className="stat">85% Complete</span>
            <span className="stat">Level 3</span>
          </div>
        </div>
      </div>
      
      <div className="profile-sections">
        <div className="profile-section">
          <h3>Personal Information</h3>
          <div className="info-list">
            <div className="info-item">
              <Mail size={16} />
              <div>
                <p className="info-label">Email</p>
                <p className="info-value">john.doe@example.com</p>
              </div>
            </div>
            <div className="info-item">
              <Phone size={16} />
              <div>
                <p className="info-label">Phone</p>
                <p className="info-value">+1 (555) 123-4567</p>
              </div>
            </div>
            <div className="info-item">
              <MapPin size={16} />
              <div>
                <p className="info-label">Location</p>
                <p className="info-value">San Francisco, CA</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="profile-section">
          <h3>Professional Information</h3>
          <div className="info-list">
            <div className="info-item">
              <Briefcase size={16} />
              <div>
                <p className="info-label">Experience</p>
                <p className="info-value">5 years</p>
              </div>
            </div>
            <div className="info-item">
              <Award size={16} />
              <div>
                <p className="info-label">Skills</p>
                <p className="info-value">React, JavaScript, CSS, TypeScript</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="profile-section">
          <h3>Skills</h3>
          <div className="skills-grid">
            <span className="skill-tag">React</span>
            <span className="skill-tag">JavaScript</span>
            <span className="skill-tag">TypeScript</span>
            <span className="skill-tag">CSS</span>
            <span className="skill-tag">HTML</span>
            <span className="skill-tag">Node.js</span>
            <span className="skill-tag">Git</span>
            <span className="skill-tag">Redux</span>
          </div>
        </div>
        
        <div className="profile-section">
          <h3>Resume</h3>
          <div className="resume-card">
            <div className="resume-info">
              <FileText size={20} />
              <div>
                <p className="resume-name">John_Doe_Resume.pdf</p>
                <p className="resume-date">Updated 2 days ago</p>
              </div>
            </div>
            <button className="upload-button">Update</button>
          </div>
        </div>
        
        <div className="profile-section">
          <h3>Settings</h3>
          <div className="settings-list">
            <button className="settings-item">
              <Settings size={16} />
              <span>Account Settings</span>
            </button>
            <button className="settings-item">
              <User size={16} />
              <span>Privacy Settings</span>
            </button>
            <button className="settings-item">
              <Mail size={16} />
              <span>Notification Preferences</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
