import React from 'react';
import { Briefcase, MapPin, DollarSign, Clock, Building } from 'lucide-react';
import './JobsPage.css';

const JobsPage: React.FC = () => {
  const jobs = [
    {
      id: 1,
      title: 'Senior Frontend Developer',
      company: 'TechCorp Solutions',
      location: 'San Francisco, CA',
      salary: '$120k - $160k',
      type: 'Full-time',
      posted: '2 days ago',
      logo: '🏢'
    },
    {
      id: 2,
      title: 'React Developer',
      company: 'StartupHub',
      location: 'Remote',
      salary: '$90k - $130k',
      type: 'Full-time',
      posted: '3 days ago',
      logo: '🚀'
    },
    {
      id: 3,
      title: 'Full Stack Engineer',
      company: 'Digital Innovations',
      location: 'New York, NY',
      salary: '$110k - $150k',
      type: 'Full-time',
      posted: '1 week ago',
      logo: '💡'
    },
    {
      id: 4,
      title: 'JavaScript Developer',
      company: 'WebCraft Agency',
      location: 'Austin, TX',
      salary: '$85k - $115k',
      type: 'Contract',
      posted: '2 weeks ago',
      logo: '🎨'
    }
  ];

  return (
    <div className="jobs-page">
      <div className="jobs-header">
        <h1>Available Jobs</h1>
        <p>Find your next opportunity</p>
      </div>
      
      <div className="search-bar">
        <input 
          type="text" 
          placeholder="Search jobs, companies, or keywords..."
          className="search-input"
        />
        <button className="search-button">Search</button>
      </div>
      
      <div className="filter-tabs">
        <button className="filter-tab active">All Jobs</button>
        <button className="filter-tab">Remote</button>
        <button className="filter-tab">Full-time</button>
        <button className="filter-tab">Part-time</button>
      </div>
      
      <div className="jobs-list">
        {jobs.map((job) => (
          <div key={job.id} className="job-card">
            <div className="job-header">
              <div className="company-logo">{job.logo}</div>
              <div className="job-info">
                <h3>{job.title}</h3>
                <p className="company-name">{job.company}</p>
                <div className="job-meta">
                  <span className="meta-item">
                    <MapPin size={14} />
                    {job.location}
                  </span>
                  <span className="meta-item">
                    <DollarSign size={14} />
                    {job.salary}
                  </span>
                  <span className="meta-item">
                    <Clock size={14} />
                    {job.posted}
                  </span>
                </div>
              </div>
            </div>
            <div className="job-footer">
              <span className="job-type">{job.type}</span>
              <button className="apply-button">Apply Now</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JobsPage;
