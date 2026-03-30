import { User, Candidate, Job, Assessment, Question, ExamResult, Notification, SalaryInsight, Recruiter } from '../types';

export const mockUsers: Record<string, User> = {
  'candidate-1': {
    id: 'candidate-1',
    name: 'Alex Johnson',
    email: 'alex@example.com',
    role: 'candidate',
    contactInfo: {
      phone: '+1 234-567-8900',
      location: 'San Francisco, CA'
    },
    onboardingComplete: true
  },
  'recruiter-1': {
    id: 'recruiter-1',
    name: 'Sarah Smith',
    email: 'sarah@techcorp.com',
    role: 'recruiter',
    contactInfo: {
      phone: '+1 234-567-8901',
      location: 'New York, NY'
    },
    onboardingComplete: true
  }
};

export const mockCandidates: Record<string, Candidate> = {
  'candidate-1': {
    userId: 'candidate-1',
    skills: [
      { name: 'React', proficiency: 'Advanced', yearsOfExperience: 3, category: 'technical' },
      { name: 'TypeScript', proficiency: 'Advanced', yearsOfExperience: 3, category: 'technical' },
      { name: 'Node.js', proficiency: 'Intermediate', yearsOfExperience: 2, category: 'technical' },
      { name: 'Python', proficiency: 'Advanced', yearsOfExperience: 4, category: 'technical' },
      { name: 'MongoDB', proficiency: 'Intermediate', yearsOfExperience: 2, category: 'technical' },
      { name: 'Leadership', proficiency: 'Intermediate', yearsOfExperience: 2, category: 'soft' },
      { name: 'Communication', proficiency: 'Advanced', yearsOfExperience: 3, category: 'soft' }
    ],
    experience: 3,
    projects: [
      {
        id: 'proj-1',
        name: 'E-commerce Platform',
        description: 'Built a full-stack e-commerce platform with React, Node.js, and MongoDB',
        skills: ['React', 'Node.js', 'MongoDB', 'Express'],
        role: 'Full Stack Developer',
        duration: '6 months'
      },
      {
        id: 'proj-2',
        name: 'AI Chatbot',
        description: 'Developed an AI-powered customer service chatbot using Python and NLP',
        skills: ['Python', 'NLP', 'Machine Learning', 'FastAPI'],
        role: 'Backend Developer',
        duration: '4 months'
      },
      {
        id: 'proj-3',
        name: 'Real-time Analytics Dashboard',
        description: 'Created a real-time data visualization dashboard with React and WebSockets',
        skills: ['React', 'TypeScript', 'D3.js', 'WebSockets'],
        role: 'Frontend Developer',
        duration: '3 months'
      }
    ],
    education: [
      {
        degree: 'Bachelor of Science',
        institution: 'Stanford University',
        year: 2020,
        field: 'Computer Science'
      }
    ],
    certifications: ['AWS Certified Developer', 'Google Cloud Professional'],
    uploadedFiles: [
      {
        id: 'file-1',
        userId: 'candidate-1',
        type: 'resume',
        fileUrl: '/files/alex-resume.pdf',
        filename: 'alex-johnson-resume.pdf',
        uploadedAt: '2024-01-15T10:00:00Z'
      }
    ],
    leagueScore: 85,
    league: 'Platinum',
    abilityScore: 850
  }
};

export const mockRecruiters: Record<string, Recruiter> = {
  'recruiter-1': {
    userId: 'recruiter-1',
    companyInfo: {
      name: 'TechCorp Solutions',
      industry: 'Technology',
      size: '500-1000'
    },
    hiringRoles: ['Full Stack Developer', 'Backend Engineer', 'DevOps Engineer'],
    jobPosts: ['job-1', 'job-2', 'job-3']
  }
};

