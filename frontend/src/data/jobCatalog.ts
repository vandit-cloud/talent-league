export interface JobPosting {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  posted: string;
  description: string;
  skills: string[];
  experience: string;
  department: string;
}

export const jobCatalog: JobPosting[] = [
  {
    id: 'job_frontend_senior',
    title: 'Senior Frontend Developer',
    company: 'TechCorp',
    location: 'San Francisco, CA',
    type: 'Full-time',
    salary: '$120k - $180k',
    posted: '2 days ago',
    description:
      'Looking for experienced frontend developer with React expertise to build cutting-edge web applications and lead development initiatives.',
    skills: ['React', 'TypeScript', 'Node.js', 'CSS', 'Redux'],
    experience: '5+ years',
    department: 'Engineering',
  },
  {
    id: 'job_fullstack_remote',
    title: 'Full Stack Engineer',
    company: 'StartupXYZ',
    location: 'Remote',
    type: 'Full-time',
    salary: '$100k - $150k',
    posted: '1 week ago',
    description:
      'Join our team to build amazing web applications using modern technologies and contribute to product development.',
    skills: ['JavaScript', 'Python', 'MongoDB', 'React', 'AWS'],
    experience: '3+ years',
    department: 'Engineering',
  },
  {
    id: 'job_react_agency',
    title: 'React Developer',
    company: 'Digital Agency',
    location: 'New York, NY',
    type: 'Contract',
    salary: '$80k - $120k',
    posted: '3 days ago',
    description:
      'Seeking talented React developer for client projects and innovative digital solutions.',
    skills: ['React', 'JavaScript', 'HTML', 'CSS', 'Git'],
    experience: '2+ years',
    department: 'Development',
  },
  {
    id: 'job_backend_datadriven',
    title: 'Backend Developer',
    company: 'DataDriven Inc',
    location: 'Boston, MA',
    type: 'Full-time',
    salary: '$110k - $160k',
    posted: '5 days ago',
    description: 'Build scalable backend systems and APIs for our data analytics platform.',
    skills: ['Python', 'Django', 'PostgreSQL', 'Redis', 'Docker'],
    experience: '4+ years',
    department: 'Backend',
  },
  {
    id: 'job_devops_cloudfirst',
    title: 'DevOps Engineer',
    company: 'CloudFirst Systems',
    location: 'Seattle, WA',
    type: 'Full-time',
    salary: '$130k - $180k',
    posted: '1 day ago',
    description:
      'Manage cloud infrastructure and implement CI/CD pipelines for enterprise applications.',
    skills: ['Docker', 'Kubernetes', 'AWS', 'Terraform', 'Jenkins'],
    experience: '4+ years',
    department: 'DevOps',
  },
  {
    id: 'job_mobile_appworks',
    title: 'Mobile Developer',
    company: 'AppWorks Studio',
    location: 'Austin, TX',
    type: 'Full-time',
    salary: '$90k - $130k',
    posted: '4 days ago',
    description: 'Develop native mobile applications for iOS and Android platforms.',
    skills: ['React Native', 'Swift', 'Kotlin', 'Firebase', 'REST APIs'],
    experience: '3+ years',
    department: 'Mobile',
  },
];

export const getJobById = (jobId: string | null | undefined) =>
  jobCatalog.find((job) => job.id === jobId) || null;
