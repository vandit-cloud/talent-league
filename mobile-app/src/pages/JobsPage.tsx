import React, { useState } from 'react';
import { MapPin, DollarSign, Clock, Search, Bookmark, Building2, Sparkles } from 'lucide-react';
import './JobsPage.css';

const JobsPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState('all');

  const filters = [
    { id: 'all', label: 'All Jobs' },
    { id: 'remote', label: 'Remote' },
    { id: 'fulltime', label: 'Full-time' },
    { id: 'contract', label: 'Contract' },
    { id: 'parttime', label: 'Part-time' },
  ];

  const jobs = [
    {
      id: 1,
      title: 'Senior Frontend Developer',
      company: 'TechCorp Solutions',
      location: 'San Francisco, CA',
      salary: '$120k - $160k',
      type: 'Full-time',
      posted: '2d ago',
      match: 92,
      logo: '🏢',
      hot: true,
    },
    {
      id: 2,
      title: 'React Developer',
      company: 'StartupHub',
      location: 'Remote',
      salary: '$90k - $130k',
      type: 'Full-time',
      posted: '3d ago',
      match: 88,
      logo: '🚀',
      hot: false,
    },
    {
      id: 3,
      title: 'Full Stack Engineer',
      company: 'Digital Innovations',
      location: 'New York, NY',
      salary: '$110k - $150k',
      type: 'Full-time',
      posted: '1w ago',
      match: 76,
      logo: '💡',
      hot: false,
    },
    {
      id: 4,
      title: 'JavaScript Developer',
      company: 'WebCraft Agency',
      location: 'Austin, TX',
      salary: '$85k - $115k',
      type: 'Contract',
      posted: '2w ago',
      match: 70,
      logo: '🎨',
      hot: false,
    },
  ];

  const getMatchColor = (match: number) => {
    if (match >= 85) return 'match-high';
    if (match >= 70) return 'match-mid';
    return 'match-low';
  };

  return (
    <div className="jobs-page">
      {/* Header */}
      <div className="jobs-header">
        <div className="jobs-header-top">
          <div>
            <h1>Find Jobs</h1>
            <p className="jobs-count">24 matches for you</p>
          </div>
          <button className="header-icon-btn">
            <Bookmark size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search jobs, companies..."
            className="search-input"
          />
        </div>
      </div>

      {/* Filter Chips */}
      <div className="filter-scroll">
        <div className="filter-chips">
          {filters.map((f) => (
            <button
              key={f.id}
              className={`filter-chip ${activeFilter === f.id ? 'active' : ''}`}
              onClick={() => setActiveFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Job Cards */}
      <div className="jobs-list">
        {jobs.map((job, index) => (
          <div
            key={job.id}
            className="job-card"
            style={{ animationDelay: `${index * 0.08}s` }}
          >
            {job.hot && (
              <div className="job-hot-badge">
                <Sparkles size={10} />
                Hot
              </div>
            )}
            <div className="job-card-top">
              <div className="company-logo">{job.logo}</div>
              <div className="job-info">
                <h3 className="job-title">{job.title}</h3>
                <div className="company-row">
                  <Building2 size={13} />
                  <span>{job.company}</span>
                </div>
              </div>
              <button className="bookmark-btn">
                <Bookmark size={16} />
              </button>
            </div>

            <div className="job-tags">
              <span className="job-tag tag-location">
                <MapPin size={12} />
                {job.location}
              </span>
              <span className="job-tag tag-salary">
                <DollarSign size={12} />
                {job.salary}
              </span>
            </div>

            <div className="job-card-footer">
              <div className="job-footer-left">
                <span className="job-type-badge">{job.type}</span>
                <span className="job-posted">
                  <Clock size={11} />
                  {job.posted}
                </span>
              </div>
              <div className={`match-badge ${getMatchColor(job.match)}`}>
                {job.match}% Match
              </div>
            </div>

            <button className="apply-btn">Apply Now</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JobsPage;
