require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('./models/Job');
const User = require('./models/User');

const sampleJobs = [
  {
    title: 'Frontend Developer',
    company: 'TechNova Solutions',
    department: 'Engineering',
    location: 'Bangalore, India',
    type: 'full-time',
    experience: 'mid',
    salary: { min: 600000, max: 1200000, currency: 'INR' },
    description: 'Build and maintain responsive web applications using React and modern JavaScript. Work closely with designers and backend engineers to deliver seamless user experiences.',
    requirements: ['React', 'JavaScript', 'TypeScript', 'HTML/CSS', 'REST APIs', 'Git'],
    status: 'active',
    applicants: 42,
  },
  {
    title: 'Backend Developer',
    company: 'CloudStack India',
    department: 'Engineering',
    location: 'Hyderabad, India',
    type: 'full-time',
    experience: 'mid',
    salary: { min: 800000, max: 1500000, currency: 'INR' },
    description: 'Design and develop scalable backend services and APIs. Manage database schemas, optimize queries, and ensure system reliability.',
    requirements: ['Node.js', 'Express', 'MongoDB', 'PostgreSQL', 'Docker', 'AWS'],
    status: 'active',
    applicants: 38,
  },
  {
    title: 'Data Science Intern',
    company: 'AnalytiQ Labs',
    department: 'Data Science',
    location: 'Remote',
    type: 'internship',
    experience: 'entry',
    salary: { min: 15000, max: 25000, currency: 'INR' },
    description: 'Assist the data science team in building ML models, data cleaning, and generating insights from large datasets. Great learning opportunity for students.',
    requirements: ['Python', 'Pandas', 'Machine Learning', 'SQL', 'Statistics'],
    status: 'active',
    applicants: 120,
  },
  {
    title: 'UI/UX Designer',
    company: 'PixelCraft Studio',
    department: 'Design',
    location: 'Mumbai, India',
    type: 'full-time',
    experience: 'mid',
    salary: { min: 500000, max: 1000000, currency: 'INR' },
    description: 'Create intuitive and visually appealing user interfaces for web and mobile applications. Conduct user research, wireframing, and prototyping.',
    requirements: ['Figma', 'Adobe XD', 'User Research', 'Wireframing', 'Prototyping', 'Design Systems'],
    status: 'active',
    applicants: 27,
  },
  {
    title: 'Digital Marketing Executive',
    company: 'GrowthBridge Media',
    department: 'Marketing',
    location: 'Delhi, India',
    type: 'full-time',
    experience: 'entry',
    salary: { min: 300000, max: 600000, currency: 'INR' },
    description: 'Plan and execute digital marketing campaigns across social media, email, and paid channels. Track metrics and optimize for engagement and conversions.',
    requirements: ['SEO', 'Google Ads', 'Social Media', 'Content Marketing', 'Analytics'],
    status: 'active',
    applicants: 65,
  },
  {
    title: 'Full Stack Developer',
    company: 'InnovateTech',
    department: 'Engineering',
    location: 'Pune, India',
    type: 'full-time',
    experience: 'senior',
    salary: { min: 1500000, max: 2500000, currency: 'INR' },
    description: 'Lead full stack development of enterprise web applications. Mentor junior developers, architect solutions, and drive technical decisions.',
    requirements: ['React', 'Node.js', 'MongoDB', 'TypeScript', 'System Design', 'AWS', 'CI/CD'],
    status: 'active',
    applicants: 18,
  },
  {
    title: 'Content Writer',
    company: 'WordSmith Digital',
    department: 'Content',
    location: 'Remote',
    type: 'part-time',
    experience: 'entry',
    salary: { min: 150000, max: 350000, currency: 'INR' },
    description: 'Write engaging blog posts, articles, and marketing copy for tech companies. SEO-friendly content creation with research-backed insights.',
    requirements: ['Content Writing', 'SEO Writing', 'Research', 'Blogging', 'Editing'],
    status: 'active',
    applicants: 89,
  },
  {
    title: 'DevOps Engineer',
    company: 'ScaleUp Systems',
    department: 'Engineering',
    location: 'Bangalore, India',
    type: 'full-time',
    experience: 'senior',
    salary: { min: 1800000, max: 3000000, currency: 'INR' },
    description: 'Build and maintain CI/CD pipelines, manage cloud infrastructure, and ensure high availability of production systems.',
    requirements: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'Jenkins', 'Linux', 'Monitoring'],
    status: 'active',
    applicants: 14,
  },
  {
    title: 'Mobile App Developer',
    company: 'AppCraft Technologies',
    department: 'Engineering',
    location: 'Chennai, India',
    type: 'full-time',
    experience: 'mid',
    salary: { min: 700000, max: 1400000, currency: 'INR' },
    description: 'Develop cross-platform mobile applications using React Native. Integrate APIs, implement push notifications, and optimize app performance.',
    requirements: ['React Native', 'JavaScript', 'iOS', 'Android', 'REST APIs', 'Firebase'],
    status: 'active',
    applicants: 33,
  },
  {
    title: 'Accounting Associate',
    company: 'FinEdge Consulting',
    department: 'Accounting',
    location: 'Noida, India',
    type: 'full-time',
    experience: 'entry',
    salary: { min: 300000, max: 500000, currency: 'INR' },
    description: 'Handle accounts payable/receivable, prepare financial statements, assist with audits, and maintain accurate financial records.',
    requirements: ['Accounting', 'Tally', 'Excel', 'GST', 'Financial Reporting', 'SAP'],
    status: 'active',
    applicants: 51,
  },
  {
    title: 'Machine Learning Engineer',
    company: 'DeepMind India',
    department: 'Data Science',
    location: 'Hyderabad, India',
    type: 'full-time',
    experience: 'senior',
    salary: { min: 2000000, max: 3500000, currency: 'INR' },
    description: 'Design and deploy production ML models. Work on NLP, computer vision, and recommendation systems at scale.',
    requirements: ['Python', 'TensorFlow', 'PyTorch', 'NLP', 'Computer Vision', 'MLOps', 'Deep Learning'],
    status: 'active',
    applicants: 22,
  },
  {
    title: 'Customer Support Executive',
    company: 'HelpDesk Pro',
    department: 'Support',
    location: 'Ahmedabad, India',
    type: 'full-time',
    experience: 'entry',
    salary: { min: 240000, max: 400000, currency: 'INR' },
    description: 'Provide excellent customer support via chat, email, and phone. Resolve customer queries, troubleshoot issues, and maintain satisfaction scores.',
    requirements: ['Communication', 'Problem Solving', 'Customer Service', 'English Fluency', 'CRM Tools'],
    status: 'active',
    applicants: 95,
  },
];

