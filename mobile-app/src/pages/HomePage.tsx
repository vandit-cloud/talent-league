import React from 'react';
import { TrendingUp, Clock, Award, Briefcase } from 'lucide-react';
import './HomePage.css';

const HomePage: React.FC = () => {
  return (
    <div className="home-page">
      <div className="home-header">
        <h1>Welcome to TalentLeague</h1>
        <p>Your career journey starts here</p>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <h3>85%</h3>
            <p>Profile Completion</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <Award size={24} />
          </div>
          <div className="stat-info">
            <h3>12</h3>
            <p>Tests Completed</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <Briefcase size={24} />
          </div>
          <div className="stat-info">
            <h3>8</h3>
            <p>Jobs Applied</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <h3>2.5h</h3>
            <p>Test Time</p>
          </div>
        </div>
      </div>
      
      <div className="recent-activity">
        <h2>Recent Activity</h2>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-icon">📝</div>
            <div className="activity-content">
              <p>Completed React Developer Assessment</p>
              <span>2 hours ago</span>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">💼</div>
            <div className="activity-content">
              <p>Applied to Frontend Developer Position</p>
              <span>1 day ago</span>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">🎯</div>
            <div className="activity-content">
              <p>Updated Skills Profile</p>
              <span>3 days ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