export const mockJobs: Job[] = [
  {
    id: 'job-1',
    recruiterId: 'recruiter-1',
    recruiterName: 'Sarah Smith',
    companyName: 'TechCorp Solutions',
    title: 'Senior Full Stack Developer',
    description: 'We are looking for an experienced Full Stack Developer to join our team. You will work on cutting-edge projects using modern technologies.',
    requiredSkills: ['React', 'Node.js', 'TypeScript', 'MongoDB'],
    optionalSkills: ['AWS', 'Docker', 'Kubernetes'],
    level: 'Senior',
    experienceRange: { min: 3, max: 6 },
    salary: { min: 120000, max: 160000 },
    createdAt: '2024-01-10T10:00:00Z'
  },
  {
    id: 'job-2',
    recruiterId: 'recruiter-1',
    recruiterName: 'Sarah Smith',
    companyName: 'TechCorp Solutions',
    title: 'Python Backend Engineer',
    description: 'Join our backend team to build scalable microservices and APIs using Python and modern frameworks.',
    requiredSkills: ['Python', 'FastAPI', 'PostgreSQL', 'Docker'],
    optionalSkills: ['Kubernetes', 'Redis', 'RabbitMQ'],
    level: 'Mid',
    experienceRange: { min: 2, max: 4 },
    salary: { min: 100000, max: 130000 },
    createdAt: '2024-01-12T10:00:00Z'
  },
  {
    id: 'job-3',
    recruiterId: 'recruiter-1',
    recruiterName: 'Sarah Smith',
    companyName: 'InnovateTech',
    title: 'Frontend Developer',
    description: 'Create beautiful and responsive user interfaces using React and modern CSS frameworks.',
    requiredSkills: ['React', 'JavaScript', 'CSS', 'HTML'],
    optionalSkills: ['TypeScript', 'Tailwind CSS', 'Next.js'],
    level: 'Entry',
    experienceRange: { min: 0, max: 2 },
    salary: { min: 70000, max: 90000 },
    createdAt: '2024-01-14T10:00:00Z'
  },
  {
    id: 'job-4',
    recruiterId: 'recruiter-1',
    recruiterName: 'Sarah Smith',
    companyName: 'DataDriven Inc',
    title: 'Machine Learning Engineer',
    description: 'Build and deploy ML models for production systems. Experience with Python, TensorFlow, and cloud platforms required.',
    requiredSkills: ['Python', 'Machine Learning', 'TensorFlow', 'AWS'],
    optionalSkills: ['PyTorch', 'MLOps', 'Docker'],
    level: 'Senior',
    experienceRange: { min: 4, max: 7 },
    salary: { min: 140000, max: 180000 },
    createdAt: '2024-01-08T10:00:00Z'
  }
];

export const mockQuestions: Question[] = [
  {
    id: 'q1',
    questionText: 'What is the output of the following React hook: useEffect(() => { console.log("Hello"); }, [])?',
    skills: ['React'],
    format: 'mcq',
    difficulty: 'Easy',
    options: [
      'Runs on every render',
      'Runs only once on mount',
      'Never runs',
      'Runs on unmount'
    ],
    correctAnswer: 'Runs only once on mount'
  },
  {
    id: 'q2',
    questionText: 'Implement a function that debounces another function.',
    skills: ['JavaScript'],
    format: 'coding',
    difficulty: 'Medium'
  },
  {
    id: 'q3',
    questionText: 'Your API is experiencing high latency during peak hours. How would you diagnose and solve this issue?',
    skills: ['System Design', 'Backend'],
    format: 'scenario',
    difficulty: 'Hard'
  }
];

export const mockAssessment: Assessment = {
  id: 'assessment-1',
  candidateId: 'candidate-1',
  questions: mockQuestions,
  difficulty: 'Medium',
  status: 'completed',
  assignedAt: '2024-01-15T09:00:00Z',
  completedAt: '2024-01-15T10:30:00Z',
  score: 85
};

export const mockExamResult: ExamResult = {
  candidateId: 'candidate-1',
  assessmentId: 'assessment-1',
  score: 85,
  consistency: 92,
  abilityScore: 850,
  skillPerformance: [
    { skill: 'React', score: 90, questionsAttempted: 5 },
    { skill: 'JavaScript', score: 85, questionsAttempted: 4 },
    { skill: 'System Design', score: 78, questionsAttempted: 3 }
  ],
  difficultyReached: 'Hard',
  timeSpent: 90,
  completedAt: '2024-01-15T10:30:00Z',
  resumeVsReality: {
    claimValidation: 92,
    exaggerationScore: 8,
    underclaimedSkills: ['TypeScript', 'Docker']
  },
  antiCheating: {
    suspicious: false,
    anomaliesDetected: [],
    trustScore: 98
  }
};

export const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    userId: 'candidate-1',
    type: 'assessment',
    content: 'New assessment assigned: Full Stack Developer Evaluation',
    timestamp: '2024-01-15T09:00:00Z',
    read: false
  },
  {
    id: 'notif-2',
    userId: 'candidate-1',
    type: 'league_update',
    content: 'Congratulations! You\'ve been promoted to Platinum League!',
    timestamp: '2024-01-14T15:30:00Z',
    read: true
  },
  {
    id: 'notif-3',
    userId: 'candidate-1',
    type: 'job_match',
    content: 'New job match found: Senior Full Stack Developer at TechCorp',
    timestamp: '2024-01-13T11:20:00Z',
    read: true
  }
];

export const mockSalaryInsight: SalaryInsight = {
  candidateId: 'candidate-1',
  league: 'Platinum',
  recommendedSalary: {
    min: 120000,
    max: 150000
  },
  skillPremiums: [
    { skill: 'React', premium: 15000 },
    { skill: 'Python', premium: 12000 },
    { skill: 'TypeScript', premium: 10000 }
  ],
  marketComparison: 112
};