async function seedJobs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/exam_portal');
    console.log('Connected to MongoDB');

    // Find or create a recruiter user to own the jobs
    let recruiter = await User.findOne({ role: 'recruiter' });

    if (!recruiter) {
      recruiter = await User.create({
        name: 'TalentLeague Recruiter',
        email: 'recruiter@talentleague.com',
        password: 'Recruiter@123',
        role: 'recruiter',
      });
      console.log('Created recruiter user:', recruiter.email);
    } else {
      console.log('Using existing recruiter:', recruiter.email);
    }

    // Clear existing jobs (optional - comment out if you want to keep them)
    await Job.deleteMany({});
    console.log('Cleared existing jobs');

    // Insert sample jobs with the recruiter's ID
    const jobsWithRecruiter = sampleJobs.map(job => ({
      ...job,
      recruiterId: recruiter._id,
    }));

    const inserted = await Job.insertMany(jobsWithRecruiter);
    console.log(`Successfully added ${inserted.length} jobs!`);

    inserted.forEach(job => {
      console.log(`  - ${job.title} at ${job.company} (${job.location})`);
    });

    await mongoose.disconnect();
    console.log('\nDone! Start your server and check the jobs page.');
  } catch (err) {
    console.error('Error seeding jobs:', err.message);
    process.exit(1);
  }
}

seedJobs();
